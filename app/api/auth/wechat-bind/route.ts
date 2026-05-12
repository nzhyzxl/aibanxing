import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// POST /api/auth/wechat-bind
// 由后台调用，生成绑定token，返回供手机扫描的链接
export async function POST(req: NextRequest) {
  // 验证登录态
  const { data: { session } } = await supabase.auth.getSession()
  // 服务端拿不到 session，改从 Authorization header 取
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

  // 写入数据库
  const { error } = await supabaseAdmin
    .from('wechat_bind_tokens')
    .insert({ token, user_id: user.id })

  if (error) {
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!
  // 这个链接在手机微信里打开，会走授权流程
  const bindUrl = `${baseUrl}/wechat-bind?token=${token}`

  return NextResponse.json({ token, bindUrl })
}
