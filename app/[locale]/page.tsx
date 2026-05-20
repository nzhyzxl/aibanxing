'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import UnifiedShare from '@/components/frontend/UnifiedShare'
import RichText from '@/components/frontend/RichText'
import type { Product, User } from '@/lib/supabase'

const CATEGORIES = [
  { value: 'all', zh: '全部', en: 'All' },
  { value: 'ceramics', zh: '陶瓷', en: 'Ceramics' },
  { value: 'leather', zh: '皮具', en: 'Leather' },
  { value: 'textile', zh: '织物', en: 'Textiles' },
  { value: 'food', zh: '食品', en: 'Food' },
  { value: 'handcraft', zh: '手作', en: 'Handcraft' },
  { value: 'service', zh: '服务', en: 'Services' },
]

interface ArtisanEntry {
  artisan: User
  allProducts: Product[]
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const [entries, setEntries] = useState<ArtisanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [inviters, setInviters] = useState<Record<string, User>>({})

  // 取数：匠人（已排序） + 全部产品
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

      // 按匠人分组
      const productMap = new Map<string, Product[]>()
      allProducts.forEach((p) => {
        if (!productMap.has(p.artisan_id)) productMap.set(p.artisan_id, [])
        productMap.get(p.artisan_id)!.push(p)
      })

      // 只保留有产品的匠人，按 sort_order → created_at 排
      const result: ArtisanEntry[] = allArtisans
        .filter((a) => productMap.has(a.id))
        .map((a) => ({
          artisan: a,
          allProducts: productMap.get(a.id)!,
        }))

      setEntries(result)

      // 取邀请人信息
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

