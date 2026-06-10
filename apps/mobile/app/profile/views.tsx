import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { apiRequest } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ViewerProfile {
  id: string;
  profileId: number | string;
  gender: string;
  age: number;
  gotra: string;
  city: string;
  education: string;
  occupation: string;
  isMasked: boolean;
}

interface ViewItem {
  id: string;
  createdAt: string;
  viewer: ViewerProfile;
}

export default function ProfileViewsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  const [viewsList, setViewsList] = useState<ViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentLang = i18n.language || 'en';
  const isPremium = userProfile?.user?.tier === 'paid';

  const fetchViews = async () => {
    try {
      const res = await apiRequest('/profile/me/views');
      if (res.success && res.data) {
        setViewsList(res.data);
      }
    } catch (err: any) {
      console.warn('Error fetching profile views:', err.message);
      Alert.alert('Error', 'Failed to load profile views');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchViews();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchViews();
  };

  const handleItemPress = (item: ViewItem) => {
    if (item.viewer.isMasked) {
      Alert.alert(
        currentLang === 'hi' ? 'प्रीमियम आवश्यक है' : 'Premium Required',
        currentLang === 'hi'
          ? 'यह देखने के लिए कि इस सदस्य ने आपकी प्रोफ़ाइल कब देखी, कृपया प्रीमियम में अपग्रेड करें!'
          : 'Please upgrade to Premium to unlock the identity of who viewed your profile!',
        [
          { text: currentLang === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
          {
            text: currentLang === 'hi' ? 'प्रीमियम लें' : 'Upgrade',
            onPress: () => router.push('/payment/checkout'),
          },
        ]
      );
    } else {
      router.push(`/profile/${item.viewer.profileId}`);
    }
  };

  const renderViewCard = ({ item }: { item: ViewItem }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString(
      currentLang === 'hi' ? 'hi-IN' : 'en-US',
      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );

    return (
      <TouchableOpacity
        style={[styles.card, item.viewer.isMasked && styles.cardMasked]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Ionicons
            name={item.viewer.isMasked ? 'lock-closed' : 'person'}
            size={24}
            color={item.viewer.isMasked ? '#E8B84B' : '#D4BFA0'}
          />
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.profileId, item.viewer.isMasked && styles.blurredText]}>
              {item.viewer.isMasked ? 'GS-*****' : `GS-${item.viewer.profileId}`}
            </Text>
            <Text style={styles.timeText}>{formattedDate}</Text>
          </View>

          <Text style={styles.infoText}>
            {item.viewer.age} yrs • {item.viewer.gender}
          </Text>

          <Text style={[styles.subInfoText, item.viewer.isMasked && styles.blurredText]}>
            Gotra: {item.viewer.gotra} • {item.viewer.city}
          </Text>
        </View>

        {item.viewer.isMasked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="gift-outline" size={16} color="#E8B84B" />
            <Text style={styles.unlockCTA}>Unlock / खोलें</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E8B84B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#E8B84B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentLang === 'hi' ? 'प्रोफ़ाइल दर्शक / Views' : 'Profile Visitors'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Free user upgrade promotion */}
      {!isPremium && (
        <View style={styles.promoBanner}>
          <Ionicons name="star" size={20} color="#1A0800" />
          <Text style={styles.promoText}>
            {currentLang === 'hi'
              ? 'प्रीमियम लें और देखें कि किसने आपकी प्रोफ़ाइल देखी।'
              : 'Upgrade to see exactly who visited your profile.'}
          </Text>
          <TouchableOpacity
            style={styles.promoBtn}
            onPress={() => router.push('/payment/checkout')}
          >
            <Text style={styles.promoBtnText}>View / देखें</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={viewsList}
        renderItem={renderViewCard}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="eye-off-outline" size={48} color="#8A7A60" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>
              {currentLang === 'hi'
                ? 'अभी तक किसी ने आपकी प्रोफ़ाइल नहीं देखी है'
                : 'No one has viewed your profile yet'}
            </Text>
          </View>
        }
      />
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
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8B84B',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  promoText: {
    flex: 1,
    color: '#1A0800',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 8,
    marginRight: 8,
  },
  promoBtn: {
    backgroundColor: '#1A0800',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  promoBtnText: {
    color: '#E8B84B',
    fontWeight: 'bold',
    fontSize: 11,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C1A10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3D281C',
    marginBottom: 12,
    padding: 16,
  },
  cardMasked: {
    opacity: 0.85,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C0D05',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3D281C',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileId: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  timeText: {
    color: '#8A7A60',
    fontSize: 11,
  },
  infoText: {
    color: '#D4BFA0',
    fontSize: 13,
    marginTop: 4,
  },
  subInfoText: {
    color: '#8A7A60',
    fontSize: 12,
    marginTop: 2,
  },
  blurredText: {
    color: '#3D281C',
  },
  lockOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  unlockCTA: {
    color: '#E8B84B',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8A7A60',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
