import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Modal, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import SignUpScreen from './SignUpScreen';
import { useAuth } from '../src/AuthContext';
import LogoTitle from '../src/components/LogoTitle';
import { logger } from '../src/utils/logger';
import { API_BASE_URL } from '../src/Api';
import * as Api from '../src/Api';

WebBrowser.maybeCompleteAuthSession();

function GoogleSignInController({
  googleIds,
  busy,
  setBusy,
  auth,
  navigation,
}) {
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: googleIds.iosClientId,
    androidClientId: googleIds.androidClientId,
    webClientId: googleIds.webClientId,
    scopes: ['profile', 'email'],
  });

  async function doGoogleLogin() {
    if (busy) return;
    try {
      await googlePromptAsync({ useProxy: false, showInRecents: true });
    } catch (e) {
      Alert.alert('Google sign-in failed', e?.message || 'Could not start Google sign-in.');
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!googleResponse) return;
      if (googleResponse.type !== 'success') return;
      if (busy) return;

      try {
        setBusy(true);
        const idToken = googleResponse?.params?.id_token || googleResponse?.authentication?.idToken;
        if (!idToken) throw new Error('Google did not return an id_token');

        const res = await Api.loginWithGoogle(idToken);
        if (!res?.token) throw new Error(res?.error || 'Invalid Google login response');

        await auth.setAuth({ token: res.token, user: res.user });
        try {
          await SecureStore.setItemAsync('bb_bio_token', String(res.token));
          await SecureStore.setItemAsync('bb_bio_user', JSON.stringify(res.user || {}));
        } catch (e) {}

        navigation.replace('Main');
      } catch (e) {
        const msg = e?.response?.data?.error || e?.message || 'Google sign-in failed.';
        Alert.alert('Google sign-in failed', msg);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [googleResponse, busy, setBusy, auth, navigation]);

  return (
    <View style={{ width: '100%', maxWidth: 360, marginTop: 10 }}>
      <Button
        title="Continue with Google"
        onPress={doGoogleLogin}
        disabled={!googleRequest || busy}
      />
    </View>
  );
}

export default function LoginScreen({ navigation, suppressAutoRedirect = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Use biometrics');
  const [hasBiometricAuthStored, setHasBiometricAuthStored] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const auth = useAuth();

  const googleIds = {
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  };

  const googleRequiredClientId = Platform.OS === 'ios'
    ? googleIds.iosClientId
    : Platform.OS === 'android'
      ? googleIds.androidClientId
      : googleIds.webClientId;

  const googleEnabled = !!googleRequiredClientId;

  const fieldWidthStyle = useMemo(() => ({ width: '100%', maxWidth: 360 }), []);

  async function doLogin(){
    setBusy(true);
    try{
      logger.debug('auth', 'Login submit', { hasEmail: !!email });
      const res = await auth.login(email, password);
      try {
        await SecureStore.setItemAsync('bb_bio_token', String(res?.token || auth?.token || ''));
        await SecureStore.setItemAsync('bb_bio_user', JSON.stringify(res?.user || auth?.user || {}));
        setHasBiometricAuthStored(true);
      } catch (e) {}
      navigation.replace('Main');
    }catch(e){
      logger.warn('auth', 'Login failed', { message: e?.message || String(e) });
      const msg = e?.message || 'Please check credentials';
      const isNetworkish = /network|timeout|ssl|certificate|ats/i.test(String(msg));
      const detail = isNetworkish ? `\n\nServer: ${API_BASE_URL || '(unset)'}` : '';
      Alert.alert('Login failed', `${msg}${detail}`);
    }finally{ setBusy(false); }
  }

  function showGoogleConfigHelp() {
    Alert.alert(
      'Google sign-in not configured',
      'Missing the Google Client ID for this platform.\n\nFor EAS builds, add these to your build profile env (or EAS project env vars):\n- EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID\n- EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID\n- EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID\n\nThen rebuild the app binary.'
    );
  }

  async function doBiometricUnlock() {
    setBiometricBusy(true);
    try {
      const storedToken = await SecureStore.getItemAsync('bb_bio_token');
      const storedUser = await SecureStore.getItemAsync('bb_bio_user');
      if (!storedToken || !storedUser) {
        Alert.alert('Biometric sign-in', 'No saved sign-in found. Please sign in with email and password first.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock BuddyBoard',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result?.success) {
        let parsedUser = null;
        try { parsedUser = JSON.parse(storedUser); } catch (e) {}
        await auth.setAuth({ token: storedToken, user: parsedUser || undefined });
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('bb_bio_token');
        const storedUser = await SecureStore.getItemAsync('bb_bio_user');
        if (mounted) setHasBiometricAuthStored(!!storedToken && !!storedUser);
      } catch (e) {
        if (mounted) setHasBiometricAuthStored(false);
      }
    })();
    return () => { mounted = false; };
  }, [auth.loading, showSignUp]);

  if (auth.loading) return (
    <View style={styles.container}><ActivityIndicator size="large" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <LogoTitle width={360} height={108} />
      </View>
      <View style={fieldWidthStyle}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {googleEnabled ? (
        <GoogleSignInController
          googleIds={googleIds}
          busy={busy}
          setBusy={setBusy}
          auth={auth}
          navigation={navigation}
        />
      ) : (
        <View style={{ width: '100%', maxWidth: 360, marginTop: 10 }}>
          <Button title="Continue with Google" onPress={showGoogleConfigHelp} />
        </View>
      )}

      <View style={[fieldWidthStyle, styles.passwordFieldWrap]}>
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
          style={styles.peekIconBtn}
          onPress={() => setShowPassword((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color="#2563eb" />
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

      <View style={styles.secondaryActions}>
        <TouchableOpacity
          style={[styles.secondaryBtn, busy ? { opacity: 0.7 } : null]}
          onPress={doGoogleLogin}
          disabled={busy}
          accessibilityRole="button"
        >
          <MaterialIcons name="account-circle" size={18} color="#111827" />
          <Text style={styles.secondaryBtnText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSignUp} animationType="slide" onRequestClose={() => setShowSignUp(false)}>
        <SignUpScreen
          onDone={(result) => {
            setShowSignUp(false);
            if (result && result.authed) navigation.replace('Main');
          }}
          onCancel={() => setShowSignUp(false)}
        />
      </Modal>

      {biometricAvailable && hasBiometricAuthStored && (
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
  input: { borderWidth: 1, borderColor: '#ccc', paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12, borderRadius: 10, backgroundColor: '#fff' },
  registerWrap: { marginTop: 12, alignItems: 'center' },
  registerText: { color: '#2563eb', fontWeight: '600' },
  passwordFieldWrap: { position: 'relative' },
  passwordInput: { paddingRight: 42 },
  peekIconBtn: { position: 'absolute', right: 10, top: 10, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  sep: { marginHorizontal: 8, color: '#666', fontSize: 18 },
  signUpBtn: { marginLeft: 6 },
  biometricWrap: { marginTop: 12 },
  secondaryActions: { marginTop: 10, alignItems: 'center' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f8fafc', width: '100%', maxWidth: 360 },
  secondaryBtnText: { marginLeft: 8, color: '#111827', fontWeight: '700' },
});
