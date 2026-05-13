import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'

// 用 Supabase 缓存 token，解决 Vercel 多实例内存不共享导致频繁请求微信的问题
// 所有实例共享同一份缓存，2小时内只需请求微信一次，IP 变化影响可忽略

async function getCached(key: string): Promise<string | null> {
  try {
    const { data } = await getSupabaseAdmin()
      .from('wechat_cache')
      .select('value, expires_at')
      .eq('key', key)
      .single()
    if (!data) return null
    if (new Date(data.expires_at) < new Date()) return null
    return data.value
  } catch {
    return null
  }
}

async function setCached(key: string, value: string, ttlSeconds: number) {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
    await getSupabaseAdmin()
      .from('wechat_cache')
      .upsert({ key, value, expires_at: expiresAt }, { onConflict: 'key' })
  } catch {}
}

async function getAccessToken(): Promise<string> {
  const cached = await getCached('wx_access_token')
  if (cached) return cached

  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.NEXT_PUBLIC_WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}`
  )
  const data = await res.json()
  if (!data.access_token) {
    throw new Error(`access_token failed: ${JSON.stringify(data)}`)
  }
  await setCached('wx_access_token', data.access_token, data.expires_in - 300)
  return data.access_token
}

async function getJsapiTicket(): Promise<string> {
  const cached = await getCached('wx_jsapi_ticket')
  if (cached) return cached

  const token = await getAccessToken()
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`
  )
  const data = await res.json()
  if (!data.ticket) {
    throw new Error(`jsapi_ticket failed: ${JSON.stringify(data)}`)
  }
  await setCached('wx_jsapi_ticket', data.ticket, data.expires_in - 300)
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
