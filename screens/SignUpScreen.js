import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal } from 'react-native';
import { useAuth } from '../src/AuthContext';
import * as Api from '../src/Api';
import { logger } from '../src/utils/logger';

export default function SignUpScreen({ onDone, onCancel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [method, setMethod] = useState(null);
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [destinationMask, setDestinationMask] = useState('');
  const auth = useAuth();

  const doSignup = async (chosenMethod) => {
    setBusy(true);
    try {
      logger.debug('auth', 'Signup submit', { method: chosenMethod });
      const res = await Api.signup({
        name,
        email,
        phone,
        password,
        role: 'parent',
        twoFaMethod: chosenMethod,
      });

      // If backend is configured to skip 2FA, it may return a token directly.
      if (res && res.token) {
        await auth.setAuth({ token: res.token, user: res.user });
        Alert.alert('Success', 'Account created and authenticated');
        if (onDone) onDone();
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
      Alert.alert('Verify', `Enter the verification code sent via ${res.method || chosenMethod}.`);
    } catch (e) {
      logger.warn('auth', 'Signup failed', { message: e?.message || String(e) });
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'Signup failed');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!email || !name || !password) return Alert.alert('Missing', 'Please provide name, email, and password');
    if (!phone) return Alert.alert('Missing', 'Please provide a phone number for SMS verification (E.164 format like +15551234567).');
    setMethod('sms');
    await doSignup('sms');
  };

  const verifyCode = async () => {
    setBusy(true);
    try {
      logger.debug('auth', '2FA verify submit', { method, hasChallenge: !!challengeId });
      const res = await Api.verify2fa({ challengeId, code });
      if (!res || !res.token) throw new Error(res?.error || 'Verification failed');
      await auth.setAuth({ token: res.token, user: res.user });
      Alert.alert('Success', 'Account created and authenticated');
      if (onDone) onDone();
    } catch (e) {
      logger.warn('auth', '2FA verification failed', { message: e?.message || String(e) });
      Alert.alert('Error', 'Verification failed');
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {!show2fa ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Sign Up</Text>
          <TextInput placeholder="Full name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
          <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
          <TextInput placeholder="Phone (+15551234567)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Button title="Cancel" onPress={() => { if (onCancel) onCancel(); }} />
            <Button title={busy ? 'Submitting...' : 'Submit'} onPress={submit} disabled={busy} />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, marginBottom: 8 }}>
            Enter verification code ({method === 'sms' ? 'text' : 'email'}){destinationMask ? ` to ${destinationMask}` : ''}
          </Text>
          <TextInput placeholder="123456" value={code} onChangeText={setCode} keyboardType="number-pad" style={styles.input} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Button title="Back" onPress={() => { setShow2fa(false); setMethod(null); setChallengeId(''); setDestinationMask(''); setCode(''); }} />
            <Button title={busy ? 'Verifying...' : 'Verify'} onPress={verifyCode} disabled={busy} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 6 }
});
