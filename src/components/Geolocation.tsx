"use client";

import { useState, useEffect } from "react";
import { Loader2, MapPin } from "lucide-react";

interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const YANDEX_API_KEY = "9fe927df-b2cc-41aa-85e0-5a94ce96135e";

export function useGeolocation(): GeolocationData {
  const [data, setData] = useState<GeolocationData>({
    latitude: null,
    longitude: null,
    city: null,
    loading: true,
    error: null,
    refresh: () => {},
  } as GeolocationData);

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setGeolocationData({ loading: false, error: "Геолокация не поддерживается" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setGeolocationData({ latitude, longitude, loading: true });
        
        try {
          const response = await fetch(
            `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${longitude},${latitude}&format=json&results=1`
          );
          const json = await response.json();
          
          const featureMember = json.response?.GeoObjectCollection?.featureMember;
          let city = null;
          
          if (featureMember && featureMember.length > 0) {
            const geoObject = featureMember[0].GeoObject;
            const metaData = geoObject?.metaDataProperty?.GeocoderMetaData;
            const address = metaData?.Address;
            
            if (address) {
              const components = address.Components || [];
              const cityComponent = components.find((c: any) => c.kind === "locality");
              const provinceComponent = components.find((c: any) => c.kind === "province");
              
              city = cityComponent?.name || provinceComponent?.name || null;
            }
          }

          setGeolocationData({
            city,
            loading: false,
            error: city ? null : "Город не определён",
          });
        } catch (e) {
          setGeolocationData({
            city: null,
            loading: false,
            error: "Ошибка определения города",
          });
        }
      },
      (error) => {
        setGeolocationData({ 
          latitude: null, 
          longitude: null, 
          city: null, 
          loading: false, 
          error: error.code === 1 
            ? "Доступ запрещён" 
            : "Не удалось определить"
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  const refresh = () => {
    setData((prev: any) => ({ ...prev, latitude: null, longitude: null, city: null, loading: true, error: null }));
    getLocation();
  };

  const setGeolocationData = (newData: Partial<GeolocationData>) => {
    setData((prev: GeolocationData) => ({ ...prev, ...newData, refresh }));
  };

  return { ...data, refresh };
}

interface LocationDisplayProps {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
}

export function LocationDisplay({ latitude, longitude, city }: LocationDisplayProps) {
  if (!latitude || !longitude) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <MapPin className="w-4 h-4" />
      <span>{city || "Местоположение определено"}</span>
    </div>
  );
}
