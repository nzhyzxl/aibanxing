'use client'
import { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Spin } from 'antd'
import {
  UserOutlined,
  AppstoreOutlined,
  MailOutlined,
  DashboardOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const { Sider, Content } = Layout
const { Text } = Typography

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [checking, setChecking] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== '/admin/login') {
        router.replace('/admin/login')
      } else {
        setChecking(false)
      }
    })
  }, [pathname, router])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFAF5' }}>
        <Spin size="large" />
      </div>
    )
  }

  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '控制台' },
    { key: '/admin/artisans', icon: <UserOutlined />, label: '匠人管理' },
    { key: '/admin/invitations', icon: <MailOutlined />, label: '邀请审核' },
    { key: '/admin/products', icon: <AppstoreOutlined />, label: '产品管理' },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Text strong style={{ fontSize: collapsed ? 12 : 16 }}>
            {collapsed ? '爱' : '爱伴行后台'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0 }}
        />
        <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 16px' }}>
          <Menu
            mode="inline"
            items={[{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }]}
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/admin/login')
            }}
            style={{ borderRight: 0 }}
          />
        </div>
      </Sider>
      <Layout>
        <Content style={{ margin: '24px', background: '#fff', borderRadius: 8, padding: 24, minHeight: 360 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
