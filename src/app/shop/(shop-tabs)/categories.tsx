import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

export default function ShopCategoriesScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.text}>Shop categories go here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f6f7',
  },
  wrap: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
});