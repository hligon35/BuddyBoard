import React from 'react';
import { View } from 'react-native';
import ScreenHeader from './ScreenHeader';
import { useNavigation, useRoute } from '@react-navigation/native';

export function ScreenWrapper({ children, style, hideBanner = false, bannerShowBack, bannerTitle, bannerRight }) {
  const navigation = useNavigation();
  const route = useRoute();

  const nameMap = {
    CommunityMain: 'Home',
    PostThread: 'Post',
    ChatsList: 'Chats',
    ChatThread: 'Thread',
    MyChildMain: 'My Child',
    SettingsMain: 'Profile Settings',
    ScheduleMain: 'Schedule',
    ControlsMain: 'App Controls',
    StudentDirectory: 'Student Directory',
    ParentDirectory: 'Parent Directory',
    FacultyDirectory: 'Faculty Directory',
    ChildDetail: 'Student',
    FacultyDetail: 'Faculty',
    ManagePermissions: 'Manage Permissions',
    PrivacyDefaults: 'Profile Settings',
    ManageUsers: 'Manage Users',
    ModeratePosts: 'Moderate Posts',
    SystemSettings: 'Profile Settings',
    ExportData: 'Export Data',
  };

  const title = bannerTitle || nameMap[route?.name] || route?.name || '';
  const computedShowBack = navigation && navigation.canGoBack && navigation.canGoBack() && title !== 'Home';
  const showBack = (typeof bannerShowBack === 'boolean') ? bannerShowBack : computedShowBack;

  return (
    <View style={[{ flex: 1, backgroundColor: '#fff' }, style]}>
      {!hideBanner && <ScreenHeader title={title} showBack={showBack} right={bannerRight} />}
      {children}
      {/* spacer to prevent bottom nav from overlapping content */}
      <View style={{ height: 88 }} accessibilityElementsHidden importantForAccessibility="no" />
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
