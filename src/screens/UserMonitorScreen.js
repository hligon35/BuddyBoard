import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';

const windowWidth = Dimensions.get('window').width;

const AdminChatMonitor = require('./AdminChatMonitorScreen').default;
const ModeratePosts = require('./ModeratePostsScreen').default;

export default function UserMonitorScreen({ navigation, route }) {
  const userId = route?.params?.initialUserId;
  const scrollRef = useRef(null);
  const [page, setPage] = useState(0);

  const goToPage = idx => {
    if (scrollRef.current) scrollRef.current.scrollTo({ x: idx * windowWidth, animated: true });
    setPage(idx);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.tab} onPress={() => goToPage(0)}>
          <Text style={[styles.tabText, page === 0 && styles.tabTextActive]}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => goToPage(1)}>
          <Text style={[styles.tabText, page === 1 && styles.tabTextActive]}>Posts</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
          setPage(idx);
        }}
      >
        <View style={{ width: windowWidth, flex: 1 }}>
          <AdminChatMonitor navigation={navigation} route={{ params: { initialUserId: userId } }} />
        </View>
        <View style={{ width: windowWidth, flex: 1 }}>
          <ModeratePosts navigation={navigation} route={{ params: { authorId: userId } }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', paddingVertical: 8, backgroundColor: '#fff', borderBottomColor: '#eee', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 16, color: '#666' },
  tabTextActive: { color: '#000', fontWeight: '700' },
});
