"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, User } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const YANDEX_API_KEY = "9fe927df-b2cc-41aa-85e0-5a94ce96135e";

async function getCityFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${lon},${lat}&format=json&results=1`
    );
    const json = await response.json();
    
    const featureMember = json.response?.GeoObjectCollection?.featureMember;
    
    if (featureMember && featureMember.length > 0) {
      const geoObject = featureMember[0].GeoObject;
      const metaData = geoObject?.metaDataProperty?.GeocoderMetaData;
      const address = metaData?.Address;
      
      if (address) {
        const components = address.Components || [];
        const cityComponent = components.find((c: any) => c.kind === "locality");
        const provinceComponent = components.find((c: any) => c.kind === "province");
        
        return cityComponent?.name || provinceComponent?.name || "Город не определён";
      }
    }
    return "Город не определён";
  } catch (e) {
    console.error("Error getting city:", e);
    return "Город не определён";
  }
}

interface NearbyPerson {
  id: string;
  full_name: string;
  avatar_url: string;
  birth_date: string;
  city: string;
  latitude: number;
  longitude: number;
  distance: number;
  is_verified: boolean;
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function NearbyPage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [people, setPeople] = useState<NearbyPerson[]>([]);
  const [distance, setDistance] = useState(5);
  const [likedPerson, setLikedPerson] = useState<NearbyPerson | null>(null);
  const [loadingPeople, setLoadingPeople] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  const requestLocation = () => {
    setLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const acc = pos.coords.accuracy;
          
          setLatitude(lat);
          setLongitude(lon);
          setAccuracy(acc);
          
          const city = await getCityFromCoords(lat, lon);
          setCityName(city);
          setLoading(false);
          
          if (user && city !== "Город не определён") {
            await supabase.from('profiles').update({
              latitude: lat,
              longitude: lon,
              city: city
            }).eq('id', user.id);
          }
          
          fetchNearbyPeople(lat, lon, distance);
        },
        () => {
          setLoading(false);
          setError("Не удалось определить местоположение");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLoading(false);
      setError("Геолокация не поддерживается");
    }
  };

  const fetchNearbyPeople = async (lat: number, lon: number, radiusKm: number) => {
    setLoadingPeople(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, birth_date, city, latitude, longitude, is_verified')
        .eq('is_verified', true)
        .not('id', 'eq', user?.id)
        .not('avatar_url', 'is', null)
        .limit(50);

      if (profiles && profiles.length > 0) {
        const nearbyPeople = (profiles
          .map(p => ({
            ...p,
            distance: p.latitude && p.longitude 
              ? getDistanceFromLatLonInKm(lat, lon, p.latitude, p.longitude)
              : null
          }))
          .filter(p => p.distance !== null && p.distance <= radiusKm)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0))
          .slice(0, 30)) as NearbyPerson[];

        setPeople(nearbyPeople);
      } else {
        setPeople([]);
      }
    } catch (err) {
      console.error('Error:', err);
      setPeople([]);
    } finally {
      setLoadingPeople(false);
    }
  };

  const updateDistance = (val: number) => {
    setDistance(val);
    if (latitude && longitude) {
      fetchNearbyPeople(latitude, longitude, val);
    }
  };

  const likePerson = (person: NearbyPerson) => {
    setLikedPerson(person);
  };

  const closeLike = () => {
    setLikedPerson(null);
  };

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return PlaceHolderImages[1].imageUrl;
    return avatarUrl;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen relative pt-24 pb-12 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-24 pb-12 px-4">
      
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">💘 Знакомства рядом</h1>
          <p className="text-muted-foreground">Найди свою половинку поблизости</p>
        </div>

        {!latitude && !loading && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Определение местоположения
            </h2>
            <p className="text-muted-foreground mb-4">
              Разрешите доступ к геолокации, чтобы найти людей рядом с вами
            </p>
            {error && <p className="text-amber-500 text-sm mb-4">{error}</p>}
            <Button 
              onClick={requestLocation}
              className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Определить моё местоположение
            </Button>
          </GlassCard>
        )}

        {loading && (
          <GlassCard className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Определяем ваше местоположение...</p>
          </GlassCard>
        )}

        {latitude && !loading && !likedPerson && (
          <>
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold mb-4">✅ Вы на карте</h2>
              
              <div className="relative h-64 rounded-xl overflow-hidden mb-4">
                <iframe
                  src={`https://yandex.ru/map-widget/v1/?ll=${longitude}%2C${latitude}&z=12&pt=${longitude}%2C${latitude},pm2rdm`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  style={{ border: 0 }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">🏙️ Город</span>
                  <span className="font-medium">{cityName}</span>
                </div>
                <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">🌐 Координаты</span>
                  <span className="font-medium text-sm">{latitude?.toFixed(4)}, {longitude?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">📏 Точность</span>
                  <span className="font-medium">~{Math.round(accuracy || 0)} м</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="text-lg font-bold mb-4">👥 Люди рядом с вами</h2>
              
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Радиус поиска: <strong>{distance} км</strong></p>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={distance}
                  onChange={(e) => updateDistance(parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>

              {loadingPeople ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Загрузка анкет...</p>
                </div>
              ) : people.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {people.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => likePerson(person)}
                      className="p-3 bg-muted/30 rounded-xl text-center hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative mb-2">
                        <img 
                          src={getAvatarUrl(person.avatar_url)}
                          alt={person.full_name}
                          className="w-16 h-16 rounded-full object-cover mx-auto"
                        />
                        {person.is_verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px]">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="font-medium text-sm truncate">{person.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {person.birth_date ? calculateAge(person.birth_date) : '?'} лет
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {person.distance ? `${person.distance.toFixed(1)} км` : person.city}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Никого не найдено в этом радиусе</p>
                  <p className="text-sm text-muted-foreground/70">Попробуйте увеличить радиус поиска</p>
                </div>
              )}
            </GlassCard>
          </>
        )}

        {likedPerson && (
          <GlassCard className="p-6 text-center">
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border-4 border-pink-500">
              <img 
                src={getAvatarUrl(likedPerson.avatar_url)}
                alt={likedPerson.full_name}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-bold mb-2">
              Вы отправили 💖 для {likedPerson.full_name}
            </h2>
            <p className="text-muted-foreground mb-4">
              Если интерес взаимный — мы вас соединим! 😊
            </p>
            <Button 
              onClick={closeLike}
              variant="outline"
              className="w-full rounded-full"
            >
              ← Назад к списку
            </Button>
          </GlassCard>
        )}
      </div>
    </div>
  );
}