import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, password } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. 更新 public.users 表（name、email）
    const publicUpdate: Record<string, string> = {}
    if (name) publicUpdate.name = name
    if (email) publicUpdate.email = email

    console.log('[update-auth] userId:', userId, 'publicUpdate:', publicUpdate)

    if (Object.keys(publicUpdate).length > 0) {
      const { data, error: publicError } = await supabaseAdmin
        .from('users')
        .update(publicUpdate)
        .eq('id', userId)
        .select('id, name, email')
        .single()

      console.log('[update-auth] public result:', { data, error: publicError })

      if (publicError) {
        return NextResponse.json({ error: publicError.message }, { status: 400 })
      }

      if (!data) {
        return NextResponse.json({ error: '未找到该匠人记录，更新失败' }, { status: 400 })
      }
    }

    // 2. 如果需要更新 email 或 password，先确认 auth.users 中存在该用户
    if (email || password) {
      const { data: authUser, error: lookupError } = await supabaseAdmin.auth.admin.getUserById(userId)

      if (lookupError || !authUser?.user) {
        return NextResponse.json({
          success: true,
          note: '该匠人尚未在认证系统中创建账号，仅更新了平台资料',
        })
      }

      const authPayload: Record<string, string> = {}
      if (email) authPayload.email = email
      if (password) authPayload.password = password

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authPayload)

      if (authError) {
        return NextResponse.json({ error: `认证系统更新失败: ${authError.message}` }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[update-auth] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
