import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import TeaShellHeader from '../../../components/tea/TeaShellHeader';

export default function TeaMeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <TeaShellHeader title="Profile" />
      <View style={styles.center}>
        <Text style={styles.text}>Tea profile hub goes here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f6f7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, color: '#333' },
});