import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, Alert, TouchableWithoutFeedback, Linking, Platform, Share, RefreshControl } from 'react-native';
import { ScreenWrapper, CenteredContainer } from '../components/ScreenWrapper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../DataContext';
import * as Api from '../Api';

function detectFirstUrl(text) {
  const re = /(https?:\/\/[^\s]+)/i;
  const m = text && text.match(re);
  return m ? m[0] : null;
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

function PostCard({ post, onLike, onComment, onShare }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const url = detectFirstUrl(post.body || '');
    let mounted = true;
    if (url) {
      Api.getLinkPreview(url).then((d) => { if (mounted) setPreview(d); }).catch(() => {});
    }
    return () => { mounted = false; };
  }, [post.body]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: post.author?.avatar || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{post.author?.name || 'Anonymous'}</Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>

      {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}

      {post.image ? <Image source={{ uri: post.image }} style={styles.image} resizeMode="cover" /> : null}

      {preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>{preview.title}</Text>
          <Text style={styles.previewDesc}>{preview.description}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onLike(post)} style={styles.actionBtn}>
          <MaterialCommunityIcons name="thumb-up-outline" size={18} color="#444" />
          <Text style={styles.actionText}> {post.likes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onComment(post)} style={styles.actionBtn}>
          <MaterialIcons name="comment" size={18} color="#444" />
          <Text style={styles.actionText}> {(post.comments || []).length}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onShare && onShare(post)} style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={18} color="#444" />
          <Text style={styles.actionText}> {post.shares || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
  author: { fontWeight: '700' },
  time: { color: '#6b7280', fontSize: 12 },
  title: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  body: { marginTop: 6, color: '#374151' },
  image: { height: 180, marginTop: 8, borderRadius: 6 },
  preview: { padding: 8, borderWidth: 1, borderColor: '#e6e7ea', backgroundColor: '#f8fafc', marginTop: 8 },
  previewTitle: { fontWeight: '700' },
  previewDesc: { fontSize: 12, color: '#6b7280' },
  actions: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-around' },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#374151', marginLeft: 4 },
  inputTile: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', margin: 12, borderRadius: 10, alignItems: 'flex-start' },
  inputAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  inputTileCompact: { flexDirection: 'row', padding: 8, backgroundColor: '#fff', margin: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'space-between' },
  inputAvatarCompact: { width: 40, height: 40, borderRadius: 20 },
  inputFieldsCompact: { flex: 1 },
  inputTextCompact: { borderWidth: 1, borderColor: '#e6e7ea', borderRadius: 8, padding: 6, backgroundColor: '#fff', color: '#111', minHeight: 44 },
  postRowCompact: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  pickButtonCompact: { padding: 6, marginRight: 8 },
  postButtonCompact: { backgroundColor: '#0066FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  postButtonLabelCompact: { color: '#fff', fontWeight: '700' },
  previewImageCompact: { height: 80, width: 120, marginLeft: 6, borderRadius: 6 },
  leftColumn: { width: 72, alignItems: 'center', marginRight: 10, justifyContent: 'center' },
  buttonsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonsRowCentered: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#e6e7ea', alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, backgroundColor: '#fff' },
  iconBoxPrimary: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, backgroundColor: '#0066FF' },
  iconButton: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  inputFlex: { flex: 1, marginHorizontal: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', padding: 14, borderRadius: 10 },
  modalInput: { borderWidth: 1, borderColor: '#e6e7ea', borderRadius: 8, padding: 8, marginTop: 6 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', marginHorizontal: 6 },
  modalOption: { paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#e6e7ea', backgroundColor: '#fff', borderRadius: 6 },
});

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { posts, createPost, like, comment, share, recordShare, fetchAndSync } = useData();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkMode, setLinkMode] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareTargetPost, setShareTargetPost] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAndSync(); }, []);

  async function onRefresh() {
    try {
      setRefreshing(true);
      await fetchAndSync();
    } catch (e) {}
    setRefreshing(false);
  }

  async function pickImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos to attach an image.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.Images, quality: 0.7 });
      if (!res.cancelled) {
        setImage(res.uri);
        // close modal after a successful pick
        setShowLinkModal(false);
      }
    } catch (e) {
      console.warn('Image pick failed', e?.message || e);
    }
  }

  function onAttachPress() {
    // open modal offering link input or photo selection
    setShowLinkModal(true);
  }

  function openShareModal(post) {
    setShareTargetPost(post);
    setShareModalVisible(true);
  }

  async function handleShareViaMessages(post) {
    try {
      const body = post.title ? `${post.title}\n\n${post.body || ''}` : (post.body || '');
      const encoded = encodeURIComponent(body);
      const scheme = Platform.OS === 'android' ? `sms:?body=${encoded}` : `sms:&body=${encoded}`;
      await Linking.openURL(scheme);
    } catch (e) {
      Alert.alert('Unable to open Messages', 'Your device could not open the messages app.');
    }
    setShareModalVisible(false);
    setShareTargetPost(null);
    // record the share (notify server) but don't open native share sheet
    if (post?.id) recordShare(post.id).catch(() => {});
  }

  async function handleShareViaEmail(post) {
    try {
      const subject = encodeURIComponent(post.title || 'Shared post');
      const body = encodeURIComponent((post.title ? `${post.title}\n\n` : '') + (post.body || '') + (post.image ? `\n\n${post.image}` : ''));
      const url = `mailto:?subject=${subject}&body=${body}`;
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Unable to open Email', 'Your device could not open the email app.');
    }
    setShareModalVisible(false);
    setShareTargetPost(null);
    if (post?.id) recordShare(post.id).catch(() => {});
  }

  async function handleShareMore(post) {
    try {
      const message = post.title ? `${post.title}\n\n${post.body || ''}` : (post.body || '');
      await Share.share({ message, url: post.image, title: post.title || 'Post' });
    } catch (e) {
      console.warn('share more failed', e?.message || e);
    }
    setShareModalVisible(false);
    setShareTargetPost(null);
    // share() already opens share sheet and records count, but recordShare is safer if share fails
    try { await recordShare(post.id); } catch (e) {}
  }

  async function handlePost() {
    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        const form = new FormData();
        const filename = image.split('/').pop();
        const match = filename.match(/\.(\w+)$/);
        const type = match ? `image/${match[1]}` : 'image';
        form.append('file', { uri: image, name: filename, type });
        const up = await Api.uploadMedia(form);
        imageUrl = up.url || up?.url;
      }
      await createPost({ title, body, image: imageUrl });
      setTitle(''); setBody(''); setImage(null);
    } catch (e) {
      console.warn('post failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <CenteredContainer>
      <FlatList
        data={posts.slice().reverse()}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <PostCard post={item} onLike={() => like(item.id)} onComment={() => navigation.navigate('PostThread', { postId: item.id })} onShare={() => openShareModal(item)} />
        )}
        ListHeaderComponent={() => (
          <>
            <View style={styles.inputTileCompact}>
              <Image source={{ uri: user?.avatar || `https://i.pravatar.cc/80?u=${user?.email || 'anon'}` }} style={styles.inputAvatarCompact} />
              <View style={styles.inputFieldsCompact}>
                <TextInput placeholder="Share something with the community..." value={body} onChangeText={setBody} style={styles.inputTextCompact} multiline />
                <View style={styles.postRowCompact}>
                  <TouchableOpacity style={styles.pickButtonCompact} onPress={onAttachPress}>
                    <Ionicons name="image-outline" size={20} color="#444" />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity style={styles.postButtonCompact} onPress={handlePost}>
                    <Text style={styles.postButtonLabelCompact}>Post</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {showLinkModal && (
              <Modal transparent visible animationType="fade">
                <TouchableWithoutFeedback onPress={() => setShowLinkModal(false)}>
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={{ fontWeight: '700', marginBottom: 8 }}>Attach</Text>
                      <TextInput placeholder="Paste a link" value={linkInput} onChangeText={setLinkInput} style={styles.modalInput} />
                      <View style={{ flexDirection: 'row', marginTop: 12 }}>
                        <TouchableOpacity style={styles.modalBtn} onPress={() => { setLinkMode(true); setShowLinkModal(false); }}>
                          <Text>Use Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalBtn} onPress={() => { pickImage(); }}>
                          <Text>Pick Photo</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            )}
          </>
        )}
      />
      </CenteredContainer>
    </ScreenWrapper>
  );
}
