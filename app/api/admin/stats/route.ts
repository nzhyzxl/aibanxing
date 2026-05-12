import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const [artisansRes, productsRes, invitationsRes] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('role', 'artisan').eq('status', 'active'),
      supabaseAdmin.from('products').select('id', { count: 'exact' }).eq('is_published', true),
      supabaseAdmin.from('invitations').select('*, inviter:inviter_id(name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    ])

    return NextResponse.json({
      artisans: artisansRes.count || 0,
      products: productsRes.count || 0,
      pendingInvitations: invitationsRes.count || 0,
      recentInvitations: invitationsRes.data || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
