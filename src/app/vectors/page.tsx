"use client";

import { useState, useEffect } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, RotateCcw, Sparkles, Users, Heart, Target, MapPin, Ruler, Calendar, Filter } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const CITY_SUGGESTIONS = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
  "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
  "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград"
];

const TRAIT_OPTIONS = [
  "Эмпат", "Лидер", "Творческий", "Аналитик", "Коммуникабельный",
  "Оптимист", "Интроверт", "Экстраверт", "Спортсмен", "Музыкант",
  "Путешественник", "Читатель", "Киноман", "Гурман", "Искатель приключений"
];

const HOBBY_OPTIONS = [
  "Музыка", "Чтение", "Фотография", "Игры", "Программирование",
  "Природа", "Кулинария", "Спорт", "Путешествия", "Кино",
  "Танцы", "Рисование", "Писательство", "Йога", "Автомобили"
];

function VectorsPage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  
  const [preferences, setPreferences] = useState({
    looking_for_age_min: 18,
    looking_for_age_max: 45,
    looking_for_height_min: 155,
    looking_for_height_max: 190,
    looking_for_gender: "female",
    city: "",
    traits: [] as string[],
    hobbies: [] as string[],
    weights: {
      age: 30,
      height: 20,
      city: 25,
      traits: 40,
      hobbies: 35
    }
  });

  useEffect(() => {
    if (!authLoading) {
      setShowContent(true);
      if (!user) {
        router.push("/auth");
      }
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('preferences, looking_for_age_min, looking_for_age_max, looking_for_height_min, looking_for_height_max, looking_for_gender, city, traits, hobbies')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setPreferences(prev => ({
            ...prev,
            looking_for_age_min: data.looking_for_age_min || 18,
            looking_for_age_max: data.looking_for_age_max || 45,
            looking_for_height_min: data.looking_for_height_min || 155,
            looking_for_height_max: data.looking_for_height_max || 190,
            looking_for_gender: data.looking_for_gender || "female",
            city: data.city || "",
            traits: data.traits || [],
            hobbies: data.hobbies || [],
            ...(data.preferences || {})
          }));
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          looking_for_age_min: preferences.looking_for_age_min,
          looking_for_age_max: preferences.looking_for_age_max,
          looking_for_height_min: preferences.looking_for_height_min,
          looking_for_height_max: preferences.looking_for_height_max,
          looking_for_gender: preferences.looking_for_gender,
          city: preferences.city,
          traits: preferences.traits,
          hobbies: preferences.hobbies,
          preferences: {
            weights: preferences.weights
          }
        })
        .eq('id', user.id);
      
      alert("Настройки сохранены!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const toggleTrait = (trait: string) => {
    setPreferences(prev => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter(t => t !== trait)
        : [...prev.traits, trait]
    }));
  };

  const toggleHobby = (hobby: string) => {
    setPreferences(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby]
    }));
  };

  const resetFilters = () => {
    setPreferences({
      looking_for_age_min: 18,
      looking_for_age_max: 45,
      looking_for_height_min: 155,
      looking_for_height_max: 190,
      looking_for_gender: "female",
      city: "",
      traits: [],
      hobbies: [],
      weights: {
        age: 30,
        height: 20,
        city: 25,
        traits: 40,
        hobbies: 35
      }
    });
  };

  if ((authLoading || loading) && !showContent) {
    return (
      <div className="min-h-screen relative pt-24 pb-12 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-headline">Настройка векторов</h1>
            <p className="text-muted-foreground">Настройте параметры поиска и веса совместимости</p>
          </div>
          <Button variant="outline" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Сбросить
          </Button>
        </header>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">
              <Filter className="w-4 h-4 mr-2" />
              Поиск
            </TabsTrigger>
            <TabsTrigger value="interests">
              <Sparkles className="w-4 h-4 mr-2" />
              Интересы
            </TabsTrigger>
            <TabsTrigger value="weights">
              <Target className="w-4 h-4 mr-2" />
              Веса
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <GlassCard className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Кого ищу</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Пол</Label>
                    <select
                      value={preferences.looking_for_gender}
                      onChange={(e) => setPreferences(prev => ({ ...prev, looking_for_gender: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-input"
                    >
                      <option value="female">Женщина</option>
                      <option value="male">Мужчина</option>
                      <option value="other">Любой</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Город</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Любой город"
                        value={preferences.city}
                        onChange={(e) => setPreferences(prev => ({ ...prev, city: e.target.value }))}
                        className="pl-10"
                        list="cities"
                      />
                      <datalist id="cities">
                        {CITY_SUGGESTIONS.map(city => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Возраст</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>От {preferences.looking_for_age_min} лет</span>
                    <span>До {preferences.looking_for_age_max} лет</span>
                  </div>
                  <Slider
                    value={[preferences.looking_for_age_min, preferences.looking_for_age_max]}
                    onValueChange={([min, max]) => setPreferences(prev => ({ 
                      ...prev, 
                      looking_for_age_min: min, 
                      looking_for_age_max: max 
                    }))}
                    min={18}
                    max={70}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Рост</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>От {preferences.looking_for_height_min} см</span>
                    <span>До {preferences.looking_for_height_max} см</span>
                  </div>
                  <Slider
                    value={[preferences.looking_for_height_min, preferences.looking_for_height_max]}
                    onValueChange={([min, max]) => setPreferences(prev => ({ 
                      ...prev, 
                      looking_for_height_min: min, 
                      looking_for_height_max: max 
                    }))}
                    min={140}
                    max={210}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="interests">
            <GlassCard className="p-8 space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Черты характера</h2>
                <p className="text-sm text-muted-foreground">Выберите черты, которые вам важны в партнёре</p>
                <div className="flex flex-wrap gap-2">
                  {TRAIT_OPTIONS.map(trait => (
                    <Button
                      key={trait}
                      variant={preferences.traits.includes(trait) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTrait(trait)}
                      className="rounded-full"
                    >
                      {trait}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold">Интересы и хобби</h2>
                <p className="text-sm text-muted-foreground">Выберите интересы, которыми должен увлекаться ваш партнёр</p>
                <div className="flex flex-wrap gap-2">
                  {HOBBY_OPTIONS.map(hobby => (
                    <Button
                      key={hobby}
                      variant={preferences.hobbies.includes(hobby) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleHobby(hobby)}
                      className="rounded-full"
                    >
                      {hobby}
                    </Button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="weights">
            <GlassCard className="p-8 space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Веса совместимости</h2>
                <p className="text-sm text-muted-foreground">Настройте важность каждого фактора при подборе пары (сумма = 100%)</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Возраст</Label>
                    <span className="text-primary font-bold">{preferences.weights.age}%</span>
                  </div>
                  <Slider
                    value={[preferences.weights.age]}
                    onValueChange={([val]) => setPreferences(prev => ({ 
                      ...prev, 
                      weights: { ...prev.weights, age: val } 
                    }))}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Рост</Label>
                    <span className="text-primary font-bold">{preferences.weights.height}%</span>
                  </div>
                  <Slider
                    value={[preferences.weights.height]}
                    onValueChange={([val]) => setPreferences(prev => ({ 
                      ...prev, 
                      weights: { ...prev.weights, height: val } 
                    }))}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Город</Label>
                    <span className="text-primary font-bold">{preferences.weights.city}%</span>
                  </div>
                  <Slider
                    value={[preferences.weights.city]}
                    onValueChange={([val]) => setPreferences(prev => ({ 
                      ...prev, 
                      weights: { ...prev.weights, city: val } 
                    }))}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Черты характера</Label>
                    <span className="text-primary font-bold">{preferences.weights.traits}%</span>
                  </div>
                  <Slider
                    value={[preferences.weights.traits]}
                    onValueChange={([val]) => setPreferences(prev => ({ 
                      ...prev, 
                      weights: { ...prev.weights, traits: val } 
                    }))}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Интересы</Label>
                    <span className="text-primary font-bold">{preferences.weights.hobbies}%</span>
                  </div>
                  <Slider
                    value={[preferences.weights.hobbies]}
                    onValueChange={([val]) => setPreferences(prev => ({ 
                      ...prev, 
                      weights: { ...prev.weights, hobbies: val } 
                    }))}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between font-bold">
                    <span>Итого:</span>
                    <span className={preferences.weights.age + preferences.weights.height + preferences.weights.city + preferences.weights.traits + preferences.weights.hobbies === 100 ? "text-green-500" : "text-red-500"}>
                      {preferences.weights.age + preferences.weights.height + preferences.weights.city + preferences.weights.traits + preferences.weights.hobbies}%
                    </span>
                  </div>
                  {preferences.weights.age + preferences.weights.height + preferences.weights.city + preferences.weights.traits + preferences.weights.hobbies !== 100 && (
                    <p className="text-xs text-red-400 mt-1">Сумма весов должна равняться 100%</p>
                  )}
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Отмена
          </Button>
          <Button className="rounded-full neo-glow" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VectorsPage;
