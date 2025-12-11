import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LogoTitle() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>BuddyBoard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 0, paddingHorizontal: 0, marginVertical: -6 },
  text: { fontSize: 20, fontWeight: '800', color: '#5a20c5ff' },
});
