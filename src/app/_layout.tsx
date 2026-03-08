import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="thread/[id]" />
        <Stack.Screen name="thread/new" />
        <Stack.Screen name="login" />
      </Stack>
    </QueryClientProvider>
  );
}