import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function TeaCreateScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.wrap}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Create</Text>
        <Text style={styles.subtitle}>Choose what you want to share.</Text>

        <Pressable
          style={styles.optionCard}
          onPress={() => router.push('/tea/new-post')}
        >
          <Text style={styles.optionTitle}>Post</Text>
          <Text style={styles.optionText}>
            Share text, photos, and hashtags to the Tea feed.
          </Text>
        </Pressable>

        <Pressable style={styles.optionCardDisabled}>
          <Text style={styles.optionTitle}>Reel</Text>
          <Text style={styles.optionText}>Coming next.</Text>
        </Pressable>

        <Pressable style={styles.optionCardDisabled}>
          <Text style={styles.optionTitle}>Story</Text>
          <Text style={styles.optionText}>Coming next.</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  wrap: {
    padding: 24,
    gap: 12,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
    marginBottom: 8,
  },
  backBtnText: {
    color: '#111',
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  optionCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 18,
  },
  optionCardDisabled: {
    backgroundColor: '#f3f3f6',
    borderRadius: 20,
    padding: 18,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  optionText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});