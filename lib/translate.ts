// 翻译服务：支持 MiniMax（默认）和 DeepSeek 双后端
// 通过环境变量 TRANSLATION_PROVIDER 切换，不填默认用 MiniMax

interface Provider {
  baseUrl: string
  apiKey: string
  model: string
}

function getProvider(): Provider | null {
  const provider = process.env.TRANSLATION_PROVIDER || 'minimax'

  if (provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) return null
    return {
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
    }
  }

  // 默认：MiniMax
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) return null
  return {
    baseUrl: 'https://api.minimaxi.com/v1',
    apiKey,
    model: process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
  }
}

export async function translateProductToEnglish(
  name: string,
  description?: string
): Promise<{ name_en: string; description_en: string }> {
  const provider = getProvider()
  if (!provider) {
    console.warn('[translate] No API key configured, skipping translation')
    return { name_en: '', description_en: '' }
  }

  const userMessage = [
    'Translate the following Chinese artisan product info into natural English.',
    'Return JSON only, no explanation, no markdown fences.',
    'Format: {"name_en":"...","description_en":"..."}',
    'Keep tone warm and craft-appropriate. Do not add content not in the original.',
    'If no description is provided, return empty string for description_en.',
    '',
    `Product name: ${name}`,
    description ? `Description: ${description}` : '',
  ].filter(Boolean).join('\n')

  try {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 512,
        temperature: 0.3,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!res.ok) {
      console.error('[translate] API error:', res.status, await res.text())
      return { name_en: '', description_en: '' }
    }

    const data = await res.json()
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { name_en: '', description_en: '' }

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('[translate] Error:', err)
    return { name_en: '', description_en: '' }
  }
}
