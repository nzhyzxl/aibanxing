import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * 从请求 cookie 中提取 Supabase session 并返回当前用户信息。
 * 返回 null 表示未登录或 token 无效。
 */
export async function getCurrentUser(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const matches = cookie.match(/sb-.+?-auth-token=([^;]+)/)
  if (!matches) return null

  try {
    const tokenData = JSON.parse(decodeURIComponent(matches[1]))
    const supabaseAdmin = getSupabaseAdmin()
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(tokenData.access_token)
    if (error || !user) return null

    const { data } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    return data as { id: string; role: string } | null
  } catch {
    return null
  }
}
