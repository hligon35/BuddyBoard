import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../AuthContext';

export function HelpButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Settings', { screen: 'Help' })}>
      <Text style={styles.help}>Help</Text>
    </TouchableOpacity>
  );
}

export function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity style={styles.btn} onPress={() => logout()}>
      <Text style={styles.logout}>Logout</Text>
    </TouchableOpacity>
  );
}

export function BackButton({ onPress }) {
  return (
    <TouchableOpacity style={[styles.btn, styles.backBtn]} onPress={onPress}>
      <Text style={styles.backText}>‹ Back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 12 },
  help: { color: '#2563eb', fontWeight: '600' },
  logout: { color: '#ef4444', fontWeight: '600' },
  backBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#eef2ff' },
  backText: { color: '#2563eb', fontWeight: '700', fontSize: 14 },
});

export default { HelpButton, LogoutButton };
