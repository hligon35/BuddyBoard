import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Api from '../src/Api';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export default function ForgotPasswordScreen({ onDone, onCancel }) {
  const [step, setStep] = useState('request'); // request | reset
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const supportEmail = useMemo(() => {
    try {
      const v = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_SUPPORT_EMAIL)
        ? String(process.env.EXPO_PUBLIC_SUPPORT_EMAIL)
        : '';
      return v.trim() || 'support@buddyboard.getsparqd.com';
    } catch (e) {
      return 'support@buddyboard.getsparqd.com';
    }
  }, []);

  async function submitRequest() {
    const e = normalizeEmail(email);
    if (!e) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }

    setBusy(true);
    try {
      const res = await Api.requestPasswordReset(e);
      // Always show a generic message to avoid account enumeration.
      const msg = 'If an account exists for that email, a reset code has been generated.';

      if (res && res.resetCode) {
        Alert.alert('Reset code (internal build)', `${msg}\n\nCode: ${res.resetCode}\n\nEnter this code to set a new password.`, [
          { text: 'OK', onPress: () => {} },
        ]);
        setCode(String(res.resetCode));
        setStep('reset');
      } else {
        Alert.alert('Check your email', msg);
        setStep('reset');
      }
    } catch (err) {
      Alert.alert('Reset failed', err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitReset() {
    const e = normalizeEmail(email);
    const c = String(code || '').trim();
    const p1 = String(newPassword || '');
    const p2 = String(confirmPassword || '');

    if (!e) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    if (!c) {
      Alert.alert('Missing code', 'Please enter the reset code.');
      return;
    }
    if (!p1 || p1.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (p1 !== p2) {
      Alert.alert('Passwords do not match', 'Please re-type your new password.');
      return;
    }

    setBusy(true);
    try {
      await Api.resetPassword({ email: e, resetCode: c, newPassword: p1 });
      Alert.alert('Password updated', 'You can now sign in with your new password.', [
        { text: 'OK', onPress: () => { try { onDone && onDone(); } catch (e2) {} } },
      ]);
    } catch (err) {
      Alert.alert('Reset failed', err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  function openSupportEmail() {
    const url = `mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent('BuddyBoard Password Reset')}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Contact support', `Please email ${supportEmail} for help resetting your password.`);
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Reset Password</Text>
        <TouchableOpacity onPress={() => { try { onCancel && onCancel(); } catch (e) {} }} accessibilityRole="button">
          <MaterialIcons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subTitle}>
        Enter your email to request a reset code, then set a new password.
      </Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!busy}
      />

      {step === 'request' ? (
        <TouchableOpacity
          onPress={submitRequest}
          disabled={busy}
          accessibilityRole="button"
          style={[styles.primaryBtn, busy ? { opacity: 0.7 } : null]}
        >
          <Text style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Send reset code'}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.label}>Reset code</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            style={styles.input}
            placeholder="Code"
            autoCapitalize="none"
            editable={!busy}
          />

          <Text style={styles.label}>New password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
            placeholder="New password"
            secureTextEntry
            autoCapitalize="none"
            editable={!busy}
          />

          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            placeholder="Confirm new password"
            secureTextEntry
            autoCapitalize="none"
            editable={!busy}
          />

          <TouchableOpacity
            onPress={submitReset}
            disabled={busy}
            accessibilityRole="button"
            style={[styles.primaryBtn, busy ? { opacity: 0.7 } : null]}
          >
            <Text style={styles.primaryBtnText}>{busy ? 'Updating…' : 'Update password'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStep('request')}
            disabled={busy}
            accessibilityRole="button"
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>Request a new code</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ marginTop: 14 }}>
        <TouchableOpacity onPress={openSupportEmail} accessibilityRole="button" style={styles.supportBtn}>
          <MaterialIcons name="email" size={18} color="#2563eb" />
          <Text style={styles.supportBtnText}>Contact support</Text>
        </TouchableOpacity>
        <Text style={styles.hintText}>
          {Platform.OS === 'web' ? 'Web: email client opens in a new tab.' : `Support: ${supportEmail}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subTitle: { marginTop: 8, fontSize: 13, color: '#6b7280' },
  label: { marginTop: 14, fontSize: 13, fontWeight: '700', color: '#111827' },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  linkBtn: { marginTop: 10, alignSelf: 'flex-start' },
  linkText: { color: '#2563eb', fontWeight: '700' },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  supportBtnText: { marginLeft: 8, color: '#2563eb', fontWeight: '800' },
  hintText: { marginTop: 8, fontSize: 12, color: '#6b7280' },
});
