import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { formatProfileIdLabel, buildProfileShareText } from '@gahoisarthi/shared';
import { useAuth } from '../../src/lib/auth';
import { apiRequest } from '../../src/lib/api';
import { Icon, Card, IconName } from '../../src/components/ui';
import { colors, spacing, radius } from '../../src/theme';

interface Stats {
  views: number;
  interests: number;
  shortlisted: number;
}

export default function OwnProfileScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<Stats>({ views: 0, interests: 0, shortlisted: 0 });

  const isPremium = userProfile?.user?.tier === 'paid';
  const publicId = userProfile?.profileId;
  const fullName = [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') || 'Gahoi Member';
  const photo = userProfile?.gallery?.[0]?.signedUrl as string | undefined;

  useEffect(() => {
    apiRequest('/profile/me/stats')
      .then((res) => {
        if (res?.success && res.data) setStats({ views: res.data.views ?? 0, interests: res.data.interests ?? 0, shortlisted: res.data.shortlisted ?? 0 });
      })
      .catch(() => {});
  }, []);

  const shareProfile = async () => {
    if (!publicId) return;
    try {
      await Share.share({ message: buildProfileShareText(publicId) });
    } catch {
      Alert.alert('Error', 'Could not open share sheet');
    }
  };

  const links: { icon: IconName; label: string; onPress: () => void; gold?: boolean }[] = [
    { icon: 'edit', label: 'Edit Profile / प्रोफ़ाइल संपादित करें', onPress: () => router.push('/profile/wizard') },
    { icon: 'bookmark', label: 'My Shortlist / मेरी सूची', onPress: () => router.push('/(tabs)/shortlist' as any) },
    { icon: 'eye', label: 'Who Viewed Me / किसने देखा', onPress: () => router.push('/profile/views') },
    { icon: 'settings', label: 'Settings / सेटिंग्स', onPress: () => router.push('/(tabs)/settings' as any) },
  ];
  if (!isPremium) {
    links.push({ icon: 'crown', label: 'Upgrade to Premium / प्रीमियम लें', onPress: () => router.push('/payment/checkout'), gold: true });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      {/* Hero */}
      <View style={styles.hero}>
        {photo ? <Image source={{ uri: photo }} style={styles.heroPhoto} /> : <View style={[styles.heroPhoto, styles.heroPlaceholder]}><Icon name="user" size={64} color={colors.borderWarm} /></View>}
        <TouchableOpacity style={styles.shareBtn} onPress={shareProfile}>
          <Icon name="share" size={18} color={colors.sacredGold} />
        </TouchableOpacity>
        {publicId != null && (
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>{formatProfileIdLabel(publicId)}</Text>
          </View>
        )}
      </View>

      <View style={styles.identity}>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.sub}>{userProfile?.user?.email || ''}</Text>
        <View style={[styles.tierBadge, isPremium ? styles.tierPaid : styles.tierFree]}>
          <Icon name={isPremium ? 'verified' : 'user'} size={12} color={isPremium ? colors.onGold : colors.midBrown} />
          <Text style={[styles.tierText, { color: isPremium ? colors.onGold : colors.midBrown }]}>{isPremium ? 'Paid' : 'Free'}</Text>
        </View>
      </View>

      {/* Stat chips */}
      <View style={styles.statsRow}>
        {[
          { n: stats.views, label: 'Views / व्यून', tab: 'views' },
          { n: stats.interests, label: 'Interests / रुचि', tab: 'received' },
          { n: stats.shortlisted, label: 'Shortlisted / सूची', tab: 'shortlist' },
        ].map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.statChip}
            onPress={() => (s.tab === 'shortlist' ? router.push('/(tabs)/shortlist' as any) : router.push('/(tabs)/interests' as any))}
          >
            <Text style={styles.statNum}>{s.n}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Links */}
      <View style={styles.section}>
        {links.map((l) => (
          <TouchableOpacity key={l.label} style={styles.linkRow} onPress={l.onPress}>
            <Icon name={l.icon} size={20} color={l.gold ? colors.sacredGold : colors.midBrown} />
            <Text style={[styles.linkText, l.gold && { color: colors.sacredGold }]}>{l.label}</Text>
            <Icon name="chevron" size={16} color={colors.midBrown} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  hero: { height: 280, backgroundColor: colors.lightGold },
  heroPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  shareBtn: {
    position: 'absolute',
    top: 44,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idBadge: { position: 'absolute', top: 44, left: spacing.lg, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  idBadgeText: { color: '#FFFFFF', fontSize: 11 },
  identity: { padding: spacing.lg },
  name: { fontSize: 18, fontWeight: '600', color: colors.darkBrown },
  sub: { fontSize: 12, color: colors.midBrown, marginTop: 2 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, marginTop: spacing.sm, gap: 4 },
  tierPaid: { backgroundColor: colors.sacredGold },
  tierFree: { backgroundColor: colors.pillInactiveBg },
  tierText: { fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.lg },
  statChip: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderWarm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '700', color: colors.goldAccent },
  statLabel: { fontSize: 10, color: colors.midBrown, marginTop: 2 },
  section: { paddingHorizontal: spacing.lg },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderWarm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  linkText: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.darkBrown },
});
