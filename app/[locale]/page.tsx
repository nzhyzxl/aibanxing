'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import UnifiedShare from '@/components/frontend/UnifiedShare'
import type { Product, User } from '@/lib/supabase'

type ProductWithArtisan = Product & { artisan: User }

const CATEGORIES = [
  { value: 'all', zh: '全部', en: 'All' },
  { value: 'ceramics', zh: '陶瓷', en: 'Ceramics' },
  { value: 'leather', zh: '皮具', en: 'Leather' },
  { value: 'textile', zh: '织物', en: 'Textiles' },
  { value: 'food', zh: '食品', en: 'Food' },
  { value: 'handcraft', zh: '手作', en: 'Handcraft' },
  { value: 'service', zh: '服务', en: 'Services' },
]

export default function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const [products, setProducts] = useState<ProductWithArtisan[]>([])
  const [filtered, setFiltered] = useState<ProductWithArtisan[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, artisan:artisan_id(*)')
        .eq('is_published', true)
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false })
      setProducts((data || []) as ProductWithArtisan[])
      setFiltered((data || []) as ProductWithArtisan[])
      setLoading(false)
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    if (activeCategory === 'all') {
      setFiltered(products)
    } else {
      setFiltered(products.filter(p => p.category === activeCategory))
    }
  }, [activeCategory, products])

  // 每6个产品后插入匠人聚焦带
  const renderGrid = () => {
    const items: React.ReactNode[] = []
    const spotlightArtisans = new Set<string>()

    filtered.forEach((product, i) => {
      items.push(
        <ProductCard key={product.id} product={product} locale={locale} />
      )
      // 每6个产品后插入聚焦带
      if ((i + 1) % 6 === 0 && i < filtered.length - 1) {
        const artisan = product.artisan
        if (!spotlightArtisans.has(artisan.id)) {
          spotlightArtisans.add(artisan.id)
          items.push(
            <div key={`spotlight-${i}`} className="col-span-2 md:col-span-3">
              <ArtisanSpotlight artisan={artisan} locale={locale} />
            </div>
          )
        }
      }
    })
    return items
  }

  return (
    <div className="min-h-screen bg-[#FDFAF5]">
      {/* Hero */}
      <section className="relative w-full overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #C4956A 0%, #E8C99A 50%, #F5EFE6 100%)', minHeight: 320 }}>
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
              imgUrl={typeof window !== 'undefined' ? `${window.location.origin}/og-image.jpg` : ''}
              pageUrl={typeof window !== 'undefined' ? window.location.origin + '/' + locale : ''}
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
              {locale === 'zh' ? `共 ${filtered.length} 件作品` : `${filtered.length} works curated`}
            </p>
          )}
        </div>
      </div>

      {/* 产品瀑布流 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E8DDD4] overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[#F5EFE6]" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-[#F5EFE6] rounded w-3/4" />
                  <div className="h-3 bg-[#F5EFE6] rounded w-1/2" />
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {renderGrid()}
          </div>
        )}
      </div>
    </div>
  )
}

// 产品卡片
function ProductCard({ product, locale }: { product: ProductWithArtisan; locale: string }) {
  const name = locale === 'en' && product.name_en ? product.name_en : product.name
  const coverImage = product.images?.[0]

  return (
    <Link
      href={`/${locale}/products/${product.id}`}
      className="block bg-white rounded-2xl border border-[#E8DDD4] hover:border-[#F5A623] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
    >
      <div className="relative aspect-[4/3] bg-[#F5EFE6] overflow-hidden">
        {coverImage ? (
          <Image src={coverImage} alt={name} fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 33vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#C8A882] text-3xl">
            🌿
          </div>
        )}
        {product.category && (
          <span className="absolute top-2 right-2 bg-white/90 text-[#6B4C35] text-xs px-2 py-0.5 rounded-full">
            {CATEGORIES.find(c => c.value === product.category)?.[locale === 'zh' ? 'zh' : 'en']}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-serif font-medium text-sm text-[#2C2420] mb-1.5 line-clamp-1">{name}</p>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 rounded-full bg-[#FEF6E9] flex items-center justify-center text-[#854F0B] text-xs font-medium flex-shrink-0">
            {product.artisan.name[0]}
          </div>
          <span className="text-xs text-[#9E9189] truncate">{product.artisan.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs bg-[#F5A623] text-white px-2 py-0.5 rounded-full font-medium">初心价</span>
          <span className="text-sm font-semibold text-[#2C2420]">
            {product.price ? `¥${product.price}` : (locale === 'zh' ? '询价' : 'Inquire')}
          </span>
        </div>
        <p className="text-xs text-[#9E9189]/60 mt-1.5 truncate">
          {locale === 'zh' ? `由 ${product.artisan.name} 推荐` : `Via ${product.artisan.name}`}
        </p>
      </div>
    </Link>
  )
}

// 匠人聚焦带
function ArtisanSpotlight({ artisan, locale }: { artisan: User; locale: string }) {
  const bio = locale === 'en' && artisan.bio_en ? artisan.bio_en : artisan.bio
  return (
    <div className="bg-[#FEF6E9] rounded-2xl p-6 flex items-center gap-6 my-2">
      <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#E8C99A] flex items-center justify-center text-[#854F0B] text-2xl font-serif font-bold">
        {artisan.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-lg font-semibold text-[#2C2420] mb-1">{artisan.name}</p>
        {bio && (
          <p className="text-sm text-[#6B4C35] italic line-clamp-2">「{bio}」</p>
        )}
      </div>
      <Link
        href={`/${locale}/artisans/${artisan.id}`}
        className="flex-shrink-0 text-sm text-[#F5A623] font-medium hover:underline whitespace-nowrap"
      >
        {locale === 'zh' ? `认识 ${artisan.name}` : `Meet ${artisan.name}`} →
      </Link>
    </div>
  )
}
