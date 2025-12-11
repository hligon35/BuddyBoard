import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useData } from '../DataContext';
import { useAuth } from '../AuthContext';
import { pravatarUriFor, formatIdForDisplay } from '../utils/idVisibility';

export default function MyClassScreen() {
  const { children = [], therapists = [], parents = [] } = useData();
  const { user } = useAuth();
  const role = (user && user.role) ? (user.role || '').toString().toLowerCase() : 'parent';
  const uid = user?.id;

  const isBCBA = (user && (user.role || '').toString().toLowerCase().includes('bcba'));

  const amStudents = useMemo(() => (children || []).filter(c => c.amTherapist && c.amTherapist.id === uid), [children, uid]);
  const pmStudents = useMemo(() => (children || []).filter(c => c.pmTherapist && c.pmTherapist.id === uid), [children, uid]);

  const abasManaged = useMemo(() => {
    if (!isBCBA) return [];
    return (therapists || []).filter(t => t && t.supervisedBy === uid);
  }, [therapists, uid, isBCBA]);

  const studentsForAba = (abaId) => (children || []).filter(c => (c.amTherapist && c.amTherapist.id === abaId) || (c.pmTherapist && c.pmTherapist.id === abaId));

  const getDisplayName = (f) => {
    if (!f) return 'Staff';
    if (f.name && !f.name.toLowerCase().startsWith('therapist')) return f.name;
    if (f.firstName || f.lastName) return `${f.firstName || ''} ${f.lastName || ''}`.trim();
    return f.name || f.role || 'Staff';
  };

  const resolveParents = (student) => {
    const list = student?.parents || [];
    return list.map((p) => {
      if (!p) return null;
      // p may be an object or id string
      if (typeof p === 'object' && p.id) return (parents || []).find(pp => pp.id === p.id) || p;
      if (typeof p === 'string') return (parents || []).find(pp => pp.id === p) || { id: p, name: p };
      return p;
    }).filter(Boolean);
  };

  return (
    <ScreenWrapper bannerShowBack={false} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header similar to Faculty profile (no action icons) */}
        <View style={styles.header}>
          {(() => {
            const avatarUri = (user && user.avatar && !String(user.avatar).includes('pravatar.cc')) ? user.avatar : pravatarUriFor(user, 120);
            return <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />;
          })()}
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.name}>{getDisplayName(user)}</Text>
            <Text style={styles.role}>{user?.role || ''}</Text>
            <Text style={styles.meta}>{formatIdForDisplay(user?.id, { allow: true })}</Text>
          </View>
        </View>

        {isBCBA ? (
          <>
            <Text style={styles.pageHeader}>My Team</Text>
            {(abasManaged || []).length ? (abasManaged.map((aba) => (
              <View key={aba.id} style={styles.card}>
                <View style={styles.row}>
                  <Image source={{ uri: aba.avatar || pravatarUriFor(aba, 64) }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{aba.name}</Text>
                    <Text style={styles.meta}>{aba.role || 'ABA'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '700' }}>{studentsForAba(aba.id).length}</Text>
                    <Text style={{ color: '#6b7280' }}>students</Text>
                  </View>
                </View>
                {(studentsForAba(aba.id) || []).map(s => (
                  <View key={s.id} style={styles.subRow}>
                    <Text style={styles.subName}>{s.name}</Text>
                    <Text style={styles.subMeta}>{s.age} • {s.room}</Text>
                    <View style={{ marginTop: 6 }}>
                      <Text style={{ color: '#6b7280', fontSize: 13 }}>Parents:</Text>
                      {resolveParents(s).map(p => (<Text key={p.id || p.name} style={{ fontSize: 13 }}>{p.name || String(p)}</Text>))}
                      {s.bcaTherapist ? <Text style={{ marginTop: 6, fontSize: 13, color: '#6b7280' }}>BCBA: {s.bcaTherapist.name}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            ))) : <Text style={styles.paragraph}>You do not currently manage any ABAs.</Text>}
          </>
        ) : (
          <>
            <Text style={styles.pageHeader}>My Class</Text>
            <Text style={styles.sectionTitle}>AM Students</Text>
            {(amStudents || []).length ? amStudents.map(s => (
              <View key={s.id} style={styles.cardSmall}>
                <View style={styles.rowSmall}>
                  <Image source={{ uri: s.avatar }} style={styles.tinyAvatar} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.nameSmall}>{s.name}</Text>
                    <Text style={styles.metaSmall}>{s.age} • {s.room}</Text>
                    <Text style={{ color: '#6b7280', marginTop: 6, fontSize: 13 }}>Parents: {resolveParents(s).map(p => p.name || String(p)).join(', ')}</Text>
                    {s.bcaTherapist ? <Text style={{ color: '#6b7280', marginTop: 4 }}>BCBA: {s.bcaTherapist.name}</Text> : null}
                  </View>
                </View>
              </View>
            )) : <Text style={styles.paragraph}>No AM students assigned.</Text>}

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>PM Students</Text>
            {(pmStudents || []).length ? pmStudents.map(s => (
              <View key={s.id} style={styles.cardSmall}>
                <View style={styles.rowSmall}>
                  <Image source={{ uri: s.avatar }} style={styles.tinyAvatar} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.nameSmall}>{s.name}</Text>
                    <Text style={styles.metaSmall}>{s.age} • {s.room}</Text>
                    <Text style={{ color: '#6b7280', marginTop: 6, fontSize: 13 }}>Parents: {resolveParents(s).map(p => p.name || String(p)).join(', ')}</Text>
                    {s.bcaTherapist ? <Text style={{ color: '#6b7280', marginTop: 4 }}>BCBA: {s.bcaTherapist.name}</Text> : null}
                  </View>
                </View>
              </View>
            )) : <Text style={styles.paragraph}>No PM students assigned.</Text>}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  pageHeader: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerAvatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#eee' },
  role: { color: '#6b7280', marginTop: 4 },
  meta: { color: '#374151', marginTop: 6, fontSize: 13, fontWeight: '700', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  sectionTitle: { marginTop: 8, fontWeight: '700' },
  paragraph: { marginTop: 8, color: '#374151' },
  card: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eef2f7', backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eee' },
  name: { fontSize: 20, fontWeight: '700' },
  subRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  subName: { fontWeight: '700' },
  subMeta: { color: '#6b7280' },
  cardSmall: { marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eef2f7', backgroundColor: '#fff' },
  rowSmall: { flexDirection: 'row', alignItems: 'center' },
  tinyAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  nameSmall: { fontWeight: '700' },
  metaSmall: { color: '#6b7280' },
});
