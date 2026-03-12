import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

export type PickedMedia = {
  uri: string;
  fileName: string;
  mimeType: string;
  thumbnailUri?: string;
};

function normalizePickedAsset(
  asset: ImagePicker.ImagePickerAsset,
  thumbnailUri?: string
): PickedMedia {
  const isVideo =
    asset.type === 'video' ||
    String(asset.mimeType || '')
      .toLowerCase()
      .startsWith('video/');

  return {
    uri: asset.uri,
    fileName:
      asset.fileName ||
      `${isVideo ? 'video' : 'photo'}-${Date.now()}.${
        isVideo ? 'mp4' : 'jpg'
      }`,
    mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
    thumbnailUri,
  };
}

export async function generateVideoThumbnail(
  videoUri: string
): Promise<string | null> {
  try {
    const result = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 500,
    });

    return result?.uri || null;
  } catch (e) {
    console.log('thumbnail generation failed', e);
    return null;
  }
}

export async function pickSingleImage(): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Media permission denied.');
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
  });

  if (res.canceled || !res.assets?.length) return null;

  return normalizePickedAsset(res.assets[0]);
}

export async function pickSingleVideo(): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Media permission denied.');
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: false,
    quality: 1,
  });

  if (res.canceled || !res.assets?.length) return null;

  const asset = res.assets[0];
  const thumbnailUri = await generateVideoThumbnail(asset.uri);

  return normalizePickedAsset(asset, thumbnailUri || undefined);
}

export async function takePhoto(): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Camera permission denied.');
  }

  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
  });

  if (res.canceled || !res.assets?.length) return null;

  return normalizePickedAsset(res.assets[0]);
}

export async function uploadWpMedia(file: PickedMedia): Promise<number | null> {
  const tokenModule = await import('../store/auth-store');
  const token = tokenModule.useAuthStore.getState().token;

  if (!token) {
    throw new Error('You must be logged in.');
  }

  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.fileName,
    type: file.mimeType,
  } as any);

  const res = await fetch('https://everythingdid.com/wp-json/wp/v2/media', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(raw?.message || 'Media upload failed.');
  }

  console.log('UPLOAD MEDIA RAW', raw);

  return Number(raw?.id ?? 0) || null;
}