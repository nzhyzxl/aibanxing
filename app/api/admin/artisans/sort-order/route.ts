export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { id, sort_order } = await req.json()

    if (!id || typeof sort_order !== 'number') {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
    }

    const { error } = await getSupabaseAdmin()
      .from('users')
      .update({ sort_order })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
