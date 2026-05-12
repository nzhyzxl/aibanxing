'use client'
import { useState } from 'react'
import type { Endorsement, User } from '@/lib/supabase'

interface TrustChainProps {
  artisan: User
  endorsements: (Endorsement & { endorser: User })[]
  locale: string
}

export default function TrustChain({ artisan, endorsements, locale }: TrustChainProps) {
  return (
    <section className="px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-warm-charcoal">
          {locale === 'zh' ? '朋友的信任' : 'Vouched by Friends'}
        </h2>
        <span className="text-sm text-amber-brand font-medium">
          {endorsements.length} {locale === 'zh' ? '条推荐' : 'endorsements'}
        </span>
      </div>

      <p className="text-sm text-warm-gray mb-6 leading-relaxed">
        {locale === 'zh'
          ? '这里的每一条推荐，都源于真实的人际关系——不是陌生人的评分，而是朋友亲口告知的那种信任。'
          : 'Every endorsement here traces back to a real relationship — not star ratings, but friend-to-friend trust.'}
      </p>

      <div className="relative">
        {endorsements.map((e, i) => (
          <EndorsementCard
            key={e.id}
            endorsement={e}
            isFirst={i === 0}
            isLast={i === endorsements.length - 1}
            locale={locale}
          />
        ))}

        {/* 信任链终点：匠人本人 */}
        <div className="flex items-center gap-3 mt-2 pl-5">
          <div className="w-8 h-8 rounded-full bg-amber-light flex items-center justify-center text-amber-dark text-sm font-medium border-2 border-amber-brand">
            {artisan.name[0]}
          </div>
          <span className="text-sm text-warm-gray">
            {artisan.name}
            {locale === 'zh' ? ' · 手工艺人' : ' · Artisan'}
          </span>
        </div>
      </div>
    </section>
  )
}

function EndorsementCard({
  endorsement,
  isFirst,
  isLast,
  locale,
}: {
  endorsement: Endorsement & { endorser: User }
  isFirst: boolean
  isLast: boolean
  locale: string
}) {
  const [expanded, setExpanded] = useState(isFirst)
  const content = locale === 'en' && endorsement.content_en
    ? endorsement.content_en
    : endorsement.content

  return (
    <div className="relative flex gap-3 mb-4">
      {/* 连接线 */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-px border-l-2 border-dashed border-amber-brand/30" />
      )}

      {/* 背书人头像 */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-light flex items-center justify-center text-amber-dark text-sm font-medium z-10">
        {endorsement.endorser.name[0]}
      </div>

      {/* 背书卡片 */}
      <div className="flex-1 bg-white rounded-card border border-warm-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm text-warm-charcoal">
            {endorsement.endorser.name}
          </span>
          {endorsement.relationship && (
            <span className="text-xs bg-amber-light text-amber-dark px-2 py-0.5 rounded-pill">
              {endorsement.relationship}
            </span>
          )}
        </div>

        <blockquote
          className={`text-sm text-warm-gray leading-relaxed border-l-2 border-amber-brand pl-3 italic ${
            !expanded ? 'line-clamp-2' : ''
          }`}
        >
          {`"${content}"`}
        </blockquote>

        {content.length > 80 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-amber-brand mt-2 hover:underline"
          >
            {expanded
              ? (locale === 'zh' ? '收起' : 'Show less')
              : (locale === 'zh' ? '展开' : 'Read more')}
          </button>
        )}
      </div>
    </div>
  )
}
