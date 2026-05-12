import { redirect } from 'next/navigation'

// 手机微信扫码后打开这个页面
// 直接重定向到微信授权，授权完成后走 callback
export default function WechatBindPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token
  if (!token) {
    return (
      <div style={{ padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>无效的绑定链接</p>
      </div>
    )
  }

  const appId = process.env.NEXT_PUBLIC_WECHAT_APP_ID!
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!
  const callbackUrl = encodeURIComponent(`${baseUrl}/api/auth/wechat-bind-callback`)
  const state = encodeURIComponent(token)

  // 服务端直接 redirect 到微信授权
  redirect(
    `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${callbackUrl}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`
  )
}
