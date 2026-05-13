'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import TrustChain from '@/components/frontend/TrustChain'
import UnifiedShare from '@/components/frontend/UnifiedShare'
import type { User, Product, Endorsement } from '@/lib/supabase'

type EndorsementWithEndorser = Endorsement & { endorser: User }

export default function ArtisanProfilePage({
  params
}: {
  params: { locale: string; id: string }
}) {
  const { locale, id } = params
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  const [artisan, setArtisan] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [endorsements, setEndorsements] = useState<EndorsementWithEndorser[]>([])
  const [inviter, setInviter] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 保存 ref 来源到 sessionStorage
    if (ref) sessionStorage.setItem('ref', ref)
  }, [ref])

  useEffect(() => {
    const fetchAll = async () => {
      // 匠人信息
      const { data: artisanData } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single()

      if (!artisanData) { setLoading(false); return }
      setArtisan(artisanData as User)

      // 并行获取：产品、背书、邀请人
      const [productsRes, endorsementsRes] = await Promise.all([
        supabase.from('products').select('*')
          .eq('artisan_id', id).eq('is_published', true)
          .order('sort_order', { ascending: false }),
        supabase.from('endorsements').select('*, endorser:endorser_id(*)')
          .eq('artisan_id', id).order('created_at', { ascending: true }),
      ])

      setProducts((productsRes.data || []) as Product[])
      setEndorsements((endorsementsRes.data || []) as EndorsementWithEndorser[])

      // 邀请人
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
          {locale === 'zh' ? '加载中...' : 'Loading...'}
        </div>
      </div>
    )
  }

  if (!artisan) {
    return (
      <div className="min-h-screen bg-[#FDFAF5] flex items-center justify-center text-center px-4">
        <div>
          <p className="text-4xl mb-4">🌿</p>
          <p className="text-[#9E9189]">
            {locale === 'zh' ? '找不到这位匠人' : 'Artisan not found'}
          </p>
          <Link href={`/${locale}/artisans`} className="text-[#F5A623] text-sm mt-4 inline-block">
            {locale === 'zh' ? '← 返回匠人列表' : '← Back to artisans'}
          </Link>
        </div>
      </div>
    )
  }

  const bio = locale === 'en' && artisan.bio_en ? artisan.bio_en : artisan.bio
  const city = locale === 'en' && artisan.city_en ? artisan.city_en : artisan.city
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/artisans/${artisan.id}`
    : ''
  const coverImage = products[0]?.images?.[0] || artisan.avatar_url

  return (
    <div className="min-h-screen bg-[#FDFAF5]">
      {/* Hero */}
      <div className="relative w-full overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #C4956A 0%, #E8C99A 60%, #F5EFE6 100%)', minHeight: 220 }}>
        {coverImage && (
          <Image src={coverImage} alt={artisan.name} fill
            className="object-cover opacity-60" sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* 匠人信息区 */}
      <div className="max-w-2xl mx-auto px-4">
        {/* 头像（叠在hero底部） */}
        <div className="flex items-end gap-4 -mt-10 mb-4 relative z-10">
          <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#E8C99A] flex items-center justify-center flex-shrink-0">
            {artisan.avatar_url ? (
              <Image src={artisan.avatar_url} alt={artisan.name} width={80} height={80}
                className="object-cover w-full h-full" />
            ) : (
              <span className="text-[#854F0B] text-2xl font-serif font-bold">{artisan.name[0]}</span>
            )}
          </div>
          <div className="pb-1">
            <h1 className="font-serif text-2xl font-bold text-[#2C2420]">{artisan.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {artisan.category && (
                <span className="text-xs bg-[#F5A623] text-white px-2.5 py-0.5 rounded-full">
                  {artisan.category}
                </span>
              )}
              {city && (
                <span className="text-xs text-[#9E9189]">📍 {city}</span>
              )}
            </div>
          </div>
        </div>

        {bio && (
          <p className="font-serif italic text-[#6B4C35] text-base leading-relaxed mb-3">
            「{bio}」
          </p>
        )}

        {/* 分享按钮（靠近顶部） */}
        <div className="mb-6">
          <UnifiedShare
            title={`${artisan.name} · ${artisan.category || '匠人'}`}
            desc={bio || (locale === 'zh' ? '在爱伴行发现了一位好匠人' : 'Found a great artisan on AiBanXing')}
            imgUrl={coverImage || ''}
            pageUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/artisans/${artisan.id}`}
            locale={locale}
            variant="text"
          />
        </div>

        {/* 信任链 */}
        <TrustChain artisan={artisan} endorsements={endorsements} locale={locale} />

        {/* 作品与服务 */}
        {products.length > 0 && (
          <section className="py-6 border-t border-[#E8DDD4]">
            <h2 className="font-serif text-xl text-[#2C2420] mb-4">
              {locale === 'zh' ? '作品与服务' : 'Works & Services'}
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
            <h2 className="font-serif text-xl text-[#2C2420] mb-1">
              {locale === 'zh' ? '想了解更多？' : 'Want to know more?'}
            </h2>
            <p className="text-sm text-[#9E9189] mb-6">
              {locale === 'zh' ? '成交发生在私信' : 'All transactions via private chat'}
            </p>

            {artisan.wechat_qr_url ? (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm inline-block">
                  <Image src={artisan.wechat_qr_url} alt="WeChat QR"
                    width={160} height={160} className="rounded-lg" />
                </div>
                <p className="text-sm text-[#6B4C35] font-medium">
                  {locale === 'zh' ? '长按扫码添加微信' : 'Long press to add on WeChat'}
                </p>
                <p className="text-xs text-[#9E9189]">
                  {locale === 'zh' ? '告诉他/她你是从爱伴行看到的' : 'Tell them you found them on AiBanXing'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 inline-flex items-center justify-center border-2 border-dashed border-[#E8DDD4]">
                <p className="text-[#9E9189] text-sm">
                  {locale === 'zh' ? '微信二维码即将上线' : 'WeChat QR coming soon'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 底部分享 */}
        <div className="pb-8">
          <UnifiedShare
            title={`${artisan.name} · ${artisan.category || '匠人'}`}
            desc={bio || (locale === 'zh' ? '在爱伴行发现了一位好匠人' : 'Found a great artisan on AiBanXing')}
            imgUrl={coverImage || ''}
            pageUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/artisans/${artisan.id}`}
            locale={locale}
          />
        </div>
      </div>
    </div>
  )
}

function ProductItem({ product, locale }: { product: Product; locale: string }) {
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
            {locale === 'zh' ? '工作坊' : 'Workshop'}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-medium text-[#2C2420] line-clamp-1 mb-1">{name}</p>
        <div className="flex items-center gap-1">
          <span className="text-xs bg-[#F5A623] text-white px-1.5 py-0.5 rounded-full">初心价</span>
          <span className="text-sm font-semibold text-[#2C2420]">
            {product.price ? `¥${product.price}` : (locale === 'zh' ? '询价' : 'Inquire')}
          </span>
        </div>
      </div>
    </Link>
  )
}
