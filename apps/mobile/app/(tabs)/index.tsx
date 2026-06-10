import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiRequest } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface MatchCandidate {
  id: string;
  profileId: string;
  gender: string;
  gotra: string;
  maritalStatus: string;
  age: number;
  heightDisplay?: string | null;
  height_cm?: number | null;
  city: string;
  education: string;
  occupation: string;
  matchScore: number;
  photoUrl?: string;
  isVerified: boolean;
}

export default function MatchesScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [topPick, setTopPick] = useState<MatchCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchMatches = async (cursor?: string, isRefresh = false) => {
    try {
      const path = `/matches/suggestions${cursor ? `?cursor=${btoa(cursor)}` : ''}`;
      const res = await apiRequest(path);
      
      if (res.success && res.data) {
        const list: MatchCandidate[] = res.data;
        if (isRefresh) {
          setCandidates(list);
          if (list.length > 0) {
            setTopPick(list[0]); // Pick first as Top Pick for demo/MVP
          }
        } else {
          setCandidates((prev) => [...prev, ...list]);
        }
        setNextCursor(res.meta?.next_cursor || null);
      }
    } catch (err: any) {
      console.warn('Error fetching matches:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMatches(undefined, true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMatches(undefined, true);
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      setLoadingMore(true);
      fetchMatches(nextCursor);
    }
  };

  const handleSendInterest = async (candidateId: string) => {
    try {
      const res = await apiRequest('/interests', {
        method: 'POST',
        body: JSON.stringify({ receiverId: candidateId }),
      });
      if (res.success) {
        Alert.alert('Success / सफलता', 'Interest request sent! / रुचि अनुरोध भेजा गया!');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send interest');
    }
  };

  const handleShortlist = async (candidateId: string) => {
    try {
      const res = await apiRequest(`/shortlist/${candidateId}`, {
        method: 'POST',
      });
      if (res.success) {
        Alert.alert('Success / सफलता', 'Added to Shortlist! / सूची में जोड़ा गया!');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to shortlist');
    }
  };

  const renderCandidateCard = ({ item }: { item: MatchCandidate }) => {
    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => router.push(`/profile/${item.profileId}`)}
          style={styles.cardHeader}
        >
          <Image
            source={{ uri: item.photoUrl || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <View style={styles.cardDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName}>
                GS{item.profileId} {item.isVerified && <Ionicons name="checkmark-circle" size={16} color="#E8B84B" />}
              </Text>
              <Text style={styles.matchScore}>{item.matchScore}% Match</Text>
            </View>
            <Text style={styles.cardInfo}>
              {item.age} yrs • {item.heightDisplay || (item.height_cm ? `${item.height_cm} cm` : '—')} • {item.maritalStatus}
            </Text>
            <Text style={styles.cardSubInfo}>
              Gotra: {item.gotra} • {item.city}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSendInterest(item.id)}
          >
            <Ionicons name="heart" size={18} color="#E8B84B" />
            <Text style={styles.actionText}>Interest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShortlist(item.id)}
          >
            <Ionicons name="bookmark" size={18} color="#D4BFA0" />
            <Text style={styles.actionText}>Shortlist</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => router.push(`/profile/${item.profileId}`)}
          >
            <Text style={styles.primaryActionText}>View / देखें</Text>
          </TouchableOpacity>
        </View>
      </View>
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
      <FlatList
        data={candidates}
        renderItem={renderCandidateCard}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          topPick ? (
            <View style={styles.topPickSection}>
              <Text style={styles.sectionHeader}>Today's Top Pick / आज का मुख्य मिलान</Text>
              <TouchableOpacity
                style={styles.topPickCard}
                onPress={() => router.push(`/profile/${topPick.profileId}`)}
              >
                <Image
                  source={{ uri: topPick.photoUrl || 'https://via.placeholder.com/300' }}
                  style={styles.topPickImage}
                />
                <View style={styles.topPickOverlay}>
                  <Text style={styles.topPickName}>GS{topPick.profileId}</Text>
                  <Text style={styles.topPickSub}>
                    {topPick.age} yrs • {topPick.city} • Gotra: {topPick.gotra}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{topPick.matchScore}% Match Score</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={styles.sectionHeader}>More Recommendations / अन्य मिलान</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matches found / कोई मिलान नहीं मिला</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" color="#E8B84B" style={{ marginVertical: 16 }} /> : null
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
  topPickSection: {
    padding: 16,
  },
  sectionHeader: {
    color: '#D4BFA0',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topPickCard: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3D281C',
  },
  topPickImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topPickOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(26, 8, 0, 0.75)',
  },
  topPickName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  topPickSub: {
    color: '#D4BFA0',
    fontSize: 14,
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8B84B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: {
    color: '#1A0800',
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#2C1A10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D281C',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    resizeMode: 'cover',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  matchScore: {
    color: '#E8B84B',
    fontWeight: '700',
    fontSize: 14,
  },
  cardInfo: {
    color: '#D4BFA0',
    fontSize: 13,
    marginTop: 4,
  },
  cardSubInfo: {
    color: '#8A7A60',
    fontSize: 12,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#3D281C',
    marginTop: 16,
    paddingTop: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionText: {
    color: '#D4BFA0',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  primaryAction: {
    backgroundColor: '#E8B84B',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  primaryActionText: {
    color: '#1A0800',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8A7A60',
    fontSize: 15,
  },
});
