import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import SignUpScreen from './SignUpScreen';
import { useAuth } from '../src/AuthContext';
import LogoTitle from '../src/components/LogoTitle';

export default function LoginScreen({ navigation, suppressAutoRedirect = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const auth = useAuth();

  async function doLogin(){
    setBusy(true);
    try{
      await auth.login(email, password);
      navigation.replace('Main');
    }catch(e){
      Alert.alert('Login failed', e.message || 'Please check credentials');
    }finally{ setBusy(false); }
  }

  // If already authenticated (e.g. dev auto-login), redirect to Home
  // This effect must be declared before any early returns to preserve
  // the order of Hooks between renders.
  useEffect(() => {
    if (suppressAutoRedirect) return;
    if (!auth.loading && auth.token) {
      navigation.replace('Main');
    }
  }, [auth.loading, auth.token, suppressAutoRedirect]);

  if (auth.loading) return (
    <View style={styles.container}><ActivityIndicator size="large" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <LogoTitle width={360} height={108} />
      </View>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Password" secureTextEntry />

      <View style={styles.actionsRow}>
        <View style={{ flex: 0 }}>
          <Button title={busy ? 'Signing in...' : 'Sign in'} onPress={doLogin} disabled={busy} />
        </View>
        <Text style={styles.sep}>|</Text>
        <TouchableOpacity style={styles.signUpBtn} onPress={() => setShowSignUp(true)} accessibilityRole="button">
          <Text style={styles.registerText}>Sign up</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSignUp} animationType="slide" onRequestClose={() => setShowSignUp(false)}>
        <SignUpScreen onDone={() => setShowSignUp(false)} onCancel={() => setShowSignUp(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 6 },
  registerWrap: { marginTop: 12, alignItems: 'center' },
  registerText: { color: '#2563eb', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  sep: { marginHorizontal: 8, color: '#666', fontSize: 18 },
  signUpBtn: { marginLeft: 6 }
});
