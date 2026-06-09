import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiRequest } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface KundliScore {
  total: number;
  varna: number;
  vashya: number;
  tara: number;
  yoni: number;
  graha_maitri: number;
  gana: number;
  bhakoot: number;
  nadi: number;
  label: 'Uttam' | 'Madhyam' | 'Vichar Yogya';
  is_approximate: boolean;
}

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [kundli, setKundli] = useState<KundliScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingKundli, setLoadingKundli] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [interestStatus, setInterestStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined'>('none');
  const [interestId, setInterestId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const currentLang = i18n.language || 'en';
  const isPremium = userProfile?.user?.tier === 'paid';

  const fetchProfileAndShortlist = async () => {
    try {
      // 1. Fetch Profile Details
      const profileRes = await apiRequest(`/profile/${id}`);
      if (profileRes.success && profileRes.data) {
        const p = profileRes.data;
        setProfile(p);

        // Process interest relationship returned from backend
        if (p.interest) {
          setInterestId(p.interest.id);
          if (p.interest.status === 'accepted') {
            setInterestStatus('accepted');
          } else if (p.interest.status === 'declined') {
            setInterestStatus('declined');
          } else if (p.interest.status === 'pending') {
            if (p.interest.senderId === userProfile.id) {
              setInterestStatus('pending_sent');
            } else {
              setInterestStatus('pending_received');
            }
          }
        } else {
          setInterestStatus('none');
          setInterestId(null);
        }
      }

      // 2. Fetch shortlist to check if shortlisted
      const shortlistRes = await apiRequest('/shortlist');
      if (shortlistRes.success && shortlistRes.data) {
        const exists = shortlistRes.data.some((item: any) => item.id === id);
        setIsShortlisted(exists);
      }
    } catch (err: any) {
      console.warn('Error fetching profile details:', err.message);
      Alert.alert('Error', 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const fetchKundli = async () => {
    if (!isPremium) return;
    setLoadingKundli(true);
    try {
      const res = await apiRequest(`/matches/${id}/kundli`);
      if (res.success && res.data) {
        setKundli(res.data);
      }
    } catch (err: any) {
      console.warn('Error fetching Kundli matching:', err.message);
    } finally {
      setLoadingKundli(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfileAndShortlist();
    }
  }, [id]);

  useEffect(() => {
    if (id && profile && isPremium) {
      fetchKundli();
    }
  }, [id, profile, isPremium]);

  const handleShortlistToggle = async () => {
    setActionLoading(true);
    try {
      if (isShortlisted) {
        const res = await apiRequest(`/shortlist/${id}`, { method: 'DELETE' });
        if (res.success) {
          setIsShortlisted(false);
          Alert.alert(t('common.success', 'Success'), currentLang === 'hi' ? 'शॉर्टलिस्ट से हटाया गया।' : 'Removed from Shortlist.');
        }
      } else {
        const res = await apiRequest(`/shortlist/${id}`, { method: 'POST' });
        if (res.success) {
          setIsShortlisted(true);
          Alert.alert(t('common.success', 'Success'), currentLang === 'hi' ? 'शॉर्टलिस्ट में जोड़ा गया।' : 'Added to Shortlist.');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle shortlist');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInterest = async () => {
    setActionLoading(true);
    try {
      const res = await apiRequest('/interests', {
        method: 'POST',
        body: JSON.stringify({ receiverId: id }),
      });
      if (res.success && res.data) {
        setInterestStatus('pending_sent');
        setInterestId(res.data.id);
        Alert.alert(
          currentLang === 'hi' ? 'सफलता' : 'Success',
          currentLang === 'hi' ? 'रुचि अनुरोध सफलतापूर्वक भेजा गया!' : 'Interest request sent successfully!'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send interest');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawInterest = async () => {
    if (!interestId) return;
    setActionLoading(true);
    try {
      const res = await apiRequest(`/interests/${interestId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setInterestStatus('none');
        setInterestId(null);
        Alert.alert(
          currentLang === 'hi' ? 'सफलता' : 'Success',
          currentLang === 'hi' ? 'रुचि अनुरोध वापस ले लिया गया।' : 'Interest request withdrawn.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to withdraw interest');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondInterest = async (status: 'accepted' | 'declined') => {
    if (!interestId) return;
    setActionLoading(true);
    try {
      const res = await apiRequest(`/interests/${interestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        setInterestStatus(status);
        if (status === 'accepted') {
          // Re-fetch profile to load newly unmasked contact details
          await fetchProfileAndShortlist();
        }
        Alert.alert(
          currentLang === 'hi' ? 'सफलता' : 'Success',
          status === 'accepted'
            ? (currentLang === 'hi' ? 'अनुरोध स्वीकार कर लिया गया!' : 'Request accepted!')
            : (currentLang === 'hi' ? 'अनुरोध अस्वीकार कर दिया गया।' : 'Request declined.')
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to respond to interest');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E8B84B" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Profile not found / प्रोफ़ाइल नहीं मिली</Text>
      </View>
    );
  }

  // Get primary photo
  const primaryPhoto = profile.gallery && profile.gallery.length > 0 ? profile.gallery[0].signedUrl : null;

  const renderKundliLabel = (lbl: 'Uttam' | 'Madhyam' | 'Vichar Yogya') => {
    if (lbl === 'Uttam') return currentLang === 'hi' ? 'उत्तम / Uttam' : 'Uttam';
    if (lbl === 'Madhyam') return currentLang === 'hi' ? 'मध्यम / Madhyam' : 'Madhyam';
    return currentLang === 'hi' ? 'विचार योग्य / Vichar Yogya' : 'Vichar Yogya';
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#E8B84B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GS-{profile.profileId}</Text>
        <TouchableOpacity style={styles.shortlistBtn} onPress={handleShortlistToggle} disabled={actionLoading}>
          <Ionicons
            name={isShortlisted ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color="#E8B84B"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Photo Container */}
        <View style={styles.photoContainer}>
          {isPremium ? (
            primaryPhoto ? (
              <Image source={{ uri: primaryPhoto }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Ionicons name="person" size={80} color="#3D281C" />
                <Text style={styles.placeholderText}>No Photo Uploaded / कोई फोटो नहीं</Text>
              </View>
            )
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="lock-closed" size={60} color="#E8B84B" style={{ marginBottom: 12 }} />
              <Text style={styles.lockText}>Photos Locked / फोटो लॉक हैं</Text>
              <Text style={styles.lockSubtext}>
                Upgrade to Premium to view photos {'\n'} प्रीमियम में अपग्रेड कर फोटो देखें
              </Text>
              <TouchableOpacity
                style={styles.upgradeBtnSmall}
                onPress={() => router.push('/payment/checkout')}
              >
                <Text style={styles.upgradeBtnText}>Upgrade / अपग्रेड करें</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Identity & Basic Header */}
        <View style={styles.introCard}>
          <View style={styles.nameRow}>
            <Text style={styles.profileIdText}>GS-{profile.profileId}</Text>
            {profile.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#1A0800" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.quickInfo}>
            {profile.age} yrs • {profile.height_cm} cm • {profile.maritalStatus}
          </Text>
          <Text style={styles.quickSubInfo}>
            Gotra: {profile.gotra} • {profile.city || 'City'}
          </Text>
        </View>

        {/* Action Panel */}
        <View style={styles.actionPanel}>
          {actionLoading ? (
            <ActivityIndicator size="small" color="#E8B84B" style={{ padding: 12 }} />
          ) : (
            <>
              {interestStatus === 'none' && (
                <TouchableOpacity style={styles.primaryActionButton} onPress={handleSendInterest}>
                  <Ionicons name="heart" size={20} color="#1A0800" />
                  <Text style={styles.primaryActionBtnText}>Send Interest / रुचि भेजें</Text>
                </TouchableOpacity>
              )}

              {interestStatus === 'pending_sent' && (
                <TouchableOpacity style={styles.secondaryActionButton} onPress={handleWithdrawInterest}>
                  <Ionicons name="close-circle-outline" size={20} color="#FF6F61" />
                  <Text style={[styles.secondaryActionBtnText, { color: '#FF6F61' }]}>
                    Withdraw Interest / रुचि वापस लें
                  </Text>
                </TouchableOpacity>
              )}

              {interestStatus === 'pending_received' && (
                <View style={styles.respondRow}>
                  <TouchableOpacity
                    style={[styles.respondButton, styles.declineButton]}
                    onPress={() => handleRespondInterest('declined')}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                    <Text style={styles.respondButtonText}>Decline / मना करें</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.respondButton, styles.acceptButton]}
                    onPress={() => handleRespondInterest('accepted')}
                  >
                    <Ionicons name="checkmark" size={20} color="#1A0800" />
                    <Text style={[styles.respondButtonText, { color: '#1A0800' }]}>Accept / स्वीकारें</Text>
                  </TouchableOpacity>
                </View>
              )}

              {interestStatus === 'accepted' && (
                <View style={styles.connectedBadge}>
                  <Ionicons name="ribbon" size={20} color="#E8B84B" />
                  <Text style={styles.connectedBadgeText}>
                    Mutual Match (Connected) / परस्पर मिलान (संपर्क करें)
                  </Text>
                </View>
              )}

              {interestStatus === 'declined' && (
                <View style={styles.declinedBadge}>
                  <Text style={styles.declinedText}>Declined / अस्वीकृत</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Premium Notice (if free) */}
        {!isPremium && (
          <View style={styles.premiumPromoCard}>
            <Ionicons name="star" size={28} color="#E8B84B" style={{ marginBottom: 8 }} />
            <Text style={styles.promoHeader}>Premium Features Locked / प्रीमियम फीचर्स लॉक हैं</Text>
            <Text style={styles.promoDesc}>
              Upgrade to see contact details, full family backgrounds, and astrological Kundli matching scores.
            </Text>
            <TouchableOpacity
              style={styles.upgradeBtnLarge}
              onPress={() => router.push('/payment/checkout')}
            >
              <Text style={styles.upgradeBtnLargeText}>Upgrade to Premium / प्रीमियम सदस्यता लें</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Kundli Compatibility Section (Paid only) */}
        {isPremium && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>
              {currentLang === 'hi' ? 'कुण्डली मिलान (अष्टकूट गुण मिलान)' : 'Kundli Compatibility (Ashtakoot)'}
            </Text>
            {loadingKundli ? (
              <ActivityIndicator size="small" color="#E8B84B" style={{ margin: 16 }} />
            ) : kundli ? (
              <View style={styles.kundliCard}>
                <View style={styles.kundliHeader}>
                  <Text style={styles.kundliScoreText}>
                    {kundli.total} / 36 {currentLang === 'hi' ? 'गुण' : 'Guns'}
                  </Text>
                  <View
                    style={[
                      styles.kundliLabelBadge,
                      kundli.label === 'Uttam'
                        ? styles.labelUttam
                        : kundli.label === 'Madhyam'
                        ? styles.labelMadhyam
                        : styles.labelVichar,
                    ]}
                  >
                    <Text style={styles.kundliLabelBadgeText}>{renderKundliLabel(kundli.label)}</Text>
                  </View>
                </View>

                {kundli.is_approximate && (
                  <View style={styles.approxNotice}>
                    <Ionicons name="information-circle" size={16} color="#E8B84B" />
                    <Text style={styles.approxNoticeText}>
                      Approximate match (Incomplete birth details) {'\n'} अनुमानित मिलान (अपूर्ण जन्म विवरण)
                    </Text>
                  </View>
                )}

                {/* 8 Dimensions Grid */}
                <View style={styles.kundliGrid}>
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Varna / वर्ण</Text>
                      <Text style={styles.gridVal}>{kundli.varna} / 1</Text>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Vashya / वश्य</Text>
                      <Text style={styles.gridVal}>{kundli.vashya} / 2</Text>
                    </View>
                  </View>

                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Tara / तारा</Text>
                      <Text style={styles.gridVal}>{kundli.tara} / 3</Text>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Yoni / योनि</Text>
                      <Text style={styles.gridVal}>{kundli.yoni} / 4</Text>
                    </View>
                  </View>

                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Graha Maitri / ग्रह मैत्री</Text>
                      <Text style={styles.gridVal}>{kundli.graha_maitri} / 5</Text>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Gana / गण</Text>
                      <Text style={styles.gridVal}>{kundli.gana} / 6</Text>
                    </View>
                  </View>

                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Bhakoot / भकूट</Text>
                      <Text style={styles.gridVal}>{kundli.bhakoot} / 7</Text>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Nadi / नाड़ी</Text>
                      <Text style={styles.gridVal}>{kundli.nadi} / 8</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.noDataText}>Astrology data unavailable / ज्योतिष विवरण अनुपलब्ध</Text>
            )}
          </View>
        )}

        {/* Basic Details */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            {currentLang === 'hi' ? 'मूल जानकारी' : 'Basic Details'}
          </Text>
          <View style={styles.detailsList}>
            {profile.aboutMe && (
              <View style={styles.aboutContainer}>
                <Text style={styles.aboutHeader}>{currentLang === 'hi' ? 'मेरे बारे में / About Me' : 'About Me'}</Text>
                <Text style={styles.aboutText}>{profile.aboutMe}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender / लिंग</Text>
              <Text style={styles.detailValue}>{profile.gender}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age / आयु</Text>
              <Text style={styles.detailValue}>{profile.age} yrs</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Height / ऊँचाई</Text>
              <Text style={styles.detailValue}>{profile.height_cm} cm</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gotra / गोत्र</Text>
              <Text style={styles.detailValue}>{profile.gotra}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Complexion / रंग</Text>
              <Text style={styles.detailValue}>{profile.complexion || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Marital Status / वैवाहिक स्थिति</Text>
              <Text style={styles.detailValue}>{profile.maritalStatus}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Manglik Status / मांगलिक स्थिति</Text>
              <Text style={styles.detailValue}>{profile.manglikStatus}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobile / मोबाइल</Text>
              <Text style={styles.detailValue}>
                {profile.mobile ? profile.mobile : 'Locked / लॉक है'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email / ईमेल</Text>
              <Text style={styles.detailValue}>
                {profile.email ? profile.email : 'Locked / लॉक है'}
              </Text>
            </View>
          </View>
        </View>

        {/* Education Details */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            {currentLang === 'hi' ? 'शिक्षा' : 'Education Details'}
          </Text>
          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Highest Degree / उच्चतम डिग्री</Text>
              <Text style={styles.detailValue}>
                {profile.education?.highestDegree || profile.education || '-'}
              </Text>
            </View>
            {profile.education?.fieldOfStudy && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Field of Study / अध्ययन का क्षेत्र</Text>
                <Text style={styles.detailValue}>{profile.education.fieldOfStudy}</Text>
              </View>
            )}
            {profile.education?.institution && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Institution / संस्थान</Text>
                <Text style={styles.detailValue}>{profile.education.institution}</Text>
              </View>
            )}
            {profile.education?.completionYear && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Completion Year / वर्ष</Text>
                <Text style={styles.detailValue}>{profile.education.completionYear}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Occupation Details */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            {currentLang === 'hi' ? 'व्यवसाय' : 'Occupation Details'}
          </Text>
          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Occupation / व्यवसाय</Text>
              <Text style={styles.detailValue}>
                {profile.occupation?.type || profile.occupation || '-'}
              </Text>
            </View>
            {profile.occupation?.jobTitle && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Job Title / पद</Text>
                <Text style={styles.detailValue}>{profile.occupation.jobTitle}</Text>
              </View>
            )}
            {profile.occupation?.employer && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Employer / नियोक्ता</Text>
                <Text style={styles.detailValue}>{profile.occupation.employer}</Text>
              </View>
            )}
            {profile.occupation?.annualIncomeMin !== undefined && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Annual Income / वार्षिक आय</Text>
                <Text style={styles.detailValue}>
                  {profile.occupation.annualIncomeMin 
                    ? `₹${(profile.occupation.annualIncomeMin / 100000).toFixed(1)} Lakhs` 
                    : '-'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Family Details */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            {currentLang === 'hi' ? 'पारिवारिक विवरण' : 'Family Details'}
          </Text>
          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Father's Name / पिता का नाम</Text>
              <Text style={styles.detailValue}>
                {profile.fatherName ? profile.fatherName : (profile.family?.fatherName || 'Locked / लॉक है')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Father's Occupation / पिता का व्यवसाय</Text>
              <Text style={styles.detailValue}>
                {profile.family?.fatherOccupation || '-'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mother's Name / माता का नाम</Text>
              <Text style={styles.detailValue}>
                {profile.family?.motherName || 'Locked / लॉक है'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Family Type / परिवार का प्रकार</Text>
              <Text style={styles.detailValue}>
                {profile.family?.familyType || '-'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Family Status / पारिवारिक स्तर</Text>
              <Text style={styles.detailValue}>
                {profile.family?.familyStatus || '-'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address / पता</Text>
              <Text style={styles.detailValue}>
                {profile.homeAddress ? profile.homeAddress : (profile.family?.homeAddress || 'Locked / लॉक है')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0800',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#1A0800',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#FF6F61',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A0800',
    borderBottomWidth: 1,
    borderBottomColor: '#3D281C',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#E8B84B',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  shortlistBtn: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photoContainer: {
    height: 320,
    backgroundColor: '#2C1A10',
    width: '100%',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#3D281C',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  placeholderText: {
    color: '#8A7A60',
    fontSize: 14,
    marginTop: 12,
  },
  lockText: {
    color: '#E8B84B',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  lockSubtext: {
    color: '#D4BFA0',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  upgradeBtnSmall: {
    backgroundColor: '#E8B84B',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 16,
  },
  upgradeBtnText: {
    color: '#1A0800',
    fontWeight: 'bold',
    fontSize: 13,
  },
  introCard: {
    backgroundColor: '#2C1A10',
    borderBottomWidth: 1,
    borderBottomColor: '#3D281C',
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIdText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8B84B',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 12,
  },
  verifiedText: {
    color: '#1A0800',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  quickInfo: {
    color: '#D4BFA0',
    fontSize: 16,
    marginTop: 6,
  },
  quickSubInfo: {
    color: '#8A7A60',
    fontSize: 14,
    marginTop: 4,
  },
  actionPanel: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#3D281C',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8B84B',
    borderRadius: 8,
    paddingVertical: 12,
    width: '100%',
  },
  primaryActionBtnText: {
    color: '#1A0800',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FF6F61',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 12,
    width: '100%',
  },
  secondaryActionBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  respondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    flex: 0.47,
  },
  declineButton: {
    backgroundColor: '#FF6F61',
  },
  acceptButton: {
    backgroundColor: '#E8B84B',
  },
  respondButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 184, 75, 0.15)',
    borderWidth: 1,
    borderColor: '#E8B84B',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    justifyContent: 'center',
  },
  connectedBadgeText: {
    color: '#E8B84B',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  declinedBadge: {
    backgroundColor: '#3D281C',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    alignItems: 'center',
  },
  declinedText: {
    color: '#8A7A60',
    fontWeight: 'bold',
  },
  premiumPromoCard: {
    backgroundColor: '#2C1A10',
    borderWidth: 1,
    borderColor: '#E8B84B',
    borderRadius: 12,
    margin: 16,
    padding: 20,
    alignItems: 'center',
  },
  promoHeader: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  promoDesc: {
    color: '#D4BFA0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  upgradeBtnLarge: {
    backgroundColor: '#E8B84B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  upgradeBtnLargeText: {
    color: '#1A0800',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#E8B84B',
    fontSize: 15,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  detailsList: {
    backgroundColor: '#2C1A10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3D281C',
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3D281C',
  },
  detailLabel: {
    color: '#8A7A60',
    fontSize: 13,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D281C',
    paddingBottom: 16,
  },
  aboutHeader: {
    color: '#8A7A60',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  aboutText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  kundliCard: {
    backgroundColor: '#2C1A10',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8B84B',
    padding: 16,
  },
  kundliHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#3D281C',
    paddingBottom: 12,
    marginBottom: 12,
  },
  kundliScoreText: {
    color: '#E8B84B',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  kundliLabelBadge: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  labelUttam: {
    backgroundColor: '#4CAF50',
  },
  labelMadhyam: {
    backgroundColor: '#E8B84B',
  },
  labelVichar: {
    backgroundColor: '#FF6F61',
  },
  kundliLabelBadgeText: {
    color: '#1A0800',
    fontWeight: 'bold',
    fontSize: 12,
  },
  approxNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 184, 75, 0.1)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  approxNoticeText: {
    color: '#E8B84B',
    fontSize: 11,
    marginLeft: 6,
    lineHeight: 14,
  },
  kundliGrid: {
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridCol: {
    flex: 0.48,
    backgroundColor: '#1C0D05',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#3D281C',
  },
  gridLabel: {
    color: '#8A7A60',
    fontSize: 11,
  },
  gridVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  noDataText: {
    color: '#8A7A60',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
