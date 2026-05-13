'use client'
import { useEffect, useState, useRef } from 'react'
import { useWxAuth } from '@/lib/wx-auth'

interface UnifiedShareProps {
  title: string
  desc: string
  imgUrl: string        // 必须是完整 https:// 绝对路径，或传空字符串
  pageUrl: string       // 落地页，不含参数的原始 URL
  locale: string
  variant?: 'button' | 'text'
}

// 确保 imgUrl 是完整绝对路径，微信分享卡片必须
function ensureAbsoluteUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (typeof window !== 'undefined') return window.location.origin + url
  return url
}

// 微信 JS-SDK 初始化（全局只做一次）
let wxReady = false
let wxInitializing = false
const wxReadyCallbacks: Array<() => void> = []

async function initWxSdk(signUrl: string) {
  if (wxReady) return
  if (wxInitializing) {
    // 等待已有初始化完成
    return new Promise<void>(resolve => wxReadyCallbacks.push(resolve))
  }
  wxInitializing = true
  try {
    const res = await fetch(`/api/wechat?url=${encodeURIComponent(signUrl)}`)
    const config = await res.json()
    if (!config.appId) return

    if (!(window as any).wx) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
        s.onload = () => resolve()
        s.onerror = () => reject()
        document.head.appendChild(s)
      })
    }

    const wx = (window as any).wx
    await new Promise<void>(resolve => {
      wx.config({
        debug: false,
        appId: config.appId,
        timestamp: config.timestamp,
        nonceStr: config.nonceStr,
        signature: config.signature,
        jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
      })
      wx.ready(() => {
        wxReady = true
        wxInitializing = false
        wxReadyCallbacks.forEach(cb => cb())
        wxReadyCallbacks.length = 0
        resolve()
      })
      wx.error(() => {
        wxInitializing = false
        resolve()
      })
    })
  } catch {
    wxInitializing = false
  }
}

function updateWxShare(title: string, desc: string, imgUrl: string, link: string) {
  try {
    const wx = (window as any).wx
    if (!wx || !wxReady) return
    const safeImgUrl = ensureAbsoluteUrl(imgUrl)
    wx.updateAppMessageShareData({ title, desc, link, imgUrl: safeImgUrl })
    wx.updateTimelineShareData({ title, link, imgUrl: safeImgUrl })
  } catch {}
}

