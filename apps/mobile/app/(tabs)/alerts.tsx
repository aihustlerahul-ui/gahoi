import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { apiRequest } from '../../src/lib/api';
import { getRouteFromScreen } from '../../src/lib/notifications';
import { Icon, Card } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

interface AlertItem {
  id: string;
  title?: string;
  body?: string;
  message?: string;
  screen?: string;
  createdAt?: string;
  read?: boolean;
}

export default function AlertsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await apiRequest('/profile/me/notifications').catch(() => ({ success: false, data: [] }));
      if (res?.success && res.data) setItems(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = (a: AlertItem) => {
    const route = getRouteFromScreen(a.screen);
    if (route) router.push(route as any);
  };

  const render = ({ item }: { item: AlertItem }) => (
    <TouchableOpacity onPress={() => open(item)} activeOpacity={0.8}>
      <Card style={[styles.card, !item.read && styles.unread]}>
        <View style={styles.iconWrap}>
          <Icon name="bell" size={18} color={colors.sacredGold} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.title}>{item.title || 'Notification'}</Text>
          <Text style={styles.body}>{item.body || item.message || ''}</Text>
          {item.createdAt && <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>}
        </View>
      </Card>
    </TouchableOpacity>
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
      <Text style={styles.h1}>Alerts / सूचनाएं</Text>
      <FlatList
        data={items}
        renderItem={render}
        keyExtractor={(i) => i.id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell" size={28} color={colors.borderWarm} />
            <Text style={styles.emptyText}>No notifications yet / अभी कोई सूचना नहीं</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  center: { flex: 1, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 18, fontWeight: '600', color: colors.darkBrown, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  unread: { borderColor: colors.goldAccent },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lightGold, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '500', color: colors.darkBrown },
  body: { fontSize: 11, color: colors.midBrown, marginTop: 2 },
  date: { fontSize: 10, color: colors.midBrown, marginTop: 4 },
  empty: { padding: 60, alignItems: 'center', gap: spacing.md },
  emptyText: { color: colors.midBrown, fontSize: 13 },
});
