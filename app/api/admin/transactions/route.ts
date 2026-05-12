import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const artisanId = request.nextUrl.searchParams.get('artisan_id')
    if (!artisanId) {
      return NextResponse.json({ error: 'Missing artisan_id' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const [txRes, prodRes] = await Promise.all([
      supabaseAdmin
        .from('transactions')
        .select('*, product:product_id(name, images), referrer:referrer_id(name, wechat_nickname)')
        .eq('artisan_id', artisanId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('products')
        .select('id, name')
        .eq('artisan_id', artisanId)
        .eq('is_published', true),
    ])

    let referrers: any[] = []
    if (prodRes.data && prodRes.data.length > 0) {
      const productIds = prodRes.data.map((p: any) => p.id)
      const { data: logData } = await supabaseAdmin
        .from('ref_logs')
        .select('ref_user_id, user:ref_user_id(id, name, wechat_nickname)')
        .in('product_id', productIds)

      const uniqueMap = new Map<string, any>()
      ;(logData || []).forEach((r: any) => {
        if (r.user && !uniqueMap.has(r.ref_user_id)) {
          uniqueMap.set(r.ref_user_id, r.user)
        }
      })
      referrers = Array.from(uniqueMap.values())
    }

    return NextResponse.json({
      transactions: txRes.data || [],
      products: prodRes.data || [],
      referrers,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin.from('transactions').insert(body)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
