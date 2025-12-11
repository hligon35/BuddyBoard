import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'dev_wall_visible_v1';

const listeners = new Set();

export async function getDevWallVisible() {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === null) return true;
    return v === '1';
  } catch (e) {
    return true;
  }
}

export async function setDevWallVisible(val) {
  try {
    await AsyncStorage.setItem(KEY, val ? '1' : '0');
  } catch (e) {}
  for (const l of Array.from(listeners)) {
    try { l(val); } catch (e) {}
  }
}

export function addDevWallListener(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export default {
  get: getDevWallVisible,
  set: setDevWallVisible,
  addListener: addDevWallListener,
};
