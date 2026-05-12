'use client';

const CACHE_PREFIX = 'cache_';
const DEFAULT_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;
    
    const entry: CacheEntry<T> = JSON.parse(item);
    const now = Date.now();
    
    if (now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  if (typeof window === 'undefined') return;
  
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

export function clearCache(key?: string): void {
  if (typeof window === 'undefined') return;
  
  if (key) {
    localStorage.removeItem(CACHE_PREFIX + key);
  } else {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  }
}

export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL,
  forceRefresh: boolean = false
): Promise<T> {
  if (!forceRefresh) {
    const cached = getCache<T>(key);
    if (cached !== null) {
      return cached;
    }
  }
  
  try {
    const data = await fetchFn();
    setCache(key, data, ttl);
    return data;
  } catch (error) {
    const cached = getCache<T>(key);
    if (cached !== null) {
      console.log('Using cached data due to fetch error');
      return cached;
    }
    throw error;
  }
}