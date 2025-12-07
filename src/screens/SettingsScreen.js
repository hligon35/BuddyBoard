import React, { useLayoutEffect, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Switch, ScrollView } from 'react-native';
import { useAuth } from '../AuthContext';
import { BASE_URL } from '../config';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ARRIVAL_KEY = 'settings_arrival_enabled_v1';
const PUSH_KEY = 'settings_push_enabled_v1';
const PUSH_CHATS_KEY = 'settings_push_chats_v1';
const PUSH_TIMELINE_POSTS_KEY = 'settings_push_timeline_posts_v1';
const PUSH_MENTIONS_POSTS_KEY = 'settings_push_mentions_posts_v1';
const PUSH_TAGS_POSTS_KEY = 'settings_push_tags_posts_v1';
const PUSH_REPLIES_COMMENTS_KEY = 'settings_push_replies_comments_v1';
const PUSH_MENTIONS_COMMENTS_KEY = 'settings_push_mentions_comments_v1';
const PUSH_UPDATES_KEY = 'settings_push_updates_v1';
const PUSH_OTHER_KEY = 'settings_push_other_v1';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { setRole } = useAuth();
  const navigation = useNavigation();
  const [arrivalEnabled, setArrivalEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushChats, setPushChats] = useState(true);
  const [pushTimelinePosts, setPushTimelinePosts] = useState(true);
  const [pushMentionsPosts, setPushMentionsPosts] = useState(true);
  const [pushTagsPosts, setPushTagsPosts] = useState(true);
  const [pushRepliesComments, setPushRepliesComments] = useState(true);
  const [pushMentionsComments, setPushMentionsComments] = useState(true);
  const [pushUpdates, setPushUpdates] = useState(true);
  const [pushOther, setPushOther] = useState(false);

  // header buttons are provided globally by the navigator

  // not using safe-area insets here to avoid shifting content down

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const a = await AsyncStorage.getItem(ARRIVAL_KEY);
        const p = await AsyncStorage.getItem(PUSH_KEY);
        const pc = await AsyncStorage.getItem(PUSH_CHATS_KEY);
        const pt = await AsyncStorage.getItem(PUSH_TIMELINE_POSTS_KEY);
        const pmp = await AsyncStorage.getItem(PUSH_MENTIONS_POSTS_KEY);
        const ptg = await AsyncStorage.getItem(PUSH_TAGS_POSTS_KEY);
        const prc = await AsyncStorage.getItem(PUSH_REPLIES_COMMENTS_KEY);
        const pmc = await AsyncStorage.getItem(PUSH_MENTIONS_COMMENTS_KEY);
        const pu = await AsyncStorage.getItem(PUSH_UPDATES_KEY);
        const po = await AsyncStorage.getItem(PUSH_OTHER_KEY);
        if (!mounted) return;
        if (a !== null) setArrivalEnabled(a === '1');
        if (p !== null) setPushEnabled(p === '1');
        if (pc !== null) setPushChats(pc === '1');
        if (pt !== null) setPushTimelinePosts(pt === '1');
        if (pmp !== null) setPushMentionsPosts(pmp === '1');
        if (ptg !== null) setPushTagsPosts(ptg === '1');
        if (prc !== null) setPushRepliesComments(prc === '1');
        if (pmc !== null) setPushMentionsComments(pmc === '1');
        if (pu !== null) setPushUpdates(pu === '1');
        if (po !== null) setPushOther(po === '1');
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(ARRIVAL_KEY, arrivalEnabled ? '1' : '0').catch(() => {});
  }, [arrivalEnabled]);

  useEffect(() => {
    AsyncStorage.setItem(PUSH_KEY, pushEnabled ? '1' : '0').catch(() => {});
  }, [pushEnabled]);

  useEffect(() => {
    AsyncStorage.setItem(PUSH_CHATS_KEY, pushChats ? '1' : '0').catch(() => {});
  }, [pushChats]);
  useEffect(() => {
    AsyncStorage.setItem(PUSH_TIMELINE_POSTS_KEY, pushTimelinePosts ? '1' : '0').catch(() => {});
  }, [pushTimelinePosts]);
  useEffect(() => {
    AsyncStorage.setItem(PUSH_MENTIONS_POSTS_KEY, pushMentionsPosts ? '1' : '0').catch(() => {});
  }, [pushMentionsPosts]);
  useEffect(() => {
    AsyncStorage.setItem(PUSH_TAGS_POSTS_KEY, pushTagsPosts ? '1' : '0').catch(() => {});
  }, [pushTagsPosts]);
  useEffect(() => {
    AsyncStorage.setItem(PUSH_REPLIES_COMMENTS_KEY, pushRepliesComments ? '1' : '0').catch(() => {});
  }, [pushRepliesComments]);
  useEffect(() => {
    AsyncStorage.setItem(PUSH_MENTIONS_COMMENTS_KEY, pushMentionsComments ? '1' : '0').catch(() => {});
  }, [pushMentionsComments]);
  useEffect(() => {
    AsyncStorage.setItem(PUSH_UPDATES_KEY, pushUpdates ? '1' : '0').catch(() => {});
  }, [pushUpdates]);
  useEffect(() => {
    AsyncStorage.setItem(PUSH_OTHER_KEY, pushOther ? '1' : '0').catch(() => {});
  }, [pushOther]);

  const toggleArrival = () => {
    const next = !arrivalEnabled;
    if (next) {
      Alert.alert(
        'Enable Arrival Detection',
        'Arrival detection requires location permission. Please grant location access in your device settings for full functionality.',
        [{ text: 'OK', onPress: () => setArrivalEnabled(true) }]
      );
      return;
    }
    setArrivalEnabled(false);
  };

  const togglePush = () => {
    const next = !pushEnabled;
    if (next) {
      Alert.alert(
        'Enable Push Notifications',
        'Push notifications require device permission and an active push setup. Enable notifications in device settings to receive alerts.',
        [{ text: 'OK', onPress: () => setPushEnabled(true) }]
      );
      return;
    }
    setPushEnabled(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 28 }} bounces={true} alwaysBounceVertical={true} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 720, borderRadius: 14, backgroundColor: '#fff', padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, marginTop: 8 }}>
        <TouchableOpacity onPress={() => Alert.alert('Edit Profile', 'Edit profile tapped')} style={{ position: 'absolute', right: 12, top: 12, padding: 6 }}>
          <MaterialIcons name="edit" size={20} color="#374151" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={{ uri: user?.avatar || `https://i.pravatar.cc/120?u=${user?.email || 'anon'}` }}
            style={{ width: 84, height: 84, borderRadius: 42, marginRight: 16 }}
          />
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>{user?.name || 'Guest User'}</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{user?.email || 'Not signed in'}</Text>
            <Text style={{ fontSize: 14, color: '#374151', marginTop: 8 }}>{user?.phone || 'Phone: —'}</Text>
            <Text style={{ fontSize: 14, color: '#374151', marginTop: 4 }}>{user?.address || 'Address: —'}</Text>
          </View>
        </View>

        {/* Arrival Detection Section */}
        <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: '#eef2f7', paddingTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Arrival Detection</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>Use location for arrival detection</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Automatically detect within close range to help with smoother pick-ups.</Text>
            </View>
            <Switch value={arrivalEnabled} onValueChange={toggleArrival} />
          </View>
        </View>

        {/* Other Settings Section - Push Notification Groups */}
        <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: '#eef2f7', paddingTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Other Settings</Text>

          {/* Master Push Toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>Push Notifications</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Enable or disable all push notifications.</Text>
            </View>
            <Switch value={pushEnabled} onValueChange={togglePush} />
          </View>

          {/* Chats */}
          <View style={{ marginTop: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 6 }}>Chats</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14 }}>Receive chat messages</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Get notified when someone sends you a chat message.</Text>
              </View>
              <Switch value={pushChats} onValueChange={setPushChats} disabled={!pushEnabled} />
            </View>
          </View>

          {/* Timeline / Posts */}
          <View style={{ marginTop: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 6 }}>Timeline & Posts</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14 }}>New posts on timeline</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Notify for new posts added to the timeline.</Text>
              </View>
              <Switch value={pushTimelinePosts} onValueChange={setPushTimelinePosts} disabled={!pushEnabled} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14 }}>Mentions in posts</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Notify when you're mentioned in a post.</Text>
              </View>
              <Switch value={pushMentionsPosts} onValueChange={setPushMentionsPosts} disabled={!pushEnabled} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14 }}>Tags in posts</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Notify when a post is tagged for you or your child.</Text>
              </View>
              <Switch value={pushTagsPosts} onValueChange={setPushTagsPosts} disabled={!pushEnabled} />
            </View>
          </View>

          {/* Comments */}
          <View style={{ marginTop: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 6 }}>Comments</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14 }}>Replies to my comments</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Notify when someone replies to your comment.</Text>
              </View>
              <Switch value={pushRepliesComments} onValueChange={setPushRepliesComments} disabled={!pushEnabled} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14 }}>Mentions in comments</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Notify when you're mentioned in a comment.</Text>
              </View>
              <Switch value={pushMentionsComments} onValueChange={setPushMentionsComments} disabled={!pushEnabled} />
            </View>
          </View>

          {/* Updates & Reminders */}
          <View style={{ marginTop: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 6 }}>Updates & Reminders</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14 }}>Updates & reminders</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Reminders for events, schedule changes, and urgent updates.</Text>
              </View>
              <Switch value={pushUpdates} onValueChange={setPushUpdates} disabled={!pushEnabled} />
            </View>
          </View>

          {/* Other (removed content, preserving space) */}
          <View style={{ marginTop: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <View style={{ height: 72 }} />
          </View>

        </View>
        </View>
        {/* Dev-only role switcher for local testing */}
        {__DEV__ && (
          <View style={{ width: '100%', maxWidth: 720, marginTop: 18 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 8 }}>Developer: switch role</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => { setRole && setRole('parent'); Alert.alert('Role changed', 'Switched to parent (dev)'); }} style={{ flex: 1, marginRight: 6, backgroundColor: '#e5e7eb', padding: 10, borderRadius: 8, alignItems: 'center' }}>
                <Text>Parent</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setRole && setRole('therapist'); Alert.alert('Role changed', 'Switched to therapist (dev)'); }} style={{ flex: 1, marginHorizontal: 6, backgroundColor: '#e5e7eb', padding: 10, borderRadius: 8, alignItems: 'center' }}>
                <Text>Therapist</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setRole && setRole('admin'); Alert.alert('Role changed', 'Switched to admin (dev)'); }} style={{ flex: 1, marginLeft: 6, backgroundColor: '#e5e7eb', padding: 10, borderRadius: 8, alignItems: 'center' }}>
                <Text>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
