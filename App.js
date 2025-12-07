import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Temporarily remove TailwindProvider if not available at runtime
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/AuthContext';
import { DataProvider } from './src/DataContext';
import UrgentMemoOverlay from './src/components/UrgentMemoOverlay';
import BottomNav from './src/components/BottomNav';
import DevRoleSwitcher from './src/components/DevRoleSwitcher';
import ErrorBoundary from './src/components/ErrorBoundary';
// navigation ref used by the global bottom nav
const navigationRef = createNavigationContainerRef();

import HomeScreen from './src/screens/HomeScreen';
import ChatsScreen from './src/screens/ChatsScreen';
import ChatThreadScreen from './src/screens/ChatThreadScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HelpScreen from './src/screens/HelpScreen';
import TherapistScheduleScreen from './src/screens/TherapistScheduleScreen';
import AdminControlsScreen from './src/screens/AdminControlsScreen';
import { HelpButton, LogoutButton } from './src/components/TopButtons';
import { View, Text } from 'react-native';

const RootStack = createNativeStackNavigator();

const ScheduleStackNav = createNativeStackNavigator();
function ScheduleStack() {
  return (
    <ScheduleStackNav.Navigator screenOptions={{ headerTitleAlign: 'center', headerLeft: () => <HelpButton />, headerRight: () => <LogoutButton /> }}>
      <ScheduleStackNav.Screen name="ScheduleMain" component={TherapistScheduleScreen} options={{ title: 'Schedule' }} />
    </ScheduleStackNav.Navigator>
  );
}

const ControlsStackNav = createNativeStackNavigator();
function ControlsStack() {
  return (
    <ControlsStackNav.Navigator screenOptions={{ headerTitleAlign: 'center', headerLeft: () => <HelpButton />, headerRight: () => <LogoutButton /> }}>
      <ControlsStackNav.Screen name="ControlsMain" component={AdminControlsScreen} options={{ title: 'Controls' }} />
    </ControlsStackNav.Navigator>
  );
}

const CommunityStackNav = createNativeStackNavigator();
function CommunityStack() {
  return (
    <CommunityStackNav.Navigator screenOptions={{ headerTitleAlign: 'center', headerLeft: () => <HelpButton />, headerRight: () => <LogoutButton /> }}>
      <CommunityStackNav.Screen name="CommunityMain" component={HomeScreen} options={{ title: 'Home' }} />
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

// MainRoutes chooses which top-level stacks to expose based on authenticated user role.
function MainRoutes() {
  const { user } = useAuth();
  const role = (user && user.role) ? (user.role || '').toString().toLowerCase() : 'parent';

  const screens = [];
  screens.push({ name: 'Home', component: CommunityStack });
  screens.push({ name: 'Chats', component: ChatsStack });

  if (role === 'therapist') {
    screens.push({ name: 'Schedule', component: ScheduleStack });
  } else if (role === 'admin' || role === 'administrator') {
    screens.push({ name: 'Controls', component: ControlsStack });
  } else {
    screens.push({ name: 'MyChild', component: MyChildStack });
  }

  screens.push({ name: 'Settings', component: SettingsStack });

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
      {screens.map(s => (
        <RootStack.Screen key={s.name} name={s.name} component={s.component} />
      ))}
    </RootStack.Navigator>
  );
}

export default function App() {
  const [problem, setProblem] = useState(null);
  const [currentRoute, setCurrentRoute] = useState('Home');

  useEffect(() => {
    const missing = [];
    if (!HomeScreen) missing.push('HomeScreen');
    if (!ChatsScreen) missing.push('ChatsScreen');
    if (!ChatThreadScreen) missing.push('ChatThreadScreen');
    if (!SettingsScreen) missing.push('SettingsScreen');
    if (!AuthProvider) missing.push('AuthProvider');
    if (!DataProvider) missing.push('DataProvider');
    if (!UrgentMemoOverlay) missing.push('UrgentMemoOverlay');
    if (missing.length) setProblem(missing);
    else setProblem(null);
    // log for Metro/console
    console.log('App imports:', { HomeScreen, ChatsScreen, ChatThreadScreen, SettingsScreen, AuthProvider, DataProvider, UrgentMemoOverlay });
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
      <ErrorBoundary>
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
                    ScheduleMain: 'Schedule',
                    ControlsMain: 'Controls',
                  };
                  setCurrentRoute(map[r.name] || r.name);
                }
              } catch (e) {
                // ignore
              }
            }}
          >
            {/* Use a root Stack that hosts per-screen stacks (keeps headers centered in nested stacks) */}
            <MainRoutes />
          </NavigationContainer>
          <BottomNav navigationRef={navigationRef} currentRoute={currentRoute} />
          <DevRoleSwitcher />
          <UrgentMemoOverlay />
        </DataProvider>
      </AuthProvider>
      </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
