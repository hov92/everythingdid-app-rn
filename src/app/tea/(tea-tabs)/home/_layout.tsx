import { Stack } from 'expo-router';

export default function TeaHomeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="following" />
      <Stack.Screen name="reels" />
    </Stack>
  );
}