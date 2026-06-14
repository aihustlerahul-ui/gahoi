import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  Share,
  TextInput,
} from 'react-native';
import { buildProfileShareText, formatProfileIdLabel, parsePublicProfileId } from '@gahoisarthi/shared';
import { useAuth } from '../../src/lib/auth';
import { apiRequest } from '../../src/lib/api';
import { changeLanguage } from '../../src/lib/i18n';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { userProfile, logoutUser, refreshProfile } = useAuth();
  const [updatingLang, setUpdatingLang] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupId, setLookupId] = useState('');

  const currentLang = i18n.language || 'en';

  const handleLanguageChange = async (lang: 'en' | 'hi') => {
    if (lang === currentLang) return;
    setUpdatingLang(true);
    try {
      // 1. Update on server
      await apiRequest('/profile/me/language', {
        method: 'PATCH',
        body: JSON.stringify({ language: lang }),
      });
      // 2. Change local i18n instance & persist in SecureStore
      await changeLanguage(lang);
      // 3. Refresh user profile context
      await refreshProfile();
      
      Alert.alert(
        lang === 'hi' ? 'सफलता' : 'Success',
        lang === 'hi' ? 'भाषा सफलतापूर्वक बदली गई!' : 'Language changed successfully!'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update language');
    } finally {
      setUpdatingLang(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      currentLang === 'hi' ? 'लॉग आउट' : 'Log Out',
      currentLang === 'hi' ? 'क्या आप लॉग आउट करना चाहते हैं?' : 'Are you sure you want to log out?',
      [
        { text: currentLang === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: currentLang === 'hi' ? 'लॉग आउट' : 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logoutUser();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Logout failed');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      currentLang === 'hi' ? 'खाता हटाएं' : 'Delete Account',
      currentLang === 'hi' 
        ? 'क्या आप वास्तव में अपना खाता हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती और आपका सारा डेटा हटा दिया जाएगा।' 
        : 'Are you sure you want to delete your account? This action is permanent and all your profile data will be permanently deleted.',
      [
        { text: currentLang === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: currentLang === 'hi' ? 'हटाएं' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await apiRequest('/profile/me', {
                method: 'DELETE',
              });
              if (res.success) {
                await logoutUser();
                Alert.alert(
                  currentLang === 'hi' ? 'सफलता' : 'Success',
                  currentLang === 'hi' ? 'आपका खाता सफलतापूर्वक हटा दिया गया है।' : 'Your account has been deleted successfully.'
                );
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B5620E" />
      </View>
    );
  }

  const isPremium = userProfile?.user?.tier === 'paid';
  const publicProfileId = userProfile?.profileId;

  const handleShareProfileId = async () => {
    if (!publicProfileId) return;
    try {
      await Share.share({ message: buildProfileShareText(publicProfileId) });
    } catch {
      Alert.alert('Error', 'Could not open share sheet');
    }
  };

  const handleLookupProfile = () => {
    const parsed = parsePublicProfileId(lookupId);
    if (parsed === null) {
      Alert.alert(
        currentLang === 'hi' ? 'अमान्य ID' : 'Invalid ID',
        currentLang === 'hi' ? 'कृपया मान्य प्रोफ़ाइल ID दर्ज करें (जैसे 23432)' : 'Enter a valid profile ID (e.g. 23432 or GS-23432)'
      );
      return;
    }
    router.push(`/profile/${parsed}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile summary header */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color="#B5620E" />
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.profileId}>
            {publicProfileId ? formatProfileIdLabel(publicProfileId) : 'Gahoi Member'}
          </Text>
          {publicProfileId != null && (
            <Text style={styles.profileIdHint}>
              {currentLang === 'hi'
                ? `शेयर करें: ${publicProfileId} — दूसरे सदस्य इस ID से आपकी प्रोफ़ाइल खोज सकते हैं`
                : `Share ID: ${publicProfileId} — others can find your profile with this number`}
            </Text>
          )}
          <Text style={styles.profileEmail}>{userProfile?.user?.email || ''}</Text>
          <View style={[styles.tierBadge, isPremium ? styles.premiumBadge : styles.freeBadge]}>
            <Ionicons name={isPremium ? 'shield-checkmark' : 'shield-outline'} size={14} color={isPremium ? '#FFFFFF' : '#3D2E1A'} />
            <Text style={[styles.tierText, isPremium ? styles.premiumText : styles.freeText]}>
              {isPremium ? 'PREMIUM / प्रीमियम' : 'FREE / फ्री'}
            </Text>
          </View>
        </View>
      </View>

      {publicProfileId != null && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            {currentLang === 'hi' ? 'प्रोफ़ाइल ID' : 'Profile ID'}
          </Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleShareProfileId}>
            <Ionicons name="share-outline" size={22} color="#B5620E" />
            <Text style={styles.menuText}>
              {currentLang === 'hi' ? 'प्रोफ़ाइल ID शेयर करें' : 'Share Profile ID'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#8A7A60" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>
          {currentLang === 'hi' ? 'प्रोफ़ाइल खोजें' : 'Find Profile'}
        </Text>
        <Text style={styles.lookupHint}>
          {currentLang === 'hi'
            ? 'किसी का प्रोफ़ाइल ID दर्ज करें (जैसे 23432)'
            : 'Enter someone\'s profile ID (e.g. 23432 or GS-23432)'}
        </Text>
        <TextInput
          style={styles.lookupInput}
          value={lookupId}
          onChangeText={setLookupId}
          keyboardType="number-pad"
          placeholder="23432"
          placeholderTextColor="#8A7A60"
        />
        <TouchableOpacity style={styles.lookupButton} onPress={handleLookupProfile}>
          <Text style={styles.lookupButtonText}>
            {currentLang === 'hi' ? 'प्रोफ़ाइल देखें' : 'View Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>
          {currentLang === 'hi' ? 'भाषा सेटिंग्स' : 'Language Settings'}
        </Text>
        <View style={styles.langSelector}>
          <TouchableOpacity
            style={[styles.langOption, currentLang === 'en' && styles.langOptionSelected]}
            onPress={() => handleLanguageChange('en')}
            disabled={updatingLang}
          >
            <Text style={[styles.langText, currentLang === 'en' && styles.langTextSelected]}>
              English
            </Text>
            {currentLang === 'en' && (
              <Ionicons name="checkmark-circle" size={18} color="#B5620E" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langOption, currentLang === 'hi' && styles.langOptionSelected]}
            onPress={() => handleLanguageChange('hi')}
            disabled={updatingLang}
          >
            <Text style={[styles.langText, currentLang === 'hi' && styles.langTextSelected]}>
              हिन्दी
            </Text>
            {currentLang === 'hi' && (
              <Ionicons name="checkmark-circle" size={18} color="#B5620E" />
            )}
          </TouchableOpacity>
        </View>
        {updatingLang && <ActivityIndicator size="small" color="#B5620E" style={{ marginTop: 8 }} />}
      </View>

      {/* Menu Options Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>
          {currentLang === 'hi' ? 'सुविधाएं' : 'Features'}
        </Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/views')}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="eye-outline" size={20} color="#8A7A60" />
            <Text style={styles.menuText}>
              {currentLang === 'hi' ? 'किसने मेरी प्रोफ़ाइल देखी' : 'Who Viewed My Profile'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8A7A60" />
        </TouchableOpacity>

        {!isPremium && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/payment/checkout')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="gift-outline" size={20} color="#B5620E" />
              <Text style={[styles.menuText, { color: '#B5620E' }]}>
                {currentLang === 'hi' ? 'प्रीमियम में अपग्रेड करें' : 'Upgrade to Premium'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B5620E" />
          </TouchableOpacity>
        )}
      </View>

      {/* Account actions */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>
          {currentLang === 'hi' ? 'खाता विकल्प' : 'Account Actions'}
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>
            {currentLang === 'hi' ? 'लॉग आउट' : 'Log Out'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={18} color="#FF6F61" />
          <Text style={styles.deleteButtonText}>
            {currentLang === 'hi' ? 'खाता हमेशा के लिए हटाएं' : 'Permanently Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAF5',
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FDFAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    padding: 16,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDFAF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  profileDetails: {
    marginLeft: 16,
    flex: 1,
  },
  profileId: {
    color: '#3D2E1A',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  profileIdHint: {
    color: '#8A7A60',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  profileEmail: {
    color: '#8A7A60',
    fontSize: 14,
    marginTop: 2,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  freeBadge: {
    backgroundColor: '#E8E0D0',
  },
  premiumBadge: {
    backgroundColor: '#B5620E',
  },
  tierText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  freeText: {
    color: '#3D2E1A',
  },
  premiumText: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    color: '#3D2E1A',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  langSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    overflow: 'hidden',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
  },
  langOptionSelected: {
    backgroundColor: '#FDF3E0',
  },
  langText: {
    color: '#8A7A60',
    fontSize: 15,
  },
  langTextSelected: {
    color: '#B5620E',
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    color: '#3D2E1A',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  lookupHint: {
    color: '#8A7A60',
    fontSize: 13,
    marginBottom: 10,
  },
  lookupInput: {
    backgroundColor: '#FFFFFF',
    color: '#3D2E1A',
    borderWidth: 1,
    borderColor: '#E8E0D0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  lookupButton: {
    backgroundColor: '#B5620E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  lookupButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B5620E',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: '#C0392B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
