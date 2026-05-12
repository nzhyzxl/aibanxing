'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import WechatShare from '@/components/frontend/WechatShare'
import type { Product, User, Endorsement } from '@/lib/supabase'

type EndorsementWithEndorser = Endorsement & { endorser: User }

const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  ceramics: { zh: '陶瓷', en: 'Ceramics' },
  leather: { zh: '皮具', en: 'Leather' },
  textile: { zh: '织物', en: 'Textiles' },
  food: { zh: '食品', en: 'Food' },
  handcraft: { zh: '手作', en: 'Handcraft' },
  service: { zh: '服务', en: 'Services' },
}

const SWIPE_THRESHOLD = 50

export default function ProductDetailPage({
  params,
}: {
  params: { locale: string; productId: string }
}) {
  const { locale, productId } = params
  const [product, setProduct] = useState<Product | null>(null)
  const [artisan, setArtisan] = useState<User | null>(null)
  const [endorsements, setEndorsements] = useState<EndorsementWithEndorser[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(true)

  // Swipe state
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const touchStartX = useRef(0)
  const imageCount = product?.images?.length || 0

  const goToImage = useCallback((index: number) => {
    if (imageCount === 0) return
    setActiveImage(((index % imageCount) + imageCount) % imageCount)
  }, [imageCount])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsSwiping(true)
    setSwipeOffset(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return
    setSwipeOffset(e.touches[0].clientX - touchStartX.current)
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      if (swipeOffset > 0) {
        goToImage(activeImage - 1)
      } else {
        goToImage(activeImage + 1)
      }
    }
    setSwipeOffset(0)
  }

  useEffect(() => {
    const fetchAll = async () => {
      // 产品信息
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_published', true)
        .single()

      if (!productData) { setLoading(false); return }
      setProduct(productData as Product)

      // 匠人信息 + 背书
      const [artisanRes, endorsementsRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', productData.artisan_id).single(),
        supabase.from('endorsements')
          .select('*, endorser:endorser_id(*)')
          .eq('artisan_id', productData.artisan_id)
          .order('created_at', { ascending: true }),
      ])

      if (artisanRes.data) setArtisan(artisanRes.data as User)
      setEndorsements((endorsementsRes.data || []) as EndorsementWithEndorser[])
      setLoading(false)
    }
    fetchAll()
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFAF5] flex items-center justify-center">
        <p className="text-[#9E9189] text-sm animate-pulse">
          {locale === 'zh' ? '加载中...' : 'Loading...'}
        </p>
      </div>
    )
  }

  if (!product || !artisan) {
    return (
      <div className="min-h-screen bg-[#FDFAF5] flex items-center justify-center text-center px-4">
        <div>
          <p className="text-4xl mb-4">🌿</p>
          <p className="text-[#9E9189]">
            {locale === 'zh' ? '找不到这个产品' : 'Product not found'}
          </p>
          <Link href={`/${locale}`} className="text-[#F5A623] text-sm mt-4 inline-block">
            {locale === 'zh' ? '← 回到首页' : '← Back to home'}
          </Link>
        </div>
      </div>
    )
  }

  const name = locale === 'en' && product.name_en ? product.name_en : product.name
  const description = locale === 'en' && product.description_en ? product.description_en : product.description
  const artisanBio = locale === 'en' && artisan.bio_en ? artisan.bio_en : artisan.bio
  const catLabel = product.category ? CATEGORY_LABELS[product.category] : null
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="min-h-screen bg-[#FDFAF5]">

      {/* 面包屑 */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 text-xs text-[#9E9189]">
          <Link href={`/${locale}`} className="hover:text-[#F5A623] transition-colors">
            {locale === 'zh' ? '首页' : 'Home'}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/artisans/${artisan.id}`} className="hover:text-[#F5A623] transition-colors">
            {artisan.name}
          </Link>
          <span>/</span>
          <span className="text-[#2C2420] line-clamp-1">{name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">

          {/* 左侧：图片区 */}
          <div>
            {/* 主图 — 支持左右滑动切换 */}
            <div
              className="relative aspect-square bg-[#F5EFE6] rounded-2xl overflow-hidden mb-3 touch-pan-y select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="w-full h-full flex transition-transform duration-300"
                style={{
                  transform: `translateX(${isSwiping ? swipeOffset : 0}px)`,
                  transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
                }}
              >
                {product.images?.[activeImage] ? (
                  <Image
                    src={product.images[activeImage]}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C8A882] text-5xl">
                    🌿
                  </div>
                )}
              </div>

              {/* 左右箭头（多图时显示） */}
              {imageCount > 1 && (
                <>
                  <button
                    onClick={() => goToImage(activeImage - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-[#6B4C35] hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => goToImage(activeImage + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-[#6B4C35] hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}

              {catLabel && (
                <span className="absolute top-3 left-3 bg-white/90 text-[#6B4C35] text-xs px-2.5 py-1 rounded-full font-medium">
                  {locale === 'zh' ? catLabel.zh : catLabel.en}
                </span>
              )}
            </div>

            {/* 指示器圆点 + 缩略图 */}
            {imageCount > 1 && (
              <>
                {/* 圆点指示器 */}
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  {product.images!.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`rounded-full transition-all ${
                        activeImage === i
                          ? 'w-2 h-2 bg-[#F5A623]'
                          : 'w-1.5 h-1.5 bg-[#D4C8BC]'
                      }`}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>

                {/* 缩略图列表 */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {product.images!.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                        activeImage === i ? 'border-[#F5A623]' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${name} ${i + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 右侧：产品信息 */}
          <div className="flex flex-col gap-5">

            {/* 产品名和价格 */}
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#2C2420] mb-3 leading-tight">
                {name}
              </h1>
              <div className="flex items-center gap-2">
                <span className="bg-[#F5A623] text-white text-sm px-3 py-1 rounded-full font-medium">
                  初心价
                </span>
                <span className="text-2xl font-bold text-[#2C2420]">
                  {product.price ? `¥${product.price}` : (locale === 'zh' ? '询价' : 'Inquire')}
                </span>
              </div>
            </div>

            {/* 产品描述 */}
            {description && (
              <div className="bg-white rounded-2xl border border-[#E8DDD4] p-4">
                <p className="text-xs text-[#9E9189] mb-2 font-medium uppercase tracking-wider">
                  {locale === 'zh' ? '产品介绍' : 'About this piece'}
                </p>
                <p className="text-sm text-[#2C2420] leading-relaxed">{description}</p>
              </div>
            )}

            {/* 匠人信息 */}
            <Link
              href={`/${locale}/artisans/${artisan.id}`}
              className="flex items-center gap-3 bg-[#FEF6E9] rounded-2xl p-4 hover:bg-[#FDE8C8] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-[#E8C99A] flex items-center justify-center text-[#854F0B] text-lg font-serif font-bold flex-shrink-0 overflow-hidden">
                {artisan.avatar_url ? (
                  <Image src={artisan.avatar_url} alt={artisan.name} width={48} height={48}
                    className="object-cover w-full h-full" />
                ) : (
                  artisan.name[0]
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#2C2420]">{artisan.name}</p>
                {artisanBio && (
                  <p className="text-xs text-[#9E9189] line-clamp-1 mt-0.5">{artisanBio}</p>
                )}
              </div>
              <span className="text-xs text-[#F5A623] group-hover:translate-x-0.5 transition-transform">
                {locale === 'zh' ? '查看主页 →' : 'View profile →'}
              </span>
            </Link>

            {/* 信任链摘要 */}
            {endorsements.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E8DDD4] p-4">
                <p className="text-xs text-[#9E9189] mb-3 font-medium uppercase tracking-wider">
                  {locale === 'zh' ? '朋友的信任' : 'Vouched by friends'}
                </p>
                <div className="border-l-2 border-[#F5A623] pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-[#FEF6E9] flex items-center justify-center text-[#854F0B] text-xs font-medium flex-shrink-0">
                      {endorsements[0].endorser?.name?.[0]}
                    </div>
                    <span className="text-xs font-medium text-[#2C2420]">
                      {endorsements[0].endorser?.name}
                    </span>
                    {endorsements[0].relationship && (
                      <span className="text-xs bg-[#F5EFE6] text-[#854F0B] px-1.5 py-0.5 rounded-full">
                        {endorsements[0].relationship}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B4C35] italic leading-relaxed line-clamp-2">
                    「{endorsements[0].content}」
                  </p>
                </div>
                {endorsements.length > 1 && (
                  <Link
                    href={`/${locale}/artisans/${artisan.id}`}
                    className="text-xs text-[#F5A623] mt-3 inline-block hover:underline"
                  >
                    {locale === 'zh'
                      ? `查看全部 ${endorsements.length} 条背书 →`
                      : `View all ${endorsements.length} endorsements →`}
                  </Link>
                )}
              </div>
            )}

            {/* 微信联系 */}
            <div className="bg-[#FEF6E9] rounded-2xl p-5 text-center">
              <p className="font-serif text-base text-[#2C2420] mb-1">
                {locale === 'zh' ? '想购买这件作品？' : 'Interested in this piece?'}
              </p>
              <p className="text-xs text-[#9E9189] mb-4">
                {locale === 'zh' ? '扫码添加匠人微信，直接洽谈' : 'Add the artisan on WeChat to discuss'}
              </p>
              {artisan.wechat_qr_url ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-white rounded-xl p-3 shadow-sm inline-block">
                    <Image
                      src={artisan.wechat_qr_url}
                      alt="WeChat QR"
                      width={140}
                      height={140}
                      className="rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-[#6B4C35] font-medium">
                    {locale === 'zh' ? '长按扫码添加微信' : 'Long press to add on WeChat'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 border-2 border-dashed border-[#E8DDD4] inline-flex">
                  <p className="text-xs text-[#9E9189]">
                    {locale === 'zh' ? '微信二维码即将上线' : 'WeChat QR coming soon'}
                  </p>
                </div>
              )}
            </div>

            {/* 分享 */}
            <WechatShare
              title={`${name} · ${artisan.name}`}
              desc={description || (locale === 'zh' ? `${artisan.name} 在爱伴行的作品` : `${artisan.name}'s work on AiBanXing`)}
              imgUrl={product.images?.[0] || ''}
              link={`${shareUrl}?ref=${artisan.id}`}
              locale={locale}
            />
          </div>
        </div>

        {/* 底部：更多产品 */}
        <MoreProducts artisanId={artisan.id} currentProductId={product.id} locale={locale} artisanName={artisan.name} />
      </div>
    </div>
  )
}

