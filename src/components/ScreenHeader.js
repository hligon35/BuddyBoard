import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { logger } from '../utils/logger';

export default function ScreenHeader({ title, showBack = true, left, right }) {
  const navigation = useNavigation();
  const logEvent = (ev) => {
    logger.debug('ui', `ScreenHeader:${ev}`, { title });
  };

  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => { logEvent('onPress'); navigation.goBack(); }}
          onPressIn={() => logEvent('onPressIn')}
          onPressOut={() => logEvent('onPressOut')}
          onLongPress={() => logEvent('onLongPress')}
          delayLongPress={600}
          style={styles.back}
          accessibilityLabel="Go back"
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <View style={styles.backInner}>
            <MaterialIcons name="arrow-back" size={18} color="#111827" />
            <Text style={styles.backText}>Back</Text>
          </View>
        </TouchableOpacity>
      ) : left ? (
        <View style={styles.left}>{left}</View>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.titlePlaceholder} />}

      <View style={styles.right}>{right || null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'relative', height: 56, justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  back: { position: 'absolute', left: 12, top: 8 },
  left: { position: 'absolute', left: 12, top: 8 },
  backInner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e6eef8', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  backText: { marginLeft: 6, fontSize: 14, color: '#111827', fontWeight: '700' },
  backPlaceholder: { width: 84, position: 'absolute', left: 12, top: 8 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  titlePlaceholder: { height: 0 },
  right: { position: 'absolute', right: 12, top: 8, minWidth: 34, alignItems: 'flex-end' }
});
