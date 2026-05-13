import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { WxAuthProvider } from '@/lib/wx-auth'

export default function FrontendLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <WxAuthProvider>
      <div className="min-h-screen bg-cream font-sans">
        <Navbar locale={locale} />
        <main>{children}</main>
        <Footer locale={locale} />
      </div>
    </WxAuthProvider>
  )
}

function Navbar({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  const otherLocale = locale === 'zh' ? 'en' : 'zh'

  return (
    <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-warm-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="font-serif text-lg font-semibold text-warm-charcoal">
          爱伴行 <span className="text-warm-gray text-sm font-sans font-normal">AiBanXing</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-warm-gray">
          <Link href={`/${locale}/artisans`} className="hover:text-warm-charcoal transition-colors">
            {t('artisans')}
          </Link>
          <Link href={`/${locale}/about`} className="hover:text-warm-charcoal transition-colors">
            {t('about')}
          </Link>
          <Link href={`/${locale}/my-shares`} className="hover:text-warm-charcoal transition-colors text-xs">
            🧧 {locale === 'zh' ? '我的分享' : 'My Shares'}
          </Link>
          <Link
            href={`/${otherLocale}`}
            className="text-xs border border-warm-border rounded-pill px-3 py-1 hover:bg-amber-light transition-colors"
          >
            {otherLocale === 'zh' ? '中' : 'EN'}
          </Link>
        </div>
      </div>
    </nav>
  )
}

function Footer({ locale }: { locale: string }) {
  return (
    <footer className="bg-cream border-t border-warm-border/40 py-12 text-center">
      <p className="font-serif text-xl text-warm-charcoal mb-2">爱伴行</p>
      <p className="text-sm text-warm-gray">用爱与善意，陪伴美好流转</p>
      <p className="text-xs text-warm-gray/60 mt-6">© 2026 爱伴行 AiBanXing</p>
    </footer>
  )
}
