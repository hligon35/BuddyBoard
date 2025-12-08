import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Alert, StyleSheet, Switch, Modal } from 'react-native';
import devToolsFlag from '../utils/devToolsFlag';
import { useAuth } from '../AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function DevRoleSwitcher() {
  if (!__DEV__) return null;
  const { setRole, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [devTools, setDevTools] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const v = await devToolsFlag.get();
        if (!mounted) return;
        setDevTools(Boolean(v));
      } catch (e) {}
    })();
    const unsub = devToolsFlag.addListener((v) => { if (mounted) setDevTools(Boolean(v)); });
    return () => { mounted = false; unsub(); };
  }, []);

  const setDevToolsPersisted = async (val) => {
    try {
      await devToolsFlag.set(val);
    } catch (e) {}
  };

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
          <View style={{ height: 1, backgroundColor: '#f3f4f6', marginVertical: 6 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 }}>
            <Text style={{ marginRight: 8 }}>Show Dev Tools</Text>
            <Switch value={devTools} onValueChange={setDevToolsPersisted} />
          </View>

          <TouchableOpacity onPress={() => setShowLoginModal(true)} style={styles.menuBtn}>
            <Text>Open Login Screen</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showLoginModal} animationType="slide" onRequestClose={() => setShowLoginModal(false)}>
        {/* Render the existing LoginScreen in a modal for dev testing. Provide a fake navigation.replace that closes the modal. */}
        {/** Import lazily to avoid bundling issues in production */}
        <DevLoginWrapper onClose={() => setShowLoginModal(false)} />
      </Modal>

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

function DevLoginWrapper({ onClose }) {
  // Lazy require to avoid loading login screen in production bundles
  let LoginScreen = null;
  try {
    const mod = require('../../screens/LoginScreen');
    LoginScreen = (mod && mod.default) ? mod.default : mod;
  } catch (e) { return null; }

  // Guard: ensure the required module is a valid component before attempting to render
  if (!LoginScreen || (typeof LoginScreen !== 'function' && typeof LoginScreen !== 'object')) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Login screen unavailable</Text>
      </View>
    );
  }

  const fakeNav = {
    replace: (/* routeName */) => {
      // Close the modal instead of navigating
      try { onClose && onClose(); } catch (e) {}
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LoginScreen navigation={fakeNav} />
    </View>
  );
}
