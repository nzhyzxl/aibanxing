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

export function WxAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WxUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('wx_user='))
        ?.split('=')[1]
      if (raw) {
        setUser(JSON.parse(atob(decodeURIComponent(raw))))
      }
    } catch {}
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
