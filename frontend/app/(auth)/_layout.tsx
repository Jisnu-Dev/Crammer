import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
        gestureEnabled: false, // Disable swipe back gesture
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
