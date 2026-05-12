'use client'
import { useEffect } from 'react'

interface WechatShareProps {
  title: string
  desc: string
  imgUrl: string
  link: string
  locale: string
}

export default function WechatShare({ title, desc, imgUrl, link, locale }: WechatShareProps) {
  useEffect(() => {
    const initWechat = async () => {
      try {
        const res = await fetch(`/api/wechat?url=${encodeURIComponent(window.location.href)}`)
        const config = await res.json()

        // 动态加载微信SDK
        if (typeof window !== 'undefined' && !(window as any).wx) {
          await new Promise<void>((resolve) => {
            const script = document.createElement('script')
            script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
            script.onload = () => resolve()
            document.head.appendChild(script)
          })
        }

        const wx = (window as any).wx
        wx.config({
          debug: false,
          appId: config.appId,
          timestamp: config.timestamp,
          nonceStr: config.nonceStr,
          signature: config.signature,
          jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
        })

        wx.ready(() => {
          wx.updateAppMessageShareData({ title, desc, link, imgUrl })
          wx.updateTimelineShareData({ title, link, imgUrl })
        })
      } catch (e) {
        // 非微信环境，静默失败
      }
    }

    initWechat()
  }, [title, desc, imgUrl, link])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, text: desc, url: link })
    } else {
      navigator.clipboard.writeText(link).then(() => {
        alert(locale === 'zh' ? '链接已复制' : 'Link copied')
      })
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 bg-amber-brand text-white px-6 py-3 rounded-pill text-sm font-medium hover:bg-amber-600 transition-colors w-full justify-center"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
      </svg>
      {locale === 'zh' ? '分享给朋友' : 'Share with friends'}
    </button>
  )
}
