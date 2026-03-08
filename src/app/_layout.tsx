import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';
import { useSavedThreadsStore } from '../store/saved-threads-store';

const queryClient = new QueryClient();

function AppShell() {
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const hydratedAuth = useAuthStore((s) => s.hydrated);

  const hydrateSaved = useSavedThreadsStore((s) => s.hydrateSaved);
  const hydratedSaved = useSavedThreadsStore((s) => s.hydrated);

  useEffect(() => {
    hydrateAuth();
    hydrateSaved();
  }, [hydrateAuth, hydrateSaved]);

  if (!hydratedAuth || !hydratedSaved) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="thread/[id]" />
      <Stack.Screen name="thread/new" />
      <Stack.Screen name="login" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}