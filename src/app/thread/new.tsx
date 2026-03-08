import { useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchForums, createThread } from '../../lib/api';
import { useAuthStore } from '../../store/auth-store';

export default function NewThreadScreen() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const [forumId, setForumId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const forumsQuery = useQuery({
    queryKey: ['forums'],
    queryFn: fetchForums,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createThread({
        parent: forumId,
        title: title.trim(),
        content: content.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['topics'] });
      await queryClient.invalidateQueries({ queryKey: ['following-topics'] });
      router.back();
    },
    onError: (e: any) => {
      Alert.alert('Could not create thread', e?.message || 'Try again.');
    },
  });

  function handleSubmit() {
    if (!token) {
      router.push('/login');
      return;
    }

    if (!forumId) {
      Alert.alert('Choose a category', 'Select a forum first.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing fields', 'Add a title and content.');
      return;
    }

    createMutation.mutate();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Create Thread</Text>

        <Text style={styles.label}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {(forumsQuery.data ?? []).map((forum) => (
            <Pressable
              key={forum.id}
              onPress={() => setForumId(forum.id)}
              style={[styles.chip, forumId === forum.id && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, forumId === forum.id && styles.chipTextActive]}
              >
                {forum.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Thread title"
          style={styles.input}
        />

        <Text style={styles.label}>Body</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="What do you want to talk about?"
          style={[styles.input, styles.bodyInput]}
          multiline
        />

        <Pressable
          onPress={handleSubmit}
          style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
          disabled={createMutation.isPending}
        >
          <Text style={styles.submitBtnText}>
            {createMutation.isPending ? 'Posting...' : 'Post Thread'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  wrap: { padding: 24, gap: 12 },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
    marginBottom: 8,
  },
  backBtnText: { color: '#111', fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', color: '#111', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#333', marginTop: 6 },
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f3f3f6',
  },
  chipActive: { backgroundColor: '#111' },
  chipText: { color: '#111', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#f3f3f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  bodyInput: { minHeight: 140, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});