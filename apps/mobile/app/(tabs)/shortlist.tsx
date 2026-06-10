import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiRequest } from '../../src/lib/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
      if (res.success && res.data) {
        setList(res.data);
      }
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

  const handleRemove = async (profileId: string) => {
    try {
      const res = await apiRequest(`/shortlist/${profileId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setList((prev) => prev.filter((item) => item.id !== profileId));
        Alert.alert('Success / सफलता', 'Removed from Shortlist / सूची से हटाया गया');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to remove from shortlist');
    }
  };

  const renderItem = ({ item }: { item: ShortlistedItem }) => {
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardBody}
          onPress={() => router.push(`/profile/${item.profileId}`)}
        >
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="bookmark" size={24} color="#E8B84B" />
          </View>
          <View style={styles.details}>
            <Text style={styles.name}>GS{item.profileId}</Text>
            <Text style={styles.sub}>
              {item.gender} • {item.gotra} • {item.livingCity?.name || 'City'}
            </Text>
            <Text style={styles.subText}>
              {item.maritalStatus} • {item.heightDisplay || (item.height_cm ? `${item.height_cm} cm` : '—')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6F61" />
        </TouchableOpacity>
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
        data={list}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your Shortlist is empty / आपकी सूची खाली है</Text>
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
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C0D05',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3D281C',
  },
  details: {
    marginLeft: 16,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sub: {
    color: '#D4BFA0',
    fontSize: 13,
    marginTop: 2,
  },
  subText: {
    color: '#8A7A60',
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8A7A60',
    fontSize: 14,
  },
});
