import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useStore } from '../src/store';
import { useEffect, useState } from 'react';
import { initDatabase } from '../src/db';

export default function RootLayoutNav() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialize = useStore((state) => state.initialize);
  const isLoading = useStore((state) => state.isLoading);
  const toast = useStore((state) => state.toast);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing DB...');
        await initDatabase();
        console.log('DB initialized, initializing store...');
        await initialize();
        console.log('Store initialized');
        setIsReady(true);
      } catch (err: any) {
        console.error('Init error:', err);
        setError(err.message || 'Initialization failed');
      }
    };
    init();
  }, [initialize]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 20 }}>
        <Text style={{ color: '#ef4444', textAlign: 'center' }}>Error: {error}</Text>
      </View>
    );
  }

  if (!isReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {toast.visible && (
        <View
          style={[
            styles.toast,
            toast.type === 'success'
              ? styles.toastSuccess
              : toast.type === 'error'
                ? styles.toastError
                : styles.toastInfo,
          ]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    maxWidth: '82%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    zIndex: 9999,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  toastSuccess: { backgroundColor: 'rgba(15, 23, 42, 0.86)' },
  toastError: { backgroundColor: 'rgba(127, 29, 29, 0.92)' },
  toastInfo: { backgroundColor: 'rgba(30, 41, 59, 0.88)' },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
