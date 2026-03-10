import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        gestureEnabled: true,
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
        gestureDirection: 'horizontal',
        contentStyle: { backgroundColor: '#FFFFFF' },
        fullScreenGestureEnabled: true,
        customAnimationOnGesture: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home', gestureEnabled: false }} />
      <Stack.Screen name="files" options={{ title: 'Files', headerShown: true }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="sessions" options={{ title: 'Study Sessions' }} />
      <Stack.Screen name="courses" options={{ title: 'Courses' }} />
      <Stack.Screen name="assignments" options={{ title: 'Assignments' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="study" options={{ title: 'Study Assistant' }} />
      <Stack.Screen name="study-plans" options={{ title: 'Study Plans' }} />
      <Stack.Screen name="study-plan-detail" options={{ title: 'Study Plan Detail' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
