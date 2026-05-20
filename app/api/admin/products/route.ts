export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { translateProductToEnglish } from '@/lib/translate'


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    const supabaseAdmin = getSupabaseAdmin()

    let query = supabaseAdmin
      .from('products')
      .select('*, artisan:artisan_id(*)')
      .order('created_at', { ascending: false })

    if (user?.role === 'artisan') {
      query = query.eq('artisan_id', user.id)
    }

    const { data } = await query
    return NextResponse.json(data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const supabaseAdmin = getSupabaseAdmin()

    // 匠人只能给自己创建产品
    const artisanId = user.role === 'artisan' ? user.id : body.artisan_id

    // 自动翻译中文内容为英文
    const { name_en, description_en } = await translateProductToEnglish(
      body.name,
      body.description
    )

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({ ...body, artisan_id: artisanId, is_published: false, name_en, description_en })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
