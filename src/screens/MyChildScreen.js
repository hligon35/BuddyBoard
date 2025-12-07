import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useData } from '../DataContext';

export default function MyChildScreen() {
  const { children, resetChildrenToDemo } = useData();
  const childList = (Array.isArray(children) && children.length) ? children : [{ name: 'Sam L.', age: '4 yrs', room: 'Sunflowers', avatar: 'https://picsum.photos/seed/child1/200/200', carePlan: '', notes: '' }];
  const [selectedIndex, setSelectedIndex] = useState(0);
  useEffect(() => {
    if (selectedIndex >= childList.length) setSelectedIndex(0);
  }, [childList.length]);
  // If there are multiple children, default to showing the second child now
  useEffect(() => {
    if (childList.length > 1) setSelectedIndex(1);
  }, [childList.length]);
  const child = childList[selectedIndex];

  function shortName(name, maxLen = 18) {
    if (!name || typeof name !== 'string') return '';
    if (name.length <= maxLen) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      // single long name — truncate
      return parts[0].slice(0, maxLen - 1) + '…';
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first} ${last.charAt(0)}.`;
  }

  const openPhone = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };
  const openEmail = (email) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
      {/* Child selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {childList.map((c, i) => (
          <TouchableOpacity key={c.id || i} onPress={() => setSelectedIndex(i)} style={[styles.selectorItem, selectedIndex === i && styles.selectorActive]}>
            <Image source={{ uri: c.avatar }} style={styles.selectorAvatar} />
            <Text style={styles.selectorName}>{shortName(c.name, 12)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={() => { resetChildrenToDemo(); setSelectedIndex(1); }} style={styles.demoButton}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Load demo children</Text>
      </TouchableOpacity>
      
      <View style={styles.card}>
        <Image source={{ uri: child.avatar }} style={styles.avatar} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>{shortName(child.name, 20)}</Text>
          <Text style={styles.meta}>{child.age} • {child.room}</Text>
        </View>
      </View>

      {/* BCA therapist tile (always render; show placeholder when not assigned) */}
      <View style={[styles.card, { marginTop: 12, alignItems: 'center' }]}>
        {child.bcaTherapist ? (
          <>
            <Image source={{ uri: child.bcaTherapist.avatar }} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#eee' }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{shortName(child.bcaTherapist.name, 20)}</Text>
              <Text style={styles.meta}>{child.bcaTherapist.role}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <TouchableOpacity onPress={() => openPhone(child.bcaTherapist.phone)} style={{ paddingVertical: 6 }} accessibilityLabel="Call BCA therapist">
                <MaterialIcons name="call" size={20} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEmail(child.bcaTherapist.email)} style={{ paddingVertical: 6 }} accessibilityLabel="Email BCA therapist">
                <MaterialIcons name="email" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>BCA Therapist</Text>
            <Text style={styles.meta}>No BCA therapist assigned.</Text>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <View style={[styles.therapistBlock, { marginRight: 8 }]}>
          <Text style={styles.therapistTitle}>AM Therapist</Text>
          {child.amTherapist ? (
            <View style={styles.therapistInner}>
              <Image source={{ uri: child.amTherapist.avatar }} style={styles.therapistAvatar} />
              <View style={{ flex: 1, marginLeft: 8, alignItems: 'center' }}>
                <Text style={styles.therapistName}>{shortName(child.amTherapist.name, 18)}</Text>
                <Text style={styles.therapistRole}>{child.amTherapist.role}</Text>
                <View style={styles.amIconRow}>
                  <TouchableOpacity onPress={() => openPhone(child.amTherapist.phone)} style={styles.iconTouch} accessibilityLabel="Call AM therapist">
                    <MaterialIcons name="call" size={22} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEmail(child.amTherapist.email)} style={styles.iconTouch} accessibilityLabel="Email AM therapist">
                    <MaterialIcons name="email" size={22} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.sectionText}>No AM therapist assigned.</Text>
          )}
        </View>

        <View style={[styles.therapistBlock, { marginLeft: 8 }]}>
          <Text style={styles.therapistTitle}>PM Therapist</Text>
          {child.pmTherapist ? (
              <View style={styles.therapistInner}>
                <Image source={{ uri: child.pmTherapist.avatar }} style={styles.therapistAvatar} />
                <View style={{ flex: 1, marginLeft: 8, alignItems: 'center' }}>
                  <Text style={styles.therapistName}>{shortName(child.pmTherapist.name, 18)}</Text>
                  <Text style={styles.therapistRole}>{child.pmTherapist.role}</Text>
                  <View style={styles.amIconRow}>
                    <TouchableOpacity onPress={() => openPhone(child.pmTherapist.phone)} style={styles.iconTouch} accessibilityLabel="Call PM therapist">
                      <MaterialIcons name="call" size={22} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEmail(child.pmTherapist.email)} style={styles.iconTouch} accessibilityLabel="Email PM therapist">
                      <MaterialIcons name="email" size={22} color="#2563eb" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
          ) : (
            <Text style={styles.sectionText}>No PM therapist assigned.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Care Plan</Text>
        <Text style={styles.sectionText}>{child.carePlan || "Sam's goals: fine motor, communication prompts, and independent dressing."}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meeting with BCA</Text>
        {((child.upcoming || []).filter((u) => u.type === 'parent-aba')).length ? (
          (child.upcoming || []).filter((u) => u.type === 'parent-aba').map((u) => (
            <View key={u.id} style={{ marginBottom: 8 }}>
              <Text style={styles.sectionText}>• {u.when} — {u.title}</Text>
              {u.organizer ? (
                <Text style={[styles.sectionText, { marginTop: 4 }]}>Organizer: {u.organizer.name} • {u.organizer.phone} • {u.organizer.email}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.sectionText}>No meeting scheduled yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Text style={styles.sectionText}>{child.notes || 'No notes available.'}</Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eee' },
  name: { fontSize: 18, fontWeight: '700' },
  meta: { color: '#6b7280', marginTop: 4 },
  section: { marginTop: 12, backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  sectionText: { color: '#374151' },
  row: { flexDirection: 'row', marginTop: 12 },
  therapistBlock: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  therapistTitle: { fontWeight: '700', marginBottom: 8 },
  therapistInner: { flexDirection: 'row', alignItems: 'center' },
  therapistAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  therapistName: { fontWeight: '700' },
  therapistRole: { color: '#6b7280', fontSize: 12 },
  contactButton: { paddingVertical: 6 },
  contactText: { color: '#2563eb', fontSize: 13 },
  selectorItem: { alignItems: 'center', padding: 8, marginRight: 8, backgroundColor: '#fff', borderRadius: 8, width: 100 },
  selectorAvatar: { width: 48, height: 48, borderRadius: 24, marginBottom: 6 },
  selectorName: { fontSize: 12, textAlign: 'center' },
  selectorActive: { borderWidth: 2, borderColor: '#2563eb' },
  amIconRow: { flexDirection: 'row', marginTop: 8, justifyContent: 'center' },
  iconTouch: { marginHorizontal: 12 },
  demoButton: { backgroundColor: '#2563eb', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
});
