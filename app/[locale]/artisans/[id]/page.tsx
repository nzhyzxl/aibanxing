'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import TrustChain from '@/components/frontend/TrustChain'
import UnifiedShare from '@/components/frontend/UnifiedShare'
import RichText from '@/components/frontend/RichText'
import InquiryForm from '@/components/frontend/InquiryForm'
import type { User, Product, Endorsement } from '@/lib/supabase'

type EndorsementWithEndorser = Endorsement & { endorser: User }

export default function ArtisanProfilePage({
  params
}: {
  params: { locale: string; id: string }
}) {
  const { locale, id } = params
  const t = useTranslations()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  const [artisan, setArtisan] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [endorsements, setEndorsements] = useState<EndorsementWithEndorser[]>([])
  const [inviter, setInviter] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ref) sessionStorage.setItem('ref', ref)
  }, [ref])

  useEffect(() => {
    const fetchAll = async () => {
      const { data: artisanData } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single()

      if (!artisanData) { setLoading(false); return }
      setArtisan(artisanData as User)

      const marketFilter = locale === 'en' ? ['intl'] : ['cn']
      const [productsRes, endorsementsRes] = await Promise.all([
        supabase.from('products').select('*')
          .eq('artisan_id', id).eq('is_published', true)
          .contains('markets', marketFilter)
          .order('sort_order', { ascending: false }),
        supabase.from('endorsements').select('*, endorser:endorser_id(*)')
          .eq('artisan_id', id).order('created_at', { ascending: true }),
      ])

      setProducts((productsRes.data || []) as Product[])
      setEndorsements((endorsementsRes.data || []) as EndorsementWithEndorser[])

      if (artisanData.invited_by) {
        const { data: inviterData } = await supabase
          .from('users').select('*').eq('id', artisanData.invited_by).single()
        if (inviterData) setInviter(inviterData as User)
      }

      setLoading(false)
    }
    fetchAll()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFAF5] flex items-center justify-center">
        <div className="text-[#9E9189] text-sm animate-pulse">
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (!artisan) {
    return (
      <div className="min-h-screen bg-[#FDFAF5] flex items-center justify-center text-center px-4">
        <div>
          <p className="text-4xl mb-4">🌿</p>
          <p className="text-[#9E9189]">{t('artisans.not_found')}</p>
          <Link href={`/${locale}/artisans`} className="text-[#F5A623] text-sm mt-4 inline-block">
            {t('artisans.back')}
          </Link>
        </div>
      </div>
    )
  }

  const bio = locale === 'en' && artisan.bio_en ? artisan.bio_en : artisan.bio
  const city = locale === 'en' && artisan.city_en ? artisan.city_en : artisan.city
  const catLabel = artisan.category ? t(`category.${artisan.category}`) : null
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.aibanxing.top'
  const coverImage = artisan.cover_image_url || products[0]?.images?.[0] || artisan.avatar_url
  const shareImgUrl = coverImage
    ? (coverImage.startsWith('http') ? coverImage : `${baseUrl}${coverImage}`)
    : "https://aibanxing.oss-cn-hangzhou.aliyuncs.com/uploads/og-image.jpg"

  return (
    <div className="min-h-screen bg-[#FDFAF5]">
      {/* Hero */}
      <div className="relative w-full overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #C4956A 0%, #E8C99A 60%, #F5EFE6 100%)', minHeight: 280 }}>
        {coverImage && (
          <Image src={coverImage} alt={artisan.name} fill
            className="object-cover opacity-70" sizes="100vw" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 max-w-2xl mx-auto">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-full border-3 border-white/80 shadow-lg overflow-hidden bg-[#E8C99A] flex items-center justify-center flex-shrink-0">
              {artisan.avatar_url ? (
                <Image src={artisan.avatar_url} alt={artisan.name} width={80} height={80}
                  className="object-cover w-full h-full" />
              ) : (
                <span className="text-[#854F0B] text-2xl font-serif font-bold">{artisan.name[0]}</span>
              )}
            </div>
            <div className="pb-1">
              <h1 className="font-serif text-2xl font-bold text-white drop-shadow-md">{artisan.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {catLabel && (
                  <span className="text-xs bg-[#F5A623] text-white px-2.5 py-0.5 rounded-full">
                    {catLabel}
                  </span>
                )}
                {city && (
                  <span className="text-xs text-white/80">📍 {city}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 正文区域 */}
      <div className="max-w-2xl mx-auto px-4 pt-5">

        {bio && (
          <p className="font-serif italic text-[#6B4C35] text-base leading-relaxed mb-3">
            「<RichText content={bio} />」
          </p>
        )}

        {/* 分享入口 */}
        <div className="mb-6">
          <a
            href="#share-section"
            className="text-sm text-[#F5A623] font-medium flex items-center gap-1 hover:underline"
            onClick={e => {
              e.preventDefault()
              document.getElementById('share-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
            {t('profile.share_text')}
          </a>
        </div>

        {/* 信任链 */}
        <TrustChain artisan={artisan} endorsements={endorsements} locale={locale} />

        {/* 作品与服务 */}
        {products.length > 0 && (
          <section className="py-6 border-t border-[#E8DDD4]">
            <h2 className="font-serif text-xl text-[#2C2420] mb-4">
              {t('profile.works_title')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <ProductItem key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* 联系转化区 */}
        <section className="py-8 border-t border-[#E8DDD4]">
          <div className="bg-[#FEF6E9] rounded-2xl p-6 text-center">
            {locale === 'en' ? (
              <>
                <h2 className="font-serif text-xl text-[#2C2420] mb-1">{t('profile.contact_title')}</h2>
                <p className="text-sm text-[#9E9189] mb-6">
                  {t('profile.contact_desc', { name: artisan.name_en || artisan.name })}
                </p>
                <InquiryForm
                  artisanId={artisan.id}
                  artisanName={artisan.name_en || artisan.name}
                />
              </>
            ) : (
              <>
                <h2 className="font-serif text-xl text-[#2C2420] mb-1">{t('profile.contact_title')}</h2>
                <p className="text-sm text-[#9E9189] mb-6">{t('profile.private_note')}</p>
                {artisan.wechat_qr_url ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white rounded-2xl p-4 shadow-sm inline-block">
                      <Image src={artisan.wechat_qr_url} alt="WeChat QR"
                        width={160} height={160} className="rounded-lg" />
                    </div>
                    <p className="text-sm text-[#6B4C35] font-medium">{t('profile.wechat_hint')}</p>
                    <p className="text-xs text-[#9E9189]">{t('profile.wechat_note')}</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-8 inline-flex items-center justify-center border-2 border-dashed border-[#E8DDD4]">
                    <p className="text-[#9E9189] text-sm">{t('profile.wechat_qr_coming')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* 底部分享 */}
        <div className="pb-8" id="share-section">
          <UnifiedShare
            title={`${artisan.name} · ${catLabel || t('common.artisan_label')}`}
            desc={bio || t('profile.found_artisan')}
            imgUrl={shareImgUrl}
            pageUrl={`${baseUrl}/${locale}/artisans/${artisan.id}`}
            locale={locale}
          />
        </div>
      </div>
    </div>
  )
}

function ProductItem({ product, locale }: { product: Product; locale: string }) {
  const t = useTranslations()
  const name = locale === 'en' && product.name_en ? product.name_en : product.name
  const cover = product.images?.[0]

  return (
    <Link
      href={`/${locale}/products/${product.id}`}
      className="block bg-white rounded-xl border border-[#E8DDD4] hover:border-[#F5A623] hover:-translate-y-0.5 transition-all overflow-hidden group"
    >
      <div className="relative aspect-square bg-[#F5EFE6]">
        {cover ? (
          <Image src={cover} alt={name} fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#C8A882] text-2xl">🌿</div>
        )}
        {product.category === 'service' && (
          <span className="absolute top-2 left-2 bg-[#4A90C4] text-white text-xs px-2 py-0.5 rounded-full">
            {t('profile.workshop')}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-medium text-[#2C2420] line-clamp-1 mb-1">{name}</p>
        <div className="flex items-center gap-1">
          <span className="text-xs bg-[#F5A623] text-white px-1.5 py-0.5 rounded-full">
            {t('profile.xinxin_price')}
          </span>
          <span className="text-sm font-semibold text-[#2C2420]">
            {locale === 'en'
              ? (product.price_usd ? `$${product.price_usd}` : t('profile.inquire'))
              : (product.price ? `¥${product.price}` : t('profile.inquire'))}
          </span>
        </div>
      </div>
    </Link>
  )
}
