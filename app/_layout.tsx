import { Stack } from "expo-router";
import { BluetoothProvider } from "../context/BluetoothContext";
import { DownloadProvider } from "../context/DownloadContext";

export default function Layout() {
  return (
    <DownloadProvider>
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
    </DownloadProvider>
  );
}
