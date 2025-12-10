import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import devToolsFlag from '../utils/devToolsFlag';
import { useData } from '../DataContext';
import { ScreenWrapper } from '../components/ScreenWrapper';

export default function SystemSettingsScreen(){
  const navigation = useNavigation();
  const [devVisible, setDevVisible] = useState(true);
  const { resetChildrenToDemo, resetMessagesToDemo, clearMessages } = useData();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const v = await devToolsFlag.get();
      if (!mounted) return;
      setDevVisible(!!v);
    })();
    return () => { mounted = false; };
  }, []);

  async function toggleDev(v) {
    try {
      await devToolsFlag.set(v);
      setDevVisible(!!v);
      Alert.alert('Saved', `Dev tools ${v ? 'visible' : 'hidden'}`);
    } catch (e) { Alert.alert('Error', 'Could not save setting'); }
  }

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.body}>
        <View style={styles.row}><Text style={styles.label}>Show dev tools</Text><Switch value={devVisible} onValueChange={toggleDev} /></View>
        <View style={{ height: 12 }} />
        <TouchableOpacity style={styles.btn} onPress={() => { resetChildrenToDemo(); Alert.alert('Reset', 'Children cleared (enable dev seed to repopulate)'); }}><Text style={styles.btnText}>Clear children (use dev seed to populate)</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => { resetMessagesToDemo(); Alert.alert('Reset', 'Messages reset to demo data'); }}><Text style={styles.btnText}>Reset messages to demo data</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => { clearMessages(); Alert.alert('Cleared', 'Messages cleared'); }}><Text style={styles.btnText}>Clear messages</Text></TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 16 },
  p: { color: '#374151' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  label: { color: '#111827' },
  btn: { marginTop: 12, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 },
  btnText: { color: '#111827', fontWeight: '700' }
});