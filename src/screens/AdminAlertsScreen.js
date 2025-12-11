import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useData } from '../DataContext';
import { useNavigation } from '@react-navigation/native';

export default function AdminAlertsScreen() {
  const { urgentMemos, respondToUrgentMemo, fetchAndSync, children = [] } = useData();
  const [list, setList] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    setList((urgentMemos || []).slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, [urgentMemos]);

  function childNameForId(id) {
    const c = (children || []).find((x) => x.id === id);
    return c ? c.name : id;
  }

  async function handleRespond(id, action) {
    try {
      const ok = await respondToUrgentMemo(id, action);
      if (ok) {
        Alert.alert('Updated', `Alert ${action}`);
        // refresh from server if available
        fetchAndSync().catch(() => {});
      } else {
        Alert.alert('Failed', 'Could not update alert');
      }
    } catch (e) {
      console.warn('handleRespond failed', e?.message || e);
      Alert.alert('Error', 'Failed to update');
    }
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Urgent Alerts</Text>
        {list.length === 0 ? (
          <Text style={styles.empty}>No urgent alerts currently.</Text>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => {
              const cname = childNameForId(item.childId);
              const status = item.status || 'pending';
              const statusColor = status === 'accepted' ? '#10B981' : status === 'denied' ? '#ef4444' : status === 'opened' ? '#F59E0B' : '#F59E0B';
              return (
                <View style={styles.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.meta}>{item.updateType === 'pickup' ? 'Pickup' : 'Drop-off'} • {new Date(item.createdAt).toLocaleString()}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={{ marginLeft: 8, color: '#6b7280' }}>{status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('ChildDetail', { childId: item.childId })}>
                    <Text style={styles.child}>Child: {cname}</Text>
                  </TouchableOpacity>
                  <Text style={styles.note}>{item.note}</Text>
                  <View style={styles.row}>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#2563eb' }]} onPress={() => handleRespond(item.id, 'opened')}>
                      <Text style={styles.btnLabel}>Mark Opened</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#10B981' }]} onPress={() => handleRespond(item.id, 'accepted')}>
                      <Text style={styles.btnLabel}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={() => handleRespond(item.id, 'denied')}>
                      <Text style={styles.btnLabel}>Deny</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, flex: 1 },
  title: { fontWeight: '700', fontSize: 18, marginBottom: 12 },
  empty: { color: '#6b7280' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10 },
  meta: { color: '#6b7280', fontSize: 12 },
  child: { fontWeight: '700', marginTop: 6 },
  note: { color: '#374151', marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  btnLabel: { color: '#fff', fontWeight: '700' },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginLeft: 8 }
});
