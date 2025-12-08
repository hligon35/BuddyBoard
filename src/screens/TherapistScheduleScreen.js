import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useData } from '../DataContext';
import { useAuth } from '../AuthContext';

export default function TherapistScheduleScreen() {
  const { children } = useData();
  const { user } = useAuth();

  const assignedChildren = useMemo(() => {
    if (!user) return [];
    const uid = user.id;
    return (children || []).filter(c => (c.amTherapist && c.amTherapist.id === uid) || (c.pmTherapist && c.pmTherapist.id === uid) || (c.bcaTherapist && c.bcaTherapist.id === uid));
  }, [children, user]);

  const upcoming = useMemo(() => {
    const list = [];
    (assignedChildren || []).forEach(c => {
      (c.upcoming || []).forEach(u => list.push({ child: c, item: u }));
    });
    return list;
  }, [assignedChildren]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Pod</Text>
        <Text style={styles.paragraph}>Assigned children ({assignedChildren.length})</Text>

        {(assignedChildren || []).map(c => (
          <View key={c.id} style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: '700' }}>{c.name}</Text>
            <Text style={{ color: '#6b7280' }}>{c.age} • {c.room}</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Upcoming Appointments</Text>
        {upcoming.length ? upcoming.map(u => (
          <View key={`${u.child.id}-${u.item.id}`} style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: '600' }}>• {u.item.when} — {u.child.name} — {u.item.title}</Text>
            {u.item.organizer ? <Text style={{ color: '#6b7280' }}>Organizer: {u.item.organizer.name}</Text> : null}
          </View>
        )) : <Text style={styles.paragraph}>No upcoming appointments assigned.</Text>}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  sectionTitle: { marginTop: 12, fontWeight: '700' },
  paragraph: { marginTop: 8, color: '#374151' }
});
