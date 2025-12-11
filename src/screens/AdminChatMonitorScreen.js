import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useData } from '../DataContext';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AdminChatMonitorScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { messages = [], parents = [], therapists = [] } = useData();
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const { initialUserId } = route.params || {};

  const users = useMemo(() => {
    const combined = [...(parents || []), ...(therapists || [])];
    return combined.map(u => ({ id: u.id || u.name, name: u.firstName ? `${u.firstName} ${u.lastName}` : (u.name || ''), raw: u }));
  }, [parents, therapists]);

  const filteredUsers = useMemo(() => {
    const q = (query || '').toString().toLowerCase().trim();
    if (!q) return users;
    return users.filter(u => (u.name || '').toLowerCase().includes(q) || `${u.id}`.toLowerCase().includes(q));
  }, [users, query]);

  useEffect(() => {
    if (initialUserId && users && users.length) {
      const found = users.find(u => `${u.id}` === `${initialUserId}` || `${u.id}`.toLowerCase() === `${initialUserId}`.toLowerCase());
      if (found) setSelectedUser(found);
    }
  }, [initialUserId, users]);

  const threadsForSelected = useMemo(() => {
    if (!selectedUser) return [];
    const uid = `${selectedUser.id}`.toLowerCase();
    const threads = (messages || []).reduce((acc, m) => {
      const key = m.threadId || m.threadId === 0 ? m.threadId : m.threadId || m.id || m.contactId || 'default';
      acc[key] = acc[key] || { id: key, last: m, participants: new Set() };
      if (m.sender) acc[key].participants.add((m.sender.id || m.sender.name || '').toString());
      if (m.to && Array.isArray(m.to)) m.to.forEach(t => acc[key].participants.add((t.id || t.name || '').toString()));
      if (new Date(m.createdAt) > new Date(acc[key].last.createdAt)) acc[key].last = m;
      return acc;
    }, {});
    const list = Object.values(threads).map(t => ({ id: t.id, last: t.last, participants: Array.from(t.participants) }));
    return list.filter(l => (l.participants || []).some(p => `${p}`.toLowerCase().includes(uid)));
  }, [messages, selectedUser]);

  return (
    <ScreenWrapper>
      <View style={{ padding: 12 }}>
        <Text style={{ fontWeight: '700', fontSize: 16 }}>Chat Monitor</Text>
        <Text style={{ color: '#6b7280', marginTop: 6 }}>Search users (parents or therapists) to view their conversations.</Text>
        <View style={{ marginTop: 12 }}>
          <TextInput placeholder="Search users" value={query} onChangeText={setQuery} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 8, borderRadius: 8 }} />
        </View>

        {!selectedUser ? (
          <FlatList
            data={filteredUsers}
            keyExtractor={(i) => `${i.id}`}
            style={{ marginTop: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedUser(item)} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eef2f7' }}>
                <Text style={{ fontWeight: '700' }}>{item.name || item.id}</Text>
                <Text style={{ color: '#6b7280', marginTop: 4 }}>{(messages || []).filter(m => ((m.sender && (`${m.sender.id}` === `${item.id}`)) || (m.to || []).some(t => `${t.id}` === `${item.id}`))).length} messages</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>No users found.</Text></View>}
          />
        ) : (
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity onPress={() => setSelectedUser(null)} style={{ marginBottom: 12 }}><Text style={{ color: '#2563eb' }}>← Back to users</Text></TouchableOpacity>
            <Text style={{ fontWeight: '700' }}>{selectedUser.name}</Text>
            <Text style={{ color: '#6b7280', marginTop: 6 }}>Conversations involving {selectedUser.name}:</Text>
            <FlatList
              data={threadsForSelected}
              keyExtractor={(i) => `${i.id}`}
              style={{ marginTop: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => navigation.navigate('ChatThread', { threadId: item.id })} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eef2f7' }}>
                  <Text style={{ fontWeight: '700' }}>{(item.participants || []).slice(0,3).join(', ')}</Text>
                  <Text style={{ color: '#6b7280', marginTop: 6 }}>{item.last?.body}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>No conversations found for this user.</Text></View>}
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
