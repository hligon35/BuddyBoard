import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Animated, Linking, Alert, Switch, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { pravatarUriFor, setIdVisibilityEnabled, initIdVisibilityFromStorage } from '../utils/idVisibility';
import { useData } from '../DataContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BUSINESS_ADDR_KEY = 'business_address_v1';
const ORG_ARRIVAL_KEY = 'settings_arrival_org_enabled_v1';

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

  const [orgAddress, setOrgAddress] = useState('');
  const [orgLat, setOrgLat] = useState('');
  const [orgLng, setOrgLng] = useState('');
  const [dropZoneMiles, setDropZoneMiles] = useState('1');
  const [orgArrivalEnabled, setOrgArrivalEnabled] = useState(true);

  useEffect(() => {
    let mounted = true;
    initIdVisibilityFromStorage().then((v) => { if (mounted) setShowIds(!!v); }).catch(() => {});
    (async () => {
      try {
        const orgRaw = await AsyncStorage.getItem(ORG_ARRIVAL_KEY);
        if (!mounted) return;
        // default to enabled when not set
        setOrgArrivalEnabled(orgRaw !== '0');

        const raw = await AsyncStorage.getItem(BUSINESS_ADDR_KEY);
        if (!mounted) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (parsed.address) setOrgAddress(String(parsed.address));
            if (typeof parsed.lat === 'number') setOrgLat(String(parsed.lat));
            if (typeof parsed.lng === 'number') setOrgLng(String(parsed.lng));
            if (typeof parsed.dropZoneMiles === 'number') setDropZoneMiles(String(parsed.dropZoneMiles));
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleShowIds = () => { const next = !showIds; setShowIds(next); setIdVisibilityEnabled(next); };

  async function toggleOrgArrival() {
    const next = !orgArrivalEnabled;
    setOrgArrivalEnabled(next);
    try {
      await AsyncStorage.setItem(ORG_ARRIVAL_KEY, next ? '1' : '0');
    } catch (e) {
      // revert on failure
      setOrgArrivalEnabled(!next);
      Alert.alert('Error', 'Could not update organization arrival detection setting.');
    }
  }

  async function saveArrivalControls() {
    const latNum = Number(orgLat);
    const lngNum = Number(orgLng);
    const milesNum = Number(dropZoneMiles);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      Alert.alert('Missing location', 'Tap “Use my current location” to set the organization location.');
      return;
    }
    if (!Number.isFinite(milesNum) || milesNum <= 0) {
      Alert.alert('Invalid Drop Zone', 'Drop Zone must be a number greater than 0 (miles).');
      return;
    }

    const obj = {
      address: orgAddress || `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
      lat: latNum,
      lng: lngNum,
      dropZoneMiles: milesNum,
    };
    try {
      await AsyncStorage.setItem(BUSINESS_ADDR_KEY, JSON.stringify(obj));
      Alert.alert('Saved', 'Arrival detection controls updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not save arrival detection controls.');
    }
  }

  async function useCurrentLocationForOrg() {
    try {
      const Location = require('expo-location');
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Location required', 'Please grant location permission to set the organization location.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setOrgLat(String(pos.coords.latitude));
      setOrgLng(String(pos.coords.longitude));
      setOrgAddress(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
    } catch (e) {
      console.warn('admin arrival controls: location failed', e?.message || e);
      Alert.alert('Location failed', 'Could not get current location.');
    }
  }

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
              <Text style={{ color: '#6b7280', marginTop: 4 }}>Tap to view</Text>
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
                  <Text style={{ color: '#6b7280', fontSize: 12, textAlign: 'center' }}>No students enrolled yet.</Text>
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
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Account IDs</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 14 }}>Show internal account ID numbers</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Toggle to show internal account ID numbers in profiles.</Text>
            </View>
            <Switch value={showIds} onValueChange={toggleShowIds} />
          </View>
        </View>

        {/* Arrival Detection Controls (admin) */}
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#eef2f7', paddingTop: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Arrival Detection Controls</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            Set the organization location and the “Drop Zone” (Radius in miles, used to determine when a parent has arrived.)
          </Text>

          <View style={styles.formCard}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.toggleTitle}>Arrival detection enabled</Text>
                <Text style={styles.toggleHint}>If turned off, arrival detection does not run for anyone (even if enabled in their settings).</Text>
              </View>
              <Switch value={orgArrivalEnabled} onValueChange={toggleOrgArrival} />
            </View>

            <Text style={styles.fieldLabel}>Organization Address</Text>
            <TextInput
              value={orgAddress}
              editable={false}
              placeholder="Has not been set"
              style={styles.input}
              autoCapitalize="words"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity onPress={useCurrentLocationForOrg} style={[styles.secondaryBtn, { flex: 1, marginTop: 0, marginRight: 10 }]}>
                <MaterialIcons name="my-location" size={18} color="#2563eb" />
                <Text style={styles.secondaryBtnText}>Use my current location</Text>
              </TouchableOpacity>

              <View style={{ width: 140 }}>
                <Text style={[styles.fieldLabel, { marginTop: 0 }]}>Drop Zone (miles)</Text>
                <TextInput
                  value={dropZoneMiles}
                  onChangeText={setDropZoneMiles}
                  placeholder="1"
                  style={styles.input}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <TouchableOpacity onPress={saveArrivalControls} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Save</Text>
            </TouchableOpacity>
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
  ,
  formCard: { marginTop: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eef2f7', backgroundColor: '#fff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  toggleHint: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#111827', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  secondaryBtn: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e6eef8', backgroundColor: '#f1f5f9' },
  secondaryBtnText: { marginLeft: 8, color: '#2563eb', fontWeight: '700' },
  primaryBtn: { marginTop: 12, backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});
