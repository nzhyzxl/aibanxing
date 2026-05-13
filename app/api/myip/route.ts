import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      headers: { 'User-Agent': 'aibanxing/1.0' }
    })
    const data = await res.json()
    return NextResponse.json({
      ip: data.ip,
      message: '请把这个 IP 填入微信公众平台 → 基本配置 → IP白名单'
    })
  } catch {
    try {
      const res2 = await fetch('https://checkip.amazonaws.com/')
      const ip = (await res2.text()).trim()
      return NextResponse.json({ ip, message: '请把这个 IP 填入微信公众平台 IP白名单' })
    } catch {
      return NextResponse.json({ error: '无法获取 IP' })
    }
  }
}
