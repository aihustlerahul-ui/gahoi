import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiRequest } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { useRouter } from 'expo-router';
import { Icon, Card, Pill } from '../../src/components/ui';
import { colors, spacing, radius } from '../../src/theme';

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

const CATEGORY_PILLS = [
  { key: 'all', label: 'All / सभी' },
  { key: 'new', label: 'New / नए' },
  { key: 'premium', label: 'Premium' },
  { key: '30plus', label: '30+ Age' },
  { key: 'divorce', label: 'Divorce' },
  { key: 'widow', label: 'Widow' },
  { key: 'manglik', label: 'Manglik' },
  { key: 'business', label: 'Business' },
];

function getMissingItems(p: any): string[] {
  const missing: string[] = [];
  if (!p?.firstName || !p?.lastName) missing.push('Full name');
  if (!p?.aboutMe) missing.push('About me');
  if (!p?.gallery?.length) missing.push('Photos');
  if (!p?.education?.highestDegree) missing.push('Education');
  if (!p?.occupation?.type) missing.push('Occupation');
  if (!p?.family?.fatherName) missing.push('Family details');
  return missing;
}

function ProfileCompletionBanner({ userProfile, onPress }: { userProfile: any; onPress: () => void }) {
  const pct: number = userProfile?.profileCompletenessPct ?? 0;
  if (pct >= 100) return null;
  const missing = getMissingItems(userProfile);
  return (
    <TouchableOpacity style={bannerStyles.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={bannerStyles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={bannerStyles.title}>Complete your profile / प्रोफ़ाइल पूरा करें</Text>
          <Text style={bannerStyles.sub}>
            {missing.length > 0 ? `Missing: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` +${missing.length - 3} more` : ''}` : 'Almost there!'}
          </Text>
        </View>
        <View style={bannerStyles.pctCircle}>
          <Text style={bannerStyles.pctText}>{pct}%</Text>
        </View>
      </View>
      <View style={bannerStyles.track}>
        <View style={[bannerStyles.fill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={bannerStyles.cta}>Tap to complete →</Text>
    </TouchableOpacity>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.lightGold,
    borderWidth: 1,
    borderColor: colors.goldAccent,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: 13, fontWeight: '600', color: colors.darkBrown },
  sub: { fontSize: 11, color: colors.midBrown, marginTop: 2 },
  pctCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sacredGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  pctText: { color: colors.onGold, fontSize: 13, fontWeight: '700' },
  track: { height: 6, backgroundColor: colors.borderWarm, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.sacredGold, borderRadius: 3 },
  cta: { fontSize: 11, color: colors.sacredGold, fontWeight: '500', marginTop: spacing.sm, textAlign: 'right' },
});

export default function MatchesScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [topPick, setTopPick] = useState<MatchCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activePill, setActivePill] = useState('all');

  const isPremium = userProfile?.user?.tier === 'paid';

  const fetchMatches = async (cursor?: string, isRefresh = false) => {
    try {
      const path = `/matches/suggestions${cursor ? `?cursor=${btoa(cursor)}` : ''}`;
      const res = await apiRequest(path);
      if (res.success && res.data) {
        const list: MatchCandidate[] = res.data;
        if (isRefresh) {
          setCandidates(list);
          if (list.length > 0) setTopPick(list[0]);
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
      if (res.success) Alert.alert('Sent / भेजा गया', 'Interest request sent! / रुचि अनुरोध भेजा गया!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send interest');
    }
  };

  const handleShortlist = async (candidateId: string) => {
    try {
      const res = await apiRequest(`/shortlist/${candidateId}`, { method: 'POST' });
      if (res.success) Alert.alert('Saved / सहेजा गया', 'Added to Shortlist! / सूची में जोड़ा गया!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to shortlist');
    }
  };

  const renderCard = ({ item }: { item: MatchCandidate }) => (
    <Card style={styles.card}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/profile/${item.profileId}`)}>
        <View style={styles.photoWrap}>
          <Image source={{ uri: item.photoUrl || 'https://via.placeholder.com/400x240' }} style={styles.photo} />
          <View style={styles.idOverlay}>
            <Text style={styles.idOverlayText}>Profile Id – GS {item.profileId}</Text>
          </View>
          {item.isVerified && (
            <View style={styles.verifiedPill}>
              <Icon name="verified" size={11} color={colors.verified} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
          <View style={styles.pillStack}>
            {!!item.gotra && <Pill label={item.gotra} bg={colors.borderWarm} color="#5C3A1A" />}
            {!!item.occupation && <Pill label={item.occupation} bg="#F0E8D8" color="#5C3A1A" />}
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.cardInfo}>
        <Text style={styles.name}>GS {item.profileId}</Text>
        <Text style={styles.meta}>
          {item.age} years  🇮🇳  {item.city}
        </Text>
        <Text style={styles.metaSub}>
          {item.heightDisplay || (item.height_cm ? `${item.height_cm} cm` : '—')} · {item.maritalStatus} · {item.matchScore}% match
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleShortlist(item.id)}>
            <Icon name="bookmark" size={16} color={colors.sacredGold} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={() => handleSendInterest(item.id)}>
            <Icon name="heart" size={14} color={colors.onGold} />
            <Text style={styles.sendBtnText}>Send Interest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.sacredGold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header bar — spec §7.1 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Namaste, {userProfile?.firstName || 'Member'}</Text>
          <Text style={styles.greetingSub}>{candidates.length} matches today</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => router.push('/(tabs)/search' as any)}>
            <Icon name="search" size={18} color={colors.sacredGold} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={() => router.push('/drawer' as any)}>
            <Icon name="menu" size={18} color={colors.sacredGold} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={candidates}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListHeaderComponent={
          <View>
            {/* Profile completion banner */}
            <ProfileCompletionBanner userProfile={userProfile} onPress={() => router.push('/(tabs)/profile' as any)} />

            {/* Category pills — spec §7.2 */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORY_PILLS}
              keyExtractor={(p) => p.key}
              contentContainerStyle={styles.pillBar}
              renderItem={({ item }) => (
                <View style={{ marginRight: spacing.sm }}>
                  <Pill label={item.label} active={activePill === item.key} onPress={() => setActivePill(item.key)} />
                </View>
              )}
            />

            {/* Today's top pick — paid only, spec §7.3 */}
            {isPremium && topPick && (
              <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/profile/${topPick.profileId}`)}>
                <View style={styles.topPick}>
                  <Image source={{ uri: topPick.photoUrl || 'https://via.placeholder.com/80' }} style={styles.topPickAvatar} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.topPickLabel}>★ Today's top pick</Text>
                    <Text style={styles.name}>GS {topPick.profileId}</Text>
                    <Text style={styles.metaSub}>
                      {topPick.education} · {topPick.city} · {topPick.matchScore}%
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.sendBtnSmall} onPress={() => handleSendInterest(topPick.id)}>
                    <Text style={styles.sendBtnText}>Send Interest</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No matches found / कोई मिलान नहीं मिला</Text>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.sacredGold} style={{ marginVertical: spacing.lg }} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  center: { flex: 1, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderWarm,
  },
  greeting: { fontSize: 13, fontWeight: '500', color: colors.darkBrown },
  greetingSub: { fontSize: 10, color: colors.midBrown, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  topPick: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.topPickBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldAccent,
    borderRadius: radius.card,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  topPickAvatar: { width: 38, height: 38, borderRadius: 9 },
  topPickLabel: { fontSize: 10, color: '#8A4408', marginBottom: 2 },
  card: { padding: 0, overflow: 'hidden', marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  photoWrap: { height: 200, backgroundColor: colors.lightGold },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  idOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  idOverlayText: { color: '#FFFFFF', fontSize: 10 },
  verifiedPill: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  verifiedText: { color: colors.verified, fontSize: 10, fontWeight: '500' },
  pillStack: { position: 'absolute', bottom: spacing.sm, right: spacing.sm, alignItems: 'flex-end', gap: 4 },
  cardInfo: { padding: spacing.md },
  name: { fontSize: 13, fontWeight: '500', color: colors.darkBrown },
  meta: { fontSize: 10, color: colors.midBrown, marginTop: 2 },
  metaSub: { fontSize: 10, color: colors.midBrown, marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sacredGold,
    borderRadius: radius.button,
    paddingVertical: 10,
    gap: 6,
  },
  sendBtnSmall: { backgroundColor: colors.sacredGold, borderRadius: radius.button, paddingHorizontal: spacing.md, paddingVertical: 8 },
  sendBtnText: { color: colors.onGold, fontSize: 11, fontWeight: '600' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.midBrown, fontSize: 13 },
});
