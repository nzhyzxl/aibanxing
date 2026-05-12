'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useWxAuth } from '@/lib/wx-auth'
import WxLoginModal from './WxLoginModal'
import { supabase } from '@/lib/supabase'

interface ContactSectionProps {
  artisan: { id: string; name: string; wechat_qr_url?: string | null }
  productId?: string
  refUserId?: string
  locale: string
}

export default function ContactSection({ artisan, productId, refUserId, locale }: ContactSectionProps) {
  const { user } = useWxAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [qrRevealed, setQrRevealed] = useState(false)

  // 用户登录后记录 ref_log
  useEffect(() => {
    if (!user || !refUserId || refUserId === user.id) return
    supabase.from('ref_logs').insert({
      ref_user_id: refUserId,
      product_id: productId || null,
      visitor_user_id: user.id,
    }).then(() => {})
  }, [user, refUserId, productId])

  const isRevealed = qrRevealed || !!user

  return (
    <div className="bg-[#FEF6E9] rounded-2xl p-5 text-center">
      <h2 className="font-serif text-lg text-[#2C2420] mb-1">
        {locale === 'zh' ? '想了解更多？' : 'Want to know more?'}
      </h2>
      <p className="text-xs text-[#9E9189] mb-4">
        {locale === 'zh' ? '成交发生在私信 · 加微信直接洽谈' : 'All transactions via private chat'}
      </p>

      {artisan.wechat_qr_url ? (
        <div className="flex flex-col items-center gap-3">
          <div
            className={`relative bg-white rounded-2xl p-4 shadow-sm inline-block ${!isRevealed ? 'cursor-pointer' : ''}`}
            onClick={!isRevealed ? () => setShowLogin(true) : undefined}
          >
            <Image
              src={artisan.wechat_qr_url}
              alt="WeChat QR"
              width={160}
              height={160}
              className={`rounded-lg transition-all duration-300 ${!isRevealed ? 'blur-md scale-95' : ''}`}
            />
            {!isRevealed && (
              <div className="absolute inset-4 flex flex-col items-center justify-center gap-1">
                <span className="text-2xl">👆</span>
                <p className="text-xs text-[#2C2420] font-medium text-center leading-tight">
                  {locale === 'zh' ? '点击查看\n享首单优惠' : 'Tap to reveal\nget discount'}
                </p>
              </div>
            )}
          </div>

          {isRevealed ? (
            <div className="text-center space-y-1">
              <p className="text-sm text-[#6B4C35] font-medium">
                {locale === 'zh' ? '长按扫码添加微信' : 'Long press to add on WeChat'}
              </p>
              {refUserId && (
                <p className="text-xs text-[#9E9189]">
                  {locale === 'zh'
                    ? '💬 加微信时告诉他/她是谁推荐你来的，享首单优惠'
                    : '💬 Tell them who referred you for a first-order discount'}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-sm text-[#F5A623] font-medium">
                {locale === 'zh' ? '登录后查看二维码，享首单优惠 🎁' : 'Login to reveal QR & get discount 🎁'}
              </p>
              <button
                onClick={() => setQrRevealed(true)}
                className="text-xs text-[#9E9189] underline"
              >
                {locale === 'zh' ? '直接查看（不登录）' : 'View without login'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 border-2 border-dashed border-[#E8DDD4] inline-flex">
          <p className="text-xs text-[#9E9189]">
            {locale === 'zh' ? '微信二维码即将上线' : 'WeChat QR coming soon'}
          </p>
        </div>
      )}

      <WxLoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSkip={() => setQrRevealed(true)}
        scene="contact"
        locale={locale}
        refId={refUserId}
      />
    </div>
  )
}
