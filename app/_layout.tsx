import { Stack } from "expo-router";
import { BluetoothProvider } from "../context/BluetoothContext";

export default function Layout() {
  return (
    <BluetoothProvider>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade',
          statusBarTranslucent: true,
          statusBarStyle: 'dark',
        }} 
      />
    </BluetoothProvider>
  );
}
