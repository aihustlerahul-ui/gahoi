import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { PROFILE_CREATED_BY_OPTIONS } from '@gahoisarthi/shared';
import { useAuth } from '../../src/lib/auth';
import { apiRequest } from '../../src/lib/api';
import { setSecureItem } from '../../src/lib/secure-storage';
import { Screen, Card, Button, Icon } from '../../src/components/ui';
import { colors, spacing, radius, typography } from '../../src/theme';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;
const MAX_ATTEMPTS = 5;

export default function LoginScreen() {
  const { loginWithOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [createdBy, setCreatedBy] = useState<(typeof PROFILE_CREATED_BY_OPTIONS)[number]>('Self');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // spec §4.2 — must stay empty
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [step, setStep] = useState<'welcome' | 'email' | 'otp'>('welcome');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [resendIn, setResendIn] = useState(0);

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const otp = otpDigits.join('');

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email / कृपया सही ईमेल दर्ज करें');
      return;
    }
    if (mode === 'signup' && !acceptedTerms) {
      setError('Please accept the Terms & Privacy Policy / कृपया नियम स्वीकार करें');
      return;
    }
    if (honeypot) return; // bot trap — silently bail
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (res.success) {
        await setSecureItem('registration-created-by', createdBy);
        setStep('otp');
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setAttempts(0);
        setResendIn(RESEND_SECONDS);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(res.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    setError(null);
    // Handle paste of full code into any box
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => (next[i] = d));
      setOtpDigits(next);
      const lastFilled = Math.min(digits.length, OTP_LENGTH) - 1;
      otpRefs.current[lastFilled >= 0 ? lastFilled : 0]?.focus();
      return;
    }
    const next = [...otpDigits];
    next[index] = text.replace(/\D/g, '');
    setOtpDigits(next);
    if (text && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== OTP_LENGTH) {
      setError('Enter the 6-digit code / 6 अंकों का कोड दर्ज करें');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithOtp(email, otp);
      // AuthProvider routes to wizard/tabs on state change
    } catch (err: any) {
      const left = MAX_ATTEMPTS - (attempts + 1);
      setAttempts((a) => a + 1);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
      setError(
        left > 0
          ? `Incorrect OTP — ${left} attempt${left === 1 ? '' : 's'} remaining / ${left} प्रयास शेष`
          : (err.message || 'Too many attempts. Try again later. / बहुत अधिक प्रयास')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logoTitle}>Gahoi Sarthi</Text>
            <Text style={styles.logoHindi}>गहोई सारथी</Text>
          </View>

          <Card style={styles.card}>
            {step === 'welcome' ? (
              <View>
                <Text style={styles.welcomeTitle}>Welcome / स्वागत है</Text>
                <Text style={styles.welcomeSub}>Gahoi Bania community matrimony{'\n'}गहोई बनिया समुदाय का विवाह मंच</Text>

                <Button
                  label="Login / लॉगिन"
                  onPress={() => { setMode('login'); setStep('email'); setError(null); }}
                  style={{ marginTop: spacing.xl }}
                />

                <TouchableOpacity
                  style={styles.signupBtn}
                  onPress={() => { setMode('signup'); setStep('email'); setError(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signupBtnText}>Create Account / खाता बनाएं</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8} disabled>
                  <Icon name="user" size={18} color={colors.darkBrown} />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>
            ) : step === 'email' ? (
              <View>
                <TouchableOpacity onPress={() => { setStep('welcome'); setError(null); }} style={styles.backRow}>
                  <Icon name="chevron" size={16} color={colors.midBrown} />
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.cardTitle}>
                  {mode === 'signup' ? 'Create Account / खाता बनाएं' : 'Login / लॉगिन'}
                </Text>

                <Text style={styles.label}>Email Address / ईमेल पता</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.midBrown}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError(null);
                  }}
                />

                {mode === 'signup' && (
                  <>
                    <Text style={styles.label}>Profile Created By / प्रोफ़ाइल किसने बनाई</Text>
                    <View style={styles.chipRow}>
                      {PROFILE_CREATED_BY_OPTIONS.map((opt) => {
                        const active = createdBy === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setCreatedBy(opt)}
                          >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity style={styles.termsRow} onPress={() => setAcceptedTerms((v) => !v)} activeOpacity={0.7}>
                      <View style={[styles.checkbox, acceptedTerms && styles.checkboxOn]}>
                        {acceptedTerms && <Icon name="check" size={14} color={colors.onGold} />}
                      </View>
                      <Text style={styles.termsText}>
                        I accept the <Text style={styles.link}>Terms of Service</Text> and{' '}
                        <Text style={styles.link}>Privacy Policy</Text>
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Honeypot — visually hidden, never focusable by humans */}
                <TextInput
                  style={styles.honeypot}
                  value={honeypot}
                  onChangeText={setHoneypot}
                  autoComplete="off"
                  accessible={false}
                  importantForAccessibility="no"
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <Button label="Send OTP / ओटीपी भेजें" onPress={handleSendOtp} loading={loading} style={{ marginTop: spacing.md }} />
              </View>
            ) : (
              <View>
                <Text style={styles.cardTitle}>Enter OTP / ओटीपी दर्ज करें</Text>
                <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>

                <View style={styles.otpRow}>
                  {otpDigits.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => (otpRefs.current[i] = r)}
                      style={[styles.otpBox, !!digit && styles.otpBoxFilled]}
                      value={digit}
                      onChangeText={(t) => handleOtpChange(t, i)}
                      onKeyPress={(e) => handleOtpKeyPress(e, i)}
                      keyboardType="number-pad"
                      maxLength={OTP_LENGTH}
                      textAlign="center"
                      returnKeyType="done"
                    />
                  ))}
                </View>

                {resendIn > 0 ? (
                  <Text style={styles.timer}>
                    Resend OTP in 0:{String(resendIn).padStart(2, '0')}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                    <Text style={[styles.timer, styles.link]}>Resend OTP</Text>
                  </TouchableOpacity>
                )}

                {error && <Text style={styles.errorText}>{error}</Text>}

                <Button
                  label="Verify OTP / ओटीपी सत्यापित करें"
                  onPress={handleVerifyOtp}
                  loading={loading}
                  style={{ marginTop: spacing.sm }}
                />

                <TouchableOpacity
                  style={styles.editEmail}
                  onPress={() => {
                    setStep('email');
                    setOtpDigits(Array(OTP_LENGTH).fill(''));
                    setError(null);
                  }}
                >
                  <Text style={styles.editEmailText}>← Edit Email / ईमेल बदलें</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoTitle: { fontSize: 28, fontWeight: '600', color: colors.sacredGold, letterSpacing: 0.5 },
  logoHindi: { fontSize: 18, color: colors.deepGold, marginTop: spacing.xs },
  card: { padding: spacing.xl },
  welcomeTitle: { fontSize: 18, fontWeight: '600', color: colors.darkBrown, textAlign: 'center', marginBottom: spacing.sm },
  welcomeSub: { fontSize: 12, color: colors.midBrown, textAlign: 'center', lineHeight: 18, marginBottom: spacing.sm },
  signupBtn: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.sacredGold,
    borderRadius: radius.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signupBtnText: { color: colors.sacredGold, fontWeight: '600', fontSize: 14 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.xs },
  backText: { fontSize: 13, color: colors.midBrown },
  cardTitle: { fontSize: 16, fontWeight: '500', color: colors.darkBrown, marginBottom: spacing.lg },
  subtitle: { ...typography.secondary, marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '500', color: colors.midBrown, marginBottom: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: colors.ivory,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderWarm,
    backgroundColor: colors.pillInactiveBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.sacredGold, borderColor: colors.sacredGold },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.darkBrown },
  chipTextActive: { color: colors.onGold },
  honeypot: { height: 0, width: 0, opacity: 0, position: 'absolute', left: -9999 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.midBrown,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxOn: { backgroundColor: colors.sacredGold, borderColor: colors.sacredGold },
  termsText: { flex: 1, fontSize: 11, color: colors.textSecondary },
  link: { color: colors.sacredGold, fontWeight: '500' },
  errorText: { color: colors.rejected, fontSize: 12, marginTop: spacing.md, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.borderWarm },
  dividerText: { color: colors.midBrown, fontSize: 11, marginHorizontal: spacing.md },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    borderRadius: radius.button,
    paddingVertical: 12,
    opacity: 0.6,
  },
  googleText: { color: colors.darkBrown, fontSize: 14, fontWeight: '500', marginLeft: spacing.sm },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.lg },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    backgroundColor: colors.ivory,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  otpBoxFilled: { borderColor: colors.sacredGold },
  timer: { fontSize: 11, color: colors.midBrown, textAlign: 'center', marginBottom: spacing.md },
  editEmail: { alignItems: 'center', marginTop: spacing.lg },
  editEmailText: { color: colors.midBrown, fontSize: 13, fontWeight: '500' },
});
