import { useEffect, useState, useRef } from 'react';
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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);

      if (connected && !isSyncingRef.current && connectionMode === 'online' && isAuthenticated) {
        isSyncingRef.current = true;
        syncNow()
          .catch(() => {})
          .finally(() => {
            isSyncingRef.current = false;
          });
      }
    });

    return () => unsubscribe();
  }, [syncNow, connectionMode, isAuthenticated]);

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);
    });
  }, []);

  const effectiveOnline = canReachServer();

  return {
    isOnline,
    effectiveOnline,
    connectionMode,
    isServerReachable: effectiveOnline,
  };
};
