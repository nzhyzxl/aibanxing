'use client'
import { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Spin, Alert } from 'antd'
import {
  UserOutlined,
  AppstoreOutlined,
  MailOutlined,
  DashboardOutlined,
  LogoutOutlined,
  GiftOutlined,
  SettingOutlined,
  WechatOutlined,
  ControlOutlined,
} from '@ant-design/icons'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WechatBindModal from '@/components/admin/WechatBindModal'

const { Sider, Content } = Layout
const { Text } = Typography

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasWechat, setHasWechat] = useState(true)
  const [showBindModal, setShowBindModal] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session && pathname !== '/admin/login') {
        router.replace('/admin/login')
      } else {
        setChecking(false)
        if (session?.user) {
          const { data } = await supabase
            .from('users').select('wechat_openid').eq('id', session.user.id).single()
          setHasWechat(!!data?.wechat_openid)
        }
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
    { key: '/admin/transactions', icon: <GiftOutlined />, label: '成交记录' },
    { key: '/admin/profile', icon: <SettingOutlined />, label: '我的资料' },
    { key: '/admin/settings', icon: <ControlOutlined />, label: '系统设置' },
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
        {!hasWechat && pathname !== '/admin/login' && (
          <Alert
            type="warning"
            showIcon
            icon={<WechatOutlined />}
            message={
              <span>
                你还没有绑定微信。绑定后可以分享产品并收获感谢红包 🧧
                <a onClick={() => setShowBindModal(true)}
                  style={{ marginLeft: 8, color: '#F5A623', cursor: 'pointer' }}>
                  立即绑定 →
                </a>
              </span>
            }
            closable
            style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
          />
        )}
        <Content style={{ margin: '24px', background: '#fff', borderRadius: 8, padding: 24, minHeight: 360 }}>
          {children}
        </Content>
      </Layout>

      <WechatBindModal
        open={showBindModal}
        onClose={() => setShowBindModal(false)}
        onSuccess={() => setHasWechat(true)}
      />
    </Layout>
  )
}
