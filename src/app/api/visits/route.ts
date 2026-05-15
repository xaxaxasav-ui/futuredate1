import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: visits, error } = await supabase
      .from('page_visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Visits error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: totalCount } = await supabase
      .from('page_visits')
      .select('id', { count: 'exact', head: true });

    const { data: todayCount } = await supabase
      .from('page_visits')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());

    const { data: uniqueUsers } = await supabase
      .from('page_visits')
      .select('visitor_id')
      .not('visitor_id', 'is', null);

    const uniqueUserIds = uniqueUsers ? [...new Set(uniqueUsers.map(v => v.visitor_id))] : [];

    return NextResponse.json({
      visits: visits || [],
      total: totalCount?.length || 0,
      today: todayCount?.length || 0,
      uniqueUsers: uniqueUserIds.length
    });
  } catch (error) {
    console.error('Server visits error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const body = await request.json();
    
    const { visitor_id, page, metadata } = body;

    const { data, error } = await supabase
      .from('page_visits')
      .insert({
        visitor_id,
        page,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server visits error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}