import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Api from './Api';

export const DataContext = createContext(null);

const now = () => new Date().toISOString();

const seedMessages = [
  { id: 'm1', title: 'Urgent: Early dismissal', body: 'School closes at 1:15 today.', date: now(), read: false, sender: 'Admin' },
  { id: 'm2', title: 'Parent-teacher conference', body: 'Sign up link sent to families.', date: now(), read: false, sender: 'Office' }
];

const seedMemos = [
  { id: 'u1', title: 'Weather Alert', body: 'Severe weather procedures in effect.', date: now(), ack: false },
];

export function DataProvider({ children }){
  const [messages, setMessages] = useState(seedMessages);
  const [urgentMemos, setUrgentMemos] = useState(seedMemos);
  const [ready, setReady] = useState(false);

  const MSG_KEY = 'messages_v1';
  const MEMO_KEY = 'urgentMemos_v1';

  // Hydrate from AsyncStorage first, then try remote and overwrite if available
  useEffect(() => {
    let mounted = true;
    async function load(){
      try{
        const [localMsgs, localMemos] = await Promise.all([
          AsyncStorage.getItem(MSG_KEY),
          AsyncStorage.getItem(MEMO_KEY)
        ]);
        if (!mounted) return;
        if (localMsgs) {
          try{ setMessages(JSON.parse(localMsgs)); }catch(e){ console.warn('parse msgs', e.message); }
        }
        if (localMemos){
          try{ setUrgentMemos(JSON.parse(localMemos)); }catch(e){ console.warn('parse memos', e.message); }
        }

        // Then attempt remote hydration
        try{
          const [remoteMessages, remoteMemos] = await Promise.all([Api.getMessages(), Api.getUrgentMemos()]);
          if (!mounted) return;
          if (Array.isArray(remoteMessages)) setMessages(remoteMessages);
          if (Array.isArray(remoteMemos)) setUrgentMemos(remoteMemos);
        }catch(e){
          console.warn('API load failed, using local cache/seed', e.message);
        }

      }catch(e){
        console.warn('hydration failed', e.message);
      }finally{
        if (mounted) setReady(true);
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  // Persist messages and memos when they change
  useEffect(() => {
    AsyncStorage.setItem(MSG_KEY, JSON.stringify(messages)).catch(e => console.warn('save msgs', e.message));
  }, [messages]);

  useEffect(() => {
    AsyncStorage.setItem(MEMO_KEY, JSON.stringify(urgentMemos)).catch(e => console.warn('save memos', e.message));
  }, [urgentMemos]);

  function sendMessage({ title, body, sender='Me' }){
    const local = { id: 'm' + Math.random().toString(36).slice(2,9), title, body, date: now(), read: false, sender };
    setMessages(prev => [local, ...prev]);
    // fire-and-forget to API, but replace local with server response when available
    (async () => {
      try{
        const remote = await Api.sendMessageApi({ title, body, sender });
        if (remote && remote.id){
          setMessages(prev => prev.map(m => m.id===local.id ? remote : m));
        }
      }catch(e){
        console.warn('sendMessage API failed', e.message);
      }
    })();
    return local;
  }

  function markRead(id){
    setMessages(prev => prev.map(m => m.id===id ? { ...m, read: true } : m));
  }

  function createUrgentMemo({ title, body }){
    const local = { id: 'u' + Math.random().toString(36).slice(2,9), title, body, date: now(), ack: false };
    setUrgentMemos(prev => [local, ...prev]);
    (async () => {
      try{
        const remote = await Api.createUrgentMemoApi({ title, body });
        if (remote && remote.id){
          setUrgentMemos(prev => prev.map(u => u.id===local.id ? remote : u));
        }
      }catch(e){
        console.warn('createUrgentMemo API failed', e.message);
      }
    })();
    return local;
  }

  function ackMemo(id){
    setUrgentMemos(prev => prev.map(u => u.id===id ? { ...u, ack: true } : u));
    (async () => {
      try{ await Api.ackUrgentMemoApi(id); }catch(e){ console.warn('ackMemo failed', e.message); }
    })();
  }

  return (
    <DataContext.Provider value={{ messages, urgentMemos, sendMessage, markRead, createUrgentMemo, ackMemo }}>
      {children}
    </DataContext.Provider>
  );
}
