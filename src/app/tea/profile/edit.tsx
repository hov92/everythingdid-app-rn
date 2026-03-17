import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import TeaShellHeader from '../../../../src/components/tea/TeaShellHeader';
import {
  fetchMeMember,
  findMyBioField,
  updateMeMember,
  updateMyXProfileFields,
} from '../../../../src/lib/tea-api';
import { useAuthStore } from '../../../../src/store/auth-store';

export default function TeaEditProfileScreen() {
  const userId = useAuthStore((s) => s.userId);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  const meQuery = useQuery({
    queryKey: ['tea-me-member'],
    queryFn: fetchMeMember,
    enabled: !!token,
  });

  const bioFieldQuery = useQuery({
    queryKey: ['tea-me-bio-field', userId],
    queryFn: () => findMyBioField(Number(userId)),
    enabled: !!token && !!userId,
  });

  useEffect(() => {
    if (meQuery.data?.name) {
      setName(String(meQuery.data.name));
    }
  }, [meQuery.data]);

  useEffect(() => {
    if (bioFieldQuery.data?.value) {
      setBio(String(bioFieldQuery.data.value));
    }
  }, [bioFieldQuery.data]);

  useEffect(() => {
    console.log('ME QUERY DATA', meQuery.data);
  }, [meQuery.data]);

  useEffect(() => {
    console.log('BIO FIELD QUERY DATA', bioFieldQuery.data);
  }, [bioFieldQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log('SAVE NAME', name);
      console.log('SAVE BIO', bio);
      console.log('BIO FIELD BEFORE SAVE', bioFieldQuery.data);

      await updateMeMember({ name });

      if (bioFieldQuery.data?.id) {
        await updateMyXProfileFields([
          {
            field_id: Number(bioFieldQuery.data.id),
            group_id: bioFieldQuery.data.group_id,
            value: bio,
            visibility_level: 'public',
          },
        ]);
      }
    },
    onSuccess: async () => {
      console.log('PROFILE SAVE SUCCESS');
      await queryClient.invalidateQueries({ queryKey: ['tea-me-member'] });
      await queryClient.invalidateQueries({ queryKey: ['tea-me-bio-field'] });
      await queryClient.invalidateQueries({ queryKey: ['tea-posts'] });
      router.back();
    },
    onError: (e: any) => {
      console.log('PROFILE SAVE ERROR', e);
      Alert.alert('Save failed', e?.message || 'Could not update profile.');
    },
  });

  if (!token) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <Text style={styles.title}>Log in to edit your profile</Text>
          <Pressable onPress={() => router.push('/login')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Log In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (meQuery.isLoading || bioFieldQuery.isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  const busy = saveMutation.isPending;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <TeaShellHeader title="Edit Profile" />

        <View style={styles.card}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#8b8b8b"
          />

          <Text style={[styles.label, styles.labelSpacing]}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={[styles.input, styles.bioInput]}
            placeholder="Tell people about yourself"
            placeholderTextColor="#8b8b8b"
            multiline
          />

          {!bioFieldQuery.data?.id ? (
            <Text style={styles.helpText}>
              Bio field not found yet. Name will save now; bio will save after we map your BuddyBoss bio field.
            </Text>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={() => saveMutation.mutate()}
              style={[styles.primaryBtn, busy && styles.disabledBtn]}
              disabled={busy}
            >
              <Text style={styles.primaryBtnText}>{busy ? 'Saving...' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f6f7',
  },
  content: {
    paddingBottom: 24,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
  },
  labelSpacing: {
    marginTop: 16,
  },
  input: {
    marginTop: 8,
    backgroundColor: '#f3f3f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
  },
  bioInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helpText: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#777',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ececf1',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});