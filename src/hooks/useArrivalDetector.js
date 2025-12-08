import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Api from '../Api';
import { useData } from '../DataContext';
import { useAuth } from '../AuthContext';

const ARRIVAL_KEY = 'settings_arrival_enabled_v1';
const BUSINESS_ADDR_KEY = 'business_address_v1';

// Default window (minutes) to check around scheduled times
const DEFAULT_WINDOW_MIN = 30; // start 30 minutes before
const DEFAULT_WINDOW_AFTER_MIN = 15; // stop 15 minutes after

function parseIso(t) {
  try { return new Date(t); } catch (e) { return null; }
}

function isWithinWindow(targetDate, now = new Date(), before = DEFAULT_WINDOW_MIN, after = DEFAULT_WINDOW_AFTER_MIN) {
  if (!targetDate) return false;
  const start = new Date(targetDate.getTime() - before * 60000);
  const end = new Date(targetDate.getTime() + after * 60000);
  return now >= start && now <= end;
}

export default function useArrivalDetector() {
  const { children, fetchAndSync } = useData();
  const { user } = useAuth();
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [enabled, setEnabled] = useState(false);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const a = await AsyncStorage.getItem(ARRIVAL_KEY);
        if (!mounted) return;
        setEnabled(a === '1');
        const bRaw = await AsyncStorage.getItem(BUSINESS_ADDR_KEY);
        if (bRaw) setBusiness(JSON.parse(bRaw));
      } catch (e) {
        // ignore
      }
    })();

    const sub = AppState.addEventListener ? AppState.addEventListener('change', _handleAppState) : null;
    return () => { mounted = false; if (sub && sub.remove) sub.remove(); };
  }, []);

  useEffect(() => {
    if (!enabled) {
      _stopInterval();
      return;
    }
    // start checking periodically when enabled
    _evaluateAndSchedule();
    return () => { _stopInterval(); };
  }, [enabled, children, user, business]);

  function _handleAppState(next) {
    appState.current = next;
    // If app becomes active, evaluate windows immediately
    if (next === 'active') _evaluateAndSchedule();
  }

  function _stopInterval() {
    try { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } } catch (e) {}
  }

  async function _getLocation() {
    try {
      // dynamic import to avoid crashing when expo-location not installed
      const Location = require('expo-location');
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return null;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
    } catch (e) {
      console.warn('arrival: location failed', e?.message || e);
      return null;
    }
  }

  async function _ping(payload) {
    try { await Api.pingArrival(payload); } catch (e) { console.warn('arrival ping failed', e?.message || e); }
  }

  async function _evaluateAndSchedule() {
    try {
      // find schedule windows for this user
      const now = new Date();
      let shouldPoll = false;

      if (!user) return;
      const role = (user.role || '').toString().toLowerCase();

      if (role === 'parent') {
        // for each child, check upcoming events with ISO timestamps (child.upcoming[].whenISO)
        const list = children || [];
        for (const ch of list) {
          const upcoming = ch.upcoming || [];
          for (const ev of upcoming) {
            const t = ev.whenISO ? parseIso(ev.whenISO) : null;
            if (t && isWithinWindow(t, now)) {
              shouldPoll = true;
              // send immediate ping once and continue polling
              _getLocation().then((loc) => {
                if (!loc) return;
                _ping({ lat: loc.lat, lng: loc.lng, userId: user.id, role, childId: ch.id, eventId: ev.id, when: t.toISOString() });
              }).catch(() => {});
            }
          }
        }
      } else if (role === 'therapist') {
        // check user.shifts array for scheduled shifts { startISO, endISO }
        const shifts = user.shifts || [];
        for (const s of shifts) {
          const start = s.startISO ? parseIso(s.startISO) : null;
          const end = s.endISO ? parseIso(s.endISO) : null;
          if (start && end) {
            // If now is within start - DEFAULT_WINDOW_MIN ... end + DEFAULT_WINDOW_AFTER_MIN
            const windowStart = new Date(start.getTime() - DEFAULT_WINDOW_MIN * 60000);
            const windowEnd = new Date(end.getTime() + DEFAULT_WINDOW_AFTER_MIN * 60000);
            if (now >= windowStart && now <= windowEnd) {
              shouldPoll = true;
              _getLocation().then((loc) => {
                if (!loc) return;
                _ping({ lat: loc.lat, lng: loc.lng, userId: user.id, role, shiftId: s.id, when: now.toISOString() });
              }).catch(() => {});
            }
          }
        }
      }

      if (shouldPoll) {
        if (!intervalRef.current) {
          // poll every 60 seconds while in window
          intervalRef.current = setInterval(async () => {
            if (appState.current !== 'active') return; // only when active
            const loc = await _getLocation();
            if (!loc) return;
            await _ping({ lat: loc.lat, lng: loc.lng, userId: user.id, role, when: new Date().toISOString() });
          }, 60 * 1000);
        }
      } else {
        _stopInterval();
      }
    } catch (e) {
      console.warn('arrival evaluate failed', e?.message || e);
    }
  }

  return { enabled, business };
}
