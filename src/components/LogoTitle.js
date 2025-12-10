import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

export default function LogoTitle() {
  return (
    <View style={styles.wrap}>
      <Image source={require('../../assets/icons/buddyBoard.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 0, paddingHorizontal: 0, marginVertical: -6 },
  logo: { height: 48, width: 220 },
});
