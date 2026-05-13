import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const token = req.nextUrl.searchParams.get('state')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

  if (!code || !token) {
    return new NextResponse(bindResultHtml('fail', '参数缺失，请重新扫码'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Step 1: 验证 token 是否有效且未过期
    const { data: bindToken, error: tokenError } = await supabaseAdmin
      .from('wechat_bind_tokens')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !bindToken) {
      console.error('[bind-callback] token invalid:', { token, tokenError })
      return new NextResponse(bindResultHtml('fail', '绑定链接已过期，请在后台重新生成'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    // Step 2: 用 code 换 openid
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.NEXT_PUBLIC_WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`
    )
    const tokenData = await tokenRes.json()

    console.log('[bind-callback] access_token response:', { openid: tokenData.openid, errcode: tokenData.errcode })

    if (!tokenData.openid) {
      return new NextResponse(bindResultHtml('fail', '获取微信信息失败，请重试'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    // Step 3: 获取微信昵称和头像（userinfo API 已废弃，可能返回空值）
    let nickname = ''
    let headimgurl = ''
    try {
      const userRes = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`
      )
      const wxUser = await userRes.json()
      nickname = wxUser.nickname || ''
      headimgurl = wxUser.headimgurl || ''
    } catch {
      // userinfo 可能失败，不影响绑定流程
      console.warn('[bind-callback] userinfo failed, continuing with openid only')
    }

    // Step 4: 检查 openid 是否已被其他账号绑定
    const { data: existingBind } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('wechat_openid', tokenData.openid)
      .neq('id', bindToken.user_id)
      .single()

    if (existingBind) {
      return new NextResponse(bindResultHtml('fail', '该微信已绑定其他账号，请联系管理员'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    // Step 5: 更新用户的微信信息
    await supabaseAdmin
      .from('users')
      .update({
        wechat_openid: tokenData.openid,
        wechat_nickname: nickname,
        wechat_avatar: headimgurl,
      })
      .eq('id', bindToken.user_id)

    // Step 6: 更新 token 状态为 done
    const { error: updateError } = await supabaseAdmin
      .from('wechat_bind_tokens')
      .update({ status: 'done', openid: tokenData.openid })
      .eq('token', token)

    console.log('[bind-callback] token updated to done:', { token, error: updateError })

    return new NextResponse(
      bindResultHtml('success', `绑定成功！${nickname ? `欢迎 ${nickname}` : ''}，请回到电脑端继续操作`),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (err) {
    console.error('[bind-callback] error:', err)
    return new NextResponse(bindResultHtml('fail', '服务异常，请重试'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
}

// 返回给手机端的简单页面
function bindResultHtml(status: 'success' | 'fail', message: string) {
  const emoji = status === 'success' ? '🎉' : '❌'
  const color = status === 'success' ? '#07C160' : '#F5222D'
  const bg = status === 'success' ? '#F6FFED' : '#FFF2F0'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${status === 'success' ? '绑定成功' : '绑定失败'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, sans-serif;
      background: ${bg};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px 32px;
      text-align: center;
      max-width: 320px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .emoji { font-size: 56px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 600; color: ${color}; margin-bottom: 12px; }
    .msg { font-size: 14px; color: #666; line-height: 1.6; }
    .brand { margin-top: 32px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">${emoji}</div>
    <div class="title">${status === 'success' ? '绑定成功' : '绑定失败'}</div>
    <div class="msg">${message}</div>
    <div class="brand">爱伴行 AiBanXing</div>
  </div>
</body>
</html>`
}
