import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Gahoi Sarthi</Text>
        <Text style={styles.hindi}>गहोई सारथी</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A0800' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#E8B84B', fontFamily: 'serif' },
  hindi: { fontSize: 16, color: '#D4BFA0', marginTop: 8 },
});
