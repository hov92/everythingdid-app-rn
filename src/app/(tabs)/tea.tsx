import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, StyleSheet } from 'react-native';

export default function TeaScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Tea</Text>
        <Text style={styles.sub}>Feed screen placeholder</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  wrap: { padding: 24 },
  title: { fontSize: 30, fontWeight: '800', color: '#111' },
  sub: { marginTop: 8, fontSize: 16, color: '#666' },
});