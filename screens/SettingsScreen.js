import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen(){
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
      <Text style={styles.title}>Settings</Text>
      <Text>Profile • Notifications • Security</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 10 }
});
