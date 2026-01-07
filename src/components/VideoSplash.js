import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

export default function VideoSplash({
  source,
  durationMs = 5000,
  scale = 1,
  onReady,
  onDone,
}) {
  const videoRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const readySentRef = useRef(false);
  const doneSentRef = useRef(false);

  const safeReady = () => {
    if (readySentRef.current) return;
    readySentRef.current = true;
    onReady?.();
  };

  const safeDone = () => {
    if (doneSentRef.current) return;
    doneSentRef.current = true;
    onDone?.();
  };

  useEffect(() => {
    if (!loaded) return;

    let timeout = null;
    timeout = setTimeout(async () => {
      try {
        await videoRef.current?.stopAsync?.();
      } catch (e) {
        // ignore
      }
      safeDone();
    }, durationMs);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [loaded, durationMs, onDone]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Video
        ref={videoRef}
        style={[StyleSheet.absoluteFillObject, scale !== 1 ? { transform: [{ scale }] } : null]}
        source={source}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping
        isMuted
        onLoad={() => {
          setLoaded(true);
          safeReady();
        }}
        onError={() => {
          // If the asset can't load/decode, don't block app startup.
          safeReady();
          safeDone();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 9999,
    elevation: 9999,
  },
});
