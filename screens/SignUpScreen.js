import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal } from 'react-native';
import { useAuth } from '../src/AuthContext';

export default function SignUpScreen({ onDone, onCancel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [method, setMethod] = useState(null);
  const [code, setCode] = useState('');
  const auth = useAuth();

  const submit = async () => {
    if (!email || !name) return Alert.alert('Missing', 'Please provide name and email');
    // In a production build this would call backend /signup and send 2FA.
    // Here we simulate by prompting for method.
    Alert.alert('Choose 2FA', 'How would you like to receive a verification code?', [
      { text: 'Text', onPress: () => { setMethod('sms'); setShow2fa(true); } },
      { text: 'Email', onPress: () => { setMethod('email'); setShow2fa(true); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const verifyCode = async () => {
    setBusy(true);
    try {
      // In dev accept any code; in prod call API to verify
      await new Promise((r) => setTimeout(r, 800));
      // grant access by using dev helper if available
      if (auth && auth.devSetAuth) {
        const token = `dev-signup-${Date.now()}`;
        const user = { id: `user-${Date.now()}`, name, email, phone, role: 'parent' };
        await auth.devSetAuth({ token, user });
      }
      Alert.alert('Success', 'Account created and authenticated');
      if (onDone) onDone();
    } catch (e) {
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
          <TextInput placeholder="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Button title="Cancel" onPress={() => { if (onCancel) onCancel(); }} />
            <Button title={busy ? 'Submitting...' : 'Submit'} onPress={submit} disabled={busy} />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, marginBottom: 8 }}>Enter verification code ({method === 'sms' ? 'text' : 'email'})</Text>
          <TextInput placeholder="123456" value={code} onChangeText={setCode} keyboardType="number-pad" style={styles.input} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Button title="Back" onPress={() => { setShow2fa(false); setMethod(null); }} />
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