// 同一匠人的其他产品
function MoreProducts({
  artisanId, currentProductId, locale, artisanName
}: {
  artisanId: string
  currentProductId: string
  locale: string
  artisanName: string
}) {
  const [more, setMore] = useState<Product[]>([])

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('artisan_id', artisanId)
      .eq('is_published', true)
      .neq('id', currentProductId)
      .limit(4)
      .then(({ data }) => setMore((data || []) as Product[]))
  }, [artisanId, currentProductId])

  if (more.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t border-[#E8DDD4]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-lg font-semibold text-[#2C2420]">
          {locale === 'zh' ? `${artisanName} 的其他作品` : `More from ${artisanName}`}
        </h2>
        <Link
          href={`/${locale}/artisans/${artisanId}`}
          className="text-sm text-[#F5A623] hover:underline"
        >
          {locale === 'zh' ? '查看主页 →' : 'View profile →'}
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {more.map(p => {
          const pName = locale === 'en' && p.name_en ? p.name_en : p.name
          return (
            <Link
              key={p.id}
              href={`/${locale}/products/${p.id}`}
              className="bg-white rounded-xl border border-[#E8DDD4] hover:border-[#F5A623] hover:-translate-y-0.5 transition-all overflow-hidden group"
            >
              <div className="relative aspect-square bg-[#F5EFE6]">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={pName} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="25vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C8A882]">🌿</div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-[#2C2420] line-clamp-1">{pName}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs bg-[#F5A623] text-white px-1.5 py-0.5 rounded-full">初心价</span>
                  <span className="text-xs font-semibold text-[#2C2420]">
                    {p.price ? `¥${p.price}` : (locale === 'zh' ? '询价' : 'Inquire')}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
