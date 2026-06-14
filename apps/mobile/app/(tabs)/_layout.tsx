import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Icon, IconName } from '../../src/components/ui';
import { colors } from '../../src/theme';

/** Spec §2.1 — five primary destinations; Interests is a centre elevated FAB. */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderWarm,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.sacredGold,
        tabBarInactiveTintColor: colors.midBrown,
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Icon name="home" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Search', tabBarIcon: ({ color }) => <Icon name="search" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="interests"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.fab}>
              <Icon name="heart" size={24} color={colors.onGold} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{ title: 'Alerts', tabBarIcon: ({ color }) => <Icon name="bell" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Icon name="user" size={22} color={color} /> }}
      />

      {/* Reachable via drawer / links, not shown as tabs */}
      <Tabs.Screen name="shortlist" options={{ href: null, title: 'Shortlist' }} />
      <Tabs.Screen name="settings" options={{ href: null, title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.sacredGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 24 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});
