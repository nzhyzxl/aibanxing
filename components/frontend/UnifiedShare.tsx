'use client'
import { useEffect, useState, useRef } from 'react'
import { useWxAuth } from '@/lib/wx-auth'

interface UnifiedShareProps {
  title: string
  desc: string
  imgUrl: string        // 必须是完整 https:// 绝对路径
  pageUrl: string       // 落地页不含参数的原始 URL
  locale: string
  variant?: 'button' | 'text'
}

// 确保是绝对路径
function toAbsoluteUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (typeof window !== 'undefined') return `${window.location.origin}${url}`
  return url
}

// 签名用的 URL：去掉 hash，保留 path+query
function getSignUrl(): string {
  if (typeof window === 'undefined') return ''
  return window.location.href.split('#')[0]
}

// 全局 SDK 状态
let sdkState: 'idle' | 'loading' | 'ready' | 'error' = 'idle'
const sdkCallbacks: Array<() => void> = []

async function ensureSdkReady(): Promise<boolean> {
  if (sdkState === 'ready') return true
  if (sdkState === 'error') return false

  if (sdkState === 'loading') {
    return new Promise(resolve => {
      sdkCallbacks.push(() => resolve(sdkState === 'ready'))
    })
  }

  sdkState = 'loading'
  try {
    // 签名 URL 必须去掉 # 后内容，且和当前页面完全匹配
    const signUrl = getSignUrl()
    const res = await fetch(`/api/wechat?url=${encodeURIComponent(signUrl)}`)
    const config = await res.json()

    if (!config.appId || config.error) {
      sdkState = 'error'
      sdkCallbacks.forEach(cb => cb())
      sdkCallbacks.length = 0
      return false
    }

    // 动态加载 SDK
    if (!(window as any).wx) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Failed to load wx sdk'))
        document.head.appendChild(s)
      })
    }

    await new Promise<void>((resolve, reject) => {
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
        sdkState = 'ready'
        sdkCallbacks.forEach(cb => cb())
        sdkCallbacks.length = 0
        resolve()
      })
      wx.error((err: any) => {
        console.warn('[WeChat SDK] config error:', err)
        sdkState = 'error'
        sdkCallbacks.forEach(cb => cb())
        sdkCallbacks.length = 0
        reject(new Error('wx.config error'))
      })
    })
    return true
  } catch (e) {
    sdkState = 'error'
    sdkCallbacks.forEach(cb => cb())
    sdkCallbacks.length = 0
    return false
  }
}

// 更新分享卡片内容
function setWxShareContent(title: string, desc: string, imgUrl: string, link: string) {
  if (sdkState !== 'ready') return
  try {
    const wx = (window as any).wx
    const absImg = toAbsoluteUrl(imgUrl)
    wx.updateAppMessageShareData({ title, desc, link, imgUrl: absImg })
    wx.updateTimelineShareData({ title, link, imgUrl: absImg })
  } catch {}
}

