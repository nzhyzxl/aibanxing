export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { id, is_published } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    if (user.role === 'artisan') {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('artisan_id')
        .eq('id', id)
        .single()

      if (product?.artisan_id !== user.id) {
        return NextResponse.json({ error: '无权限' }, { status: 403 })
      }
    }

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
