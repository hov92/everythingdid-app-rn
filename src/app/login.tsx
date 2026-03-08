import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuthStore } from '../store/auth-store';

const LOGIN_URL = 'https://everythingdid.com/wp-json/jwt-auth/v1/token';

export default function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) return;

    try {
      setBusy(true);

      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const raw = await res.json().catch(() => null);

      if (!res.ok || !raw?.token) {
        throw new Error(raw?.message || 'Login failed.');
      }

      setAuth(raw.token, raw.user_display_name || username.trim());
      router.back();
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Could not log in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Log in</Text>

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username or email"
          style={styles.input}
          autoCapitalize="none"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          style={styles.input}
          secureTextEntry
        />

        <Pressable
          style={[styles.btn, busy && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={busy}
        >
          <Text style={styles.btnText}>{busy ? 'Logging in...' : 'Log in'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  wrap: { padding: 24, gap: 12 },
  title: { fontSize: 30, fontWeight: '800', color: '#111', marginBottom: 8 },
  input: {
    backgroundColor: '#f3f3f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  btn: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});