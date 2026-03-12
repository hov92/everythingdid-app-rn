import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function TeaHomeSubTabs({
  active,
}: {
  active: 'for-you' | 'following' | 'reels';
}) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => router.replace('/tea/home')} style={[styles.pill, active === 'for-you' && styles.pillActive]}>
        <Text style={[styles.pillText, active === 'for-you' && styles.pillTextActive]}>
          For You
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace('/tea/home/following')}
        style={[styles.pill, active === 'following' && styles.pillActive]}
      >
        <Text
          style={[styles.pillText, active === 'following' && styles.pillTextActive]}
        >
          Following
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace('/tea/home/reels')}
        style={[styles.pill, active === 'reels' && styles.pillActive]}
      >
        <Text style={[styles.pillText, active === 'reels' && styles.pillTextActive]}>
          Reels
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  pillActive: {
    backgroundColor: '#111',
  },
  pillText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 13,
  },
  pillTextActive: {
    color: '#fff',
  },
});