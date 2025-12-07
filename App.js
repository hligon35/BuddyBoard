import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Temporarily remove TailwindProvider if not available at runtime
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider } from './src/AuthContext';
import { DataProvider } from './src/DataContext';
import UrgentMemoOverlay from './src/components/UrgentMemoOverlay';
import BottomNav from './src/components/BottomNav';
// navigation ref used by the global bottom nav
const navigationRef = createNavigationContainerRef();

import CommunityWallScreen from './src/screens/CommunityWallScreen';
import ChatsScreen from './src/screens/ChatsScreen';
import ChatThreadScreen from './src/screens/ChatThreadScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HelpScreen from './src/screens/HelpScreen';
import { HelpButton, LogoutButton } from './src/components/TopButtons';
import { View, Text } from 'react-native';

const RootStack = createNativeStackNavigator();

const CommunityStackNav = createNativeStackNavigator();
function CommunityStack() {
  return (
    <CommunityStackNav.Navigator screenOptions={{ headerTitleAlign: 'center', headerLeft: () => <HelpButton />, headerRight: () => <LogoutButton /> }}>
      <CommunityStackNav.Screen name="CommunityMain" component={CommunityWallScreen} options={{ title: 'Home' }} />
      <CommunityStackNav.Screen name="PostThread" component={require('./src/screens/PostThreadScreen').default} options={{ title: 'Post' }} />
    </CommunityStackNav.Navigator>
  );
}

const MyChildStackNav = createNativeStackNavigator();
function MyChildStack() {
  return (
    <MyChildStackNav.Navigator screenOptions={{ headerTitleAlign: 'center', headerLeft: () => <HelpButton />, headerRight: () => <LogoutButton /> }}>
      <MyChildStackNav.Screen name="MyChildMain" component={require('./src/screens/MyChildScreen').default} options={{ title: 'My Child' }} />
    </MyChildStackNav.Navigator>
  );
}

const ChatsStackNav = createNativeStackNavigator();
function ChatsStack() {
  return (
    <ChatsStackNav.Navigator screenOptions={{ headerTitleAlign: 'center', headerLeft: () => <HelpButton />, headerRight: () => <LogoutButton /> }}>
      <ChatsStackNav.Screen name="ChatsList" component={ChatsScreen} options={{ title: 'Chats' }} />
      <ChatsStackNav.Screen name="ChatThread" component={ChatThreadScreen} options={{ title: 'Thread' }} />
    </ChatsStackNav.Navigator>
  );
}

const SettingsStackNav = createNativeStackNavigator();
function SettingsStack() {
  return (
    <SettingsStackNav.Navigator screenOptions={{ headerTitleAlign: 'center', headerLeft: () => <HelpButton />, headerRight: () => <LogoutButton /> }}>
      <SettingsStackNav.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'Settings' }} />
      <SettingsStackNav.Screen name="Help" component={HelpScreen} options={{ title: 'Help' }} />
    </SettingsStackNav.Navigator>
  );
}

export default function App() {
  const [problem, setProblem] = useState(null);
  const [currentRoute, setCurrentRoute] = useState('Home');

  useEffect(() => {
    const missing = [];
    if (!CommunityWallScreen) missing.push('CommunityWallScreen');
    if (!ChatsScreen) missing.push('ChatsScreen');
    if (!ChatThreadScreen) missing.push('ChatThreadScreen');
    if (!SettingsScreen) missing.push('SettingsScreen');
    if (!AuthProvider) missing.push('AuthProvider');
    if (!DataProvider) missing.push('DataProvider');
    if (!UrgentMemoOverlay) missing.push('UrgentMemoOverlay');
    if (missing.length) setProblem(missing);
    else setProblem(null);
    // log for Metro/console
    console.log('App imports:', { CommunityWallScreen, ChatsScreen, ChatThreadScreen, SettingsScreen, AuthProvider, DataProvider, UrgentMemoOverlay });
  }, []);

  if (problem && problem.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Missing components detected</Text>
        <Text>{problem.join(', ')}</Text>
        <Text style={{ marginTop: 12, color: '#666' }}>Check the import paths and default exports for those files.</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" translucent={false} />
      <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <NavigationContainer
          ref={navigationRef}
          onStateChange={() => {
            try {
              const r = navigationRef.getCurrentRoute();
              if (r && r.name) {
                // Map nested route names back to top-level stack keys so BottomNav highlights correctly
                const map = {
                  CommunityMain: 'Home',
                  PostThread: 'Home',
                  ChatsList: 'Chats',
                  ChatThread: 'Chats',
                  MyChildMain: 'MyChild',
                  SettingsMain: 'Settings',
                };
                setCurrentRoute(map[r.name] || r.name);
              }
            } catch (e) {
              // ignore
            }
          }}
        >
          {/* Use a root Stack that hosts per-screen stacks (keeps headers centered in nested stacks) */}
          <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
            <RootStack.Screen name="Home" component={CommunityStack} />
            <RootStack.Screen name="Chats" component={ChatsStack} />
            <RootStack.Screen name="MyChild" component={MyChildStack} />
            <RootStack.Screen name="Settings" component={SettingsStack} />
          </RootStack.Navigator>
          </NavigationContainer>
          <BottomNav navigationRef={navigationRef} currentRoute={currentRoute} />
          <UrgentMemoOverlay />
        </DataProvider>
      </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
