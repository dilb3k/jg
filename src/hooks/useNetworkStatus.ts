import { useEffect, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useStore } from '../store';
import { useFocusEffect } from '@react-navigation/native';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(false);
  const syncStatus = useStore((state) => state.syncStatus);
  const syncNow = useStore((state) => state.syncNow);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? false;
      setIsOnline((prev) => {
        if (online && !prev) {
          syncNow();
        }
        return online;
      });
    });

    return () => unsubscribe();
  }, [syncNow]);

  useFocusEffect(
    useCallback(() => {
      NetInfo.fetch().then((state) => {
        setIsOnline(state.isConnected ?? false);
        if (state.isConnected) {
          syncNow();
        }
      });
    }, [syncNow])
  );

  return { isOnline, syncStatus };
};