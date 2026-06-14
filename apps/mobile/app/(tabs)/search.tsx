import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { parsePublicProfileId } from '@gahoisarthi/shared';
import { apiRequest } from '../../src/lib/api';
import { Icon, Card, Button } from '../../src/components/ui';
import { colors, spacing, radius } from '../../src/theme';

const AGES = Array.from({ length: 43 }, (_, i) => i + 18); // 18–60

export default function SearchScreen() {
  const router = useRouter();
  const [idQuery, setIdQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [results, setResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  const lookupById = () => {
    const parsed = parsePublicProfileId(idQuery);
    if (parsed === null) {
      Alert.alert('Invalid ID / अमान्य ID', 'Enter a valid profile ID (e.g. GS 24325)');
      return;
    }
    router.push(`/profile/${parsed}`);
  };

  const runSearch = async (params: Record<string, string>) => {
    setSearching(true);
    setResults(null);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await apiRequest(`/profile/search?${qs}`).catch(() => ({ success: false, data: [] }));
      setResults(res?.success && res.data ? res.data : []);
    } finally {
      setSearching(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.h1}>Search / खोज</Text>

      {/* Quick find */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Find Matches / मिलान खोजें</Text>
        <View style={styles.genderRow}>
          {(['Male', 'Female'] as const).map((g) => (
            <TouchableOpacity key={g} style={[styles.genderChip, gender === g && styles.genderActive]} onPress={() => setGender(g)}>
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button label="Find Matches" onPress={() => runSearch({ gender })} loading={searching} style={{ marginTop: spacing.md }} />
      </Card>

      {/* By Profile ID */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Search by Profile ID</Text>
        <TextInput style={styles.input} value={idQuery} onChangeText={setIdQuery} placeholder="e.g. GS 24325" placeholderTextColor={colors.midBrown} keyboardType="number-pad" />
        <Button label="Find Profile by ID" onPress={lookupById} style={{ marginTop: spacing.md }} />
      </Card>

      {/* By Name */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Search by Name</Text>
        <TextInput style={styles.input} value={nameQuery} onChangeText={setNameQuery} placeholder="First name" placeholderTextColor={colors.midBrown} />
        <Button label="Find Profile by Name" onPress={() => runSearch({ name: nameQuery })} loading={searching} style={{ marginTop: spacing.md }} />
      </Card>

      {results && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.cardTitle}>{results.length} result{results.length === 1 ? '' : 's'}</Text>
          {results.length === 0 ? (
            <Text style={styles.empty}>No profiles found / कोई प्रोफ़ाइल नहीं मिली</Text>
          ) : (
            results.map((r: any) => (
              <TouchableOpacity key={r.id || r.profileId} onPress={() => router.push(`/profile/${r.profileId}`)}>
                <Card style={styles.resultCard}>
                  <View style={styles.resultAvatar}>
                    <Icon name="user" size={22} color={colors.midBrown} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.name}>GS {r.profileId}</Text>
                    <Text style={styles.sub}>{r.age ? `${r.age} yrs · ` : ''}{r.gotra || ''} {r.city ? `· ${r.city}` : ''}</Text>
                  </View>
                  <Icon name="chevron" size={16} color={colors.midBrown} />
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  h1: { fontSize: 18, fontWeight: '600', color: colors.darkBrown, marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  cardTitle: { fontSize: 13, fontWeight: '500', color: colors.sacredGold, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.ivory,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 14,
  },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    backgroundColor: colors.pillInactiveBg,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  genderActive: { backgroundColor: colors.sacredGold, borderColor: colors.sacredGold },
  genderText: { color: colors.darkBrown, fontWeight: '500', fontSize: 13 },
  genderTextActive: { color: colors.onGold },
  resultCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  resultAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lightGold,
    alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderWarm,
  },
  name: { fontSize: 13, fontWeight: '500', color: colors.darkBrown },
  sub: { fontSize: 11, color: colors.midBrown, marginTop: 2 },
  empty: { color: colors.midBrown, fontSize: 13, paddingVertical: spacing.lg },
});
