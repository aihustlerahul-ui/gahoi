import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth';
import { apiRequest } from '../../src/lib/api';

export default function LoginScreen() {
  const { loginWithOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email / कृपया सही ईमेल दर्ज करें');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (res.success) {
        setStep('otp');
        setMessage('OTP sent to your email / ओटीपी आपके ईमेल पर भेजा गया है');
      } else {
        setError(res.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('OTP must be 6 digits / ओटीपी 6 अंकों का होना चाहिए');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginWithOtp(email, otp);
      // AuthProvider will automatically route to main/wizard upon state change
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logoTitle}>Gahoi Sarthi</Text>
            <Text style={styles.logoHindi}>गहोई सारथी</Text>
            <Text style={styles.subtitle}>Connecting Gahoi Souls / गहोई समुदाय का मिलान</Text>
          </View>

          <View style={styles.formContainer}>
            {step === 'email' ? (
              <View>
                <Text style={styles.label}>Email Address / ईमेल पता</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email / ईमेल दर्ज करें"
                  placeholderTextColor="#8A7A60"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#1A0800" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP / ओटीपी भेजें</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.label}>Enter 6-digit OTP / 6-अंकों का ओटीपी दर्ज करें</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP / ओटीपी दर्ज करें"
                  placeholderTextColor="#8A7A60"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text);
                    setError(null);
                  }}
                />

                {message && <Text style={styles.successText}>{message}</Text>}
                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#1A0800" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Login / सत्यापित करें</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setStep('email');
                    setOtp('');
                    setError(null);
                    setMessage(null);
                  }}
                >
                  <Text style={styles.backButtonText}>← Edit Email / ईमेल बदलें</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0800',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#E8B84B',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  logoHindi: {
    fontSize: 22,
    color: '#D4BFA0',
    marginTop: 6,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#8A7A60',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  formContainer: {
    backgroundColor: '#2C1A10',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D281C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    color: '#D4BFA0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1C0D05',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3D281C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#E8B84B',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#1A0800',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#8A7A60',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6F61',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
});
