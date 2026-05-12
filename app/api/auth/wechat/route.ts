import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get('redirect') || '/zh'
  const ref = req.nextUrl.searchParams.get('ref') || ''

  const appId = process.env.NEXT_PUBLIC_WECHAT_APP_ID!
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!
  const state = encodeURIComponent(JSON.stringify({ redirect, ref }))
  const callbackUrl = encodeURIComponent(`${baseUrl}/api/auth/wechat/callback`)

  const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${callbackUrl}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`

  return NextResponse.redirect(authUrl)
}
