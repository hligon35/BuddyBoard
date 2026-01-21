import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useAuth } from '../src/AuthContext';
import * as Api from '../src/Api';
import { logger } from '../src/utils/logger';
import * as SecureStore from 'expo-secure-store';

export default function SignUpScreen({ onDone, onCancel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [method, setMethod] = useState(null);
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [destinationMask, setDestinationMask] = useState('');
  const [resendUntilMs, setResendUntilMs] = useState(0);
  const auth = useAuth();

  const doSignup = async (chosenMethod) => {
    setBusy(true);
    try {
      logger.debug('auth', 'Signup submit', { method: chosenMethod });
      const res = await Api.signup({
        name,
        email,
        password,
        role: 'parent',
        twoFaMethod: chosenMethod,
      });

      // If backend is configured to skip 2FA, it may return a token directly.
      if (res && res.token) {
        await auth.setAuth({ token: res.token, user: res.user });
        try {
          await SecureStore.setItemAsync('bb_bio_token', String(res.token));
          await SecureStore.setItemAsync('bb_bio_user', JSON.stringify(res.user || {}));
        } catch (e) {}
        Alert.alert('Success', 'Account created and authenticated');
        if (onDone) onDone({ authed: true });
        return;
      }

      if (!res || !res.challengeId) {
        throw new Error(res?.error || 'Signup failed');
      }

      setMethod(res.method || chosenMethod);
      setDestinationMask(res.to || '');
      setChallengeId(res.challengeId);
      if (typeof __DEV__ !== 'undefined' && __DEV__ && res.devCode) {
        setCode(String(res.devCode));
        logger.debug('auth', 'Prefilled dev 2FA code from server', { challengeId: res.challengeId });
      }
      setShow2fa(true);
      Alert.alert('Verify', 'Enter the verification code sent to your email.');
    } catch (e) {
      logger.warn('auth', 'Signup failed', { message: e?.message || String(e) });

      const serverMsg = e?.response?.data?.error;
      const hasResponse = !!e?.response;
      const apiBase = Api?.API_BASE_URL || 'unknown';
      const isTimeout = e?.code === 'ECONNABORTED';

      if (!hasResponse) {
        const msg = isTimeout
          ? `Request timed out trying to reach ${apiBase}. Is the API server running and reachable from this device?`
          : `Network error trying to reach ${apiBase}. If you're on a phone, "localhost" won't work—set EXPO_PUBLIC_API_BASE_URL to your server/domain (or ensure you're on the same Wi‑Fi as your dev machine).`;
        Alert.alert('Network error', msg);
        return;
      }

      Alert.alert('Error', serverMsg || e?.message || 'Signup failed');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!email || !name || !password) return Alert.alert('Missing', 'Please provide name, email, and password');
    setMethod('email');
    await doSignup('email');
  };

  const verifyCode = async () => {
    setBusy(true);
    try {
      logger.debug('auth', '2FA verify submit', { method, hasChallenge: !!challengeId });
      const res = await Api.verify2fa({ challengeId, code });
      if (!res || !res.token) throw new Error(res?.error || 'Verification failed');
      await auth.setAuth({ token: res.token, user: res.user });
      try {
        await SecureStore.setItemAsync('bb_bio_token', String(res.token));
        await SecureStore.setItemAsync('bb_bio_user', JSON.stringify(res.user || {}));
      } catch (e) {}
      Alert.alert('Success', 'Account created and authenticated');
      if (onDone) onDone({ authed: true });
    } catch (e) {
      logger.warn('auth', '2FA verification failed', { message: e?.message || String(e) });
      Alert.alert('Error', 'Verification failed');
    } finally { setBusy(false); }
  };

  const resendCode = async () => {
    if (!challengeId) return;
    const now = Date.now();
    if (resendUntilMs && now < resendUntilMs) {
      const sec = Math.ceil((resendUntilMs - now) / 1000);
      Alert.alert('Please wait', `You can request another code in ${sec} seconds.`);
      return;
    }

    setBusy(true);
    try {
      logger.debug('auth', '2FA resend submit', { hasChallenge: !!challengeId });
      const res = await Api.resend2fa({ challengeId });
      if (res?.to) setDestinationMask(String(res.to));
      if (typeof __DEV__ !== 'undefined' && __DEV__ && res?.devCode) {
        setCode(String(res.devCode));
        logger.debug('auth', 'Prefilled dev 2FA code from resend', { challengeId });
      }
      // Server enforces a 5-minute cooldown; respect retryAfterSec when provided.
      setResendUntilMs(Date.now() + 5 * 60 * 1000);
      Alert.alert('Sent', 'A new verification code was sent.');
    } catch (e) {
      const retryAfterSec = e?.response?.data?.retryAfterSec;
      if (retryAfterSec) {
        setResendUntilMs(Date.now() + (Number(retryAfterSec) * 1000));
        Alert.alert('Please wait', `You can request another code in ${retryAfterSec} seconds.`);
        return;
      }
      logger.warn('auth', '2FA resend failed', { message: e?.message || String(e) });
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'Failed to resend code');
    } finally {
      setBusy(false);
    }
  };

  const methodLabel = (String(method || '').toLowerCase() === 'sms') ? 'SMS' : 'Email';

  return (
    <ImageBackground
      source={require('../assets/bbbg.png')}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: '#fff' }}
      imageStyle={{ transform: [{ scale: 0.92 }] }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.formCard}>
              {!show2fa ? (
                <View>
                  <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Sign Up</Text>
                  <TextInput placeholder="Full name" value={name} onChangeText={setName} style={styles.input} />
                  <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                  <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <Button title="Cancel" onPress={() => { if (onCancel) onCancel(); }} />
                    <Button title={busy ? 'Submitting...' : 'Submit'} onPress={submit} disabled={busy} />
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={{ fontSize: 18, marginBottom: 8 }}>
                    Enter verification code ({methodLabel}){destinationMask ? ` to ${destinationMask}` : ''}
                  </Text>
                  <TextInput placeholder="123456" value={code} onChangeText={setCode} keyboardType="number-pad" style={styles.input} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <Button title="Back" onPress={() => { setShow2fa(false); setMethod(null); setChallengeId(''); setDestinationMask(''); setCode(''); }} />
                    <Button title="Resend" onPress={resendCode} disabled={busy || !challengeId} />
                    <Button title={busy ? 'Verifying...' : 'Verify'} onPress={verifyCode} disabled={busy} />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  formCard: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 6, backgroundColor: '#fff' }
});
