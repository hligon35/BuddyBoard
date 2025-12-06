import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, StatusBar } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import MessagesScreen from './screens/MessagesScreen';
import MessageDetailScreen from './screens/MessageDetailScreen';
import ComposeMessageScreen from './screens/ComposeMessageScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import AdminScreen from './screens/AdminScreen';
import UrgentMemosScreen from './screens/UrgentMemosScreen';
import { DataProvider } from './src/DataContext';
import { AuthProvider } from './src/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
      <DataProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="MessageDetail" component={MessageDetailScreen} options={{ title: 'Message' }} />
          <Stack.Screen name="ComposeMessage" component={ComposeMessageScreen} options={{ title: 'Compose' }} />
          <Stack.Screen name="UrgentMemos" component={UrgentMemosScreen} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
        </Stack.Navigator>
      </SafeAreaView>
      </DataProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
