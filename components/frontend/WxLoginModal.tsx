'use client'
import { useWxAuth } from '@/lib/wx-auth'

interface WxLoginModalProps {
  open: boolean
  onClose: () => void
  onSkip?: () => void
  scene: 'share' | 'contact'
  locale: string
  refId?: string
}

export default function WxLoginModal({ open, onClose, onSkip, scene, locale, refId = '' }: WxLoginModalProps) {
  const { login } = useWxAuth()
  if (!open) return null

  const isShare = scene === 'share'
  const title = isShare
    ? (locale === 'zh' ? '登录后分享，让爱流动' : 'Login to share with attribution')
    : (locale === 'zh' ? '告诉我们是谁推荐你来的' : 'Tell us who referred you')
  const desc = isShare
    ? (locale === 'zh'
        ? '微信登录后，你的分享链接会带上专属标识。朋友通过你的链接成交后，手艺人会送上感谢红包 🧧'
        : 'Your share link carries your identity. When a friend buys through it, the artisan will send a thank-you gift.')
    : (locale === 'zh'
        ? '微信登录后，平台会记录你的推荐来源，享首单专属优惠 🎁'
        : 'Login to record your referral source and get a first-order discount.')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="text-center mb-5">
          <div className="w-16 h-16 bg-[#FEF6E9] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">{isShare ? '🧧' : '🎁'}</span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#2C2420]">{title}</h3>
          <p className="text-sm text-[#9E9189] mt-2 leading-relaxed">{desc}</p>
        </div>
        <button
          onClick={() => { login(window.location.pathname + window.location.search, refId); onClose() }}
          className="w-full flex items-center justify-center gap-3 bg-[#07C160] text-white py-3.5 rounded-2xl font-medium hover:bg-[#06AD56] transition-colors mb-3"
        >
          <WechatSvg />
          {locale === 'zh' ? '微信一键登录' : 'Login with WeChat'}
        </button>
        <button
          onClick={() => { onSkip?.(); onClose() }}
          className="w-full text-center text-sm text-[#9E9189] py-2 hover:text-[#2C2420] transition-colors"
        >
          {locale === 'zh' ? '先不了，直接看' : 'Skip for now'}
        </button>
      </div>
    </div>
  )
}

function WechatSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838C16.566 5.266 12.994 2.188 8.691 2.188zm-2.906 3.803c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm4.644 2.155c-3.318 0-6 2.368-6 5.288 0 2.921 2.682 5.289 6 5.289.714 0 1.398-.112 2.03-.315a.607.607 0 01.497.068l1.32.772a.227.227 0 00.117.033c.112 0 .2-.092.2-.206 0-.05-.02-.1-.032-.148l-.272-1.027a.408.408 0 01.147-.461C21.91 16.388 22.842 15.3 22.842 14.434c0-2.92-2.682-5.288-6-5.288h-.1zm-2.12 2.036c.446 0 .807.367.807.818a.813.813 0 01-.808.818.813.813 0 01-.807-.818c0-.451.361-.818.807-.818zm4.24 0c.445 0 .807.367.807.818a.813.813 0 01-.808.818.813.813 0 01-.807-.818c0-.451.362-.818.807-.818z"/>
    </svg>
  )
}
