'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useWxAuth } from '@/lib/wx-auth'
import { supabase } from '@/lib/supabase'

export default function MySharesPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const { user, loading, login } = useWxAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!user) { setFetching(false); return }
    const fetchData = async () => {
      const [logsRes, txRes] = await Promise.all([
        supabase.from('ref_logs')
          .select('*, product:product_id(name, images, artisan:artisan_id(name))')
          .eq('ref_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('transactions')
          .select('*, product:product_id(name, images), artisan:artisan_id(name)')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false }),
      ])
      setLogs(logsRes.data || [])
      setTransactions(txRes.data || [])
      setFetching(false)
    }
    fetchData()
  }, [user])

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#FDFAF5] flex items-center justify-center">
        <p className="text-[#9E9189] text-sm animate-pulse">加载中...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFAF5] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">🧧</div>
        <h1 className="font-serif text-2xl font-bold text-[#2C2420] mb-2">
          {locale === 'zh' ? '我的分享记录' : 'My Shares'}
        </h1>
        <p className="text-[#9E9189] text-sm mb-6 max-w-xs leading-relaxed">
          {locale === 'zh'
            ? '登录后可以看到你分享了哪些产品，以及产生了哪些感谢红包'
            : 'Login to see your share history and thank-you gifts'}
        </p>
        <button
          onClick={() => login(`/${locale}/my-shares`)}
          className="flex items-center gap-2 bg-[#07C160] text-white px-8 py-3 rounded-full font-medium hover:bg-[#06AD56] transition-colors"
        >
          微信登录查看
        </button>
      </div>
    )
  }

  const totalThankYou = transactions.filter(t => t.is_settled).reduce((s, t) => s + (t.thank_you_amount || 0), 0)
  const pendingThankYou = transactions.filter(t => !t.is_settled && t.thank_you_amount).reduce((s, t) => s + (t.thank_you_amount || 0), 0)

  return (
    <div className="min-h-screen bg-[#FDFAF5]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 用户信息 */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-shrink-0 w-14 h-14 rounded-full border-2 border-[#F5A623] overflow-hidden bg-[#FEF6E9]">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // 头像加载失败时显示首字母
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center text-[#854F0B] text-xl font-serif font-bold ${user.avatar ? 'hidden' : ''}`}>
              {user.name[0]}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif font-semibold text-lg text-[#2C2420] truncate">{user.name}</p>
            <p className="text-xs text-[#9E9189]">爱伴行分享者</p>
          </div>
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: '分享次数', value: logs.length, icon: '📤' },
            { label: '引荐成交', value: transactions.length, icon: '🤝' },
            { label: '已收红包', value: `¥${totalThankYou}`, icon: '🧧' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E8DDD4] p-4 text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="font-bold text-xl text-[#2C2420]">{s.value}</p>
              <p className="text-xs text-[#9E9189] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 待收红包提醒 */}
        {pendingThankYou > 0 && (
          <div className="bg-[#FEF6E9] border border-[#F5A623]/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🧧</span>
            <div>
              <p className="font-medium text-[#854F0B] text-sm">有 ¥{pendingThankYou} 的感谢红包等待发放</p>
              <p className="text-xs text-[#9E9189] mt-0.5">手艺人会通过微信直接发给你</p>
            </div>
          </div>
        )}

        {/* 成交记录 */}
        {transactions.length > 0 && (
          <section className="mb-8">
            <h2 className="font-serif text-lg font-semibold text-[#2C2420] mb-4">引荐成交记录</h2>
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="bg-white rounded-2xl border border-[#E8DDD4] p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F5EFE6] flex-shrink-0">
                    {tx.product?.images?.[0]
                      ? <Image src={tx.product.images[0]} alt="" width={48} height={48} className="object-cover w-full h-full" />
                      : <div className="w-full h-full flex items-center justify-center text-[#C8A882]">🌿</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#2C2420] truncate">{tx.product?.name || '-'}</p>
                    <p className="text-xs text-[#9E9189] mt-0.5">{tx.artisan?.name} · {new Date(tx.created_at).toLocaleDateString('zh-CN')}</p>
                  </div>
                  {tx.thank_you_amount && (
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold ${tx.is_settled ? 'text-[#07C160]' : 'text-[#F5A623]'}`}>
                        🧧 ¥{tx.thank_you_amount}
                      </p>
                      <p className="text-xs text-[#9E9189] mt-0.5">{tx.is_settled ? '已收到' : '待发放'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 分享记录 */}
        <section>
          <h2 className="font-serif text-lg font-semibold text-[#2C2420] mb-4">最近分享记录</h2>
          {logs.length === 0 ? (
            <div className="text-center py-10 text-[#9E9189]">
              <p className="text-3xl mb-3">📤</p>
              <p className="text-sm">还没有分享记录，去分享一个你喜欢的产品吧</p>
              <Link href={`/${locale}`} className="text-[#F5A623] text-sm mt-3 inline-block">浏览产品 →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="bg-white rounded-2xl border border-[#E8DDD4] p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F5EFE6] flex-shrink-0">
                    {log.product?.images?.[0]
                      ? <Image src={log.product.images[0]} alt="" width={48} height={48} className="object-cover w-full h-full" />
                      : <div className="w-full h-full flex items-center justify-center text-[#C8A882]">🌿</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#2C2420] truncate">{log.product?.name || '产品'}</p>
                    <p className="text-xs text-[#9E9189] mt-0.5">{log.product?.artisan?.name} · {new Date(log.created_at).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <span className="text-xs text-[#9E9189] bg-[#F5EFE6] px-2 py-1 rounded-full flex-shrink-0">📤 已分享</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
