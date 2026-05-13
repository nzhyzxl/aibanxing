export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { id, is_published } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_published })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
