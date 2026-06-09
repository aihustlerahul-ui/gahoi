import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1A0800',
          borderBottomWidth: 1,
          borderBottomColor: '#3D281C',
        },
        headerTitleStyle: {
          color: '#E8B84B',
          fontWeight: 'bold',
          fontSize: 18,
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        },
        tabBarStyle: {
          backgroundColor: '#1A0800',
          borderTopWidth: 1,
          borderTopColor: '#3D281C',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#E8B84B',
        tabBarInactiveTintColor: '#8A7A60',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Matches',
          tabBarLabel: 'Matches / मिलान',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="interests"
        options={{
          title: 'Interests',
          tabBarLabel: 'Interests / रुचियां',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shortlist"
        options={{
          title: 'Shortlist',
          tabBarLabel: 'Shortlist / सूची',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings / सेटिंग्स',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
