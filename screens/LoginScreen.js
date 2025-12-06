import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../src/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const auth = useContext(AuthContext);

  async function doLogin(){
    setBusy(true);
    try{
      await auth.login(email, password);
      navigation.replace('Home');
    }catch(e){
      Alert.alert('Login failed', e.message || 'Please check credentials');
    }finally{ setBusy(false); }
  }

  if (auth.loading) return (
    <View style={styles.container}><ActivityIndicator size="large" /></View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BuddyBoard</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Password" secureTextEntry />
      <Button title={busy ? 'Signing in...' : 'Sign in'} onPress={doLogin} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 6 }
});
