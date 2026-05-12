import { NextRequest, NextResponse } from 'next/server'
import { getWechatSignature } from '@/lib/wechat'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
  }
  try {
    const config = await getWechatSignature(url)
    return NextResponse.json(config)
  } catch (err) {
    console.error('WeChat sign error:', err)
    return NextResponse.json({ error: 'Failed to get signature' }, { status: 500 })
  }
}
