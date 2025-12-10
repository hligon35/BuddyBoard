import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../DataContext';
import { MaterialIcons } from '@expo/vector-icons';
// header provided by ScreenWrapper
import { ScreenWrapper } from '../components/ScreenWrapper';

function PostRow({ item, onRemove }) {
  return (
    <View style={styles.postRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title || 'Untitled'}</Text>
        <Text style={styles.meta}>{item.author?.name || 'Unknown'} • {new Date(item.createdAt || Date.now()).toLocaleString()}</Text>
        {item.body ? <Text numberOfLines={2} style={styles.bodyText}>{item.body}</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.iconBtn}>
          <MaterialIcons name="delete" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ModeratePostsScreen(){
  const navigation = useNavigation();
  const { posts = [], deletePost } = useData();

  function handleRemove(id) {
    Alert.alert('Remove post', 'Are you sure you want to remove this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deletePost(id) }
    ]);
  }

  return (
    <ScreenWrapper style={styles.container}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={posts || []}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <PostRow item={item} onRemove={handleRemove} />}
          ListEmptyComponent={<View style={styles.body}><Text style={styles.p}>No posts available</Text></View>}
          contentContainerStyle={{ padding: 12 }}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 16 },
  p: { color: '#374151' },
  postRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontWeight: '700' },
  meta: { color: '#6b7280', marginTop: 4 },
  bodyText: { color: '#374151', marginTop: 6 },
  actions: { marginLeft: 12 },
  iconBtn: { padding: 8 }
});