import { useState, useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useThemeStore } from '../store/themeStore';
import { useStore } from '../store';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [justWentOffline, setJustWentOffline] = useState(false);
  const setConnectionMode = useThemeStore((state) => state.setConnectionMode);
  const prevOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);

      if (prevOnlineRef.current !== null) {
        if (prevOnlineRef.current && !connected) {
          setJustWentOffline(true);
        }
        if (!prevOnlineRef.current && connected) {
          useStore.getState().syncNow().catch(() => {});
        }
      }
      prevOnlineRef.current = connected;

      setConnectionMode(connected ? 'online' : 'offline');
    });

    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);
      prevOnlineRef.current = connected;
      setConnectionMode(connected ? 'online' : 'offline');
    });

    return () => unsubscribe();
  }, [setConnectionMode]);

  const clearOfflineFlag = useCallback(() => {
    setJustWentOffline(false);
  }, []);

  return {
    isOnline,
    justWentOffline,
    clearOfflineFlag,
  };
};
