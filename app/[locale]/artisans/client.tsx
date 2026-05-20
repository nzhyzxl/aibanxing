'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import UnifiedShare from '@/components/frontend/UnifiedShare'
import RichText from '@/components/frontend/RichText'
import type { User } from '@/lib/supabase'

const CATEGORY_VALUES = ['all', 'ceramics', 'leather', 'textile', 'food', 'handcraft', 'service'] as const

export default function ArtisansClient({
  artisans,
  inviters,
  locale,
}: {
  artisans: User[]
  inviters: Record<string, User>
  locale: string
}) {
  const t = useTranslations()
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return artisans
    return artisans.filter(a => a.category === activeCategory)
  }, [activeCategory, artisans])

  return (
    <div className="min-h-screen bg-[#FDFAF5]">
      {/* 页头 */}
      <section className="max-w-3xl mx-auto px-4 pt-14 pb-10 text-center">
        <p className="text-xs tracking-[0.2em] text-[#F5A623] uppercase mb-4 font-medium">
          爱伴行 · AIBANXING
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2C2420] mb-4">
          {t('artisans.title')}
        </h1>
        <p className="text-[#9E9189] text-base">
          {t('artisans.subtitle')}
        </p>
        <div className="w-8 h-0.5 bg-[#F5A623] mx-auto mt-6 mb-6" />
        <div className="flex justify-center">
          <UnifiedShare
            title={`AiBanXing · ${t('artisans.title')}`}
            desc={t('artisans.subtitle')}
            imgUrl={"https://aibanxing.oss-cn-hangzhou.aliyuncs.com/uploads/og-image.jpg"}
            pageUrl={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.aibanxing.top'}/${locale}/artisans`}
            locale={locale}
            variant="text"
          />
        </div>
      </section>

      {/* 筛选栏 */}
      <div className="sticky top-14 z-40 bg-[#FDFAF5]/95 backdrop-blur-sm border-b border-[#E8DDD4]/60">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORY_VALUES.map(value => (
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
          <p className="text-xs text-[#9E9189] mt-2">
            {t('artisans.count', { count: filtered.length })}
          </p>
        </div>
      </div>

      {/* 匠人卡片网格 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#9E9189]">
            <p className="text-4xl mb-4">🌿</p>
            <p>{t('common.coming_soon')}</p>
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
          {t('artisans.story_footer')}
        </p>
        <Link
          href={`/${locale}/artisans`}
          className="text-xs text-[#F5A623] mt-2 inline-block hover:underline"
        >
          {t('artisans.view_profile')}
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
  const t = useTranslations()
  const bio = locale === 'en' && artisan.bio_en ? artisan.bio_en : artisan.bio
  const city = locale === 'en' && artisan.city_en ? artisan.city_en : artisan.city
  const catLabel = artisan.category ? t(`category.${artisan.category}`) : null

  return (
    <Link
      href={`/${locale}/artisans/${artisan.id}`}
      className="block bg-white rounded-2xl border border-[#E8DDD4] hover:border-[#F5A623] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
    >
      {/* 头像区域 */}
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
            {catLabel}
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
          <RichText content={bio} lineClamp={2} className="text-sm text-[#6B4C35] mb-3 leading-relaxed" />
        )}

        {/* 信任归属行 */}
        <div className="pt-3 border-t border-[#F5EFE6] flex items-center gap-2">
          {inviter ? (
            <>
              <div className="w-6 h-6 rounded-full bg-[#FEF6E9] flex items-center justify-center text-[#854F0B] text-xs font-medium flex-shrink-0">
                {inviter.name[0]}
              </div>
              <p className="text-xs text-[#9E9189] truncate">
                {t('artisans.vouched_by', { name: inviter.name })}
              </p>
            </>
          ) : (
            <p className="text-xs text-[#F5A623] font-medium">
              {t('artisans.founding_member')}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
