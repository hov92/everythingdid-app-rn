import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function TeaShellHeader({
  title,
}: {
  title: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable onPress={() => router.replace('/')} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>EverythingDid</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#f6f6f7',
  },
  row: {
    marginBottom: 12,
  },
  exitBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  exitBtnText: {
    color: '#111',
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
  },
});