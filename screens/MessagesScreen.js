import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { DataContext } from '../src/DataContext';

export default function MessagesScreen({ navigation }){
  const { messages } = useContext(DataContext);

  function openMessage(m){
    navigation.navigate('MessageDetail', { messageId: m.id });
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Messages</Text>
        <Button title="Compose" onPress={() => navigation.navigate('ComposeMessage')} />
      </View>
      <FlatList data={messages} keyExtractor={i => i.id} renderItem={({item}) => (
        <TouchableOpacity style={styles.item} onPress={() => openMessage(item)}>
          <Text style={[styles.itemTitle, item.read ? styles.read : null]}>{item.title}</Text>
          <Text style={styles.itemMeta}>{item.sender} • {new Date(item.date).toLocaleString()}</Text>
        </TouchableOpacity>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemTitle: { fontSize: 16 },
  itemMeta: { fontSize: 12, color: '#666' },
  read: { color: '#999' }
});
