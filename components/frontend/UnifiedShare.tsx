'use client'
import { useEffect, useState, useRef } from 'react'
import { useWxAuth } from '@/lib/wx-auth'

interface UnifiedShareProps {
  // 分享卡片内容
  title: string
  desc: string
  imgUrl: string
  // 落地页：不含任何参数的原始 URL
  pageUrl: string
  locale: string
  // 显示样式
  variant?: 'button' | 'text'   // button=橙色大按钮  text=文字链接
}

// 微信 JS-SDK 初始化（全局只做一次）
let wxInitialized = false
async function initWxSdk(signUrl: string) {
  if (wxInitialized) return
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
    wx.config({
      debug: false,
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
    })
    wxInitialized = true
  } catch {}
}

// 更新微信分享卡片内容
function updateWxShare(title: string, desc: string, imgUrl: string, link: string) {
  try {
    const wx = (window as any).wx
    if (!wx?.ready) return
    wx.ready(() => {
      wx.updateAppMessageShareData({ title, desc, link, imgUrl })
      wx.updateTimelineShareData({ title, link, imgUrl })
    })
  } catch {}
}

export default function UnifiedShare({
  title, desc, imgUrl, pageUrl, locale, variant = 'button'
}: UnifiedShareProps) {
  const { user, loading } = useWxAuth()
  const [showGuide, setShowGuide] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const initialized = useRef(false)

  // 构建带 ref 的分享链接
  const buildShareUrl = (userId?: string) => {
    const base = pageUrl.split('?')[0]
    return userId ? `${base}?ref=${userId}` : base
  }

  // 初始化微信JS-SDK，并更新卡片内容
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const run = async () => {
      await initWxSdk(window.location.href)
      // 登录状态确定后再设置卡片链接
      const shareLink = buildShareUrl(user?.id)
      updateWxShare(title, desc, imgUrl, shareLink)
    }
    run()
  }, []) // 只在挂载时执行一次

  // 用户登录状态变化时，更新微信卡片链接
  useEffect(() => {
    if (loading) return
    const shareLink = buildShareUrl(user?.id)
    updateWxShare(title, desc, imgUrl, shareLink)
  }, [user?.id, loading, title, desc, imgUrl])

  const handleShare = () => {
    if (loading) return

    if (!user) {
      // 未登录：强制弹登录框
      setShowLoginModal(true)
      return
    }

    // 已登录：执行分享
    doShare(user.id)
  }

  const doShare = (userId: string) => {
    const shareLink = buildShareUrl(userId)

    // 微信环境：提示点右上角（微信不允许代码触发分享）
    const isWeChat = /MicroMessenger/i.test(navigator.userAgent)
    if (isWeChat) {
      // 更新卡片内容（确保用最新 ref 链接）
      updateWxShare(title, desc, imgUrl, shareLink)
      setShowGuide(true)
      return
    }

    // 非微信环境：Web Share API 或复制链接
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
      {/* 分享按钮 */}
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

      {/* 微信环境分享引导浮层 */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/60"
          onClick={() => setShowGuide(false)}
        >
          {/* 右上角箭头引导 */}
          <div className="absolute top-0 right-0 p-4 flex flex-col items-end gap-2">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M40 8 C40 8 20 8 8 8 M40 8 L32 2 M40 8 L32 14"
                stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M40 8 Q40 28 40 40" stroke="white" strokeWidth="3"
                strokeLinecap="round" strokeDasharray="4 4"/>
            </svg>
            <div className="bg-white rounded-2xl px-5 py-3 shadow-lg max-w-[200px]">
              <p className="text-sm font-medium text-[#2C2420] text-center">
                {locale === 'zh' ? '点右上角「…」' : 'Tap ··· above'}
              </p>
              <p className="text-xs text-[#9E9189] text-center mt-1">
                {locale === 'zh' ? '选择「发送给朋友」或「分享到朋友圈」' : 'Send to friend or share to Moments'}
              </p>
            </div>
          </div>
          <p className="absolute bottom-16 left-0 right-0 text-center text-white/70 text-sm">
            {locale === 'zh' ? '点击任意处关闭' : 'Tap anywhere to close'}
          </p>
        </div>
      )}

      {/* 登录弹窗 */}
      {showLoginModal && (
        <LoginModal
          locale={locale}
          onClose={() => setShowLoginModal(false)}
          onLogin={() => {
            setShowLoginModal(false)
            // 登录后 wx-auth 会刷新页面，wx-auth 回调会带回当前页面
          }}
          onSkip={() => {
            setShowLoginModal(false)
            // 跳过登录：不带 ref 分享
            const isWeChat = /MicroMessenger/i.test(navigator.userAgent)
            if (isWeChat) {
              updateWxShare(title, desc, imgUrl, pageUrl)
              setShowGuide(true)
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

// ── 登录弹窗 ──
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
              ? '微信登录后，你的分享链接会带上专属标识。朋友通过你的链接成交后，手艺人会送上感谢红包 🧧'
              : 'Your share link carries your identity. Friends who buy through it earn you a thank-you gift.'}
          </p>
        </div>
        <button
          onClick={() => {
            login(window.location.pathname + window.location.search)
            onLogin()
          }}
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
