import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Configure how notifications appear while the app is in the foreground.
 * Call this once at app start.
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Set up Android notification channel (required for Android 8+).
 */
export async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Gahoi Sarthi',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E8B84B',
      sound: 'default',
    });
  }
}

/**
 * Request notification permissions and return the Expo push token.
 * Returns null if:
 *   - Running on a simulator/emulator (tokens only work on physical devices)
 *   - User denies permission
 *   - Any other error
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push tokens only work on real physical devices
  if (!Device.isDevice) {
    console.warn('[Push] Push notifications only work on physical devices.');
    return null;
  }

  // Check / request permission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingPermission = await Notifications.getPermissionsAsync() as any;
  let permissionGranted: boolean = existingPermission.status === 'granted' || existingPermission.granted === true;

  if (!permissionGranted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requested = await Notifications.requestPermissionsAsync() as any;
    permissionGranted = requested.status === 'granted' || requested.granted === true;
  }

  if (!permissionGranted) {
    console.warn('[Push] Notification permission denied by user.');
    return null;
  }

  await setupAndroidChannel();

  try {
    // Get the Expo push token — projectId is read from app.json automatically
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (err) {
    console.error('[Push] Failed to get push token:', err);
    return null;
  }
}

/**
 * Remove a notification subscription safely.
 */
export function removeSubscription(subscription: Notifications.Subscription) {
  subscription.remove();
}

/**
 * Map a notification data.screen value to the correct Expo Router path.
 */
export function getRouteFromScreen(screen?: string): string | null {
  if (!screen) return null;

  const routes: Record<string, string> = {
    interests: '/(tabs)/interests',
    matches: '/(tabs)/',
    shortlist: '/(tabs)/shortlist',
    profile_edit: '/profile/wizard',
    checkout: '/payment/checkout',
  };

  // Handle dynamic routes like "profile/abc123"
  if (screen.startsWith('profile/')) {
    const profileId = screen.replace('profile/', '');
    return `/profile/${profileId}`;
  }

  return routes[screen] ?? null;
}
