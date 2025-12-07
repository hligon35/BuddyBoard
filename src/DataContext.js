import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Api from './Api';
import { Share } from 'react-native';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function useData() {
  return useContext(DataContext);
}

const POSTS_KEY = 'bbs_posts_v1';
const MESSAGES_KEY = 'bbs_messages_v1';
const MEMOS_KEY = 'bbs_memos_v1';
const ARCHIVED_KEY = 'bbs_archived_threads_v1';
const CHILDREN_KEY = 'bbs_children_v1';

// Demo posts for local development / demo mode
const now = Date.now();
const demoPosts = [
  {
    id: 'demo-1',
    author: { id: 'u1', name: 'Director Bennett', avatar: 'https://i.pravatar.cc/100?img=65' },
    title: 'Picture Day for Little Sprouts',
    body: 'Picture day is this Tuesday — please send your child in their favorite outfit and arrive 5 minutes early.',
    image: 'https://picsum.photos/seed/preschool1/800/450',
    likes: 18,
    comments: [{ id: 'c1', author: { name: 'Ms. Lopez' }, body: 'Will siblings be photographed together?' }],
    shares: 2,
    createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'demo-2',
    author: { id: 'u2', name: 'Ms. Green (Lead Teacher)', avatar: 'https://i.pravatar.cc/100?img=22' },
    title: 'Parent-Teacher Playdate',
    body: 'Join us Friday for an informal playdate — bring a snack to share and enjoy circle time with your child.',
    image: 'https://picsum.photos/seed/preschool2/800/450',
    likes: 72,
    comments: [{ id: 'c2', author: { name: 'A. Carter' }, body: 'Can we bring younger siblings too?' }],
    shares: 9,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
  },
  {
    id: 'demo-3',
    author: { id: 'u3', name: 'Ms. Patel (Assistant)', avatar: 'https://i.pravatar.cc/100?img=28' },
    title: 'Free Storytime',
    body: 'Weekly storytime in the reading corner every Wednesday at 10:00 AM. All families welcome!',
    likes: 12,
    comments: [],
    shares: 1,
    createdAt: new Date(now - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: 'demo-4',
    author: { id: 'u4', name: 'Art Teacher Maya', avatar: 'https://i.pravatar.cc/100?img=18' },
    title: 'Craft Fair Submissions',
    body: 'We are collecting artwork for the preschool craft fair — bring pieces to the classroom by Monday.',
    image: 'https://picsum.photos/seed/preschool3/800/450',
    likes: 31,
    comments: [{ id: 'c3', author: { name: 'Lena M.' }, body: 'Do you accept painted rocks?' }],
    shares: 4,
    createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
  },
  {
    id: 'demo-5',
    author: { id: 'u5', name: 'Nurse Allison', avatar: 'https://i.pravatar.cc/100?img=30' },
    title: 'Health Reminder',
    body: 'Reminder to update your child’s immunization records. Please stop by the office if you need assistance.',
    likes: 14,
    comments: [],
    shares: 1,
    createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'demo-6',
    author: { id: 'u6', name: 'Music Teacher Sam', avatar: 'https://i.pravatar.cc/100?img=3' },
    title: 'Sing-Along Photos',
    body: 'Check out our sing-along photos from music class — smiling faces all around!',
    image: 'https://picsum.photos/seed/preschool4/800/450',
    likes: 41,
    comments: [{ id: 'c4', author: { name: 'Maya' }, body: 'The kids had so much fun.' }],
    shares: 5,
    createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'demo-7',
    author: { id: 'u7', name: 'Nutrition Services', avatar: 'https://i.pravatar.cc/100?img=25' },
    title: 'Snack Menu Update',
    body: 'This week’s snack menu includes fresh fruit and whole-grain crackers. Let us know about allergies.',
    image: 'https://picsum.photos/seed/preschool5/800/450',
    likes: 27,
    comments: [],
    shares: 3,
    createdAt: new Date(now - 1000 * 60 * 15).toISOString(), // 15 minutes ago
  },
  {
    id: 'demo-8',
    author: { id: 'u8', name: 'Library Corner', avatar: 'https://i.pravatar.cc/100?img=7' },
    title: 'New Board Books',
    body: 'New board books arrived — stop by the library corner to check them out with your little one.',
    likes: 9,
    comments: [],
    shares: 0,
    createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 'demo-9',
    author: { id: 'u9', name: 'Parent Volunteers', avatar: 'https://i.pravatar.cc/100?img=45' },
    title: 'Volunteer Sign-ups',
    body: 'We are signing up parents to help with outdoor play supervision this month — please sign up if available.',
    image: 'https://picsum.photos/seed/preschool6/800/450',
    likes: 36,
    comments: [{ id: 'c5', author: { name: 'Aaron' }, body: 'I can help on Thursdays.' }],
    shares: 6,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
  },
  {
    id: 'demo-10',
    author: { id: 'u10', name: 'School Board', avatar: 'https://i.pravatar.cc/100?img=52' },
    title: 'Morning Drop-off Poll',
    body: 'Quick poll for parents: Would you prefer a 15-minute staggered drop-off to reduce congestion?',
    likes: 21,
    comments: [],
    shares: 2,
    createdAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(), // 10 hours ago
  },
];

// Demo chat messages (parents <> ABA therapists / administration)
const demoMessages = [
  // Thread A: User <-> Parent (you <-> Olivia)
  { id: 'm-up-1', threadId: 't-user-parent', body: 'Hey Olivia — just checking how Sam did today.', createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(), sender: { id: 'you', name: 'You (Parent)' }, to: [{ id: 'parent-1', name: 'Olivia (Parent)' }] },
  { id: 'm-up-2', threadId: 't-user-parent', body: 'He was great — lots of progress on dressing!', createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(), sender: { id: 'parent-1', name: 'Olivia (Parent)' }, to: [{ id: 'you', name: 'You (Parent)' }] },

  // Thread B: User <-> Therapist AM (you <-> Therapist Maya)
  { id: 'm-utam-1', threadId: 't-user-therapist-am', body: 'Morning Maya — can we try the new communication board tomorrow?', createdAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(), sender: { id: 'you', name: 'You (Parent)' }, to: [{ id: 'ther-1', name: 'Therapist Maya' }] },
  { id: 'm-utam-2', threadId: 't-user-therapist-am', body: 'Sounds good — I will introduce it during circle time.', createdAt: new Date(now - 1000 * 60 * 60 * 19).toISOString(), sender: { id: 'ther-1', name: 'Therapist Maya' }, to: [{ id: 'you', name: 'You (Parent)' }] },

  // Thread C: Parent <-> Therapist PM (Liam <-> Therapist Sam)
  // Thread C: User <-> Therapist PM (you <-> Therapist Sam)
  { id: 'm-utpm-1', threadId: 't-user-therapist-pm', body: 'Hi Sam — can we move Emma\'s speech session to later?', createdAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(), sender: { id: 'you', name: 'You (Parent)' }, to: [{ id: 'ther-2', name: 'Therapist Sam' }] },
  { id: 'm-utpm-2', threadId: 't-user-therapist-pm', body: 'Yes — 3:30 PM works for me.', createdAt: new Date(now - 1000 * 60 * 60 * 9).toISOString(), sender: { id: 'ther-2', name: 'Therapist Sam' }, to: [{ id: 'you', name: 'You (Parent)' }] },

  // Thread D: User <-> Admin (you <-> Office Admin)
  { id: 'm-ua-1', threadId: 't-user-admin', body: 'Hello — could you confirm the pickup time for today?', createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(), sender: { id: 'you', name: 'You (Parent)' }, to: [{ id: 'admin-1', name: 'Office Admin' }] },
  { id: 'm-ua-2', threadId: 't-user-admin', body: 'Pickup is at 5:00 PM as scheduled.', createdAt: new Date(now - 1000 * 60 * 60 * 1.5).toISOString(), sender: { id: 'admin-1', name: 'Office Admin' }, to: [{ id: 'you', name: 'You (Parent)' }] },
];

const demoChildren = [
  {
    id: 'child-1',
    name: 'Sam L.',
    age: '4 yrs',
    room: 'Sunflowers',
    avatar: 'https://picsum.photos/seed/child1/200/200',
    carePlan: 'Goals: fine motor, communication prompts, independent dressing.',
    notes: 'No allergies recorded. Bring an extra set of clothes for messy play.',
    // upcoming now represents agreed parent <-> administration ABA meeting(s)
    upcoming: [
      { id: 'u1', title: 'Parent–Administration ABA Meeting', when: 'Wednesday, Dec 10 — 5:00 PM', organizer: { name: 'Office Admin', phone: '555-0100', email: 'office@school.org' }, type: 'parent-aba' },
    ],
    amTherapist: { id: 'ther-1', name: 'Therapist Maya', role: 'ABA Therapist', phone: '555-0101', email: 'maya@school.org', avatar: 'https://i.pravatar.cc/80?img=32' },
    pmTherapist: { id: 'ther-2', name: 'Therapist Sam', role: 'Speech Therapist', phone: '555-0102', email: 'sam@school.org', avatar: 'https://i.pravatar.cc/80?img=47' },
    bcaTherapist: { id: 'bca-1', name: 'Therapist Jordan', role: 'BCA Therapist', phone: '555-0110', email: 'jordan@school.org', avatar: 'https://i.pravatar.cc/80?img=12' },
  },
  {
    id: 'child-2',
    name: 'Ava R.',
    age: '5 yrs',
    room: 'Daisies',
    avatar: 'https://picsum.photos/seed/child2/200/200',
    carePlan: 'Goals: social engagement, fine motor play, language prompts.',
    notes: 'Peanut allergy noted. Please provide allergy-safe snacks.',
    upcoming: [
      { id: 'u3', title: 'Parent–Administration ABA Meeting', when: 'Friday, Dec 12 — 3:30 PM', organizer: { name: 'Office Admin', phone: '555-0100', email: 'office@school.org' }, type: 'parent-aba' },
    ],
    amTherapist: { id: 'ther-3', name: 'Therapist Alex', role: 'ABA Therapist', phone: '555-0103', email: 'alex@school.org', avatar: 'https://i.pravatar.cc/80?img=14' },
    pmTherapist: { id: 'ther-4', name: 'Therapist Priya', role: 'Speech Therapist', phone: '555-0104', email: 'priya@school.org', avatar: 'https://i.pravatar.cc/80?img=21' },
    bcaTherapist: { id: 'bca-2', name: 'Therapist Ben', role: 'BCA Therapist', phone: '555-0111', email: 'ben@school.org', avatar: 'https://i.pravatar.cc/80?img=16' },
  },
];

// Therapist pools (for reference or assignment UI)
const abaTherapists = [
  { id: 'ther-1', name: 'Therapist Maya', role: 'ABA Therapist', phone: '555-0101', email: 'maya@school.org', avatar: 'https://i.pravatar.cc/80?img=32' },
  { id: 'ther-3', name: 'Therapist Alex', role: 'ABA Therapist', phone: '555-0103', email: 'alex@school.org', avatar: 'https://i.pravatar.cc/80?img=14' },
  { id: 'ther-5', name: 'Therapist Jordan', role: 'ABA Therapist', phone: '555-0105', email: 'jordan.aba@school.org', avatar: 'https://i.pravatar.cc/80?img=5' },
  { id: 'ther-6', name: 'Therapist Taylor', role: 'ABA Therapist', phone: '555-0106', email: 'taylor@school.org', avatar: 'https://i.pravatar.cc/80?img=6' },
];

const bcaTherapists = [
  { id: 'bca-1', name: 'Therapist Jordan', role: 'BCA Therapist', phone: '555-0110', email: 'jordan@school.org', avatar: 'https://i.pravatar.cc/80?img=12' },
  { id: 'bca-2', name: 'Therapist Ben', role: 'BCA Therapist', phone: '555-0111', email: 'ben@school.org', avatar: 'https://i.pravatar.cc/80?img=16' },
];

export function DataProvider({ children: reactChildren }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [urgentMemos, setUrgentMemos] = useState([]);
  const [archivedThreads, setArchivedThreads] = useState([]);
  const [children, setChildren] = useState([]);

  // Hydrate from storage then attempt remote sync
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [pRaw, mRaw, uRaw] = await Promise.all([
          AsyncStorage.getItem(POSTS_KEY),
          AsyncStorage.getItem(MESSAGES_KEY),
          AsyncStorage.getItem(MEMOS_KEY),
        ]);
        if (!mounted) return;
        if (pRaw) {
          try {
            const parsed = JSON.parse(pRaw);
            if (Array.isArray(parsed) && parsed.length) setPosts(parsed);
            else setPosts(demoPosts);
          } catch (e) {
            setPosts(demoPosts);
          }
        } else {
          // seed demo posts when none exist locally (useful for demo/dev)
          setPosts(demoPosts);
        }
        if (mRaw) setMessages(JSON.parse(mRaw));
        else setMessages(demoMessages);
        if (uRaw) setUrgentMemos(JSON.parse(uRaw));
        // hydrate children
        const cRaw = await AsyncStorage.getItem(CHILDREN_KEY);
        if (cRaw) {
          try { const parsed = JSON.parse(cRaw); if (Array.isArray(parsed)) setChildren(parsed); else setChildren(demoChildren); } catch (e) { setChildren(demoChildren); }
        } else {
          setChildren(demoChildren);
        }
        // hydrate archived thread ids
        const aRaw = await AsyncStorage.getItem(ARCHIVED_KEY);
        if (aRaw) {
          try { const parsed = JSON.parse(aRaw); if (Array.isArray(parsed)) setArchivedThreads(parsed); }
          catch (e) { setArchivedThreads([]); }
        } else {
          setArchivedThreads([]);
        }
      } catch (e) {
        console.warn('hydrate failed', e.message);
      }
      await fetchAndSync();
    })();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts)).catch(() => {});
  }, [posts]);
  useEffect(() => {
    AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages)).catch(() => {});
  }, [messages]);
  useEffect(() => {
    AsyncStorage.setItem(ARCHIVED_KEY, JSON.stringify(archivedThreads)).catch(() => {});
  }, [archivedThreads]);
  useEffect(() => {
    AsyncStorage.setItem(CHILDREN_KEY, JSON.stringify(children)).catch(() => {});
  }, [children]);
  useEffect(() => {
    AsyncStorage.setItem(MEMOS_KEY, JSON.stringify(urgentMemos)).catch(() => {});
  }, [urgentMemos]);

  async function fetchAndSync() {
    try {
      const remotePosts = await Api.getPosts();
      if (Array.isArray(remotePosts)) setPosts(remotePosts);
    } catch (e) { console.warn('getPosts failed', e.message); }
    try {
      const remoteMessages = await Api.getMessages();
      if (Array.isArray(remoteMessages)) setMessages(remoteMessages);
    } catch (e) { console.warn('getMessages failed', e.message); }
    try {
      const memos = await Api.getUrgentMemos();
      setUrgentMemos(Array.isArray(memos) ? memos : (memos?.memos || []));
    } catch (e) { console.warn('getUrgentMemos failed', e.message); }
  }

  async function createPost(payload) {
    const temp = { ...payload, id: `temp-${Date.now()}`, createdAt: new Date().toISOString(), pending: true };
    setPosts((s) => [temp, ...s]);
    try {
      const created = await Api.createPost(payload);
      setPosts((s) => [created, ...s.filter((p) => p.id !== temp.id)]);
      return created;
    } catch (e) {
      console.warn('createPost failed', e.message);
      return temp;
    }
  }

  async function like(postId) {
    try {
      const updated = await Api.likePost(postId);
      setPosts((s) => s.map((p) => (p.id === postId ? { ...p, ...updated } : p)));
      return updated;
    } catch (e) {
      console.warn('like failed', e.message);
    }
  }

  async function comment(postId, commentBody) {
    try {
      const created = await Api.commentPost(postId, commentBody);
      setPosts((s) => s.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), created] } : p)));
      return created;
    } catch (e) {
      console.warn('comment failed', e.message);
    }
  }

  async function replyToComment(postId, parentCommentId, replyBody) {
    // optimistic reply
    const temp = { ...replyBody, id: `temp-reply-${Date.now()}`, createdAt: new Date().toISOString() };
    setPosts((s) => s.map((p) => {
      if (p.id !== postId) return p;
      const comments = (p.comments || []).map((c) => {
        if (c.id !== parentCommentId) return c;
        return { ...c, replies: [...(c.replies || []), temp] };
      });
      return { ...p, comments };
    }));

    try {
      const created = await Api.commentPost(postId, { ...replyBody, parentId: parentCommentId });
      setPosts((s) => s.map((p) => {
        if (p.id !== postId) return p;
        const comments = (p.comments || []).map((c) => {
          if (c.id !== parentCommentId) return c;
          return { ...c, replies: (c.replies || []).map((r) => (r.id === temp.id ? created : r)) };
        });
        return { ...p, comments };
      }));
      return created;
    } catch (e) {
      console.warn('replyToComment failed', e.message || e);
      return temp;
    }
  }

  async function reactToComment(postId, commentId, emoji) {
    const uid = user?.id || 'anonymous';
    setPosts((s) => s.map((p) => {
      if (p.id !== postId) return p;
      const comments = (p.comments || []).map((c) => {
        if (c.id !== commentId) return c;
        const reactions = { ...(c.reactions || {}) };
        const userReactions = { ...(c.userReactions || {}) };
        const prev = userReactions[uid];
        if (prev === emoji) {
          // toggle off
          reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1);
          delete userReactions[uid];
        } else {
          if (prev) {
            reactions[prev] = Math.max(0, (reactions[prev] || 1) - 1);
          }
          reactions[emoji] = (reactions[emoji] || 0) + 1;
          userReactions[uid] = emoji;
        }
        return { ...c, reactions, userReactions };
      });
      return { ...p, comments };
    }));

    // Best-effort notify server if API supports it
    try {
      if (Api.reactComment) await Api.reactComment(postId, commentId, { emoji });
    } catch (e) {
      // ignore
      console.warn('reactToComment API failed', e?.message || e);
    }
  }

  async function share(postId) {
    // Find the post
    const p = posts.find((x) => x.id === postId);
    if (!p) return;

    // Compose share content
    const message = p.title ? `${p.title}\n\n${p.body || ''}` : (p.body || '');
    try {
      await Share.share({ message, url: p.image, title: p.title || 'Post' });
    } catch (e) {
      console.warn('native share failed', e.message || e);
    }

    // Optimistically increment local share count
    setPosts((s) => s.map((x) => (x.id === postId ? { ...x, shares: (x.shares || 0) + 1 } : x)));

    // Attempt to notify backend (best-effort)
    try {
      if (Api.sharePost) await Api.sharePost(postId);
    } catch (e) {
      // ignore server errors; local increment keeps UX responsive
      console.warn('sharePost API failed', e.message || e);
    }
  }

  async function recordShare(postId, { notifyServer = true } = {}) {
    // Only increment and optionally notify the server without invoking native share UI
    setPosts((s) => s.map((x) => (x.id === postId ? { ...x, shares: (x.shares || 0) + 1 } : x)));
    if (!notifyServer) return;
    try {
      if (Api.sharePost) await Api.sharePost(postId);
    } catch (e) {
      console.warn('recordShare API failed', e.message || e);
    }
  }

  async function sendMessage(payload) {
    // Attach sender info from auth (if available) so UI shows names immediately
    const sender = user ? { id: user.id, name: user.name, email: user.email } : undefined;
    const payloadWithSender = { ...payload, sender };
    const temp = { ...payloadWithSender, id: `temp-${Date.now()}`, createdAt: new Date().toISOString(), outgoing: true };
    setMessages((s) => [temp, ...s]);
    try {
      const sent = await Api.sendMessage(payloadWithSender);
      setMessages((s) => [sent, ...s.filter((m) => m.id !== temp.id)]);
      return sent;
    } catch (e) {
      console.warn('sendMessage failed', e.message);
      return temp;
    }
  }

  function archiveThread(threadId) {
    try {
      setArchivedThreads((s) => {
        const next = Array.from(new Set([...(s || []), threadId]));
        AsyncStorage.setItem(ARCHIVED_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    } catch (e) {
      console.warn('archiveThread failed', e?.message || e);
    }
  }

  function unarchiveThread(threadId) {
    try {
      setArchivedThreads((s) => {
        const next = (s || []).filter((t) => t !== threadId);
        AsyncStorage.setItem(ARCHIVED_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    } catch (e) {
      console.warn('unarchiveThread failed', e?.message || e);
    }
  }

  function deleteThread(threadId) {
    try {
      setMessages((s) => (s || []).filter((m) => (m.threadId || m.id) !== threadId));
      setArchivedThreads((s) => (s || []).filter((t) => t !== threadId));
      AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify((messages || []).filter((m) => (m.threadId || m.id) !== threadId))).catch(() => {});
      AsyncStorage.setItem(ARCHIVED_KEY, JSON.stringify((archivedThreads || []).filter((t) => t !== threadId))).catch(() => {});
    } catch (e) {
      console.warn('deleteThread failed', e?.message || e);
    }
  }

  async function markUrgentRead(memoIds) {
    try {
      await Api.ackUrgentMemo(memoIds);
    } catch (e) {
      console.warn('ackUrgentMemo failed', e.message);
    }
  }

  function resetChildrenToDemo() {
    try {
      setChildren(demoChildren);
      AsyncStorage.setItem(CHILDREN_KEY, JSON.stringify(demoChildren)).catch(() => {});
    } catch (e) {
      console.warn('resetChildrenToDemo failed', e?.message || e);
    }
  }

  function resetMessagesToDemo() {
    try {
      setMessages(demoMessages);
      setArchivedThreads([]);
      AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(demoMessages)).catch(() => {});
      AsyncStorage.setItem(ARCHIVED_KEY, JSON.stringify([])).catch(() => {});
    } catch (e) {
      console.warn('resetMessagesToDemo failed', e?.message || e);
    }
  }

  function clearMessages() {
    try {
      setMessages([]);
      setArchivedThreads([]);
      AsyncStorage.removeItem(MESSAGES_KEY).catch(() => {});
      AsyncStorage.removeItem(ARCHIVED_KEY).catch(() => {});
    } catch (e) {
      console.warn('clearMessages failed', e?.message || e);
    }
  }

  return (
    <DataContext.Provider value={{ posts, messages, urgentMemos, children, setChildren, abaTherapists, bcaTherapists, resetChildrenToDemo, resetMessagesToDemo, clearMessages, archiveThread, unarchiveThread, deleteThread, archivedThreads, createPost, like, comment, replyToComment, reactToComment, share, recordShare, sendMessage, fetchAndSync, markUrgentRead }}>
      {reactChildren}
    </DataContext.Provider>
  );
}

export default DataContext;
