import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

export default function VideoSplash({
  source,
  durationMs = 5000,
  onReady,
  onDone,
}) {
  const videoRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const readySentRef = useRef(false);

  useEffect(() => {
    if (!loaded) return;

    let timeout = null;
    timeout = setTimeout(async () => {
      try {
        await videoRef.current?.stopAsync?.();
      } catch (e) {
        // ignore
      }
      onDone?.();
    }, durationMs);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [loaded, durationMs, onDone]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Video
        ref={videoRef}
        style={StyleSheet.absoluteFillObject}
        source={source}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        onLoad={() => {
          setLoaded(true);
          if (!readySentRef.current) {
            readySentRef.current = true;
            onReady?.();
          }
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
