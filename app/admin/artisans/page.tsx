import { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import ArtisansClient from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '匠人管理 - 爱伴行后台',
}

export default async function ArtisansPage() {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: artisans } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return <ArtisansClient initialArtisans={(artisans || []) as any} />
}
