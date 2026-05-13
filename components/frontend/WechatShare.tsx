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
    // 设置页面 meta og:image 作为兜底
    if (imgUrl) {
      let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement
      if (!ogImage) {
        ogImage = document.createElement('meta')
        ogImage.setAttribute('property', 'og:image')
        document.head.appendChild(ogImage)
      }
      ogImage.setAttribute('content', imgUrl)
    }
  }, [imgUrl])

  useEffect(() => {
    const initWechat = async () => {
      try {
        const signatureUrl = window.location.href.split('#')[0]
        const res = await fetch(`/api/wechat?url=${encodeURIComponent(signatureUrl)}`)
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
          jsApiList: [
            'updateAppMessageShareData',
            'updateTimelineShareData',
            'onMenuShareAppMessage',
            'onMenuShareTimeline',
          ],
        })

        wx.error((err: any) => {
          console.error('[wechat-share] wx.config error:', err)
        })

        wx.ready(() => {
          const shareData = {
            title,
            desc,
            link,
            imgUrl: imgUrl || `${window.location.origin}/share-default.png`,
          }

          // 新 API
          wx.updateAppMessageShareData(shareData)
          wx.updateTimelineShareData({ title, link, imgUrl: shareData.imgUrl })

          // 旧 API 兜底（兼容性更好，尤其对分享图片的支持）
          wx.onMenuShareAppMessage(shareData)
          wx.onMenuShareTimeline({ title, link, imgUrl: shareData.imgUrl })
        })
      } catch (e) {
        console.error('[wechat-share] init error:', e)
      }
    }

    initWechat()
  }, [title, desc, imgUrl, link])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, text: desc, url: link }).catch(() => {})
    } else {
      navigator.clipboard.writeText(link).then(() => {
        alert(locale === 'zh' ? '链接已复制，去微信粘贴给好友吧' : 'Link copied')
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
