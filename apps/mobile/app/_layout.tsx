import React, { useEffect, useRef, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { initI18n } from '../src/lib/i18n';
import { ActivityIndicator, Platform, View, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  configureNotificationHandler,
  registerForPushNotifications,
  getRouteFromScreen,
  removeSubscription,
} from '../src/lib/notifications';
import { apiRequest } from '../src/lib/api';

if (Platform.OS !== 'web') {
  configureNotificationHandler();
}

function NavigationRoot() {
  const { isLoggedIn, isLoading, userProfile } = useAuth();
  const segments = useSegments();
  const [i18nReady, setI18nReady] = useState(false);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Initialize i18n
  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading || !i18nReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnboardingComplete = !!(userProfile && userProfile.preferences);

    if (!isLoggedIn) {
      // If not logged in, redirect to login screen
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // If logged in, check if onboarding is complete
      if (!isOnboardingComplete) {
        // Redirect to wizard if not already there
        if (segments[0] !== 'profile' || segments[1] !== 'wizard') {
          router.replace('/profile/wizard');
        }
      } else {
        // Profile exists and onboarding is complete — allow profile/wizard (edit mode) and payment
        if (!inTabsGroup && segments[0] !== 'profile' && segments[0] !== 'payment' && segments[0] !== 'drawer') {
          router.replace('/(tabs)');
        }
      }
    }
  }, [isLoggedIn, isLoading, userProfile, segments, i18nReady]);

  // Register push token when user logs in
  useEffect(() => {
    if (!isLoggedIn || Platform.OS === 'web') return;

    registerForPushNotifications().then((token) => {
      if (!token) return;
      // Send token to backend (non-blocking, non-fatal)
      apiRequest('/profile/me/push-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }).catch(() => {});
    });

    // Listen for notification taps (background/killed state)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const screen = response.notification.request.content.data?.screen as string | undefined;
        const route = getRouteFromScreen(screen);
        if (route) {
          router.push(route as any);
        }
      }
    );

    return () => {
      if (responseListener.current) {
        removeSubscription(responseListener.current);
      }
    };
  }, [isLoggedIn]);

  if (isLoading || !i18nReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8B84B" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationRoot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A0800',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
