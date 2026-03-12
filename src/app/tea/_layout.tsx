import { Stack } from 'expo-router';

export default function TeaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tea-tabs)" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="following" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="create" />
    </Stack>
  );
}