import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useData } from '../DataContext';

export default function AdminControlsScreen() {
  const { posts, messages, children } = useData();

  const therapistCount = useMemo(() => {
    const set = new Set();
    (children || []).forEach(c => {
      if (c.amTherapist && c.amTherapist.id) set.add(c.amTherapist.id);
      if (c.pmTherapist && c.pmTherapist.id) set.add(c.pmTherapist.id);
      if (c.bcaTherapist && c.bcaTherapist.id) set.add(c.bcaTherapist.id);
    });
    return set.size;
  }, [children]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin Controls</Text>
        <Text style={styles.paragraph}>Administrative tools for managing users, content, and system settings.</Text>

        <Text style={{ marginTop: 12, fontWeight: '700' }}>Summary</Text>
        <Text style={styles.paragraph}>Posts: {posts?.length || 0}</Text>
        <Text style={styles.paragraph}>Messages: {messages?.length || 0}</Text>
        <Text style={styles.paragraph}>Children: {children?.length || 0}</Text>
        <Text style={styles.paragraph}>Therapists referenced: {therapistCount}</Text>

        <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>Manage Users</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>Moderate Posts</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>System Settings</Text></TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  paragraph: { marginTop: 8, color: '#374151' },
  btn: { marginTop: 12, backgroundColor: '#0066FF', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' }
});
