import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
        gestureEnabled: false,
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <Stack.Screen 
        name="signup" 
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="login"
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
