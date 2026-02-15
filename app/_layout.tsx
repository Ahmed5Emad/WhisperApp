import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, // This hides the top bar with the filename
        animation: 'fade',  // Optional: makes transitions smoother
        statusBarTranslucent: true, // Optional: lets your background go under the status bar
        statusBarStyle: 'dark', // Optional: makes time/battery icons black
      }} 
    />
  );
}