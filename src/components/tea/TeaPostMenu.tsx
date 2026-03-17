import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

export default function TeaPostMenu({
  isOwner,
  onEdit,
  onDelete,
  onShare,
}: {
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}) {
  function openMenu() {
    const ownerOptions = ['Edit', 'Share', 'Delete', 'Cancel'];
    const publicOptions = ['Share', 'Cancel'];

    if (Platform.OS === 'ios') {
      if (isOwner) {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ownerOptions,
            cancelButtonIndex: 3,
            destructiveButtonIndex: 2,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) onEdit?.();
            if (buttonIndex === 1) onShare?.();
            if (buttonIndex === 2) onDelete?.();
          }
        );
      } else {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: publicOptions,
            cancelButtonIndex: 1,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) onShare?.();
          }
        );
      }

      return;
    }

    if (isOwner) {
      Alert.alert('Post options', 'Choose an action', [
        { text: 'Edit', onPress: onEdit },
        { text: 'Share', onPress: onShare },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Post options', 'Choose an action', [
        { text: 'Share', onPress: onShare },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  return (
    <Pressable onPress={openMenu} style={styles.menuBtn}>
      <Text style={styles.menuBtnText}>•••</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#ececf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    letterSpacing: 1,
  },
});