'use client';

import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string | null;
  usingCachedData: boolean;
  lastOnline: number | null;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    connectionType: null,
    usingCachedData: false,
    lastOnline: typeof window !== 'undefined' ? Date.now() : null
  });

  const setUsingCachedData = useCallback((using: boolean) => {
    setStatus(prev => ({ ...prev, usingCachedData: using }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        lastOnline: Date.now()
      }));
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        usingCachedData: true
      }));
    };

    setStatus(prev => ({
      ...prev,
      isOnline: navigator.onLine
    }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setStatus(prev => ({ ...prev, connectionType: connection.effectiveType || null }));

      const handleChange = () => {
        setStatus(prev => ({ ...prev, connectionType: connection.effectiveType || null }));
      };

      connection.addEventListener('change', handleChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { ...status, setUsingCachedData };
}

export function NetworkStatusIndicator() {
  const { isOnline, connectionType, usingCachedData } = useNetworkStatus();

  if (isOnline && !usingCachedData && (!connectionType || connectionType === '4g')) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-50 px-4 py-3 rounded-xl backdrop-blur-md border border-yellow-500/30 text-sm flex items-center gap-3 shadow-lg"
      style={{
        backgroundColor: usingCachedData ? 'rgba(245, 158, 11, 0.95)' : 'rgba(239, 68, 68, 0.95)',
        color: 'black'
      }}
    >
      {!isOnline ? (
        <>
          <span className="w-3 h-3 rounded-full bg-black animate-pulse" />
          <div>
            <div className="font-semibold">Нет подключения</div>
            <div className="text-xs opacity-80">Используются кэшированные данные</div>
          </div>
        </>
      ) : usingCachedData ? (
        <>
          <span className="w-3 h-3 rounded-full bg-black" />
          <div>
            <div className="font-semibold">Офлайн режим</div>
            <div className="text-xs opacity-80">Показаны сохранённые данные</div>
          </div>
        </>
      ) : (
        <>
          <span className="w-3 h-3 rounded-full bg-black" />
          <div>
            <div className="font-semibold">Медленное соединение ({connectionType})</div>
            <div className="text-xs opacity-80">Загрузка может занять больше времени</div>
          </div>
        </>
      )}
    </div>
  );
}