import Link from 'next/link'
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
  const zh = locale === 'zh'
  const settings = await getSiteSettings()

  return (
    <div className="min-h-screen bg-[#FDFAF5]">

      {/* 开篇诗意区 */}
      <section className="py-24 px-4 text-center bg-[#FDFAF5]">
        <h1 className="font-serif text-6xl md:text-7xl font-bold text-[#2C2420] tracking-[0.2em] mb-4">
          爱　伴　行
        </h1>
        <p className="font-serif italic text-[#F5A623] text-xl tracking-[0.15em] mb-6">
          Love · Accompany · Move
        </p>
        <div className="w-10 h-0.5 bg-[#F5A623] mx-auto mb-6" />
        <p className="font-serif text-xl text-[#6B4C35] max-w-lg mx-auto leading-relaxed">
          {zh ? '「用爱与善意，陪伴美好流转」' : '"Carrying love and goodwill, letting beautiful things pass on."'}
        </p>
      </section>

      {/* 创立故事 */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* 左侧图片 */}
          <div className="rounded-2xl overflow-hidden aspect-[4/5]">
            <img
              src={settings.about_workspace_image || 'https://aibanxing.oss-cn-hangzhou.aliyuncs.com/uploads/fba0222feb668fe38436162b4434816a.jpg'}
              alt="匠人工作场景"
              className="w-full h-full object-cover"
            />
          </div>

          {/* 右侧文字 */}
          <div className="space-y-6">
            <div>
              <p className="font-serif text-lg leading-[2] text-[#2C2420]">
                {zh
                  ? '离职以后，我一直在想一件事：身边有很多真诚且有手艺的朋友，产品非常好，却因为不懂营销和销售而没有销路。'
                  : "After leaving my job, I kept thinking about one thing: so many of my friends are talented and genuine artisans — their work is beautiful — yet they struggle to find buyers simply because they don't know how to market themselves."}
              </p>
            </div>
            <div>
              <p className="font-serif text-lg leading-[2] text-[#2C2420]">
                {zh
                  ? '我相信，商业是最大的慈善。缺少商业闭环，再多的善意也难以持续。爱伴行，就是为了让美好的东西真正流转起来。'
                  : "I believe commerce is the greatest form of charity. Without a sustainable model, even the best intentions fade. AiBanXing exists to let beautiful things actually reach the people who will cherish them."}
              </p>
            </div>
            <div>
              <p className="font-serif text-lg leading-[2] text-[#2C2420]">
                {zh
                  ? '这不是一个平台，它是一个承诺：我们只带真正值得信任的人进来，我们只推真正用心的东西出去。'
                  : "This isn't just a platform — it's a promise: we only bring in people who are truly trustworthy, and we only share things made with genuine care."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 四层哲学 */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-[#2C2420] mb-3">
              {zh ? '我们相信的四层' : 'The four layers we believe in'}
            </h2>
            <p className="text-[#9E9189]">
              {zh ? '从共识到商业，每一层都不可缺少' : 'From consensus to commerce, every layer matters'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { zh_name: '共识', en_name: 'Consensus', zh_desc: '基于共识建立信任，是整个平台的地基', en_desc: 'Trust is built on shared understanding' },
              { zh_name: '信任', en_name: 'Trust', zh_desc: '信任是可以流动的，把两个互信的人连接起来', en_desc: 'Trust flows between people who know each other' },
              { zh_name: '爱', en_name: 'Love', zh_desc: '真诚的推荐与背书，让美好的东西被看见', en_desc: 'Genuine endorsements make beauty visible' },
              { zh_name: '商业', en_name: 'Commerce', zh_desc: '通过商业让产品流转，爱才能持续流动', en_desc: 'Commerce sustains the flow of love' },
            ].map((layer, i) => (
              <div key={i} className="bg-[#FEF6E9] rounded-2xl p-5 border border-[#E8C99A] text-center relative">
                <p className="text-xs text-[#F5A623] font-medium mb-2">
                  {['一', '二', '三', '四'][i]}
                </p>
                <p className="font-serif text-2xl font-bold text-[#2C2420] mb-1">
                  {zh ? layer.zh_name : layer.en_name}
                </p>
                <p className="font-serif italic text-[#F5A623] text-sm mb-3">
                  {zh ? layer.en_name : layer.zh_name}
                </p>
                <p className="text-xs text-[#9E9189] leading-relaxed">
                  {zh ? layer.zh_desc : layer.en_desc}
                </p>
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
            {zh ? '只有受邀，才能加入' : 'Invitation only'}
          </h2>
          <p className="text-[#9E9189]">
            {zh ? '这不是普通的邀请制，而是一套连带责任机制' : "This isn't just an invite system — it's a chain of accountability"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-4 mb-10">
          {[
            { num: '01', zh_title: '受邀加入', en_title: 'Join by invitation', zh_desc: '只有平台内已有成员，才能邀请新的匠人加入', en_desc: 'Only existing members can invite new artisans' },
            { num: '02', zh_title: '真实背书', en_title: 'Real endorsement', zh_desc: '邀请人必须写一段真实的背书，永久展示在匠人主页', en_desc: 'Inviters must write a real endorsement, shown permanently on the artisan\'s profile' },
            { num: '03', zh_title: '永久可溯', en_title: 'Permanently traceable', zh_desc: '信任链完整保留，每一位匠人的来源清晰可见', en_desc: 'The trust chain is preserved in full — every artisan\'s origin is visible' },
          ].map((step, i) => (
            <div key={i} className="flex-1 flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F5A623] flex items-center justify-center text-white text-sm font-bold">
                {step.num}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#2C2420] mb-1">
                  {zh ? step.zh_title : step.en_title}
                </p>
                <p className="text-sm text-[#9E9189] leading-relaxed">
                  {zh ? step.zh_desc : step.en_desc}
                </p>
              </div>
              {i < 2 && <div className="hidden md:block text-[#F5A623] text-xl pt-2">→</div>}
            </div>
          ))}
        </div>

        {/* 引用块 */}
        <div className="border-l-4 border-[#F5A623] bg-[#FEF6E9] rounded-r-2xl p-5">
          <p className="font-serif italic text-[#6B4C35] text-base leading-relaxed">
            {zh
              ? '「如果你不够信任这个人，你不会为他背书。这就是门槛。」'
              : '"If you don\'t trust someone enough, you won\'t vouch for them. That\'s the threshold."'}
          </p>
        </div>
      </section>

      {/* 创始人的话 */}
      <section className="bg-[#FDFAF5] border-y border-[#E8DDD4] py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs tracking-[0.2em] text-[#F5A623] uppercase mb-6 font-medium">
            {zh ? '创始人的话' : 'A NOTE FROM THE FOUNDER'}
          </p>
          <div className="space-y-5 text-left">
            {[
              zh ? '很多年前，我就想做一件事：加快爱流动的效率。这件事我想了很多年，直到裸辞以后才真正想清楚。'
                : "For many years I wanted to do one thing: accelerate the flow of love. It took me years to figure out how — and leaving my job to finally think it through.",
              zh ? '爱伴行不是一个平台，它是一个承诺：我们只带真正值得信任的人进来，我们只推真正用心的东西出去。'
                : "AiBanXing isn't a platform — it's a promise. We only bring in people who are truly trustworthy, and we only share things made with genuine care.",
              zh ? '如果你在这里买到了一件好东西，希望你也把它分享给你信任的朋友。这就是爱流动的样子。'
                : "If you find something beautiful here, share it with someone you trust. That's what love in motion looks like.",
            ].map((para, i) => (
              <p key={i} className="font-serif italic text-[#2C2420] text-base leading-[2]">{para}</p>
            ))}
          </div>
          <p className="text-right text-[#F5A623] font-serif mt-6">
            — {zh ? '爱伴行创始人' : 'Founder, AiBanXing'}
          </p>
        </div>
      </section>

      {/* 加入 CTA */}
      <section className="bg-[#FEF6E9] py-16 px-4 text-center">
        <h2 className="font-serif text-3xl font-bold text-[#2C2420] mb-3">
          {zh ? '想加入我们？' : 'Want to join?'}
        </h2>
        <p className="text-[#9E9189] mb-8 max-w-md mx-auto">
          {zh
            ? '告诉我们你的故事，我们会认真阅读每一封消息'
            : 'Tell us your story — we read every message carefully'}
        </p>

        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8C99A] inline-block">
            <img
              src={settings.about_wechat_qr || 'https://aibanxing.oss-cn-hangzhou.aliyuncs.com/uploads/64ef9df45b9fcd94ef7ab892b63343e2.jpg'}
              alt="微信二维码"
              className="w-28 h-28 rounded-xl object-cover"
            />
          </div>
          <p className="text-sm text-[#6B4C35] font-medium">
            {zh ? '扫码联系我们' : 'Scan to reach us'}
          </p>
        </div>

        <p className="text-sm text-[#9E9189] max-w-sm mx-auto">
          {zh
            ? '或者，找一位已在平台的朋友，请他为你引荐'
            : 'Or find someone already on the platform and ask them to introduce you'}
        </p>

        <div className="mt-8">
          <Link
            href={`/${locale}/artisans`}
            className="inline-flex items-center gap-2 bg-[#F5A623] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#E09510] transition-colors"
          >
            {zh ? '先认识我们的匠人 →' : 'Meet our artisans first →'}
          </Link>
        </div>
      </section>
    </div>
  )
}
