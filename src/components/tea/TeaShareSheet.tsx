import React, { useEffect } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { getTeaPostShareText } from '../../lib/tea-api';

type Props = {
  visible: boolean;
  onClose: () => void;
  activityId: number;
  author?: string;
  content?: string;
};

export default function TeaShareSheet({
  visible,
  onClose,
  activityId,
  author,
  content,
}: Props) {
  const shareText = getTeaPostShareText({
    activityId,
    author,
    content,
  });

  async function handleCopyLink() {
    await Clipboard.setStringAsync(shareText);
    onClose();
    Alert.alert('Copied', 'Tea post link copied.');
  }

  function handleSendInDm() {
    onClose();
    router.push({
      pathname: '/tea/dms/new',
      params: {
        shareText,
        activityId: String(activityId),
      },
    });
  }

  useEffect(() => {
    if (!visible || Platform.OS !== 'ios') return;

    const timer = setTimeout(() => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Copy Link', 'Send in DM'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleCopyLink();
          if (buttonIndex === 2) handleSendInDm();
          if (buttonIndex === 0) onClose();
        }
      );
    }, 0);

    return () => clearTimeout(timer);
  }, [visible]);

  if (Platform.OS === 'ios') {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Share Tea</Text>

          <Pressable style={styles.actionBtn} onPress={handleCopyLink}>
            <Text style={styles.actionText}>Copy Link</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleSendInDm}>
            <Text style={styles.actionText}>Send in DM</Text>
          </Pressable>

          <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  actionBtn: {
    backgroundColor: '#f3f3f6',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  cancelBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ececf1',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
  },
});