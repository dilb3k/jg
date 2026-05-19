import { useState, useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useStore } from '../store';
import { useThemeStore } from '../store/themeStore';
import { canReachServer } from '../api/client';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(false);
  const syncNow = useStore((state) => state.syncNow);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const connectionMode = useThemeStore((state) => state.connectionMode);
  const isSyncingRef = useRef(false);
  const prevConnectionModeRef = useRef(connectionMode);

  const doSync = useCallback(() => {
    if (!isSyncingRef.current && connectionMode === 'online' && isAuthenticated) {
      isSyncingRef.current = true;
      syncNow()
        .catch(() => {})
        .finally(() => {
          isSyncingRef.current = false;
        });
    }
  }, [syncNow, connectionMode, isAuthenticated]);

  // Listen for network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);

      if (connected) {
        doSync();
      }
    });

    return () => unsubscribe();
  }, [doSync]);

  // Check initial state and re-sync when connectionMode changes to online
  useEffect(() => {
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);

      if (connected && connectionMode === 'online' && isAuthenticated) {
        doSync();
      }
    });
  }, []); // Only on mount

  // Trigger sync when connectionMode changes from offline to online
  useEffect(() => {
    if (prevConnectionModeRef.current === 'offline' && connectionMode === 'online') {
      NetInfo.fetch().then((state) => {
        if (state.isConnected) {
          doSync();
        }
      });
    }
    prevConnectionModeRef.current = connectionMode;
  }, [connectionMode, doSync]);

  const effectiveOnline = canReachServer();

  return {
    isOnline,
    effectiveOnline,
    connectionMode,
    isServerReachable: effectiveOnline,
  };
};
