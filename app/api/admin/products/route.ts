export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { translateProductToEnglish } from '@/lib/translate'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const artisanId = request.nextUrl.searchParams.get('artisan_id')

    let query = supabaseAdmin
      .from('products')
      .select('*, artisan:artisan_id(*)')
      .order('created_at', { ascending: false })

    if (artisanId) {
      query = query.eq('artisan_id', artisanId)
    }

    const { data } = await query
    return NextResponse.json(data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabaseAdmin = getSupabaseAdmin()

    // 自动翻译中文内容为英文
    const { name_en, description_en } = await translateProductToEnglish(
      body.name,
      body.description
    )

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({ ...body, is_published: false, name_en, description_en })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
