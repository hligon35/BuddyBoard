import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Api from './Api';
import { Share } from 'react-native';
import { useAuth } from './AuthContext';
import devDirectoryFlag from './utils/devDirectoryFlag';
import { seededParents as fileParents, seededTherapists as fileTherapists, seededChildrenWithParents as fileChildren } from './seed/directorySeed_v2';

const DataContext = createContext(null);

export function useData() {
  return useContext(DataContext);
}

const POSTS_KEY = 'bbs_posts_v1';
const MESSAGES_KEY = 'bbs_messages_v1';
const MEMOS_KEY = 'bbs_memos_v1';
const ARCHIVED_KEY = 'bbs_archived_threads_v1';
const CHILDREN_KEY = 'bbs_children_v1';

// Demo posts for local development — authored by seeded therapists and parents only
const now = Date.now();
const demoPosts = [
  {
    id: 'demo-1',
    author: fileTherapists && fileTherapists[0] ? { id: fileTherapists[0].id, name: fileTherapists[0].name, avatar: fileTherapists[0].avatar } : null,
    title: 'Communication Board Intro',
    body: 'We introduced a communication board today — please review the attached tips for home use.',
    image: 'https://picsum.photos/seed/commboard/800/450',
    likes: 12,
    comments: [],
    shares: 1,
    createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'demo-2',
    author: fileParents && fileParents[0] ? { id: fileParents[0].id, name: `${fileParents[0].firstName} ${fileParents[0].lastName}`, avatar: fileParents[0].avatar } : null,
    title: 'Playdate Friday',
    body: 'Would anyone like to join a playdate at the park this Friday?',
    image: 'https://picsum.photos/seed/playdate/800/450',
    likes: 30,
    comments: [],
    shares: 3,
    createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'demo-3',
    author: fileTherapists && fileTherapists[2] ? { id: fileTherapists[2].id, name: fileTherapists[2].name, avatar: fileTherapists[2].avatar } : null,
    title: 'Weekly Progress Update',
    body: 'Great progress this week on independent dressing — keep up the great work at home!',
    likes: 8,
    comments: [],
    shares: 0,
    createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
  },
];

// Demo chat messages (parents <> therapists)
const demoMessages = [
  { id: 'm-1', threadId: 't-1', body: 'Hi — just checking how the session went today.', createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(), sender: { id: 'you', name: 'You' }, to: [fileParents && fileParents[0] ? { id: fileParents[0].id, name: `${fileParents[0].firstName} ${fileParents[0].lastName}` } : null] },
  { id: 'm-2', threadId: 't-2', body: 'We made great progress on communication goals.', createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(), sender: fileTherapists && fileTherapists[0] ? { id: fileTherapists[0].id, name: fileTherapists[0].name } : null, to: [{ id: 'you', name: 'You' }] },
  { id: 'm-3', threadId: 't-3', body: 'Can we move the speech session to 3:30 PM?', createdAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(), sender: { id: 'you', name: 'You' }, to: [fileTherapists && fileTherapists[1] ? { id: fileTherapists[1].id, name: fileTherapists[1].name } : null] },
];

// Helper: attach therapist objects (ABA/BCBA) to children based on assigned ABA ids
function attachTherapistsToChildren(childrenArr, therapistsArr) {
  const byId = (therapistsArr || []).reduce((acc, t) => { acc[t.id] = t; return acc; }, {});
  return (childrenArr || []).map((c) => {
    const assigned = c.assignedABA || c.assigned_ABA || c.assigned || [];
    const primaryId = Array.isArray(assigned) && assigned.length ? assigned[0] : null;
    const aba = primaryId ? byId[primaryId] : null;
    let amTherapist = null;
    let pmTherapist = null;
    if (c.session === 'AM') amTherapist = aba;
    else if (c.session === 'PM') pmTherapist = aba;
    else { amTherapist = aba; pmTherapist = aba; }
    let bcaTherapist = null;
    if (aba && aba.supervisedBy) bcaTherapist = byId[aba.supervisedBy] || null;
    return { ...c, bcaTherapist, amTherapist, pmTherapist };
  });
}

// Note: removed legacy demo children and therapist pools so the
// directory is driven only by the dev seed toggle (seeded data)
// or persisted AsyncStorage values. When the dev seed is off and
// no persisted data exists, children/therapists will be empty arrays.

// Seeded directory: 16 students (3-5yo), with 4 siblings (same family), parents and therapists
const PARENTS_KEY = 'bbs_parents_v1';
const THERAPISTS_KEY = 'bbs_therapists_v1';

// Directory seed data is provided from `src/seed/directorySeed.js` (imported above)

