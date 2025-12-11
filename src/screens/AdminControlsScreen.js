import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Animated, Linking, Alert, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { pravatarUriFor, setIdVisibilityEnabled, initIdVisibilityFromStorage } from '../utils/idVisibility';
import { useData } from '../DataContext';
import { useNavigation } from '@react-navigation/native';

export default function AdminControlsScreen() {
  const navigation = useNavigation();
  const { posts, messages, children, parents = [], therapists = [], resetChildrenToDemo, urgentMemos = [] } = useData();
  const [showStudentsPreview, setShowStudentsPreview] = useState(false);
  const [showFacultyPreview, setShowFacultyPreview] = useState(false);
  const [showParentsPreview, setShowParentsPreview] = useState(false);

  const therapistCount = useMemo(() => {
    const set = new Set();
    (children || []).forEach(c => {
      if (c.amTherapist && c.amTherapist.id) set.add(c.amTherapist.id);
      if (c.pmTherapist && c.pmTherapist.id) set.add(c.pmTherapist.id);
      if (c.bcaTherapist && c.bcaTherapist.id) set.add(c.bcaTherapist.id);
    });
    return set.size;
  }, [children]);

  const facultyCount = useMemo(() => {
    const map = new Map();
    (therapists || []).forEach((f) => { if (f && f.id) map.set(f.id, f); });
    return map.size;
  }, [therapists]);

  // Navigation helpers
  const openMemos = () => navigation.navigate('AdminMemos');
  const openAlerts = () => navigation.navigate('AdminAlerts');
  // open community moderation screen
  const openCommunity = () => navigation.navigate('ModeratePosts');
  // open admin chat monitor (admin-only chat oversight)
  const openChats = () => navigation.navigate('AdminChatMonitor');
  const openImport = () => {
    try {
      navigation.navigate('ImportData');
    } catch (e) {
      Alert.alert('Import', 'Import screen is not available.');
    }
  };
  const openStudentDirectory = () => navigation.navigate('StudentDirectory');
  const openFacultyDirectory = () => navigation.navigate('FacultyDirectory');
  const openParentDirectory = () => navigation.navigate('ParentDirectory');

  const pendingAlertCount = (urgentMemos || []).filter((m) => !m.status || m.status === 'pending').length;
  const [showIds, setShowIds] = useState(false);

  useEffect(() => {
    let mounted = true;
    initIdVisibilityFromStorage().then((v) => { if (mounted) setShowIds(!!v); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const toggleShowIds = () => { const next = !showIds; setShowIds(next); setIdVisibilityEnabled(next); };

  function DirectoryBanner({ label, onOpen, onToggle, open, childrenPreview, count, rightAction }) {
    return (
      <View style={{ marginTop: 12 }}>
        <TouchableOpacity style={styles.banner} activeOpacity={0.85} onPress={onToggle}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700' }}>{label}</Text>
                {typeof count === 'number' ? (
                  <View style={styles.dirCount}><Text style={{ color: '#111827', fontWeight: '700', fontSize: 12 }}>{count}</Text></View>
                ) : null}
              </View>
              <Text style={{ color: '#6b7280', marginTop: 4 }}>Tap to preview</Text>
            </View>
            <TouchableOpacity onPress={onOpen} style={styles.openIcon} accessibilityLabel={`Open ${label} list`}>
              <MaterialIcons name="open-in-new" size={18} color="#2563eb" />
            </TouchableOpacity>
            <View style={{ marginLeft: 8 }}>
              <TouchableOpacity onPress={onToggle} style={styles.previewIcon} accessibilityLabel={`Preview ${label}`}>
                <MaterialIcons name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={open ? '#2563eb' : '#6b7280'} />
              </TouchableOpacity>
            </View>
            {rightAction ? (
              <View style={{ marginLeft: 8 }}>{rightAction}</View>
            ) : null}
          </View>
        </TouchableOpacity>
        {open ? (
          <View style={{ marginTop: 8 }}>
            {childrenPreview}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <ScreenWrapper bannerShowBack={false} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        

        {/* Communications section removed (Alerts retained below Directory) */}

        {/* Quick Actions (Export + Alerts) */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
          <TouchableOpacity onPress={() => navigation.navigate('ExportData')} style={{ marginRight: 12, alignItems: 'center' }} accessibilityLabel="Export Data">
            <View style={[styles.iconTileBtn, { width: 44, height: 44, borderRadius: 10 }]}>
              <MaterialIcons name="file-download" size={20} color="#fff" />
            </View>
            <Text style={{ fontSize: 12, marginTop: 6 }}>Export</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openImport} style={{ marginRight: 12, alignItems: 'center' }} accessibilityLabel="Import Data">
            <View style={[styles.iconTileBtn, { width: 44, height: 44, borderRadius: 10 }]}>
              <MaterialIcons name="file-upload" size={20} color="#fff" />
            </View>
            <Text style={{ fontSize: 12, marginTop: 6 }}>Import</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openAlerts} style={{ alignItems: 'center' }} accessibilityLabel="Open Alerts">
            <View style={[styles.iconTileBtn, { width: 44, height: 44, borderRadius: 10 }]}>
              <MaterialIcons name="report" size={20} color="#fff" />
              {pendingAlertCount > 0 ? (
                <View style={[styles.countBadge, { width: 18, height: 18, borderRadius: 9, top: -6, right: -6 }]}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 10 }}>{pendingAlertCount}</Text></View>
              ) : null}
            </View>
            <Text style={{ fontSize: 12, marginTop: 6 }}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Directory Section */}
        <Text style={{ marginTop: 18, fontWeight: '700' }}>Directory</Text>

        <DirectoryBanner
          label="Students"
          count={(children || []).length}
          onOpen={openStudentDirectory}
          onToggle={() => setShowStudentsPreview((s) => !s)}
          open={showStudentsPreview}
          childrenPreview={(
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 8 }}>
                {(children || []).slice(0, 8).map((c) => (
                <TouchableOpacity key={c.id} style={styles.previewCard} onPress={() => navigation.navigate('ChildDetail', { childId: c.id })}>
                  <Image source={{ uri: (c?.avatar && !String(c.avatar).includes('pravatar.cc')) ? c.avatar : pravatarUriFor(c, 64) }} style={styles.previewAvatar} />
                  <Text numberOfLines={1} style={styles.previewName}>{c.name}</Text>
                  <Text numberOfLines={1} style={styles.previewMeta}>{c.age}</Text>
                </TouchableOpacity>
              ))}
              {!(children || []).length ? (
                <View style={[styles.previewCard, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#6b7280', fontSize: 12, textAlign: 'center' }}>No students. Enable the developer seed toggle to populate demo data.</Text>
                </View>
              ) : null}
            </ScrollView>
          )}
        />

        <DirectoryBanner
          label="Faculty"
          count={facultyCount}
          onOpen={openFacultyDirectory}
          onToggle={() => setShowFacultyPreview((s) => !s)}
          open={showFacultyPreview}
          childrenPreview={(
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 8 }}>
              {(therapists || []).slice(0, 12).map((f) => (
                <TouchableOpacity key={f.id} style={styles.previewCard} onPress={() => navigation.navigate('FacultyDetail', { facultyId: f.id })}>
                  <Image source={{ uri: (f?.avatar && !String(f.avatar).includes('pravatar.cc')) ? f.avatar : pravatarUriFor(f, 64) }} style={styles.previewAvatar} />
                  <Text numberOfLines={1} style={styles.previewName}>{f.name || (f.firstName ? `${f.firstName} ${f.lastName}` : (f.role || 'Staff'))}</Text>
                  <View style={styles.previewIconRow}>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => { if (f.phone) { try { Linking.openURL(`tel:${f.phone}`); } catch (e) {} } else { Alert.alert('No phone', 'No phone number available for this staff member.'); } }} style={styles.previewIconTouch} accessibilityLabel={`Call ${f.name}`}>
                      <MaterialIcons name="call" size={16} color={f.phone ? '#2563eb' : '#9ca3af'} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => { if (f.email) { try { Linking.openURL(`mailto:${f.email}`); } catch (e) {} } else { Alert.alert('No email', 'No email address available for this staff member.'); } }} style={styles.previewIconTouch} accessibilityLabel={`Email ${f.name}`}>
                      <MaterialIcons name="email" size={16} color={f.email ? '#2563eb' : '#9ca3af'} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        />

        

        <DirectoryBanner
          label="Parents"
          count={(parents || []).length}
          onOpen={openParentDirectory}
          onToggle={() => setShowParentsPreview((s) => !s)}
          open={showParentsPreview}
          childrenPreview={(
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 8 }}>
              {(parents || []).slice(0, 12).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.previewCard}
                  onPress={() => {
                    try {
                      if (navigation && navigation.push) navigation.push('ParentDetail', { parentId: p.id });
                      else navigation.navigate('ParentDetail', { parentId: p.id });
                    } catch (e) {
                      try { navigation.navigate('ParentDetail', { parentId: p.id }); } catch (e2) { console.warn(e2); }
                    }
                  }}
                >
                  <Image source={{ uri: (p?.avatar && !String(p.avatar).includes('pravatar.cc')) ? p.avatar : pravatarUriFor(p, 64) }} style={styles.previewAvatar} />
                  <Text numberOfLines={1} style={styles.previewName}>{p.firstName ? `${p.firstName} ${p.lastName}` : p.name}</Text>
                  <View style={styles.previewIconRow}>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => { if (p.phone) { try { Linking.openURL(`tel:${p.phone}`); } catch (e) {} } else { Alert.alert('No phone', 'No phone number available for this parent.'); } }} style={styles.previewIconTouch} accessibilityLabel={`Call ${p.firstName || p.name}`}>
                      <MaterialIcons name="call" size={16} color={p.phone ? '#2563eb' : '#9ca3af'} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => { if (p.email) { try { Linking.openURL(`mailto:${p.email}`); } catch (e) {} } else { Alert.alert('No email', 'No email address available for this parent.'); } }} style={styles.previewIconTouch} accessibilityLabel={`Email ${p.firstName || p.name}`}>
                      <MaterialIcons name="email" size={16} color={p.email ? '#2563eb' : '#9ca3af'} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        />

        {/* IDs (admin) - moved below Directory */}
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#eef2f7', paddingTop: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>IDs</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 14 }}>Show internal IDs</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Toggle to show internal ID strings in profiles (debug only).</Text>
            </View>
            <Switch value={showIds} onValueChange={toggleShowIds} />
          </View>
        </View>

        {/* Permissions & Privacy section removed per request */}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  paragraph: { marginTop: 8, color: '#374151' },
  btn: { marginTop: 12, backgroundColor: '#0066FF', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' }
  ,
  tile: { backgroundColor: '#eef2ff', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginRight: 8, minWidth: 140, alignItems: 'center' },
  tileText: { fontWeight: '700', color: '#1f2937' },
  previewCard: { width: 110, padding: 8, marginRight: 8, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#eef2f7' },
  previewAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eee' },
  previewName: { marginTop: 8, fontWeight: '700', fontSize: 13 },
  previewMeta: { color: '#6b7280', fontSize: 12 },
  previewIconRow: { flexDirection: 'row', marginTop: 8, justifyContent: 'center', alignItems: 'center' },
  previewIconTouch: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e6eef8',
    // subtle shadow / elevation to feel like a push button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#f1f5f9'
  },
  iconTile: { flex: 1, alignItems: 'center', minWidth: 72, paddingHorizontal: 6 },
  iconTileBtn: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3, position: 'relative' },
  iconTileLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  countBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#eef2f7' },
  bannerBtn: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 12 },
  openIcon: { paddingHorizontal: 8, paddingVertical: 6 },
  previewIcon: { paddingHorizontal: 8, paddingVertical: 6 },
  dirCount: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 8 }
});
