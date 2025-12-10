import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ScreenHeader({ title, showBack = true, right }) {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
      ) : <View style={styles.backPlaceholder} />}

      {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.titlePlaceholder} />}

      <View style={styles.right}>{right || null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'relative', height: 56, justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  back: { position: 'absolute', left: 12, top: 16, padding: 6 },
  backPlaceholder: { width: 34, position: 'absolute', left: 12, top: 16 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  titlePlaceholder: { height: 0 },
  right: { position: 'absolute', right: 12, top: 12, minWidth: 34, alignItems: 'flex-end' }
});
