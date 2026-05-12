'use client'
import { useState } from 'react'
import { useWxAuth } from '@/lib/wx-auth'
import WxLoginModal from './WxLoginModal'

interface ShareButtonProps {
  title: string
  desc: string
  baseUrl: string      // 不含 ref 的原始链接
  artisanId: string
  locale: string
}

export default function ShareButton({ title, desc, baseUrl, artisanId, locale }: ShareButtonProps) {
  const { user } = useWxAuth()
  const [showLogin, setShowLogin] = useState(false)

  const doShare = (refId?: string) => {
    const url = refId ? `${baseUrl}?ref=${refId}` : baseUrl
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title, text: desc, url }).catch(() => fallbackCopy(url))
    } else {
      fallbackCopy(url)
    }
  }

  const fallbackCopy = (url: string) => {
    navigator.clipboard?.writeText(url)
      .then(() => alert(locale === 'zh' ? '链接已复制，快去分享吧 🧧' : 'Link copied!'))
      .catch(() => {})
  }

  const handleShare = () => {
    if (user) {
      doShare(user.id)
    } else {
      setShowLogin(true)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 bg-[#F5A623] text-white py-3.5 rounded-2xl font-medium text-base hover:bg-[#E09510] transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
        </svg>
        {locale === 'zh' ? '分享给朋友' : 'Share with friends'}
      </button>
      <WxLoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSkip={() => doShare(artisanId)}
        scene="share"
        locale={locale}
        refId={artisanId}
      />
    </>
  )
}
