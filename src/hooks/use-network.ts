'use client';

import { useState, useEffect, useCallback } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || null);
      
      const handleChange = () => {
        setConnectionType(connection.effectiveType || null);
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
  
  return { isOnline, connectionType };
}

export function NetworkStatusIndicator() {
  const { isOnline, connectionType } = useNetworkStatus();
  
  if (isOnline && (!connectionType || connectionType === '4g')) {
    return null;
  }
  
  return (
    <div className="fixed bottom-20 left-4 z-50 px-3 py-2 rounded-lg text-sm backdrop-blur-md bg-yellow-500/90 text-black flex items-center gap-2">
      {!isOnline ? (
        <>
          <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
          Нет подключения
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-black" />
          Медленное соединение ({connectionType})
        </>
      )}
    </div>
  );
}