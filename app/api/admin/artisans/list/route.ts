export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('role', 'artisan')
      .eq('status', 'active')
      .order('name')

    return NextResponse.json(data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
