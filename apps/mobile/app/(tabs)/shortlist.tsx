import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiRequest } from '../../src/lib/api';
import { useRouter } from 'expo-router';
import { Icon, Card } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

interface ShortlistedItem {
  id: string;
  profileId: string;
  gender: string;
  gotra: string;
  maritalStatus: string;
  heightDisplay?: string | null;
  height_cm?: number | null;
  livingCity?: { name: string };
}

export default function ShortlistScreen() {
  const router = useRouter();
  const [list, setList] = useState<ShortlistedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShortlist = async () => {
    try {
      const res = await apiRequest('/shortlist');
      if (res.success && res.data) setList(res.data);
    } catch (err: any) {
      console.warn('Error fetching shortlist:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShortlist();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchShortlist();
  };

  const handleRemove = async (id: string) => {
    try {
      const res = await apiRequest(`/shortlist/${id}`, { method: 'DELETE' });
      if (res.success) setList((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to remove from shortlist');
    }
  };

  const renderItem = ({ item }: { item: ShortlistedItem }) => (
    <Card style={styles.card}>
      <TouchableOpacity style={styles.cardBody} onPress={() => router.push(`/profile/${item.profileId}`)}>
        <View style={styles.avatar}>
          <Icon name="bookmark-filled" size={22} color={colors.sacredGold} />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>GS {item.profileId}</Text>
          <Text style={styles.sub}>
            {item.gender} · {item.gotra} · {item.livingCity?.name || 'City'}
          </Text>
          <Text style={styles.subText}>
            {item.maritalStatus} · {item.heightDisplay || (item.height_cm ? `${item.height_cm} cm` : '—')}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(item.id)}>
        <Icon name="trash" size={18} color={colors.rejected} />
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

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Your Shortlist is empty / आपकी सूची खाली है</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  center: { flex: 1, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightGold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderWarm,
  },
  details: { marginLeft: spacing.lg, flex: 1 },
  name: { color: colors.darkBrown, fontSize: 13, fontWeight: '500' },
  sub: { color: colors.midBrown, fontSize: 11, marginTop: 2 },
  subText: { color: colors.midBrown, fontSize: 10, marginTop: 2 },
  removeButton: { padding: spacing.sm },
  empty: { padding: 60, alignItems: 'center' },
  emptyText: { color: colors.midBrown, fontSize: 13 },
});
