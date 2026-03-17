import { Stack } from 'expo-router';

export default function ShopLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(shop-tabs)" />
      <Stack.Screen name="product/[id]" />
    </Stack>
  );
}