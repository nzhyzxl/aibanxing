import crypto from 'crypto'

// 内存缓存（生产环境建议用 Redis）
let accessTokenCache: { token: string; expiresAt: number } | null = null
let ticketCache: { ticket: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (accessTokenCache && Date.now() < accessTokenCache.expiresAt) {
    return accessTokenCache.token
  }
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.NEXT_PUBLIC_WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}`
  )
  const data = await res.json()
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }
  return data.access_token
}

async function getJsapiTicket(): Promise<string> {
  if (ticketCache && Date.now() < ticketCache.expiresAt) {
    return ticketCache.ticket
  }
  const token = await getAccessToken()
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`
  )
  const data = await res.json()
  ticketCache = {
    ticket: data.ticket,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }
  return data.ticket
}

export async function getWechatSignature(url: string) {
  const ticket = await getJsapiTicket()
  const nonceStr = Math.random().toString(36).slice(2)
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const str = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`
  const signature = crypto.createHash('sha1').update(str).digest('hex')
  return {
    appId: process.env.NEXT_PUBLIC_WECHAT_APP_ID!,
    timestamp,
    nonceStr,
    signature,
  }
}
