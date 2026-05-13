'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export interface WxUser {
  id: string
  name: string
  avatar: string
  openid: string
}

interface WxAuthContext {
  user: WxUser | null
  loading: boolean
  login: (redirectTo?: string, ref?: string) => void
  logout: () => void
}

const WxAuthContext = createContext<WxAuthContext>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
})

function readWxUserCookie(): WxUser | null {
  try {
    // 安全分割：找到 wx_user= 后取剩余全部内容（避免 base64 里的 = 被截断）
    const cookies = document.cookie.split(';')
    const entry = cookies.find(c => c.trim().startsWith('wx_user='))
    if (!entry) return null
    const raw = entry.trim().slice('wx_user='.length)
    if (!raw) return null
    // 写入时是 btoa(encodeURIComponent(json))，所以解码是 decodeURIComponent(atob(raw))
    const decoded = decodeURIComponent(atob(raw))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function WxAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WxUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const wxUser = readWxUserCookie()
    setUser(wxUser)
    setLoading(false)
  }, [])

  const login = (redirectTo?: string, ref = '') => {
    const redirect = redirectTo || window.location.pathname + window.location.search
    const params = new URLSearchParams({ redirect, ref })
    window.location.href = `/api/auth/wechat?${params}`
  }

  const logout = () => {
    document.cookie = 'wx_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    setUser(null)
  }

  return (
    <WxAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </WxAuthContext.Provider>
  )
}

export function useWxAuth() {
  return useContext(WxAuthContext)
}
