import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNav({ navigationRef, currentRoute }) {
  function go(name) {
    if (navigationRef && navigationRef.current && navigationRef.current.navigate) {
      navigationRef.current.navigate(name);
    }
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.inner}>
        <TouchableOpacity style={styles.button} onPress={() => go('Home')}>
          <Ionicons
            name={currentRoute === 'Home' ? 'home' : 'home-outline'}
            size={22}
            color={currentRoute === 'Home' ? '#0066FF' : '#444'}
          />
          <Text style={[styles.label, currentRoute === 'Home' && styles.active]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => go('Chats')}>
          <MaterialIcons
            name={currentRoute === 'Chats' ? 'chat' : 'chat-bubble-outline'}
            size={22}
            color={currentRoute === 'Chats' ? '#0066FF' : '#444'}
          />
          <Text style={[styles.label, currentRoute === 'Chats' && styles.active]}>Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => go('MyChild')}>
          <MaterialCommunityIcons
            name={currentRoute === 'MyChild' ? 'account-child' : 'account-child-outline'}
            size={22}
            color={currentRoute === 'MyChild' ? '#0066FF' : '#444'}
          />
          <Text style={[styles.label, currentRoute === 'MyChild' && styles.active]}>My Child</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => go('Settings')}>
          <Ionicons
            name={currentRoute === 'Settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={currentRoute === 'Settings' ? '#0066FF' : '#444'}
          />
          <Text style={[styles.label, currentRoute === 'Settings' && styles.active]}>Settings</Text>
        </TouchableOpacity>
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
