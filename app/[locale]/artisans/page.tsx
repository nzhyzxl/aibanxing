'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/supabase'

const CATEGORIES = [
  { value: 'all', zh: '全部', en: 'All' },
  { value: 'ceramics', zh: '陶瓷', en: 'Ceramics' },
  { value: 'leather', zh: '皮具', en: 'Leather' },
  { value: 'textile', zh: '织物', en: 'Textiles' },
  { value: 'food', zh: '食品', en: 'Food' },
  { value: 'handcraft', zh: '手作', en: 'Handcraft' },
  { value: 'service', zh: '服务', en: 'Services' },
]

export default function ArtisansPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const [artisans, setArtisans] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [inviters, setInviters] = useState<Record<string, User>>({})

  useEffect(() => {
    const fetchArtisans = async () => {
      // 同时用 raw fetch 和 Supabase 客户端查询，对比结果
      const [rawRes, sbRes] = await Promise.all([
        fetch('https://tzvhvrbkhemakgtwajhh.supabase.co/rest/v1/users?select=*&role=eq.artisan&status=eq.active&order=created_at.desc', {
          headers: {
            'apikey': 'sb_publishable_SVWQfbt2BfsPO4mk47InhQ_dfCO4BEO',
            'Authorization': 'Bearer sb_publishable_SVWQfbt2BfsPO4mk47InhQ_dfCO4BEO'
          }
        }).then(r => r.json()).catch(e => ({ __error: e.message })),
        supabase
          .from('users')
          .select('*')
          .eq('role', 'artisan')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
      ])

      console.log('raw fetch 结果:', rawRes)
      console.log('supabase-js 结果:', sbRes.data, sbRes.error)

      const rawData = Array.isArray(rawRes) ? rawRes : []
      const list = (sbRes.data || rawData || []) as User[]
      setArtisans(list)
      setFiltered(list)

      // 获取邀请人信息
      const inviterIds = [...new Set(list.map(a => a.invited_by).filter(Boolean))]
      if (inviterIds.length > 0) {
        const { data: inviterData } = await supabase
          .from('users')
          .select('*')
          .in('id', inviterIds as string[])
        const map: Record<string, User> = {}
        ;(inviterData || []).forEach((u: User) => { map[u.id] = u })
        setInviters(map)
      }
      setLoading(false)
    }
    fetchArtisans()
  }, [])

  useEffect(() => {
    if (activeCategory === 'all') {
      setFiltered(artisans)
    } else {
      setFiltered(artisans.filter(a => a.category === activeCategory))
    }
  }, [activeCategory, artisans])

  return (
    <div className="min-h-screen bg-[#FDFAF5]">
      {/* 页头 */}
      <section className="max-w-3xl mx-auto px-4 pt-14 pb-10 text-center">
        <p className="text-xs tracking-[0.2em] text-[#F5A623] uppercase mb-4 font-medium">
          爱伴行 · AIBANXING
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2C2420] mb-4">
          {locale === 'zh' ? '认识我们的匠人' : 'Meet Our Artisans'}
        </h1>
        <p className="text-[#9E9189] text-base">
          {locale === 'zh'
            ? '每位匠人都经由真实的朋友邀请与背书'
            : 'Every artisan is personally invited and vouched for'}
        </p>
        <div className="w-8 h-0.5 bg-[#F5A623] mx-auto mt-6" />
      </section>

      {/* 筛选栏 */}
      <div className="sticky top-14 z-40 bg-[#FDFAF5]/95 backdrop-blur-sm border-b border-[#E8DDD4]/60">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-[#F5A623] text-white font-medium'
                    : 'bg-[#F5EFE6] text-[#9E9189] hover:text-[#2C2420]'
                }`}
              >
                {locale === 'zh' ? cat.zh : cat.en}
              </button>
            ))}
          </div>
          {!loading && (
            <p className="text-xs text-[#9E9189] mt-2">
              {locale === 'zh' ? `${filtered.length} 位匠人` : `${filtered.length} artisans`}
            </p>
          )}
        </div>
      </div>

      {/* 匠人卡片网格 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E8DDD4] overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[#F5EFE6]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#F5EFE6] rounded w-1/2" />
                  <div className="h-3 bg-[#F5EFE6] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#9E9189]">
            <p className="text-4xl mb-4">🌿</p>
            <p>{locale === 'zh' ? '这个品类即将上线，敬请期待' : 'Coming soon'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filtered.map(artisan => (
              <ArtisanCard
                key={artisan.id}
                artisan={artisan}
                inviter={artisan.invited_by ? inviters[artisan.invited_by] : undefined}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部文案 */}
      <div className="text-center py-12 border-t border-[#E8DDD4]/40">
        <p className="font-serif italic text-[#9E9189] text-sm">
          {locale === 'zh'
            ? '每一件作品背后，都有一段值得被讲述的故事'
            : 'Behind every piece, a story worth telling'}
        </p>
        <Link
          href={`/${locale}/artisans`}
          className="text-xs text-[#F5A623] mt-2 inline-block hover:underline"
        >
          {locale === 'zh' ? '查看匠人主页 →' : 'View artisan profiles →'}
        </Link>
      </div>
    </div>
  )
}

function ArtisanCard({
  artisan, inviter, locale
}: {
  artisan: User
  inviter?: User
  locale: string
}) {
  const bio = locale === 'en' && artisan.bio_en ? artisan.bio_en : artisan.bio
  const city = locale === 'en' && artisan.city_en ? artisan.city_en : artisan.city
  const catLabel = {
    ceramics: { zh: '陶瓷', en: 'Ceramics' },
    leather: { zh: '皮具', en: 'Leather' },
    textile: { zh: '织物', en: 'Textiles' },
    food: { zh: '食品', en: 'Food' },
    handcraft: { zh: '手作', en: 'Handcraft' },
    service: { zh: '服务', en: 'Services' },
  }[artisan.category || '']

  return (
    <Link
      href={`/${locale}/artisans/${artisan.id}`}
      className="block bg-white rounded-2xl border border-[#E8DDD4] hover:border-[#F5A623] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
    >
      {/* 产品封面图区域 */}
      <div className="relative aspect-[4/3] bg-[#F5EFE6] overflow-hidden">
        {artisan.avatar_url ? (
          <Image src={artisan.avatar_url} alt={artisan.name} fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#E8C99A] flex items-center justify-center text-[#854F0B] text-3xl font-serif font-bold">
              {artisan.name[0]}
            </div>
          </div>
        )}
        {catLabel && (
          <span className="absolute top-3 right-3 bg-[#F5A623] text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
            {locale === 'zh' ? catLabel.zh : catLabel.en}
          </span>
        )}
      </div>

      {/* 卡片内容 */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="font-serif font-semibold text-base text-[#2C2420]">{artisan.name}</p>
        </div>
        {city && (
          <p className="text-xs text-[#9E9189] mb-2 flex items-center gap-1">
            <span>📍</span>{city}
          </p>
        )}
        {bio && (
          <p className="text-sm text-[#6B4C35] line-clamp-2 mb-3 leading-relaxed">{bio}</p>
        )}

        {/* 信任归属行 */}
        <div className="pt-3 border-t border-[#F5EFE6] flex items-center gap-2">
          {inviter ? (
            <>
              <div className="w-6 h-6 rounded-full bg-[#FEF6E9] flex items-center justify-center text-[#854F0B] text-xs font-medium flex-shrink-0">
                {inviter.name[0]}
              </div>
              <p className="text-xs text-[#9E9189] truncate">
                {locale === 'zh' ? `由 ${inviter.name} 邀请并推荐` : `Vouched by ${inviter.name}`}
              </p>
            </>
          ) : (
            <p className="text-xs text-[#F5A623] font-medium">
              {locale === 'zh' ? '创始成员' : 'Founding member'}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
