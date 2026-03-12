import { useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { createTeaPost, saveTeaPoster } from '../../lib/tea-api';
import {
  pickSingleImage,
  pickSingleVideo,
  takePhoto,
  takeVideo,
  uploadWpMedia,
  PickedMedia,
} from '../../lib/media';
import { useAuthStore } from '../../store/auth-store';

function LocalVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  return (
    <VideoView
      player={player}
      style={styles.previewMedia}
      nativeControls={false}
      contentFit="cover"
    />
  );
}

export default function TeaCreateScreen() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [pickedImage, setPickedImage] = useState<PickedMedia | null>(null);
  const [pickedVideo, setPickedVideo] = useState<PickedMedia | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      let mediaIds: number[] = [];
      let videoIds: number[] = [];
      let thumbnailId: number | null = null;

      try {
        if (pickedImage) {
          setUploadingMedia(true);
          const mediaId = await uploadWpMedia(pickedImage);
          if (mediaId) mediaIds = [mediaId];
        }

        if (pickedVideo) {
          setUploadingMedia(true);

          const videoId = await uploadWpMedia({
            uri: pickedVideo.uri,
            fileName: pickedVideo.fileName,
            mimeType: pickedVideo.mimeType,
          });

          if (videoId) {
            videoIds = [videoId];
          }

          if (pickedVideo.thumbnailUri) {
            thumbnailId = await uploadWpMedia({
              uri: pickedVideo.thumbnailUri,
              fileName: `thumb-${Date.now()}.jpg`,
              mimeType: 'image/jpeg',
            });
          }
        }

        const created = await createTeaPost({
          content: content.trim(),
          mediaIds,
          videoIds,
        });

        if (thumbnailId && created?.id) {
          try {
            await saveTeaPoster({
              activityId: created.id,
              posterId: thumbnailId,
            });
          } catch (e) {
            console.log('saveTeaPoster failed', e);
          }
        }

        return created;
      } finally {
        setUploadingMedia(false);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tea-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['tea-post'] });
      router.back();
    },
    onError: (e: any) => {
      setUploadingMedia(false);
      Alert.alert('Could not post tea', e?.message || 'Try again.');
    },
  });

  async function handlePickImage() {
    try {
      const file = await pickSingleImage();
      if (file) {
        setPickedVideo(null);
        setPickedImage(file);
      }
    } catch (e: any) {
      Alert.alert('Image error', e?.message || 'Could not pick image.');
    }
  }

  async function handlePickVideo() {
    try {
      const file = await pickSingleVideo();
      if (file) {
        setPickedImage(null);
        setPickedVideo(file);
      }
    } catch (e: any) {
      Alert.alert('Video error', e?.message || 'Could not pick video.');
    }
  }

  async function handleTakePhoto() {
    try {
      const file = await takePhoto();
      if (file) {
        setPickedVideo(null);
        setPickedImage(file);
      }
    } catch (e: any) {
      Alert.alert('Camera error', e?.message || 'Could not open camera.');
    }
  }

  async function handleTakeVideo() {
    try {
      const file = await takeVideo();
      if (file) {
        setPickedImage(null);
        setPickedVideo(file);
      }
    } catch (e: any) {
      Alert.alert('Video error', e?.message || 'Could not record video.');
    }
  }

  function handleSubmit() {
    if (!token) {
      router.push('/login');
      return;
    }

    if (!content.trim() && !pickedImage && !pickedVideo) {
      Alert.alert('Missing content', 'Add text, a photo, or a video.');
      return;
    }

    createMutation.mutate();
  }

  function openMediaChooser() {
    const options = [
      'Choose Photo',
      'Choose Video',
      'Take Photo',
      'Record Video',
      'Cancel',
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 4,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) handlePickImage();
          if (buttonIndex === 1) handlePickVideo();
          if (buttonIndex === 2) handleTakePhoto();
          if (buttonIndex === 3) handleTakeVideo();
        }
      );
      return;
    }

    Alert.alert('Add Media', 'Choose how you want to add media.', [
      { text: 'Choose Photo', onPress: handlePickImage },
      { text: 'Choose Video', onPress: handlePickVideo },
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Record Video', onPress: handleTakeVideo },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const busy = createMutation.isPending || uploadingMedia;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Create Tea</Text>

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="What’s the tea?"
          placeholderTextColor="#8b8b8b"
          style={[styles.input, styles.bodyInput]}
          multiline
        />

        <View style={styles.mediaRow}>
          <Pressable onPress={openMediaChooser} style={styles.mediaBtn}>
            <Text style={styles.mediaBtnText}>
              {pickedImage || pickedVideo ? 'Change Media' : 'Add Media'}
            </Text>
          </Pressable>
        </View>

        {pickedImage ? (
          <Text style={styles.mediaMeta}>Photo selected</Text>
        ) : null}

        {pickedVideo ? (
          <Text style={styles.mediaMeta}>Video selected</Text>
        ) : null}

        {pickedImage ? (
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: pickedImage.uri }}
              style={styles.previewMedia}
              resizeMode="cover"
            />
            <Pressable
              onPress={() => setPickedImage(null)}
              style={styles.removeBtn}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </Pressable>
          </View>
        ) : null}

        {pickedVideo ? (
          <View style={styles.previewWrap}>
            {pickedVideo.thumbnailUri ? (
              <Image
                source={{ uri: pickedVideo.thumbnailUri }}
                style={styles.previewMedia}
                resizeMode="cover"
              />
            ) : (
              <LocalVideoPreview uri={pickedVideo.uri} />
            )}

            <Pressable
              onPress={() => setPickedVideo(null)}
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
    flexWrap: 'wrap',
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
  mediaMeta: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  previewWrap: {
    marginTop: 6,
  },
  previewMedia: {
    width: '100%',
    height: 320,
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