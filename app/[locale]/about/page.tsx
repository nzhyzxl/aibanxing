import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getSupabaseAdmin } from '@/lib/supabase'

async function getSiteSettings() {
  try {
    const { data } = await getSupabaseAdmin()
      .from('site_settings')
      .select('key, value')
    const map: Record<string, string> = {}
    ;(data || []).forEach(({ key, value }: { key: string; value: string }) => {
      map[key] = value
    })
    return map
  } catch {
    return {}
  }
}

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = await getTranslations('about')
  const settings = await getSiteSettings()

  const layers = [
    { ordinal: t('layer_1_ordinal'), name: t('layer_1_name'), alt: t('layer_1_alt'), desc: t('layer_1_desc') },
    { ordinal: t('layer_2_ordinal'), name: t('layer_2_name'), alt: t('layer_2_alt'), desc: t('layer_2_desc') },
    { ordinal: t('layer_3_ordinal'), name: t('layer_3_name'), alt: t('layer_3_alt'), desc: t('layer_3_desc') },
    { ordinal: t('layer_4_ordinal'), name: t('layer_4_name'), alt: t('layer_4_alt'), desc: t('layer_4_desc') },
  ]

  const steps = [
    { num: '01', title: t('step_1_title'), desc: t('step_1_desc') },
    { num: '02', title: t('step_2_title'), desc: t('step_2_desc') },
    { num: '03', title: t('step_3_title'), desc: t('step_3_desc') },
  ]

  const founderParagraphs = [t('founder_p1'), t('founder_p2'), t('founder_p3')]

  return (
    <div className="min-h-screen bg-[#FDFAF5]">

      {/* 开篇诗意区 */}
      <section className="py-24 px-4 text-center bg-[#FDFAF5]">
        <h1 className="font-serif text-6xl md:text-7xl font-bold text-[#2C2420] tracking-[0.2em] mb-4">
          {t('title')}
        </h1>
        <p className="font-serif italic text-[#F5A623] text-xl tracking-[0.15em] mb-6">
          {t('subtitle_en')}
        </p>
        <div className="w-10 h-0.5 bg-[#F5A623] mx-auto mb-6" />
        <p className="font-serif text-xl text-[#6B4C35] max-w-lg mx-auto leading-relaxed">
          {t('tagline')}
        </p>
      </section>

      {/* 创立故事 */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden aspect-[4/5]">
            <img
              src={settings.about_workspace_image || 'https://aibanxing.oss-cn-hangzhou.aliyuncs.com/uploads/fba0222feb668fe38436162b4434816a.jpg'}
              alt={t('workspace_alt')}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <p className="font-serif text-lg leading-[2] text-[#2C2420]">{t('story_p1')}</p>
            </div>
            <div>
              <p className="font-serif text-lg leading-[2] text-[#2C2420]">{t('story_p2')}</p>
            </div>
            <div>
              <p className="font-serif text-lg leading-[2] text-[#2C2420]">{t('story_p3')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 四层哲学 */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-[#2C2420] mb-3">
              {t('layers_title')}
            </h2>
            <p className="text-[#9E9189]">{t('layers_subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {layers.map((layer, i) => (
              <div key={i} className="bg-[#FEF6E9] rounded-2xl p-5 border border-[#E8C99A] text-center relative">
                <p className="text-xs text-[#F5A623] font-medium mb-2">{layer.ordinal}</p>
                <p className="font-serif text-2xl font-bold text-[#2C2420] mb-1">{layer.name}</p>
                <p className="font-serif italic text-[#F5A623] text-sm mb-3">{layer.alt}</p>
                <p className="text-xs text-[#9E9189] leading-relaxed">{layer.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-[#F5A623] text-xl z-10">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 信任机制说明 */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-[#2C2420] mb-3">
            {t('invite_only')}
          </h2>
          <p className="text-[#9E9189]">{t('invite_only_subtitle')}</p>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-4 mb-10">
          {steps.map((step, i) => (
            <div key={i} className="flex-1 flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F5A623] flex items-center justify-center text-white text-sm font-bold">
                {step.num}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#2C2420] mb-1">{step.title}</p>
                <p className="text-sm text-[#9E9189] leading-relaxed">{step.desc}</p>
              </div>
              {i < 2 && <div className="hidden md:block text-[#F5A623] text-xl pt-2">→</div>}
            </div>
          ))}
        </div>

        {/* 引用块 */}
        <div className="border-l-4 border-[#F5A623] bg-[#FEF6E9] rounded-r-2xl p-5">
          <p className="font-serif italic text-[#6B4C35] text-base leading-relaxed">
            {t('quote')}
          </p>
        </div>
      </section>

      {/* 创始人的话 */}
      <section className="bg-[#FDFAF5] border-y border-[#E8DDD4] py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs tracking-[0.2em] text-[#F5A623] uppercase mb-6 font-medium">
            {t('founder_label')}
          </p>
          <div className="space-y-5 text-left">
            {founderParagraphs.map((para, i) => (
              <p key={i} className="font-serif italic text-[#2C2420] text-base leading-[2]">{para}</p>
            ))}
          </div>
          <p className="text-right text-[#F5A623] font-serif mt-6">
            — {t('founder_sig')}
          </p>
        </div>
      </section>

      {/* 加入 CTA */}
      <section className="bg-[#FEF6E9] py-16 px-4 text-center">
        <h2 className="font-serif text-3xl font-bold text-[#2C2420] mb-3">
          {t('join_title')}
        </h2>
        <p className="text-[#9E9189] mb-8 max-w-md mx-auto">
          {t('join_subtitle')}
        </p>

        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8C99A] inline-block">
            <img
              src={settings.about_wechat_qr || 'https://aibanxing.oss-cn-hangzhou.aliyuncs.com/uploads/64ef9df45b9fcd94ef7ab892b63343e2.jpg'}
              alt="WeChat QR"
              className="w-28 h-28 rounded-xl object-cover"
            />
          </div>
          <p className="text-sm text-[#6B4C35] font-medium">{t('scan_hint')}</p>
        </div>

        <p className="text-sm text-[#9E9189] max-w-sm mx-auto">
          {t('or_ask_friend')}
        </p>

        <div className="mt-8">
          <Link
            href={`/${locale}/artisans`}
            className="inline-flex items-center gap-2 bg-[#F5A623] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#E09510] transition-colors"
          >
            {t('meet_artisans')}
          </Link>
        </div>
      </section>
    </div>
  )
}
