import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 客户端（浏览器用，受 RLS 限制）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端（API Routes 用，绕过 RLS，只在服务端使用）
// 注意：Next.js 14 会缓存 fetch 请求，即使 route 标记了 force-dynamic。
// Supabase 客户端底层用 fetch，所以必须注入自定义 fetch 禁用缓存。
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    global: {
      fetch: (input, init) => {
        return fetch(input, { ...init, cache: 'no-store' })
      },
    },
  })
}

// ── 类型定义 ──
export type UserRole = 'admin' | 'artisan' | 'visitor'
export type UserStatus = 'active' | 'suspended'
export type InvitationStatus = 'pending' | 'approved' | 'rejected'
export type Category = 'ceramics' | 'leather' | 'textile' | 'food' | 'handcraft' | 'service'

export interface User {
  id: string
  email: string
  role: UserRole
  name: string
  name_en?: string
  avatar_url?: string
  bio?: string
  bio_en?: string
  city?: string
  city_en?: string
  category?: Category
  wechat_qr_url?: string
  shipping_address?: string
  status: UserStatus
  invited_by?: string
  wechat_openid?: string
  wechat_nickname?: string
  wechat_avatar?: string
  created_at: string
}

export interface Endorsement {
  id: string
  artisan_id: string
  endorser_id: string
  content: string
  content_en?: string
  relationship?: string
  created_at: string
  endorser?: User
}

export interface Product {
  id: string
  artisan_id: string
  name: string
  name_en?: string
  description?: string
  description_en?: string
  price?: number
  images: string[]
  category?: string
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
  artisan?: User
}

export interface Invitation {
  id: string
  inviter_id: string
  invitee_name: string
  invitee_email: string
  endorsement: string
  status: InvitationStatus
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  inviter?: User
}
