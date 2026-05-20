'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import UnifiedShare from '@/components/frontend/UnifiedShare'
import RichText from '@/components/frontend/RichText'
import type { Product, User } from '@/lib/supabase'

const CATEGORY_VALUES = ['all', 'ceramics', 'leather', 'textile', 'food', 'handcraft', 'service'] as const

interface ArtisanEntry {
  artisan: User
  allProducts: Product[]
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = useTranslations()
  const [entries, setEntries] = useState<ArtisanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [inviters, setInviters] = useState<Record<string, User>>({})

  useEffect(() => {
    const fetchData = async () => {
      const marketFilter = locale === 'en' ? ['intl'] : ['cn']
      const [artisansRes, productsRes] = await Promise.all([
        supabase
          .from('users')
          .select('*')
          .eq('role', 'artisan')
          .eq('status', 'active')
          .order('sort_order', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*')
          .eq('is_published', true)
          .contains('markets', marketFilter)
          .order('sort_order', { ascending: false })
          .order('created_at', { ascending: false }),
      ])

      const allArtisans = (artisansRes.data || []) as User[]
      const allProducts = (productsRes.data || []) as Product[]

      const productMap = new Map<string, Product[]>()
      allProducts.forEach((p) => {
        if (!productMap.has(p.artisan_id)) productMap.set(p.artisan_id, [])
        productMap.get(p.artisan_id)!.push(p)
      })

      const result: ArtisanEntry[] = allArtisans
        .filter((a) => productMap.has(a.id))
        .map((a) => ({
          artisan: a,
          allProducts: productMap.get(a.id)!,
        }))

      setEntries(result)

      const inviterIds = result
        .map((e) => e.artisan.invited_by)
        .filter((id): id is string => !!id)
      const uniqueIds = Array.from(new Set(inviterIds))
      if (uniqueIds.length > 0) {
        const { data: inviterData } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .in('id', uniqueIds)
        const map: Record<string, User> = {}
        ;(inviterData || []).forEach((u: any) => { map[u.id] = u })
        setInviters(map)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredEntries = useMemo(() => {
    if (!entries.length) return []
    return entries
      .map((e) => {
        const matched =
          activeCategory === 'all'
            ? e.allProducts
            : e.allProducts.filter((p) => p.category === activeCategory)
        return {
          artisan: e.artisan,
          displayProducts: matched.slice(0, 4),
          totalCount: matched.length,
        }
      })
      .filter((e) => e.displayProducts.length > 0)
  }, [activeCategory, entries])

  const totalProducts = entries.reduce((s, e) => s + e.allProducts.length, 0)

  return (
    <div className="min-h-screen bg-[#FDFAF5]">
      {/* Hero */}
      <section
        className="relative w-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #C4956A 0%, #E8C99A 50%, #F5EFE6 100%)',
          minHeight: 320,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <p className="text-xs tracking-[0.2em] text-[#854F0B] uppercase mb-4 font-medium">
            爱伴行 · AIBANXING
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-[#2C2420] mb-4 leading-tight">
            {t('home.hero_title')}
          </h1>
          <p className="text-[#9E9189] text-sm md:text-base mb-8">
            {t('home.hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
            <Link
              href={`/${locale}/artisans`}
              className="inline-flex items-center gap-2 bg-[#F5A623] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#E09510] transition-colors"
            >
              {t('home.cta')} →
            </Link>
            <UnifiedShare
              title={`AiBanXing · ${t('home.hero_title')}`}
              desc={t('home.hero_subtitle')}
              imgUrl={'https://aibanxing.oss-cn-hangzhou.aliyuncs.com/uploads/og-image.jpg'}
              pageUrl={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.aibanxing.top'}/${locale}`}
              locale={locale}
              variant="text"
            />
          </div>
        </div>
      </section>

      {/* 信任概念条 */}
      <div className="border-y border-[#E8DDD4] bg-[#FDFAF5]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs text-[#9E9189]">
          <span>🔒 {t('home.trust_invite')}</span>
          <span className="hidden md:inline text-[#E8DDD4]">·</span>
          <span>✍️ {t('home.trust_endorse')}</span>
          <span className="hidden md:inline text-[#E8DDD4]">·</span>
          <span>✨ {t('home.trust_curated')}</span>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="sticky top-14 z-40 bg-[#FDFAF5]/95 backdrop-blur-sm border-b border-[#E8DDD4]/60">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORY_VALUES.map((value) => (
              <button
                key={value}
                onClick={() => setActiveCategory(value)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm transition-colors ${
                  activeCategory === value
                    ? 'bg-[#F5A623] text-white font-medium'
                    : 'bg-[#F5EFE6] text-[#9E9189] hover:text-[#2C2420]'
                }`}
              >
                {t(`category.${value}`)}
              </button>
            ))}
          </div>
          {!loading && (
            <p className="text-xs text-[#9E9189] mt-2">
              {t('home.count', { artisans: filteredEntries.length, works: totalProducts })}
            </p>
          )}
        </div>
      </div>

      {/* 匠人分区列表 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <SkeletonZone />
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-20 text-[#9E9189]">
            <p className="text-4xl mb-4">🌿</p>
            <p>{t('common.coming_soon')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {filteredEntries.map((entry) => (
              <ArtisanZone
                key={entry.artisan.id}
                artisan={entry.artisan}
                products={entry.displayProducts}
                totalCount={entry.totalCount}
                inviter={entry.artisan.invited_by ? inviters[entry.artisan.invited_by] : undefined}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ArtisanZone({
  artisan,
  products,
  totalCount,
  inviter,
  locale,
}: {
  artisan: User
  products: Product[]
  totalCount: number
  inviter?: User
  locale: string
}) {
  const t = useTranslations()
  const bio = locale === 'en' && artisan.bio_en ? artisan.bio_en : artisan.bio
  const catLabel = artisan.category ? t(`category.${artisan.category}`) : null
  const city = locale === 'en' && artisan.city_en ? artisan.city_en : artisan.city

  return (
    <section className="bg-white rounded-2xl border border-[#E8DDD4] overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex items-start gap-4">
          <Link
            href={`/${locale}/artisans/${artisan.id}`}
            className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-[#E8C99A] flex items-center justify-center"
          >
            {artisan.avatar_url ? (
              <Image
                src={artisan.avatar_url}
                alt={artisan.name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-[#854F0B] text-xl md:text-2xl font-serif font-bold">
                {artisan.name[0]}
              </span>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Link
                href={`/${locale}/artisans/${artisan.id}`}
                className="font-serif text-lg md:text-xl font-bold text-[#2C2420] hover:text-[#F5A623] transition-colors"
              >
                {artisan.name}
              </Link>
              {catLabel && (
                <span className="text-xs bg-[#F5A623] text-white px-2.5 py-0.5 rounded-full">
                  {catLabel}
                </span>
              )}
              {city && (
                <span className="text-xs text-[#9E9189]">📍 {city}</span>
              )}
            </div>

            {bio && (
              <div className="text-sm text-[#6B4C35] italic leading-relaxed mb-2">
                <RichText content={bio} />
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-[#9E9189]">
              {inviter ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-[#FEF6E9] flex items-center justify-center text-[#854F0B] text-[10px] font-medium flex-shrink-0">
                    {inviter.name?.[0]}
                  </div>
                  <span>{t('home.vouched_by', { name: inviter.name })}</span>
                </>
              ) : (
                <span className="text-[#F5A623] font-medium">
                  {t('home.founding_member')}
                </span>
              )}
              <span className="text-[#E8DDD4]">·</span>
              <Link
                href={`/${locale}/artisans/${artisan.id}`}
                className="text-[#F5A623] hover:underline font-medium"
              >
                {t('home.meet_artisan', { name: artisan.name })}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {products.length > 0 && (
        <div className="border-t border-[#E8DDD4] px-4 md:px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {products.map((product) => (
              <ZoneProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>

          {totalCount > 4 && (
            <div className="mt-3">
              <Link
                href={`/${locale}/artisans/${artisan.id}`}
                className="block text-center text-sm text-[#F5A623] font-medium py-2 border border-[#E8DDD4] rounded-xl hover:bg-[#FEF6E9] transition-colors"
              >
                {t('home.view_all_works', { name: artisan.name, count: totalCount })}
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function ZoneProductCard({ product, locale }: { product: Product; locale: string }) {
  const t = useTranslations()
  const name = locale === 'en' && product.name_en ? product.name_en : product.name
  const coverImage = product.images?.[0]
  const catLabel = product.category ? t(`category.${product.category}`) : null

  return (
    <Link
      href={`/${locale}/products/${product.id}`}
      className="block bg-white rounded-xl border border-[#E8DDD4] hover:border-[#F5A623] hover:-translate-y-0.5 transition-all overflow-hidden group"
    >
      <div className="relative aspect-[4/3] bg-[#F5EFE6] overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#C8A882] text-3xl">
            🌿
          </div>
        )}
        {catLabel && (
          <span className="absolute top-2 right-2 bg-white/90 text-[#6B4C35] text-xs px-2 py-0.5 rounded-full">
            {catLabel}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="font-serif text-sm font-medium text-[#2C2420] line-clamp-1 mb-1.5">
          {name}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs bg-[#F5A623] text-white px-2 py-0.5 rounded-full font-medium">
            {t('common.origin_price')}
          </span>
          <span className="text-sm font-semibold text-[#2C2420]">
            {locale === 'en'
              ? (product.price_usd ? `$${product.price_usd}` : t('common.inquire'))
              : (product.price ? `¥${product.price}` : t('common.inquire'))}
          </span>
        </div>
      </div>
    </Link>
  )
}

function SkeletonZone() {
  return (
    <div className="flex flex-col gap-10">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#E8DDD4] overflow-hidden animate-pulse">
          <div className="p-4 md:p-6 flex items-start gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#F5EFE6] flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-[#F5EFE6] rounded w-1/3" />
              <div className="h-3 bg-[#F5EFE6] rounded w-2/3" />
              <div className="h-3 bg-[#F5EFE6] rounded w-1/4" />
            </div>
          </div>
          <div className="border-t border-[#E8DDD4] px-4 md:px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-[#F5EFE6]" />
                  <div className="p-2.5 space-y-2">
                    <div className="h-3 bg-[#F5EFE6] rounded w-3/4" />
                    <div className="h-4 bg-[#F5EFE6] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
