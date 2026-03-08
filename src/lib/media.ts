import * as ImagePicker from 'expo-image-picker';

export type PickedMedia = {
  uri: string;
  fileName: string;
  mimeType: string;
};

export async function pickSingleImage(): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Media permission denied.');

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
  });

  if (res.canceled || !res.assets?.length) return null;

  const asset = res.assets[0];
  return {
    uri: asset.uri,
    fileName: asset.fileName || `photo-${Date.now()}.jpg`,
    mimeType: asset.mimeType || 'image/jpeg',
  };
}

export async function takePhoto(): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Camera permission denied.');

  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
  });

  if (res.canceled || !res.assets?.length) return null;

  const asset = res.assets[0];
  return {
    uri: asset.uri,
    fileName: asset.fileName || `camera-${Date.now()}.jpg`,
    mimeType: asset.mimeType || 'image/jpeg',
  };
}

export async function uploadWpMedia(file: PickedMedia): Promise<number | null> {
  const tokenModule = await import('../store/auth-store');
  const token = tokenModule.useAuthStore.getState().token;
  if (!token) throw new Error('You must be logged in.');

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
  if (!res.ok) throw new Error(raw?.message || 'Media upload failed.');

  return Number(raw?.id ?? 0) || null;
}