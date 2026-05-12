import { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import InvitationsClient from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '邀请审核 - 爱伴行后台',
}

export default async function InvitationsPage() {
  const supabaseAdmin = getSupabaseAdmin()
  const { data } = await supabaseAdmin
    .from('invitations')
    .select('*, inviter:inviter_id(name, email)')
    .order('created_at', { ascending: false })

  return <InvitationsClient initialInvitations={(data || []) as any} />
}
