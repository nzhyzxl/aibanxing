import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * 从请求 cookie 中提取 Supabase session 并返回当前用户信息。
 * 兼容两种 cookie 格式：
 *   旧版（单 cookie）：sb-xxx-auth-token=VALUE
 *   新版（拆包）：sb-xxx-auth-token.0=PART1; sb-xxx-auth-token.1=PART2
 */
export async function getCurrentUser(request: Request) {
  const cookie = request.headers.get('cookie') || ''

  let tokenRaw = ''

  // 优先尝试旧格式（整体单 cookie）
  const single = cookie.match(/sb-.+?-auth-token=([^;]+)/)
  if (single) {
    tokenRaw = single[1]
  } else {
    // 新格式：拆包 cookie，按 chunk index 排序后拼接
    const chunks = Array.from(cookie.matchAll(/sb-.+?-auth-token\.(\d+)=([^;]+)/g))
    if (chunks.length > 0) {
      tokenRaw = chunks
        .sort((a, b) => parseInt(a[1]) - parseInt(b[1]))
        .map(m => m[2])
        .join('')
    }
  }

  if (!tokenRaw) return null

  try {
    const tokenData = JSON.parse(decodeURIComponent(tokenRaw))
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
