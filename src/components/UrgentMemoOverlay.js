import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Button, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../AuthContext';
import * as Api from '../Api';

export default function UrgentMemoOverlay() {
  const { user } = useAuth();
  const [memos, setMemos] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const data = await Api.getUrgentMemos();
        let list = Array.isArray(data) ? data : (data?.memos || []);
        if (!Array.isArray(list)) list = [];
        // Dev helper: if no memos returned in development, show a demo memo so the overlay is visible for testing
        if (__DEV__ && (!Array.isArray(list) || list.length === 0)) {
          list = [
            { id: 'demo-1', title: 'Demo Urgent Memo', body: 'This is a demo urgent memo for development. Verify modal layout and acknowledgement.', date: new Date().toLocaleString() },
          ];
        }
        setMemos(list);
        const seenKey = `urgentSeen_${user.id}`;
        const seenRaw = await AsyncStorage.getItem(seenKey);
        let seen = [];
        if (seenRaw) {
          try {
            const parsed = JSON.parse(seenRaw);
            if (Array.isArray(parsed)) seen = parsed;
            else console.warn('UrgentMemoOverlay: seen key parsed but not array', parsed);
          } catch (e) {
            console.warn('UrgentMemoOverlay: failed to parse seenKey', e.message);
            seen = [];
          }
        }
        if (!Array.isArray(seen)) seen = [];
        // Defensive: ensure IDs exist before includes check
        const unseen = list.filter((m) => { try { return !seen.includes(m?.id); } catch (e) { return true; } });
        if (unseen.length) setVisible(true);
        // If there were no unseen items but we're in dev and we injected a demo memo, ensure modal shows
        if (__DEV__ && Array.isArray(list) && list.length && !visible) {
          const seenKey = `urgentSeen_${user.id}`;
          // if seen list doesn't include our demo id, show it
          try {
            const seenRaw = await AsyncStorage.getItem(seenKey);
            const parsed = seenRaw ? JSON.parse(seenRaw) : [];
            if (!Array.isArray(parsed) || !parsed.includes(list[0].id)) setVisible(true);
          } catch (e) {
            setVisible(true);
          }
        }
      } catch (e) {
        console.warn('urgent memos fetch failed', e.message);
      }
    })();
  }, [user]);

  async function handleContinue() {
    try {
      const ids = memos.map((m) => m.id);
      await Api.ackUrgentMemo(ids);
      if (user) {
        const seenKey = `urgentSeen_${user.id}`;
        await AsyncStorage.setItem(seenKey, JSON.stringify(ids));
      }
    } catch (e) {
      console.warn('ack failed', e.message);
    } finally {
      setVisible(false);
    }
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
          <View style={{ margin: 20, backgroundColor: 'white', borderRadius: 8, padding: 16, maxHeight: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Urgent Memos</Text>
            <ScrollView style={{ marginTop: 12 }}>
              {memos.map((m) => (
                <View key={m.id} style={{ marginBottom: 12 }}>
                  <Text style={{ fontWeight: '700' }}>{m.title}</Text>
                  <Text>{m.body}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>{m.date}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={{ marginTop: 12 }}>
              <Button title="Continue" onPress={handleContinue} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Dev-only: floating debug button to open urgent memo modal */}
      {__DEV__ && (
        <TouchableOpacity style={styles.debugBtn} onPress={() => setVisible(true)} accessibilityLabel="Open urgent memo (dev)">
          <Text style={styles.debugBtnText}>Urgent</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  debugBtn: {
    position: 'absolute',
    left: 16,
    bottom: 90,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 6,
  },
  debugBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
