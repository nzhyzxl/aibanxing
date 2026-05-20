export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { translateProductToEnglish } from '@/lib/translate'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabaseAdmin = getSupabaseAdmin()

    // name 或 description 有变动时自动重新翻译
    const translationFields: Record<string, string> = {}
    if (body.name || body.description) {
      const { name_en, description_en } = await translateProductToEnglish(
        body.name ?? '',
        body.description
      )
      if (name_en) translationFields.name_en = name_en
      if (description_en) translationFields.description_en = description_en
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
    const supabaseAdmin = getSupabaseAdmin()

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