export function DataProvider({ children: reactChildren }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [urgentMemos, setUrgentMemos] = useState([]);
  const [timeChangeProposals, setTimeChangeProposals] = useState([]);
  const [archivedThreads, setArchivedThreads] = useState([]);
  const [children, setChildren] = useState([]);
  const [parents, setParents] = useState([]);
  const [therapists, setTherapists] = useState([]);

  // Hydrate from storage then attempt remote sync
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [postsRaw, mRaw, uRaw, cRaw, pRaw, tRaw, aRaw] = await Promise.all([
          AsyncStorage.getItem(POSTS_KEY),
          AsyncStorage.getItem(MESSAGES_KEY),
          AsyncStorage.getItem(MEMOS_KEY),
          AsyncStorage.getItem(CHILDREN_KEY),
          AsyncStorage.getItem(PARENTS_KEY),
          AsyncStorage.getItem(THERAPISTS_KEY),
          AsyncStorage.getItem(ARCHIVED_KEY),
        ]);
        if (!mounted) return;

        // Posts
        if (postsRaw) {
          try {
            const parsed = JSON.parse(postsRaw);
            if (Array.isArray(parsed) && parsed.length) setPosts(parsed);
            else setPosts(demoPosts);
          } catch (e) {
            setPosts(demoPosts);
          }
        } else {
          setPosts(demoPosts);
        }

        // Messages and memos
        if (mRaw) setMessages(JSON.parse(mRaw));
        else setMessages(demoMessages);
        if (uRaw) setUrgentMemos(uRaw ? JSON.parse(uRaw) : []);

        // Parents & Therapists (set first so children can attach references)
        let parsedParents = [];
        if (pRaw) {
          try { const parsed = JSON.parse(pRaw); if (Array.isArray(parsed)) parsedParents = parsed; } catch (e) { parsedParents = []; }
        }
        let parsedTherapists = [];
        if (tRaw) {
          try { const parsed = JSON.parse(tRaw); if (Array.isArray(parsed)) parsedTherapists = parsed; } catch (e) { parsedTherapists = []; }
        }
        setParents(parsedParents);
        setTherapists(parsedTherapists);

        // Children — attach therapist objects where possible
        let parsedChildren = [];
        if (cRaw) {
          try { const parsed = JSON.parse(cRaw); if (Array.isArray(parsed)) parsedChildren = parsed; } catch (e) { parsedChildren = []; }
        }
        const mapped = attachTherapistsToChildren(parsedChildren, parsedTherapists);
        setChildren(mapped);

        // Archived threads
        if (aRaw) {
          try { const parsed = JSON.parse(aRaw); if (Array.isArray(parsed)) setArchivedThreads(parsed); else setArchivedThreads([]); }
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
    AsyncStorage.setItem(PARENTS_KEY, JSON.stringify(parents)).catch(() => {});
  }, [parents]);
  useEffect(() => {
    AsyncStorage.setItem(THERAPISTS_KEY, JSON.stringify(therapists)).catch(() => {});
  }, [therapists]);
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

  // Listen for dev directory toggle: seed or revert directory data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const v = await devDirectoryFlag.get();
        if (!mounted) return;
        if (v) {
          // set therapists and parents first
          setTherapists(fileTherapists);
          setParents(fileParents);
          const mapped = attachTherapistsToChildren(fileChildren, fileTherapists);
          setChildren(mapped);
          AsyncStorage.setItem(THERAPISTS_KEY, JSON.stringify(fileTherapists)).catch(() => {});
          AsyncStorage.setItem(PARENTS_KEY, JSON.stringify(fileParents)).catch(() => {});
          AsyncStorage.setItem(CHILDREN_KEY, JSON.stringify(mapped)).catch(() => {});
        }
      } catch (e) {}
    })();
    const unsub = devDirectoryFlag.addListener((val) => {
      if (!mounted) return;
      if (val) {
        setTherapists(fileTherapists);
        setParents(fileParents);
        const mapped = attachTherapistsToChildren(fileChildren, fileTherapists);
        setChildren(mapped);
        AsyncStorage.setItem(THERAPISTS_KEY, JSON.stringify(fileTherapists)).catch(() => {});
        AsyncStorage.setItem(PARENTS_KEY, JSON.stringify(fileParents)).catch(() => {});
        AsyncStorage.setItem(CHILDREN_KEY, JSON.stringify(mapped)).catch(() => {});
      } else {
        // clear directory when dev seed is turned off (do not fall back to legacy demo pools)
        setChildren([]);
        setParents([]);
        setTherapists([]);
        AsyncStorage.setItem(CHILDREN_KEY, JSON.stringify([])).catch(() => {});
        AsyncStorage.removeItem(PARENTS_KEY).catch(() => {});
        AsyncStorage.setItem(THERAPISTS_KEY, JSON.stringify([])).catch(() => {});
      }
    });
    return () => { mounted = false; unsub(); };
  }, []);

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
    try {
      const proposals = await Api.getTimeChangeProposals();
      setTimeChangeProposals(Array.isArray(proposals) ? proposals : (proposals?.proposals || []));
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

  function deletePost(postId) {
    try {
      setPosts((s) => (s || []).filter((p) => p.id !== postId));
      // persist immediately
      AsyncStorage.setItem(POSTS_KEY, JSON.stringify((posts || []).filter((p) => p.id !== postId))).catch(() => {});
    } catch (e) {
      console.warn('deletePost failed', e?.message || e);
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

  async function proposeTimeChange(childId, type, proposedISO, note) {
    try {
      const payload = { childId, type, proposedISO, note, proposerId: user?.id };
      const created = await Api.proposeTimeChange(payload);
      // server should return the created proposal; append locally
      setTimeChangeProposals((s) => [created, ...s]);
      return created;
    } catch (e) {
      console.warn('proposeTimeChange failed', e?.message || e);
      return null;
    }
  }

  async function respondToProposal(proposalId, action) {
    try {
      const res = await Api.respondTimeChange(proposalId, action);
      // server should return updated proposal and possibly updated child
      // remove or update local proposals
      setTimeChangeProposals((s) => (s || []).filter((p) => p.id !== proposalId));
      // if server returned updated child, merge it
      if (res && res.updatedChild && res.updatedChild.id) {
        setChildren((prev) => (prev || []).map((c) => (c.id === res.updatedChild.id ? { ...c, ...res.updatedChild } : c)));
      }
      return res;
    } catch (e) {
      console.warn('respondToProposal failed', e?.message || e);
      return null;
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

  // Send a time-update urgent alert to admin (dropoff/pickup)
  async function sendTimeUpdateAlert(childId, updateType, proposedISO, note) {
    try {
      const temp = {
        id: `urgent-${Date.now()}`,
        type: 'time_update',
        updateType, // 'pickup' or 'dropoff'
        childId,
        proposerId: user?.id,
        proposedISO,
        note: note || '',
        status: 'pending', // pending -> waiting for admin
        createdAt: new Date().toISOString(),
      };
      setUrgentMemos((s) => [temp, ...(s || [])]);
      // Attempt server send; if server returns canonical memo, replace temp
      if (Api.sendUrgentMemo) {
        try {
          const created = await Api.sendUrgentMemo(temp);
          if (created && created.id) {
            setUrgentMemos((s) => (s || []).map((m) => (m.id === temp.id ? created : m)));
            return created;
          }
        } catch (e) {
          console.warn('sendUrgentMemo API failed', e?.message || e);
        }
      }
      return temp;
    } catch (e) {
      console.warn('sendTimeUpdateAlert failed', e?.message || e);
      return null;
    }
  }

  // Send a general admin memo to multiple recipients
  async function sendAdminMemo({ recipients = [], subject = '', body = '', childId = null } = {}) {
    try {
      const temp = {
        id: `urgent-${Date.now()}`,
        type: 'admin_memo',
        subject: subject || '',
        body: body || '',
        childId: childId || null,
        recipients: Array.isArray(recipients) ? recipients : [],
        proposerId: user?.id,
        status: 'sent',
        createdAt: new Date().toISOString(),
      };
      // Optimistically add to local urgent memos so admins can see it immediately
      setUrgentMemos((s) => [temp, ...(s || [])]);

      // Attempt server send if API supports it
      if (Api.sendUrgentMemo) {
        try {
          const created = await Api.sendUrgentMemo(temp);
          if (created && created.id) {
            setUrgentMemos((s) => (s || []).map((m) => (m.id === temp.id ? created : m)));
            return created;
          }
        } catch (e) {
          console.warn('sendAdminMemo API failed', e?.message || e);
        }
      }
      return temp;
    } catch (e) {
      console.warn('sendAdminMemo failed', e?.message || e);
      return null;
    }
  }

  // Update urgent memo status locally and attempt server notify
  async function respondToUrgentMemo(memoId, action) {
    try {
      // action: 'accepted' | 'denied' | 'opened'
      setUrgentMemos((s) => (s || []).map((m) => (m.id === memoId ? { ...m, status: action, respondedAt: new Date().toISOString() } : m)));
      if (Api.respondUrgentMemo) {
        try {
          await Api.respondUrgentMemo(memoId, action);
        } catch (e) {
          console.warn('respondUrgentMemo API failed', e?.message || e);
        }
      }
      return true;
    } catch (e) {
      console.warn('respondToUrgentMemo failed', e?.message || e);
      return false;
    }
  }

  function resetChildrenToDemo() {
    try {
      // Legacy demo children removed — clearing children instead
      setChildren([]);
      AsyncStorage.setItem(CHILDREN_KEY, JSON.stringify([])).catch(() => {});
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
    <DataContext.Provider value={{
      posts,
      messages,
      urgentMemos,
      sendTimeUpdateAlert,
      respondToUrgentMemo,
      children,
      parents,
      therapists,
      setChildren,
      setParents,
      setTherapists,
      // legacy therapist pools removed; use `therapists` only
      resetChildrenToDemo,
      resetMessagesToDemo,
      clearMessages,
      archiveThread,
      unarchiveThread,
      deleteThread,
      archivedThreads,
      createPost,
      like,
      comment,
      replyToComment,
      reactToComment,
      share,
      recordShare,
      sendMessage,
      fetchAndSync,
      markUrgentRead,
      sendAdminMemo,
      // time change proposals
      timeChangeProposals,
      proposeTimeChange,
      respondToProposal,
      deletePost,
    }}>
      {reactChildren}
    </DataContext.Provider>
  );
}

export default DataContext;
