import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Splash — spec §4.1. Near-black warm background (#1A0800) is intentional and
 * the ONLY dark surface in the app; everything post-splash is ivory.
 * Mandala SVG animation is a tracked follow-up (needs react-native-svg).
 */
export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Gahoi Sarthi</Text>
        <Text style={styles.hindi}>गहोई सारथी</Text>
        <Text style={styles.tagline}>Har Gahoi Parivar Ka Bharosemand Sarthi</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A0800' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 32, fontWeight: '600', color: '#E8B84B', letterSpacing: 1 },
  hindi: { fontSize: 22, color: '#D4BFA0', marginTop: 8 },
  tagline: { fontSize: 14, fontStyle: 'italic', color: '#8A7A60', marginTop: 16, textAlign: 'center' },
});
