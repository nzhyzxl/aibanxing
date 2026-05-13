export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET: 获取所有设置
export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('site_settings')
      .select('*')
      .order('key')

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: 更新某个设置
export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

    const { error } = await getSupabaseAdmin()
      .from('site_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
