import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import TeaShellHeader from '../../../components/tea/TeaShellHeader';

export default function TeaInboxScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <TeaShellHeader title="DMs" />
      <View style={styles.center}>
        <Text style={styles.text}>Tea DMs coming next.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f6f7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, color: '#333' },
});