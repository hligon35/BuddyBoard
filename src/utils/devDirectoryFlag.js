import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'dev_directory_visible_v1';

const listeners = new Set();

export async function getDevDirectoryVisible() {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === null) return false;
    return v === '1';
  } catch (e) {
    return false;
  }
}

export async function setDevDirectoryVisible(val) {
  try {
    await AsyncStorage.setItem(KEY, val ? '1' : '0');
  } catch (e) {}
  for (const l of Array.from(listeners)) {
    try { l(val); } catch (e) {}
  }
}

export function addDevDirectoryListener(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export default {
  get: getDevDirectoryVisible,
  set: setDevDirectoryVisible,
  addListener: addDevDirectoryListener,
};
