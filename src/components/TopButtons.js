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
  const logEvent = (ev) => { try { console.log(`TopButtons.BackButton: ${ev} @ ${new Date().toISOString()}`); } catch (e) {} };
  return (
    <TouchableOpacity
      style={[styles.btn, styles.backBtn]}
      onPress={() => { logEvent('onPress'); onPress && onPress(); }}
      onPressIn={() => logEvent('onPressIn')}
      onPressOut={() => logEvent('onPressOut')}
      onLongPress={() => logEvent('onLongPress')}
      delayLongPress={600}
      accessibilityLabel="Go back"
      hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      activeOpacity={0.85}
    >
      <Text style={styles.backText}>‹ Back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 12 },
  help: { color: '#2563eb', fontWeight: '600' },
  logout: { color: '#ef4444', fontWeight: '600' },
  backBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e6eef8', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  backText: { color: '#111827', fontWeight: '700', fontSize: 14 },
});

export default { HelpButton, LogoutButton };