export default function UnifiedShare({
  title, desc, imgUrl, pageUrl, locale, variant = 'button'
}: UnifiedShareProps) {
  const { user, loading } = useWxAuth()
  const [showGuide, setShowGuide] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const initialized = useRef(false)
  const guideTimerRef = useRef<NodeJS.Timeout | null>(null)

  const buildShareUrl = (userId?: string) => {
    const base = pageUrl.split('?')[0]
    return userId ? `${base}?ref=${userId}` : base
  }

  // 初始化 SDK
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const run = async () => {
      await initWxSdk(window.location.href)
      const shareLink = buildShareUrl(user?.id)
      updateWxShare(title, desc, imgUrl, shareLink)
    }
    run()
  }, [])

  // 登录状态变化时更新卡片
  useEffect(() => {
    if (loading || !wxReady) return
    const shareLink = buildShareUrl(user?.id)
    updateWxShare(title, desc, imgUrl, shareLink)
  }, [user?.id, loading])

  // 清理引导计时器
  useEffect(() => {
    return () => {
      if (guideTimerRef.current) clearTimeout(guideTimerRef.current)
    }
  }, [])

  const closeGuide = () => {
    setShowGuide(false)
    if (guideTimerRef.current) {
      clearTimeout(guideTimerRef.current)
      guideTimerRef.current = null
    }
  }

  const handleShare = () => {
    if (loading) return
    if (!user) {
      setShowLoginModal(true)
      return
    }
    doShare(user.id)
  }

  const doShare = (userId: string) => {
    const shareLink = buildShareUrl(userId)
    const isWeChat = /MicroMessenger/i.test(navigator.userAgent)

    if (isWeChat) {
      updateWxShare(title, desc, imgUrl, shareLink)
      setShowGuide(true)
      // 用户完成分享动作后会回到页面，8秒后自动关闭引导浮层
      if (guideTimerRef.current) clearTimeout(guideTimerRef.current)
      guideTimerRef.current = setTimeout(() => {
        setShowGuide(false)
        guideTimerRef.current = null
      }, 8000)
      return
    }

    if (navigator.share) {
      navigator.share({ title, text: desc, url: shareLink })
        .then(() => {})
        .catch(() => copyLink(shareLink))
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
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-[#F5A623] text-white py-3.5 rounded-2xl font-medium text-base hover:bg-[#E09510] transition-colors"
        >
          <ShareIcon />
          {locale === 'zh' ? '分享给朋友' : 'Share with friends'}
        </button>
      ) : (
        <button
          onClick={handleShare}
          className="text-sm text-[#F5A623] font-medium flex items-center gap-1 hover:underline"
        >
          <ShareIcon size={14} />
          {locale === 'zh' ? '分享给朋友的朋友 →' : 'Share with a friend →'}
        </button>
      )}

      {/* 微信引导浮层 — 点任意处关闭，8秒自动关闭 */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/60"
          onClick={closeGuide}
        >
          {/* 右上角箭头 */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-2 pointer-events-none">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              {/* 向右上的箭头 */}
              <path d="M12 40 C20 32 36 16 44 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <path d="M44 10 L36 10 M44 10 L44 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* 说明卡片，右上角下方 */}
          <div
            className="absolute top-16 right-3 bg-white rounded-2xl px-5 py-4 shadow-xl max-w-[220px]"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-[#2C2420] text-center mb-1">
              {locale === 'zh' ? '点右上角「···」' : 'Tap ··· in top right'}
            </p>
            <p className="text-xs text-[#9E9189] text-center leading-relaxed">
              {locale === 'zh'
                ? '选择「发送给朋友」或「分享到朋友圈」'
                : 'Choose "Send to friend" or "Share to Moments"'}
            </p>
            <button
              onClick={closeGuide}
              className="w-full mt-3 text-xs text-[#9E9189] border border-[#E8DDD4] rounded-lg py-1.5 hover:bg-[#F5EFE6] transition-colors"
            >
              {locale === 'zh' ? '已分享，关闭' : 'Done, close'}
            </button>
          </div>

          <p className="absolute bottom-10 left-0 right-0 text-center text-white/60 text-xs">
            {locale === 'zh' ? '点击任意处关闭 · 8秒后自动关闭' : 'Tap anywhere or wait 8s to close'}
          </p>
        </div>
      )}

      {/* 登录弹窗 */}
      {showLoginModal && (
        <LoginModal
          locale={locale}
          onClose={() => setShowLoginModal(false)}
          onLogin={() => setShowLoginModal(false)}
          onSkip={() => {
            setShowLoginModal(false)
            const isWeChat = /MicroMessenger/i.test(navigator.userAgent)
            if (isWeChat) {
              updateWxShare(title, desc, imgUrl, pageUrl)
              setShowGuide(true)
              guideTimerRef.current = setTimeout(() => setShowGuide(false), 8000)
            } else if (navigator.share) {
              navigator.share({ title, text: desc, url: pageUrl }).catch(() => copyLink(pageUrl))
            } else {
              copyLink(pageUrl)
            }
          }}
        />
      )}
    </>
  )
}

function LoginModal({ locale, onClose, onLogin, onSkip }: {
  locale: string
  onClose: () => void
  onLogin: () => void
  onSkip: () => void
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
        <button
          onClick={() => { login(window.location.pathname + window.location.search); onLogin() }}
          className="w-full flex items-center justify-center gap-3 bg-[#07C160] text-white py-3.5 rounded-2xl font-medium hover:bg-[#06AD56] transition-colors mb-3"
        >
          <WechatSvg />
          {locale === 'zh' ? '微信一键登录' : 'Login with WeChat'}
        </button>
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-[#9E9189] py-2 hover:text-[#2C2420] transition-colors"
        >
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
