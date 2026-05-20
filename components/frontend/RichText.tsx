'use client'

interface RichTextProps {
  content: string
  className?: string
  /** 最多显示几行，超过则截断（CSS line-clamp） */
  lineClamp?: number
}

/**
 * 安全富文本渲染组件
 *
 * 1. escape HTML 实体 → 防 XSS
 * 2. 自动识别 http/https 链接 → <a>
 * 3. 换行符 → <br>
 *
 * 不依赖任何富文本编辑器库，保持简单。
 */
export default function RichText({ content, className = '', lineClamp }: RichTextProps) {
  if (!content) return null

  const html = renderSafeHtml(content)

  const style: React.CSSProperties = {}
  if (lineClamp) {
    style.overflow = 'hidden'
    style.display = '-webkit-box'
    style.WebkitBoxOrient = 'vertical'
    style.WebkitLineClamp = lineClamp
  }

  return (
    <span
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** 仅保留安全 HTML 标签转义 + 链接识别 + 换行转换 */
function renderSafeHtml(text: string): string {
  // 1. escape HTML 实体，防止 XSS
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // 2. 自动链接 URL（http/https 开头）
  const linked = escaped.replace(
    /(https?:\/\/[^\s<"]+)/g,
    (url) => {
      const display = url.length > 60 ? url.slice(0, 58) + '…' : url
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#F5A623] underline hover:opacity-80 break-all">${display}</a>`
    }
  )

  // 3. 换行 → <br>
  return linked.replace(/\n/g, '<br>')
}
