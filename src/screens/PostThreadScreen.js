import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';

export default function PostThreadScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { postId } = route.params || {};
  const { user } = useAuth();
  const { posts, comment, replyToComment, reactToComment } = useData();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [openReplyFor, setOpenReplyFor] = useState(null);
  const [replyTextMap, setReplyTextMap] = useState({});
  const [showEmojiFor, setShowEmojiFor] = useState(null);

  const post = useMemo(() => posts.find((p) => p.id === postId) || null, [posts, postId]);

  async function handleSend() {
    if (!text || !text.trim()) return;
    setSending(true);
    try {
      await comment(postId, { body: text.trim(), author: { id: user?.id, name: user?.name } });
      setText('');
    } catch (e) {
      console.warn('comment send failed', e?.message || e);
    } finally {
      setSending(false);
    }
  }

  if (!post) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Post not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <View style={styles.postCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={{ uri: post.author?.avatar || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.author}>{post.author?.name || 'Anonymous'}</Text>
            <Text style={styles.time}>{new Date(post.createdAt).toLocaleString()}</Text>
          </View>
        </View>
        {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
        {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
        {post.image ? <Image source={{ uri: post.image }} style={styles.image} /> : null}
      </View>

      <FlatList
        data={post.comments || []}
        keyExtractor={(c) => c.id || `${c.createdAt || Math.random()}`}
        renderItem={({ item }) => (
          <View>
            <View style={styles.commentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.commentAuthor}>{item.author?.name || 'Anonymous'}</Text>
                <Text style={styles.commentBody}>{item.body}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
                  {(item.reactions && Object.keys(item.reactions).length) ? (
                    <View style={{ flexDirection: 'row', marginRight: 12 }}>
                      {Object.entries(item.reactions).map(([emo, count]) => (
                        <Text key={emo} style={{ marginRight: 8 }}>{emo} {count}</Text>
                      ))}
                    </View>
                  ) : null}
                  <TouchableOpacity onPress={() => setOpenReplyFor(openReplyFor === item.id ? null : item.id)} style={{ marginRight: 12 }}>
                    <Text style={{ color: '#0066FF' }}>Reply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowEmojiFor(showEmojiFor === item.id ? null : item.id)}>
                    <Text style={{ color: '#0066FF' }}>React</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Emoji picker row */}
            {showEmojiFor === item.id ? (
              <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6 }}>
                {['👍','❤️','😂','😮'].map((emo) => (
                  <TouchableOpacity key={emo} onPress={() => { reactToComment(postId, item.id, emo); setShowEmojiFor(null); }} style={{ marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>{emo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Replies */}
            {item.replies && item.replies.length ? (
              <View style={{ paddingLeft: 24 }}>
                {item.replies.map((r) => (
                  <View key={r.id} style={[styles.commentRow, { backgroundColor: '#fbfbfb' }]}>
                    <Text style={styles.commentAuthor}>{r.author?.name || 'Anonymous'}</Text>
                    <Text style={styles.commentBody}>{r.body}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Reply composer under comment */}
            {openReplyFor === item.id ? (
              <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
                <TextInput
                  placeholder="Write a reply..."
                  value={replyTextMap[item.id] || ''}
                  onChangeText={(t) => setReplyTextMap((m) => ({ ...m, [item.id]: t }))}
                  style={{ flex: 1, borderWidth: 1, borderColor: '#e6e7ea', borderRadius: 8, padding: 8, marginRight: 8 }}
                />
                <TouchableOpacity onPress={async () => {
                  const t = (replyTextMap[item.id] || '').trim();
                  if (!t) return;
                  try {
                    await replyToComment(postId, item.id, { body: t, author: { id: user?.id, name: user?.name } });
                    setReplyTextMap((m) => ({ ...m, [item.id]: '' }));
                    setOpenReplyFor(null);
                  } catch (e) { console.warn(e); }
                }} style={{ backgroundColor: '#0066FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text style={{ padding: 12, color: '#6b7280' }}>No comments yet — be the first to reply.</Text>}
      />

      <View style={styles.composer}>
        <TextInput placeholder="Write a comment..." value={text} onChangeText={setText} style={styles.input} multiline />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending || !text.trim()}>
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postCard: { padding: 12, backgroundColor: '#fff', margin: 12, borderRadius: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
  author: { fontWeight: '700' },
  time: { color: '#6b7280', fontSize: 12 },
  title: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  body: { marginTop: 6, color: '#374151' },
  image: { height: 180, marginTop: 8, borderRadius: 6 },
  commentRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  commentAuthor: { fontWeight: '700', marginBottom: 4 },
  commentBody: { color: '#374151' },
  composer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#e6e7ea', borderRadius: 8, padding: 8, marginRight: 8, minHeight: 40 },
  sendBtn: { backgroundColor: '#0066FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
});
