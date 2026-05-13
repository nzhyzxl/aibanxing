import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const stateRaw = req.nextUrl.searchParams.get('state') || ''
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/zh?error=wechat_auth_failed`)
  }

  let redirect = '/zh'
  let ref = ''
  try {
    const state = JSON.parse(decodeURIComponent(stateRaw))
    redirect = state.redirect || '/zh'
    ref = state.ref || ''
  } catch {}

  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Step 1: code 换 access_token + openid
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.NEXT_PUBLIC_WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`
    )
    const tokenData = await tokenRes.json()
    if (!tokenData.openid) {
      return NextResponse.redirect(`${baseUrl}/zh?error=wechat_auth_failed`)
    }

    // Step 2: 获取用户昵称和头像
    const userRes = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`
    )
    const wxUser = await userRes.json()

    // Step 3: 查找或创建平台用户
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wechat_openid', tokenData.openid)
      .single()

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      await supabaseAdmin
        .from('users')
        .update({ wechat_nickname: wxUser.nickname, wechat_avatar: wxUser.headimgurl })
        .eq('id', userId)
    } else {
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: `wx_${tokenData.openid}@aibanxing.placeholder`,
          role: 'visitor',
          name: wxUser.nickname || '微信用户',
          wechat_openid: tokenData.openid,
          wechat_nickname: wxUser.nickname,
          wechat_avatar: wxUser.headimgurl,
          status: 'active',
        })
        .select('id')
        .single()

      if (error || !newUser) {
        return NextResponse.redirect(`${baseUrl}/zh?error=wechat_auth_failed`)
      }
      userId = newUser.id
    }

    // Step 4: 记录 ref_log（如果有引荐人）
    if (ref && ref !== userId) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', ref)
        .single()

      if (referrer) {
        await supabaseAdmin.from('ref_logs').insert({
          ref_user_id: referrer.id,
          visitor_user_id: userId,
        })
      }
    }

    // Step 5: 写入 cookie，7天有效
    const userPayload = JSON.stringify({
      id: userId,
      name: wxUser.nickname || '微信用户',
      avatar: wxUser.headimgurl || '',
      openid: tokenData.openid,
    })

    const response = NextResponse.redirect(`${baseUrl}${redirect}`)
    response.cookies.set('wx_user', btoa(encodeURIComponent(userPayload)), {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })

    return response
  } catch (err) {
    console.error('WeChat auth error:', err)
    return NextResponse.redirect(`${baseUrl}/zh?error=wechat_auth_failed`)
  }
}
