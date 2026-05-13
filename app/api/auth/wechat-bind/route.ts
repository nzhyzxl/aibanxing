import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// POST /api/auth/wechat-bind
// 由后台调用，生成绑定token，返回供手机扫描的链接
export async function POST(req: NextRequest) {
  // 验证登录态
  const authHeader = req.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // 验证 token，获取 user_id
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 生成随机 token
  const token = crypto.randomUUID().replace(/-/g, '')

  // 写入数据库（10分钟有效期）
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  const { error } = await supabaseAdmin
    .from('wechat_bind_tokens')
    .insert({ token, user_id: user.id, status: 'pending', expires_at: expiresAt })

  if (error) {
    console.error('[wechat-bind] insert error:', error)
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!
  const bindUrl = `${baseUrl}/wechat-bind?token=${token}`

  console.log('[wechat-bind] token created:', { token, bindUrl, expiresAt })

  return NextResponse.json({ token, bindUrl })
}
