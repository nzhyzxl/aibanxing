import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { artisan_id, product_id, visitor_name, visitor_email, message } = await request.json()

    if (!artisan_id || !visitor_name || !visitor_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 查询匠人信息（获取姓名和联系邮箱）
    const { data: artisan } = await supabaseAdmin
      .from('users')
      .select('name, name_en, contact_email, email')
      .eq('id', artisan_id)
      .single()

    if (!artisan) {
      return NextResponse.json({ error: 'Artisan not found' }, { status: 404 })
    }

    // 查询产品名（如有）
    let productName = ''
    if (product_id) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('name, name_en')
        .eq('id', product_id)
        .single()
      if (product) productName = product.name_en || product.name
    }

    // 存入数据库
    await supabaseAdmin.from('inquiries').insert({
      artisan_id,
      product_id: product_id || null,
      visitor_name,
      visitor_email,
      message,
    })

    // 发邮件通知匠人
    const notifyEmail = artisan.contact_email || artisan.email
    if (notifyEmail && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const artisanName = artisan.name_en || artisan.name
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'AiBanXing <noreply@aibanxing.top>',
        to: notifyEmail,
        subject: `New inquiry from ${visitor_name} — AiBanXing`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#2C2420">
            <h2 style="color:#F5A623">New inquiry for you, ${artisanName}!</h2>
            <p><strong>From:</strong> ${visitor_name} &lt;${visitor_email}&gt;</p>
            ${productName ? `<p><strong>About product:</strong> ${productName}</p>` : ''}
            ${message ? `<p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>` : ''}
            <hr style="border:none;border-top:1px solid #E8DDD4;margin:20px 0"/>
            <p style="font-size:12px;color:#9E9189">
              Reply directly to ${visitor_email} to get in touch.<br/>
              This inquiry was submitted via <a href="https://www.aibanxing.top" style="color:#F5A623">AiBanXing</a>.
            </p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
