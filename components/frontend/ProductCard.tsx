import Link from 'next/link'
import Image from 'next/image'
import type { Product, User } from '@/lib/supabase'

interface ProductCardProps {
  product: Product & { artisan: User }
  locale: string
}

export default function ProductCard({ product, locale }: ProductCardProps) {
  const name = locale === 'en' && product.name_en ? product.name_en : product.name
  const coverImage = product.images[0]

  return (
    <Link
      href={`/${locale}/artisans/${product.artisan_id}`}
      className="block bg-white rounded-card border border-warm-border hover:border-amber-brand hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
    >
      {/* 产品图 */}
      <div className="relative aspect-[4/3] bg-amber-light overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-warm-gray/40 text-sm">
            暂无图片
          </div>
        )}
      </div>

      {/* 卡片内容 */}
      <div className="p-3">
        <p className="font-serif font-medium text-sm text-warm-charcoal mb-1 line-clamp-1">
          {name}
        </p>

        {/* 匠人行 */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 rounded-full bg-amber-light flex items-center justify-center text-amber-dark text-xs font-medium flex-shrink-0">
            {product.artisan.name[0]}
          </div>
          <span className="text-xs text-warm-gray truncate">{product.artisan.name}</span>
        </div>

        {/* 初心价行 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs bg-amber-brand text-white px-2 py-0.5 rounded-pill font-medium">
            初心价
          </span>
          <span className="text-sm font-semibold text-warm-charcoal">
            {product.price ? `¥${product.price}` : (locale === 'zh' ? '询价' : 'Inquire')}
          </span>
        </div>

        {/* 信任归属 */}
        {product.artisan.invited_by && (
          <p className="text-xs text-warm-gray/60 mt-2 truncate">
            {locale === 'zh' ? `由 ${product.artisan.name} 推荐` : `Via ${product.artisan.name}`}
          </p>
        )}
      </div>
    </Link>
  )
}