export default function UnifiedShare({
  title, desc, imgUrl, pageUrl, locale, variant = 'button'
}: UnifiedShareProps) {
  const { user, loading } = useWxAuth()
  const [showGuide, setShowGuide] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const guideTimer = useRef<NodeJS.Timeout | null>(null)
  const sdkInitDone = useRef(false)

  const buildShareUrl = (userId?: string) => {
    const base = pageUrl.split('?')[0]
    return userId ? `${base}?ref=${userId}` : base
  }

  // 页面加载后初始化 SDK，并配置分享卡片
  useEffect(() => {
    if (sdkInitDone.current) return
    sdkInitDone.current = true
    ensureSdkReady().then(ok => {
      if (!ok) return
      const shareLink = buildShareUrl(user?.id)
      setWxShareContent(title, desc, imgUrl, shareLink)
    })
  }, [])

  // 登录状态变化后更新卡片链接（带上 ref）
  useEffect(() => {
    if (loading || sdkState !== 'ready') return
    const shareLink = buildShareUrl(user?.id)
    setWxShareContent(title, desc, imgUrl, shareLink)
  }, [user?.id, loading])

  useEffect(() => {
    return () => {
      if (guideTimer.current) clearTimeout(guideTimer.current)
    }
  }, [])

  const closeGuide = () => {
    setShowGuide(false)
    if (guideTimer.current) { clearTimeout(guideTimer.current); guideTimer.current = null }
  }

  const openGuide = (shareLink: string) => {
    setWxShareContent(title, desc, imgUrl, shareLink)
    setShowGuide(true)
    if (guideTimer.current) clearTimeout(guideTimer.current)
    guideTimer.current = setTimeout(closeGuide, 8000)
  }

  const handleShare = () => {
    if (loading) return
    if (!user) { setShowLoginModal(true); return }
    doShare(user.id)
  }

  const doShare = (userId: string, withRef = true) => {
    const shareLink = withRef ? buildShareUrl(userId) : pageUrl
    const isWeChat = /MicroMessenger/i.test(navigator.userAgent)

    if (isWeChat) {
      openGuide(shareLink)
      return
    }
    if (navigator.share) {
      navigator.share({ title, text: desc, url: shareLink }).catch(() => copyLink(shareLink))
    } else {
      copyLink(shareLink)
    }
  }

  const copyLink = (url: string) => {
    navigator.clipboard?.writeText(url)
      .then(() => alert(locale === 'zh' ? '链接已复制 🧧' : 'Link copied!'))
      .catch(() => {})
  }

  return (
    <>
      {variant === 'button' ? (
        <button onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-[#F5A623] text-white py-3.5 rounded-2xl font-medium text-base hover:bg-[#E09510] transition-colors">
          <ShareIcon />
          {locale === 'zh' ? '分享给朋友' : 'Share with friends'}
        </button>
      ) : (
        <button onClick={handleShare}
          className="text-sm text-[#F5A623] font-medium flex items-center gap-1 hover:underline">
          <ShareIcon size={14} />
          {locale === 'zh' ? '分享给朋友的朋友 →' : 'Share with a friend →'}
        </button>
      )}

      {/* 微信引导浮层 */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={closeGuide}>
          <div className="absolute top-2 right-2 pointer-events-none">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <path d="M14 44 C22 36 40 18 48 10" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M48 10 L38 11 M48 10 L47 20" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="absolute top-16 right-3 bg-white rounded-2xl px-5 py-4 shadow-xl max-w-[220px]"
            onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-[#2C2420] text-center mb-1">
              {locale === 'zh' ? '点右上角「···」' : 'Tap ··· in top right'}
            </p>
            <p className="text-xs text-[#9E9189] text-center leading-relaxed">
              {locale === 'zh'
                ? '选择「发送给朋友」或「分享到朋友圈」'
                : 'Send to friend or Share to Moments'}
            </p>
            <button onClick={closeGuide}
              className="w-full mt-3 text-xs text-[#9E9189] border border-[#E8DDD4] rounded-lg py-1.5 hover:bg-[#F5EFE6] transition-colors">
              {locale === 'zh' ? '✓ 已分享，关闭' : '✓ Done, close'}
            </button>
          </div>
          <p className="absolute bottom-10 left-0 right-0 text-center text-white/50 text-xs">
            {locale === 'zh' ? '点击任意处关闭' : 'Tap anywhere to close'}
          </p>
        </div>
      )}

      {/* 登录弹窗 */}
      {showLoginModal && (
        <LoginModal locale={locale}
          onClose={() => setShowLoginModal(false)}
          onLogin={() => setShowLoginModal(false)}
          onSkip={() => {
            setShowLoginModal(false)
            const isWeChat = /MicroMessenger/i.test(navigator.userAgent)
            if (isWeChat) { openGuide(pageUrl) }
            else if (navigator.share) { navigator.share({ title, text: desc, url: pageUrl }).catch(() => copyLink(pageUrl)) }
            else { copyLink(pageUrl) }
          }}
        />
      )}
    </>
  )
}

function LoginModal({ locale, onClose, onLogin, onSkip }: {
  locale: string; onClose: () => void; onLogin: () => void; onSkip: () => void
}) {
  const { login } = useWxAuth()
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="text-center mb-5">
          <div className="w-16 h-16 bg-[#FEF6E9] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🧧</span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
            {locale === 'zh' ? '登录后分享，让爱流动' : 'Login to share with attribution'}
          </h3>
          <p className="text-sm text-[#9E9189] mt-2 leading-relaxed">
            {locale === 'zh'
              ? '微信登录后，分享链接会带上你的专属标识。朋友通过你的链接成交后，手艺人会送上感谢红包 🧧'
              : 'Your share link carries your identity. Friends who buy through it earn you a thank-you gift.'}
          </p>
        </div>
        <button onClick={() => { login(window.location.pathname + window.location.search); onLogin() }}
          className="w-full flex items-center justify-center gap-3 bg-[#07C160] text-white py-3.5 rounded-2xl font-medium hover:bg-[#06AD56] transition-colors mb-3">
          <WechatSvg />
          {locale === 'zh' ? '微信一键登录' : 'Login with WeChat'}
        </button>
        <button onClick={onSkip}
          className="w-full text-center text-sm text-[#9E9189] py-2 hover:text-[#2C2420] transition-colors">
          {locale === 'zh' ? '先不了，直接分享' : 'Skip, share without login'}
        </button>
      </div>
    </div>
  )
}

function ShareIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  )
}

function WechatSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838C16.566 5.266 12.994 2.188 8.691 2.188zm-2.906 3.803c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm4.644 2.155c-3.318 0-6 2.368-6 5.288 0 2.921 2.682 5.289 6 5.289.714 0 1.398-.112 2.03-.315a.607.607 0 01.497.068l1.32.772a.227.227 0 00.117.033c.112 0 .2-.092.2-.206 0-.05-.02-.1-.032-.148l-.272-1.027a.408.408 0 01.147-.461C21.91 16.388 22.842 15.3 22.842 14.434c0-2.92-2.682-5.288-6-5.288h-.1zm-2.12 2.036c.446 0 .807.367.807.818a.813.813 0 01-.808.818.813.813 0 01-.807-.818c0-.451.361-.818.807-.818zm4.24 0c.445 0 .807.367.807.818a.813.813 0 01-.808.818.813.813 0 01-.807-.818c0-.451.362-.818.807-.818z"/>
    </svg>
  )
}
