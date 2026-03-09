import { useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createTeaPost } from '../../lib/tea-api';
import {
  pickSingleImage,
  takePhoto,
  uploadWpMedia,
  PickedMedia,
} from '../../lib/media';
import { useAuthStore } from '../../store/auth-store';

export default function NewTeaScreen() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [pickedImage, setPickedImage] = useState<PickedMedia | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      let mediaIds: number[] = [];

      if (pickedImage) {
        setUploadingImage(true);
        const mediaId = await uploadWpMedia(pickedImage);
        setUploadingImage(false);

        if (mediaId) mediaIds = [mediaId];
      }

      return createTeaPost({
        content: content.trim(),
        mediaIds,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tea-posts'] });
      router.back();
    },
    onError: (e: any) => {
      setUploadingImage(false);
      Alert.alert('Could not post tea', e?.message || 'Try again.');
    },
  });

  async function handlePickImage() {
    try {
      const file = await pickSingleImage();
      if (file) setPickedImage(file);
    } catch (e: any) {
      Alert.alert('Image error', e?.message || 'Could not pick image.');
    }
  }

  async function handleTakePhoto() {
    try {
      const file = await takePhoto();
      if (file) setPickedImage(file);
    } catch (e: any) {
      Alert.alert('Camera error', e?.message || 'Could not open camera.');
    }
  }

  function handleSubmit() {
    if (!token) {
      router.push('/login');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Missing content', 'Write something first.');
      return;
    }

    createMutation.mutate();
  }

  const busy = createMutation.isPending || uploadingImage;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>New Tea Post</Text>

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="What’s the tea?"
          placeholderTextColor="#8b8b8b"
          style={[styles.input, styles.bodyInput]}
          multiline
        />

        <View style={styles.mediaRow}>
          <Pressable onPress={handlePickImage} style={styles.mediaBtn}>
            <Text style={styles.mediaBtnText}>Photo</Text>
          </Pressable>

          <Pressable onPress={handleTakePhoto} style={styles.mediaBtn}>
            <Text style={styles.mediaBtnText}>Camera</Text>
          </Pressable>
        </View>

        {pickedImage ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: pickedImage.uri }} style={styles.previewImage} />
            <Pressable
              onPress={() => setPickedImage(null)}
              style={styles.removeBtn}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
          disabled={busy}
        >
          <Text style={styles.submitBtnText}>
            {busy ? 'Posting...' : 'Post Tea'}
          </Text>
        </Pressable>
      </ScrollView>
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
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f3f3f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
  },
  bodyInput: {
    minHeight: 180,
    textAlignVertical: 'top',
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  mediaBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ececf1',
  },
  mediaBtnText: {
    color: '#111',
    fontWeight: '700',
  },
  previewWrap: {
    marginTop: 6,
  },
  previewImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  removeBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ececf1',
  },
  removeBtnText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});