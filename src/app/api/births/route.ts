import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's farm_id
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('farm_id')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole) {
      return NextResponse.json(
        { error: 'User farm not found' },
        { status: 403 }
      );
    }

    // Insert birth record
    const { data: birth, error: birthError } = await supabase
      .from('births')
      .insert({
        ...body,
        user_id: user.id,
        farm_id: userRole.farm_id
      })
      .select()
      .single();

    if (birthError) {
      console.error('Birth insert error:', birthError);
      return NextResponse.json(
        { error: 'Failed to create birth record: ' + birthError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      birth: birth
    });

  } catch (error) {
    console.error('Birth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}