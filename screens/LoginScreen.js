import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import SignUpScreen from './SignUpScreen';
import { useAuth } from '../src/AuthContext';
import LogoTitle from '../src/components/LogoTitle';
import { logger } from '../src/utils/logger';

export default function LoginScreen({ navigation, suppressAutoRedirect = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Use biometrics');
  const [showSignUp, setShowSignUp] = useState(false);
  const auth = useAuth();

  async function doLogin(){
    setBusy(true);
    try{
      logger.debug('auth', 'Login submit', { hasEmail: !!email });
      await auth.login(email, password);
      navigation.replace('Main');
    }catch(e){
      logger.warn('auth', 'Login failed', { message: e?.message || String(e) });
      Alert.alert('Login failed', e.message || 'Please check credentials');
    }finally{ setBusy(false); }
  }

  async function doBiometricUnlock() {
    setBiometricBusy(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock BuddyBoard',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result?.success) {
        navigation.replace('Main');
        return;
      }

      // user_cancel / system_cancel are expected; don't throw noisy alerts
      const err = result?.error ? String(result.error) : '';
      if (err && err !== 'user_cancel' && err !== 'system_cancel' && err !== 'app_cancel') {
        Alert.alert('Biometric unlock failed', 'Please sign in with email and password.');
      }
    } catch (e) {
      Alert.alert('Biometric unlock failed', e?.message || 'Please sign in with email and password.');
    } finally {
      setBiometricBusy(false);
    }
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (auth.loading) return;

      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();

        let label = 'Use biometrics';
        try {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) label = 'Use Face ID';
          else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) label = 'Use Touch ID';
        } catch (e) {
          // ignore; default label
        }

        if (mounted) {
          setBiometricAvailable(Boolean(hasHardware && enrolled));
          setBiometricLabel(label);
        }
      } catch (e) {
        if (mounted) setBiometricAvailable(false);
      }
    })();

    return () => { mounted = false; };
  }, [auth.loading]);

  if (auth.loading) return (
    <View style={styles.container}><ActivityIndicator size="large" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <LogoTitle width={360} height={108} />
      </View>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />

      <View style={styles.passwordRow}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={[styles.input, styles.passwordInput]}
          placeholder="Password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
        />
        <TouchableOpacity
          style={styles.peekBtn}
          onPress={() => setShowPassword((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Text style={styles.peekText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

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

      {biometricAvailable && !!auth.token && (
        <View style={styles.biometricWrap}>
          <Button
            title={biometricBusy ? 'Checking…' : biometricLabel}
            onPress={doBiometricUnlock}
            disabled={biometricBusy || busy}
          />
        </View>
      )}
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
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, marginBottom: 0 },
  peekBtn: { paddingHorizontal: 10, paddingVertical: 10, marginLeft: 8 },
  peekText: { color: '#2563eb', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  sep: { marginHorizontal: 8, color: '#666', fontSize: 18 },
  signUpBtn: { marginLeft: 6 },
  biometricWrap: { marginTop: 12 }
});