  // 分类筛选
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
          displayProducts: matched.slice(0, 3),
          totalCount: matched.length,
        }
      })
      .filter((e) => e.displayProducts.length > 0)
  }, [activeCategory, entries])

  const totalProducts = entries.reduce((s, e) => s + e.allProducts.length, 0)

  // ── 渲染 ──
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
            {locale === 'zh' ? '遇见有温度的好物' : 'Discover things made with love'}
          </h1>
          <p className="font-serif italic text-[#6B4C35] text-lg md:text-xl mb-2">
            {locale === 'zh' ? '' : 'Discover things made with love'}
          </p>
          <p className="text-[#9E9189] text-sm md:text-base mb-8">
            {locale === 'zh' ? '每一件，都有人为它作证' : 'Every piece, personally vouched for'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
            <Link
              href={`/${locale}/artisans`}
              className="inline-flex items-center gap-2 bg-[#F5A623] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#E09510] transition-colors"
            >
              {locale === 'zh' ? '探索所有匠人' : 'Explore artisans'} →
            </Link>
            <UnifiedShare
              title={locale === 'zh' ? '爱伴行 · 遇见有温度的好物' : 'AiBanXing · Things made with love'}
              desc={locale === 'zh' ? '每一件好物，都有人为它作证' : 'Every piece, personally vouched for'}
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
          <span>🔒 {locale === 'zh' ? '仅限受邀加入' : 'Invitation only'}</span>
          <span className="hidden md:inline text-[#E8DDD4]">·</span>
          <span>✍️ {locale === 'zh' ? '每位匠人都有真实背书' : 'Real endorsements'}</span>
          <span className="hidden md:inline text-[#E8DDD4]">·</span>
          <span>✨ {locale === 'zh' ? '由平台精选' : 'Curated with care'}</span>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="sticky top-14 z-40 bg-[#FDFAF5]/95 backdrop-blur-sm border-b border-[#E8DDD4]/60">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
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
              {locale === 'zh'
                ? `${filteredEntries.length} 位匠人 · ${totalProducts} 件作品`
                : `${filteredEntries.length} artisans · ${totalProducts} works`}
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
            <p>{locale === 'zh' ? '这个品类即将上线，敬请期待' : 'Coming soon'}</p>
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

// ── 匠人区域 ──
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
  const bio = locale === 'en' && artisan.bio_en ? artisan.bio_en : artisan.bio
  const catLabel = locale === 'en' && artisan.category
    ? (CATEGORIES.find((c) => c.value === artisan.category)?.['en'] || artisan.category)
    : (CATEGORIES.find((c) => c.value === artisan.category)?.['zh'] || artisan.category)

  return (
    <section className="bg-white rounded-2xl border border-[#E8DDD4] overflow-hidden">
      {/* 匠人信息头 */}
      <div className="p-4 md:p-6">
        <div className="flex items-start gap-4">
          {/* 头像 */}
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

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Link
                href={`/${locale}/artisans/${artisan.id}`}
                className="font-serif text-lg md:text-xl font-bold text-[#2C2420] hover:text-[#F5A623] transition-colors"
              >
                {artisan.name}
              </Link>
              {artisan.category && (
                <span className="text-xs bg-[#F5A623] text-white px-2.5 py-0.5 rounded-full">
                  {catLabel}
                </span>
              )}
              {artisan.city && (
                <span className="text-xs text-[#9E9189]">📍 {artisan.city}</span>
              )}
            </div>

            {bio && (
              <div className="text-sm text-[#6B4C35] italic leading-relaxed mb-2">
                <RichText content={bio} />
              </div>
            )}

            {/* 信任归属 */}
            <div className="flex items-center gap-2 text-xs text-[#9E9189]">
              {inviter ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-[#FEF6E9] flex items-center justify-center text-[#854F0B] text-[10px] font-medium flex-shrink-0">
                    {inviter.name?.[0]}
                  </div>
                  <span>
                    {locale === 'zh'
                      ? `由 ${inviter.name} 邀请并推荐`
                      : `Vouched by ${inviter.name}`}
                  </span>
                </>
              ) : (
                <span className="text-[#F5A623] font-medium">
                  {locale === 'zh' ? '创始成员' : 'Founding member'}
                </span>
              )}
              <span className="text-[#E8DDD4]">·</span>
              <Link
                href={`/${locale}/artisans/${artisan.id}`}
                className="text-[#F5A623] hover:underline font-medium"
              >
                {locale === 'zh' ? `认识 ${artisan.name} →` : `Meet ${artisan.name} →`}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 产品网格 */}
      {products.length > 0 && (
        <div className="border-t border-[#E8DDD4] px-4 md:px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {products.map((product) => (
              <ZoneProductCard key={product.id} product={product} locale={locale} />
            ))}

            {/* 如果有更多产品，显示"查看全部"占位卡片 */}
            {totalCount > 3 && (
              <Link
                href={`/${locale}/artisans/${artisan.id}`}
                className="hidden md:flex flex-col items-center justify-center bg-[#FDFAF5] rounded-xl border border-dashed border-[#E8DDD4] hover:border-[#F5A623] hover:bg-[#FEF6E9] transition-colors min-h-[180px]"
              >
                <span className="text-2xl mb-1">✨</span>
                <span className="text-sm text-[#F5A623] font-medium">
                  {locale === 'zh' ? `查看全部 ${totalCount} 件` : `View all ${totalCount}`}
                </span>
                <span className="text-xs text-[#9E9189] mt-0.5">→</span>
              </Link>
            )}
          </div>

          {/* 移动端"查看全部"按钮 */}
          {totalCount > 3 && (
            <div className="mt-3 md:hidden">
              <Link
                href={`/${locale}/artisans/${artisan.id}`}
                className="block text-center text-sm text-[#F5A623] font-medium py-2 border border-[#E8DDD4] rounded-xl hover:bg-[#FEF6E9] transition-colors"
              >
                {locale === 'zh'
                  ? `查看 ${artisan.name} 的全部 ${totalCount} 件作品 →`
                  : `View all ${totalCount} works by ${artisan.name} →`}
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ── 匠人区内产品卡片 ──
function ZoneProductCard({ product, locale }: { product: Product; locale: string }) {
  const name = locale === 'en' && product.name_en ? product.name_en : product.name
  const coverImage = product.images?.[0]
  const catLabel = product.category
    ? CATEGORIES.find((c) => c.value === product.category)?.[locale === 'zh' ? 'zh' : 'en']
    : null

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
            {locale === 'zh' ? '初心价' : 'Origin Price'}
          </span>
          <span className="text-sm font-semibold text-[#2C2420]">
            {locale === 'en'
              ? (product.price_usd ? `$${product.price_usd}` : 'Inquire')
              : (product.price ? `¥${product.price}` : '询价')}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── 加载骨架 ──
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {[...Array(3)].map((_, j) => (
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
