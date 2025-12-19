import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LogoTitle from './LogoTitle';
import { useAuth } from '../AuthContext';

export default function WebNav() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const role = (user && user.role) ? (user.role || '').toString().toLowerCase() : 'parent';

  function navTo(route) {
    if (navigation && navigation.navigate) navigation.navigate(route);
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => navTo('Home')} style={styles.logoWrap}>
          <LogoTitle small />
        </TouchableOpacity>

        <View style={styles.links}>
          <TouchableOpacity onPress={() => navTo('Home')} style={styles.link}><Text style={styles.linkText}>Home</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navTo('Chats')} style={styles.link}><Text style={styles.linkText}>Messages</Text></TouchableOpacity>
          {role === 'therapist' && <TouchableOpacity onPress={() => navTo('MyClass')} style={styles.link}><Text style={styles.linkText}>My Class</Text></TouchableOpacity>}
          {(role === 'admin' || role === 'administrator') && <TouchableOpacity onPress={() => navTo('Controls')} style={styles.link}><Text style={styles.linkText}>Dashboard</Text></TouchableOpacity>}
          <TouchableOpacity onPress={() => navTo('Settings')} style={styles.link}><Text style={styles.linkText}>Settings</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  inner: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: {
    marginLeft: 18,
  },
  linkText: {
    color: '#111827',
    fontWeight: '600',
  },
});
