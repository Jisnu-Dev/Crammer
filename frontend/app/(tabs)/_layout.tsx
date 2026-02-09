import { Stack } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        gestureEnabled: false, // Disable swipe back to prevent going to auth screens
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
