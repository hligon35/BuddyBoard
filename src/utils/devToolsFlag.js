import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'dev_tools_visible_v1';

const listeners = new Set();

export async function getDevToolsVisible() {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === null) return true;
    return v === '1';
  } catch (e) {
    return true;
  }
}

export async function setDevToolsVisible(val) {
  try {
    await AsyncStorage.setItem(KEY, val ? '1' : '0');
  } catch (e) {}
  // notify listeners
  for (const l of Array.from(listeners)) {
    try { l(val); } catch (e) {}
  }
}

export function addDevToolsListener(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export default {
  get: getDevToolsVisible,
  set: setDevToolsVisible,
  addListener: addDevToolsListener,
};
