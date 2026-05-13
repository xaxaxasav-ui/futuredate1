import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: favoritesData, error: favError } = await supabase
      .from('favorites')
      .select('favorited_user_id')
      .eq('user_id', userId);

    if (favError) {
      console.error('Favorites error:', favError);
      return NextResponse.json({ error: favError.message }, { status: 500 });
    }

    if (!favoritesData || favoritesData.length === 0) {
      return NextResponse.json({ favorites: [] });
    }

    const userIds = favoritesData.map((f: any) => f.favorited_user_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, city, birth_date, bio')
      .in('id', userIds);

    if (!profiles) {
      return NextResponse.json({ favorites: [] });
    }

    const favorites = profiles.map((p: any) => ({
      id: p.id,
      name: p.full_name || 'Неизвестный',
      age: p.birth_date ? calculateAge(p.birth_date) : 0,
      city: p.city || '',
      bio: p.bio || '',
      avatar_url: p.avatar_url || ''
    }));

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Server favorites error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
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