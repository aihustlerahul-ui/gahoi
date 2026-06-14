import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { formatProfileIdLabel } from '@gahoisarthi/shared';
import { useAuth } from '../src/lib/auth';
import { Icon, IconName } from '../src/components/ui';
import { colors, spacing, radius } from '../src/theme';

const HELPLINE = '+91 9827027044';

export default function DrawerScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const isPremium = userProfile?.user?.tier === 'paid';
  const publicId = userProfile?.profileId;
  const name = [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') || 'Gahoi Member';

  const go = (path: string) => () => {
    router.back();
    setTimeout(() => router.push(path as any), 50);
  };

  type Row = { icon: IconName; label: string; onPress: () => void; subtitle?: string };
  const groups: { title: string; gold?: boolean; rows: Row[] }[] = [
    {
      title: 'Quick Access',
      gold: true,
      rows: [
        { icon: 'home', label: 'Home / होम', onPress: go('/(tabs)') },
        { icon: 'heart', label: 'Interests / रुचियां', onPress: go('/(tabs)/interests') },
        { icon: 'eye', label: 'Viewed by / किसने देखा', onPress: go('/profile/views') },
        { icon: 'bookmark', label: 'Shortlist / सूची', onPress: go('/(tabs)/shortlist') },
      ],
    },
    {
      title: 'Browse Profiles',
      rows: [
        { icon: 'user', label: 'New Today / नए', onPress: go('/(tabs)') },
        { icon: 'user', label: '30+ Age', onPress: go('/(tabs)') },
        { icon: 'user', label: 'Divorce Profiles', onPress: go('/(tabs)') },
        { icon: 'user', label: 'Widowed Profiles', onPress: go('/(tabs)') },
      ],
    },
    {
      title: 'Search',
      rows: [
        { icon: 'search', label: 'By Profile ID', onPress: go('/(tabs)/search') },
        { icon: 'search', label: 'By Name', onPress: go('/(tabs)/search') },
        { icon: 'search', label: 'By Profession', onPress: go('/(tabs)/search') },
        { icon: 'search', label: 'By State', onPress: go('/(tabs)/search') },
      ],
    },
    {
      title: 'More',
      rows: [
        { icon: 'crown', label: 'Plans / योजनाएं', onPress: go('/payment/checkout') },
        { icon: 'headset', label: 'Helpline', subtitle: HELPLINE, onPress: () => Linking.openURL(`tel:${HELPLINE.replace(/\s/g, '')}`) },
        { icon: 'settings', label: 'Settings / सेटिंग्स', onPress: go('/(tabs)/settings') },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header (dark brown) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Icon name="user" size={28} color={colors.goldAccent} />
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Icon name="close" size={22} color={colors.lightGold} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerName}>{name}</Text>
        <View style={styles.headerMeta}>
          {publicId != null && <Text style={styles.headerId}>{formatProfileIdLabel(publicId)}</Text>}
          <Text style={[styles.tier, { color: colors.goldAccent }]}>{isPremium ? 'Paid' : 'Free'}</Text>
        </View>
        <View style={styles.statsBar}>
          {['Views', 'Interests', 'Matched'].map((s) => (
            <View key={s} style={styles.statChip}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingVertical: spacing.md }}>
        {groups.map((g) => (
          <View key={g.title} style={styles.group}>
            <Text style={styles.groupTitle}>{g.title}</Text>
            {g.rows.map((r) => (
              <TouchableOpacity key={r.label} style={styles.row} onPress={r.onPress}>
                <Icon name={r.icon} size={20} color={g.gold ? colors.sacredGold : colors.midBrown} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.rowLabel}>{r.label}</Text>
                  {r.subtitle && <Text style={styles.rowSubtitle}>{r.subtitle}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.darkBrown, padding: spacing.xl, paddingTop: 56 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { padding: 4 },
  headerName: { color: '#FFFFFF', fontSize: 16, fontWeight: '500', marginTop: spacing.md },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 },
  headerId: { color: colors.lightGold, fontSize: 11 },
  tier: { fontSize: 11, fontWeight: '600' },
  statsBar: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  statChip: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.button, paddingVertical: spacing.sm, alignItems: 'center' },
  statNum: { color: colors.goldAccent, fontSize: 16, fontWeight: '700' },
  statLabel: { color: colors.lightGold, fontSize: 9, marginTop: 2 },
  group: { marginBottom: spacing.md },
  groupTitle: { color: colors.deepGold, fontSize: 11, fontWeight: '500', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  rowLabel: { fontSize: 13, color: colors.darkBrown },
  rowSubtitle: { fontSize: 11, color: colors.midBrown, marginTop: 2 },
});
