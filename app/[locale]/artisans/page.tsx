import { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { User } from '@/lib/supabase'
import ArtisansClient from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '匠人列表 - 爱伴行',
}

export default async function ArtisansPage({ params }: { params: { locale: string } }) {
  const supabaseAdmin = getSupabaseAdmin()

  // 1. 获取所有活跃匠人
  const { data: artisans } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', 'artisan')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // 2. 获取所有邀请人信息
  const inviterIds = (artisans || [])
    .map(a => a.invited_by)
    .filter((id): id is string => !!id)
  const uniqueInviterIds = Array.from(new Set(inviterIds))

  let inviters: Record<string, User> = {}
  if (uniqueInviterIds.length > 0) {
    const { data: inviterData } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('id', uniqueInviterIds)
    ;(inviterData || []).forEach((u: User) => { inviters[u.id] = u })
  }

  return (
    <ArtisansClient
      artisans={(artisans || []) as User[]}
      inviters={inviters}
      locale={params.locale}
    />
  )
}
