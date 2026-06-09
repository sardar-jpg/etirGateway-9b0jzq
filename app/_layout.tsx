import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { ShipmentsProvider } from '@/contexts/ShipmentsContext';
import { DriversProvider } from '@/contexts/DriversContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { ClientsProvider } from '@/contexts/ClientsContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider, ThemeContext } from '@/contexts/ThemeContext';
import { useContext } from 'react';
import { ForceUpdateGate } from '@/components/ui/ForceUpdateGate';
import { ThemedStatusBar } from '@/components/ui/ThemedStatusBar';

// Inner layout — only rendered after theme preference is read from AsyncStorage.
// This eliminates the dark→light flash that would occur if we rendered the
// full navigator before knowing the user's saved preference.
function InnerLayout() {
  const theme = useContext(ThemeContext);
  if (!theme?.isReady) {
    // Render an opaque background matching the default dark bg while loading.
    // Typically resolves in <30ms so users never see this.
    return <View style={{ flex: 1, backgroundColor: '#0D1117' }} />;
  }
  return (
    <ForceUpdateGate>
    <LanguageProvider>
      <SafeAreaProvider>
        <AuthProvider>
        <ShipmentsProvider>
          <DriversProvider>
            <ClientsProvider>
            <ChatProvider>
                <ThemedStatusBar />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="driver" />
                  <Stack.Screen name="tracking" />
                  <Stack.Screen name="shipment-detail" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="customer" />
                  <Stack.Screen name="reset-password" />
                </Stack>
            </ChatProvider>
            </ClientsProvider>
          </DriversProvider>
        </ShipmentsProvider>
      </AuthProvider>
      </SafeAreaProvider>
    </LanguageProvider>
    </ForceUpdateGate>
  );
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <ThemeProvider>
        <InnerLayout />
      </ThemeProvider>
    </AlertProvider>
  );
}
