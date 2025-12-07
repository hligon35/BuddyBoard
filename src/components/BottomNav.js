import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';

export default function BottomNav({ navigationRef, currentRoute }) {
  const { user } = useAuth();
  const role = (user && user.role) ? (user.role || '').toString().toLowerCase() : 'parent';

  // define tabs depending on role
  let tabs = [
    { key: 'Home', label: 'Home', icon: (active) => (<Ionicons name={active ? 'home' : 'home-outline'} size={22} color={active ? '#0066FF' : '#444'} />) },
    { key: 'Chats', label: 'Chats', icon: (active) => (<MaterialIcons name={active ? 'chat' : 'chat-bubble-outline'} size={22} color={active ? '#0066FF' : '#444'} />) },
  ];
  if (role === 'therapist') {
    tabs.push({ key: 'Schedule', label: 'Schedule', icon: (active) => (<Ionicons name={active ? 'calendar' : 'calendar-outline'} size={22} color={active ? '#0066FF' : '#444'} />) });
  } else if (role === 'admin' || role === 'administrator') {
    tabs.push({ key: 'Controls', label: 'Controls', icon: (active) => (<MaterialIcons name={'tune'} size={22} color={active ? '#0066FF' : '#444'} />) });
  } else {
    tabs.push({ key: 'MyChild', label: 'My Child', icon: (active) => (<MaterialCommunityIcons name={active ? 'account-child' : 'account-child-outline'} size={22} color={active ? '#0066FF' : '#444'} />) });
  }
  tabs.push({ key: 'Settings', label: 'Settings', icon: (active) => (<Ionicons name={active ? 'settings' : 'settings-outline'} size={22} color={active ? '#0066FF' : '#444'} />) });
  function go(name) {
    if (navigationRef && navigationRef.current && navigationRef.current.navigate) {
      navigationRef.current.navigate(name);
    }
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.inner}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={styles.button} onPress={() => go(t.key)}>
            {t.icon(currentRoute === t.key)}
            <Text style={[styles.label, currentRoute === t.key && styles.active]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  inner: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    paddingBottom: 8,
    paddingTop: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#444',
    fontSize: 12,
    marginTop: 2,
  },
  active: {
    color: '#0066FF',
    fontWeight: '700',
  },
});
