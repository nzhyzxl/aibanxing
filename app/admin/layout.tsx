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
  const [role, setRole] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showBindModal, setShowBindModal] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const adminOnlyPaths = ['/admin/artisans', '/admin/invitations']

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session && pathname !== '/admin/login') {
        router.replace('/admin/login')
      } else if (session?.user) {
        const { data } = await supabase
          .from('users').select('wechat_openid, role, name, avatar_url').eq('id', session.user.id).single()
        setHasWechat(!!data?.wechat_openid)
        setRole(data?.role || null)
        setUserName(data?.name || '')
        setAvatarUrl(data?.avatar_url || '')
        setChecking(false)
      } else {
        setChecking(false)
      }
    })
  }, [pathname, router])

  // 手艺人不能访问管理类页面
  useEffect(() => {
    if (role === 'artisan' && adminOnlyPaths.some(p => pathname.startsWith(p))) {
      router.replace('/admin/dashboard')
    }
  }, [role, pathname, router])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFAF5' }}>
        <Spin size="large" />
      </div>
    )
  }

  const allMenuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '控制台', roles: ['admin', 'artisan'] },
    { key: '/admin/artisans', icon: <UserOutlined />, label: '匠人管理', roles: ['admin'] },
    { key: '/admin/invitations', icon: <MailOutlined />, label: '邀请审核', roles: ['admin'] },
    { key: '/admin/products', icon: <AppstoreOutlined />, label: '产品管理', roles: ['admin', 'artisan'] },
    { key: '/admin/transactions', icon: <GiftOutlined />, label: '成交记录', roles: ['admin', 'artisan'] },
    { key: '/admin/profile', icon: <SettingOutlined />, label: '我的资料', roles: ['admin', 'artisan'] },
  ]

  const menuItems = allMenuItems.filter(item => role && item.roles.includes(role))

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
        <div style={{ padding: collapsed ? '12px 8px' : '16px', borderBottom: '1px solid #f0f0f0' }}>
          {collapsed ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', margin: '0 auto 4px',
                background: avatarUrl ? 'transparent' : '#F5A623',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                    {userName?.[0] || 'U'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: avatarUrl ? 'transparent' : '#F5A623',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
                    {userName?.[0] || 'U'}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2C2420', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName || '未设置姓名'}
                </div>
                <div style={{ fontSize: 12, color: role === 'admin' ? '#F5A623' : '#07C160', marginTop: 2 }}>
                  {role === 'admin' ? '管理员' : '手艺人'}
                </div>
              </div>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0 }}
        />
        <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 12px' }}>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/admin/login')
            }}
            style={{
              width: '100%', padding: collapsed ? '8px 0' : '8px 12px',
              border: '1px solid #ff4d4f', borderRadius: 8,
              background: '#fff', color: '#ff4d4f', cursor: 'pointer',
              fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff1f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
          >
            <LogoutOutlined />
            {!collapsed && '退出登录'}
          </button>
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
