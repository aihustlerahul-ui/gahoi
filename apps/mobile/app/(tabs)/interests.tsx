import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiRequest } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { useRouter } from 'expo-router';
import { Icon, Card } from '../../src/components/ui';
import { colors, spacing, radius } from '../../src/theme';

interface PartnerLite {
  id: string;
  profileId: string;
  gender: string;
  gotra: string;
  maritalStatus: string;
  height_cm: number;
  livingCity?: { name: string };
  age?: number;
}

interface InterestItem {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  createdAt: string;
  sender?: PartnerLite;
  receiver?: PartnerLite;
}

interface ViewItem {
  id: string;
  viewedAt?: string;
  createdAt?: string;
  viewer: { profileId: number | string; gotra?: string; livingCity?: { name: string }; age?: number; isMasked?: boolean };
}

type Tab = 'received' | 'sent' | 'accepted' | 'views';
const TABS: { key: Tab; label: string }[] = [
  { key: 'received', label: 'Received / प्राप्त' },
  { key: 'sent', label: 'Sent / भेजे' },
  { key: 'accepted', label: 'Accepted / स्वीकृत' },
  { key: 'views', label: 'Views / देखा' },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('received');
  const [receivedList, setReceivedList] = useState<InterestItem[]>([]);
  const [sentList, setSentList] = useState<InterestItem[]>([]);
  const [acceptedList, setAcceptedList] = useState<InterestItem[]>([]);
  const [viewsList, setViewsList] = useState<ViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInterests = async () => {
    try {
      const [sentRes, recRes, viewsRes] = await Promise.all([
        apiRequest('/interests/sent'),
        apiRequest('/interests/received'),
        apiRequest('/profile/me/views').catch(() => ({ success: false, data: [] })),
      ]);
      if (sentRes.success && sentRes.data) setSentList(sentRes.data);
      if (recRes.success && recRes.data) setReceivedList(recRes.data);
      if (viewsRes.success && viewsRes.data) setViewsList(viewsRes.data);

      const acceptedFromSent = (sentRes.data || []).filter((i: InterestItem) => i.status === 'accepted');
      const acceptedFromRec = (recRes.data || []).filter((i: InterestItem) => i.status === 'accepted');
      const merged: InterestItem[] = [...acceptedFromRec];
      acceptedFromSent.forEach((item: InterestItem) => {
        if (!merged.some((m) => m.id === item.id)) merged.push(item);
      });
      setAcceptedList(merged);
    } catch (err: any) {
      console.warn('Error loading interests:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInterests();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadInterests();
  };

  const handleRespond = async (interestId: string, action: 'accepted' | 'declined') => {
    try {
      const res = await apiRequest(`/interests/${interestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      if (res.success) loadInterests();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to respond');
    }
  };

  const handleWithdraw = async (interestId: string) => {
    try {
      const res = await apiRequest(`/interests/${interestId}`, { method: 'DELETE' });
      if (res.success) loadInterests();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to withdraw');
    }
  };

  const renderInterestCard = ({ item }: { item: InterestItem }) => {
    const isReceived = activeTab === 'received';
    const isAccepted = activeTab === 'accepted';
    const isSent = activeTab === 'sent';
    const partner = isReceived
      ? item.sender
      : isAccepted
      ? item.sender?.id === userProfile?.id
        ? item.receiver
        : item.sender
      : item.receiver;
    if (!partner) return null;

    return (
      <Card style={styles.card}>
        {/* Status banner */}
        {isAccepted ? (
          <View style={[styles.banner, styles.bannerAccepted]}>
            <Text style={styles.bannerAcceptedText}>Request Accepted / स्वीकृत</Text>
          </View>
        ) : item.status === 'pending' ? (
          <View style={[styles.banner, styles.bannerPending]}>
            <Text style={styles.bannerPendingText}>Pending / लंबित</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.cardBody} onPress={() => router.push(`/profile/${partner.profileId}`)}>
          <View style={styles.avatar}>
            <Icon name="user" size={26} color={colors.midBrown} />
          </View>
          <View style={styles.details}>
            <Text style={styles.name}>GS {partner.profileId}</Text>
            <Text style={styles.sub}>
              {partner.age} yrs · {partner.gotra} · {partner.livingCity?.name || 'City'}
            </Text>
            {item.message && <Text style={styles.msg}>"{item.message}"</Text>}
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          {isReceived && item.status === 'pending' && (
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.declineBtn]} onPress={() => handleRespond(item.id, 'declined')}>
                <Text style={styles.declineText}>Decline / अस्वीकार</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => handleRespond(item.id, 'accepted')}>
                <Text style={styles.acceptText}>Accept / स्वीकार</Text>
              </TouchableOpacity>
            </View>
          )}
          {isSent && item.status === 'pending' && (
            <TouchableOpacity style={[styles.btn, styles.declineBtn, { width: '100%' }]} onPress={() => handleWithdraw(item.id)}>
              <Text style={styles.declineText}>Withdraw / वापस लें</Text>
            </TouchableOpacity>
          )}
          {isAccepted && (
            <TouchableOpacity style={[styles.btn, styles.acceptBtn, styles.contactBtn]} onPress={() => router.push(`/profile/${partner.profileId}`)}>
              <Icon name="phone" size={14} color={colors.onGold} />
              <Text style={styles.acceptText}>View Contact / संपर्क देखें</Text>
            </TouchableOpacity>
          )}
          {!isAccepted && !isReceived && !isSent && null}
          {(activeTab === 'sent') && item.status !== 'pending' && (
            <Text style={[styles.statusLabel, item.status === 'accepted' ? styles.statusAccepted : styles.statusDeclined]}>
              {item.status.toUpperCase()}
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const renderViewCard = ({ item }: { item: ViewItem }) => (
    <Card style={styles.card}>
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => !item.viewer.isMasked && router.push(`/profile/${item.viewer.profileId}`)}
      >
        <View style={styles.avatar}>
          <Icon name="eye" size={24} color={colors.midBrown} />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.viewer.isMasked ? 'GS-*****' : `GS ${item.viewer.profileId}`}</Text>
          <Text style={styles.sub}>
            {item.viewer.age ? `${item.viewer.age} yrs · ` : ''}
            {item.viewer.gotra || ''} {item.viewer.livingCity?.name ? `· ${item.viewer.livingCity.name}` : ''}
          </Text>
          <Text style={styles.date}>{new Date(item.viewedAt || item.createdAt || Date.now()).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.sacredGold} />
      </View>
    );
  }

  const listData = activeTab === 'sent' ? sentList : activeTab === 'accepted' ? acceptedList : activeTab === 'views' ? viewsList : receivedList;

  return (
    <View style={styles.container}>
      <View style={styles.tabsHeader}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tabButton, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={listData as any[]}
        renderItem={activeTab === 'views' ? (renderViewCard as any) : (renderInterestCard as any)}
        keyExtractor={(item: any) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nothing here yet / यहाँ कुछ नहीं है</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  center: { flex: 1, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center' },
  tabsHeader: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderWarm },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.sacredGold },
  tabText: { color: colors.midBrown, fontWeight: '500', fontSize: 11 },
  tabTextActive: { color: colors.sacredGold },
  card: { marginBottom: spacing.md, padding: spacing.lg, overflow: 'hidden' },
  banner: { marginHorizontal: -spacing.lg, marginTop: -spacing.lg, marginBottom: spacing.md, paddingVertical: 6, paddingHorizontal: spacing.lg },
  bannerPending: { backgroundColor: colors.lightGold },
  bannerPendingText: { color: colors.sacredGold, fontSize: 11, fontWeight: '500' },
  bannerAccepted: { backgroundColor: '#E6F0F7' },
  bannerAcceptedText: { color: colors.accepted, fontSize: 11, fontWeight: '500' },
  cardBody: { flexDirection: 'row' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderWarm,
  },
  details: { flex: 1, marginLeft: spacing.lg },
  name: { color: colors.darkBrown, fontSize: 13, fontWeight: '500' },
  sub: { color: colors.midBrown, fontSize: 11, marginTop: 4 },
  msg: { color: colors.midBrown, fontSize: 12, fontStyle: 'italic', marginTop: 6 },
  date: { color: colors.midBrown, fontSize: 10, marginTop: 8 },
  actions: { marginTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1, borderRadius: radius.button, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { backgroundColor: colors.destructiveBg, borderWidth: 1, borderColor: colors.destructiveBorder },
  declineText: { color: colors.rejected, fontSize: 12, fontWeight: '600' },
  acceptBtn: { backgroundColor: colors.sacredGold },
  acceptText: { color: colors.onGold, fontSize: 12, fontWeight: '600' },
  contactBtn: { flexDirection: 'row', gap: 6, width: '100%' },
  statusLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  statusAccepted: { color: colors.verified },
  statusDeclined: { color: colors.rejected },
  empty: { padding: 60, alignItems: 'center' },
  emptyText: { color: colors.midBrown, fontSize: 13 },
});
