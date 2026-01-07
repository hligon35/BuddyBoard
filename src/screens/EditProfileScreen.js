import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAuth } from '../AuthContext';
import * as Api from '../Api';

export default function EditProfileScreen({ navigation }) {
  const { user, setAuth } = useAuth();

  const initial = useMemo(() => {
    return {
      name: String(user?.name || ''),
      email: String(user?.email || ''),
      phone: String(user?.phone || ''),
      address: String(user?.address || ''),
    };
  }, [user]);

  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (saving) return;

    const nextName = String(name || '').trim();
    const nextEmail = String(email || '').trim();
    const nextPhone = String(phone || '').trim();
    const nextAddress = String(address || '').trim();

    if (!nextName) return Alert.alert('Missing name', 'Display name is required.');
    if (!nextEmail) return Alert.alert('Missing email', 'Email is required.');

    const wantsPasswordChange = String(password || '').length > 0 || String(passwordConfirm || '').length > 0;
    if (wantsPasswordChange) {
      if (!password || password.length < 6) return Alert.alert('Password', 'Password must be at least 6 characters.');
      if (password !== passwordConfirm) return Alert.alert('Password', 'Passwords do not match.');
    }

    const payload = {};
    if (nextName !== String(user?.name || '')) payload.name = nextName;
    if (nextEmail.toLowerCase() !== String(user?.email || '').toLowerCase()) payload.email = nextEmail;
    if (nextPhone !== String(user?.phone || '')) payload.phone = nextPhone;
    if (nextAddress !== String(user?.address || '')) payload.address = nextAddress;
    if (wantsPasswordChange) payload.password = password;

    if (!Object.keys(payload).length) {
      navigation.goBack();
      return;
    }

    try {
      setSaving(true);
      const res = await Api.updateMe(payload);
      if (!res || !res.token || !res.user) throw new Error('Invalid update response');
      await setAuth({ token: res.token, user: res.user });
      Alert.alert('Saved', 'Your profile was updated.');
      navigation.goBack();
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Could not update profile.';
      Alert.alert('Update failed', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenWrapper bannerShowBack={false} style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Edit Profile</Text>

          <Text style={styles.label}>Display name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Your name" />

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="name@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            placeholder="+15551234567"
            autoCapitalize="none"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'phone-pad'}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput value={address} onChangeText={setAddress} style={styles.input} placeholder="Address" />

          <View style={{ height: 12 }} />

          <Text style={styles.subTitle}>Change password</Text>
          <Text style={styles.hint}>Leave blank to keep your current password.</Text>

          <Text style={styles.label}>New password</Text>
          <TextInput value={password} onChangeText={setPassword} style={styles.input} secureTextEntry placeholder="••••••" />

          <Text style={styles.label}>Confirm new password</Text>
          <TextInput value={passwordConfirm} onChangeText={setPasswordConfirm} style={styles.input} secureTextEntry placeholder="••••••" />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, saving ? { opacity: 0.7 } : null]} onPress={onSave} disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },
  subTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 10 },
  hint: { marginTop: 6, color: '#6b7280' },
  label: { marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: '800', color: '#111827' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 12, marginRight: 8 },
  cancelText: { color: '#2563eb', fontWeight: '800' },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  saveText: { color: '#fff', fontWeight: '800' },
});
