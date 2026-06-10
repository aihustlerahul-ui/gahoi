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
import { useAuth } from '../../src/lib/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface InterestItem {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  createdAt: string;
  sender?: {
    id: string;
    profileId: string;
    gender: string;
    gotra: string;
    maritalStatus: string;
    height_cm: number;
    livingCity?: { name: string };
    age?: number;
  };
  receiver?: {
    id: string;
    profileId: string;
    gender: string;
    gotra: string;
    maritalStatus: string;
    height_cm: number;
    livingCity?: { name: string };
    age?: number;
  };
}

export default function InterestsScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'accepted'>('received');
  
  const [receivedList, setReceivedList] = useState<InterestItem[]>([]);
  const [sentList, setSentList] = useState<InterestItem[]>([]);
  const [acceptedList, setAcceptedList] = useState<InterestItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInterests = async () => {
    try {
      // Fetch Sent
      const sentRes = await apiRequest('/interests/sent');
      if (sentRes.success && sentRes.data) {
        setSentList(sentRes.data);
      }

      // Fetch Received
      const recRes = await apiRequest('/interests/received');
      if (recRes.success && recRes.data) {
        setReceivedList(recRes.data);
      }

      // Accepted are those which are accepted (from either received or sent)
      const acceptedFromSent = (sentRes.data || []).filter((i: InterestItem) => i.status === 'accepted');
      const acceptedFromRec = (recRes.data || []).filter((i: InterestItem) => i.status === 'accepted');
      
      // Merge unique
      const merged: InterestItem[] = [...acceptedFromRec];
      acceptedFromSent.forEach((item: InterestItem) => {
        if (!merged.some((m) => m.id === item.id)) {
          merged.push(item);
        }
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
  }, [activeTab]);

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

      if (res.success) {
        Alert.alert('Success / सफलता', `Request ${action}! / अनुरोध ${action === 'accepted' ? 'स्वीकृत' : 'अस्वीकृत'} किया गया!`);
        loadInterests();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to respond');
    }
  };

  const handleWithdraw = async (interestId: string) => {
    try {
      const res = await apiRequest(`/interests/${interestId}`, {
        method: 'DELETE',
      });

      if (res.success) {
        Alert.alert('Success / सफलता', 'Interest request withdrawn / रुचि अनुरोध वापस लिया गया');
        loadInterests();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to withdraw');
    }
  };

  const renderInterestCard = ({ item }: { item: InterestItem }) => {
    const isReceived = activeTab === 'received';
    const isAccepted = activeTab === 'accepted';
    const isSent = activeTab === 'sent';

    // Show partner details
    const partner = isReceived 
      ? item.sender 
      : isAccepted 
        ? (item.sender?.id === userProfile?.id ? item.receiver : item.sender)
        : item.receiver;

    if (!partner) return null;

    return (
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.cardBody}
          onPress={() => router.push(`/profile/${partner.profileId}`)}
        >
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={28} color="#8A7A60" />
          </View>
          <View style={styles.details}>
            <Text style={styles.name}>GS{partner.profileId}</Text>
            <Text style={styles.sub}>
              {partner.age} yrs • {partner.gotra} • {partner.livingCity?.name || 'City'}
            </Text>
            {item.message && <Text style={styles.msg}>"{item.message}"</Text>}
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          {isReceived && item.status === 'pending' && (
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, styles.declineBtn]}
                onPress={() => handleRespond(item.id, 'declined')}
              >
                <Text style={styles.btnText}>Decline / अस्वीकार</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.acceptBtn]}
                onPress={() => handleRespond(item.id, 'accepted')}
              >
                <Text style={[styles.btnText, { color: '#1A0800' }]}>Accept / स्वीकार</Text>
              </TouchableOpacity>
            </View>
          )}

          {isSent && item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.btn, styles.declineBtn, { width: '100%' }]}
              onPress={() => handleWithdraw(item.id)}
            >
              <Text style={styles.btnText}>Withdraw / वापस लें</Text>
            </TouchableOpacity>
          )}

          {isAccepted && (
            <TouchableOpacity
              style={[styles.btn, styles.viewBtn]}
              onPress={() => router.push(`/profile/${partner.profileId}`)}
            >
              <Ionicons name="chatbubbles" size={16} color="#1A0800" style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, { color: '#1A0800' }]}>View Contact / संपर्क देखें</Text>
            </TouchableOpacity>
          )}

          {!isAccepted && item.status !== 'pending' && (
            <Text style={[styles.statusLabel, item.status === 'accepted' ? styles.statusAccepted : styles.statusDeclined]}>
              Status: {item.status.toUpperCase()}
            </Text>
          )}
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

  const getListData = () => {
    if (activeTab === 'sent') return sentList;
    if (activeTab === 'accepted') return acceptedList;
    return receivedList;
  };

  return (
    <View style={styles.container}>
      {/* Custom Tab Bar */}
      <View style={styles.tabsHeader}>
        {(['received', 'sent', 'accepted'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab ? styles.tabActive : null]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getListData()}
        renderItem={renderInterestCard}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No requests here / कोई अनुरोध नहीं है</Text>
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
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#2C1A10',
    borderBottomWidth: 1,
    borderBottomColor: '#3D281C',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#E8B84B',
  },
  tabText: {
    color: '#8A7A60',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#E8B84B',
  },
  card: {
    backgroundColor: '#2C1A10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3D281C',
    marginBottom: 16,
    padding: 16,
  },
  cardBody: {
    flexDirection: 'row',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1C0D05',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3D281C',
  },
  details: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sub: {
    color: '#D4BFA0',
    fontSize: 13,
    marginTop: 4,
  },
  msg: {
    color: '#8A7A60',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 6,
  },
  date: {
    color: '#8A7A60',
    fontSize: 11,
    marginTop: 8,
  },
  actions: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#3D281C',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8A7A60',
    marginRight: 8,
  },
  acceptBtn: {
    backgroundColor: '#E8B84B',
    marginLeft: 8,
  },
  viewBtn: {
    backgroundColor: '#E8B84B',
    flexDirection: 'row',
    width: '100%',
  },
  btnText: {
    color: '#D4BFA0',
    fontSize: 13,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusAccepted: {
    color: '#4CAF50',
  },
  statusDeclined: {
    color: '#F44336',
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
