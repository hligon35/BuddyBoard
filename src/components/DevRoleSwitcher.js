import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function DevRoleSwitcher() {
  if (!__DEV__) return null;
  const { setRole, user } = useAuth();
  const [open, setOpen] = useState(false);

  const changeRole = (r) => {
    if (!setRole) return;
    setRole(r);
    setOpen(false);
    Alert.alert('Role changed', `Switched to ${r}`);
  };

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {/* Role badge */}
      <View style={styles.badgeWrap} pointerEvents="none">
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{(user && user.role) ? user.role.toString().toUpperCase() : 'DEV'}</Text>
        </View>
      </View>
      {open && (
        <View style={styles.menu}>
          <TouchableOpacity onPress={() => changeRole('parent')} style={styles.menuBtn}>
            <Text>Parent</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeRole('therapist')} style={styles.menuBtn}>
            <Text>Therapist</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeRole('admin')} style={styles.menuBtn}>
            <Text>Admin</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setOpen(!open)} accessibilityLabel="Developer role switcher">
        <MaterialIcons name="developer-mode" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    alignItems: 'flex-end',
    zIndex: 9999,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  menu: {
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  menuBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeWrap: {
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 6,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
