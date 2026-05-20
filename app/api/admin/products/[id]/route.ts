export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { translateProductToEnglish } from '@/lib/translate'

async function checkOwnership(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, productId: string, userId: string) {
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('artisan_id')
    .eq('id', productId)
    .single()
  return product?.artisan_id === userId
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const supabaseAdmin = getSupabaseAdmin()

    if (user.role === 'artisan') {
      const isOwner = await checkOwnership(supabaseAdmin, params.id, user.id)
      if (!isOwner) {
        return NextResponse.json({ error: '无权限' }, { status: 403 })
      }
    }

    // name 或 description 有变动时重新翻译
    const needsTranslation = body.name || body.description
    let translationFields = {}
    if (needsTranslation) {
      const { name_en, description_en } = await translateProductToEnglish(
        body.name ?? '',
        body.description
      )
      if (name_en) translationFields = { ...translationFields, name_en }
      if (description_en) translationFields = { ...translationFields, description_en }
    }

    const { error } = await supabaseAdmin
      .from('products')
      .update({ ...body, ...translationFields })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    if (user.role === 'artisan') {
      const isOwner = await checkOwnership(supabaseAdmin, params.id, user.id)
      if (!isOwner) {
        return NextResponse.json({ error: '无权限' }, { status: 403 })
      }
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
