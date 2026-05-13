import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/auth/wechat-bind-status?token=xxx
// PC端轮询，检查手机是否已扫码绑定
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('wechat_bind_tokens')
    .select('status, openid, expires_at')
    .eq('token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ status: 'not_found' }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  // 检查是否过期
  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ status: 'expired' }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  return NextResponse.json({ status: data.status }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
