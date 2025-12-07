import React from 'react';
import { View } from 'react-native';

export function ScreenWrapper({ children, style }) {
  return (
    <View style={[{ flex: 1, backgroundColor: '#fff' }, style]}>
      {children}
    </View>
  );
}

export function CenteredContainer({ children, contentStyle }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', padding: 16 }}>
      <View style={[{ width: '100%', maxWidth: 720 }, contentStyle]}>{children}</View>
    </View>
  );
}

export default ScreenWrapper;
