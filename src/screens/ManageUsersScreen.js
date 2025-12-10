import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Switch } from 'react-native';
import { useData } from '../DataContext';
// header provided by ScreenWrapper
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';

export default function ManageUsersScreen(){
  const navigation = useNavigation();
  const { children = [], setChildren } = useData();

  function toggleActive(id, value) {
    const next = (children || []).map((c) => (c.id === id ? { ...c, active: value } : c));
    try { setChildren(next); } catch (e) { console.warn('toggleActive failed', e?.message || e); }
  }

  function renderItem({ item }){
    const active = item.active === undefined ? true : !!item.active;
    return (
      <View style={styles.row}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => navigation.navigate('ChildDetail', { childId: item.id })}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.age} • {item.room}</Text>
          </View>
        </TouchableOpacity>
        <Switch value={active} onValueChange={(v) => toggleActive(item.id, v)} />
      </View>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <FlatList
        data={children || []}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={<View style={{ padding: 16 }}><Text style={{ color: '#666' }}>No users available</Text></View>}
        contentContainerStyle={{ padding: 8 }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ddd' },
  name: { fontWeight: '700' },
  meta: { color: '#6b7280', marginTop: 4 }
});