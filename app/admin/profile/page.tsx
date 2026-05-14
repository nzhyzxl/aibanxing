'use client'
import { useEffect, useState } from 'react'
import { Form, Input, Select, Button, message, Typography, Divider, Card, Avatar, Space, Tag, Grid } from 'antd'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ImageUploader from '@/components/admin/ImageUploader'
import type { User } from '@/lib/supabase'

const { Title, Text } = Typography

const categoryLabels: Record<string, string> = {
  ceramics: '陶瓷',
  leather: '皮具',
  textile: '织物',
  food: '食品',
  handcraft: '手作',
  service: '服务',
}

const categoryOptions = [
  { value: 'ceramics', label: '陶瓷' },
  { value: 'leather', label: '皮具' },
  { value: 'textile', label: '织物' },
  { value: 'food', label: '食品' },
  { value: 'handcraft', label: '手作' },
  { value: 'service', label: '服务' },
]

export default function ProfilePage() {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [avatarUrls, setAvatarUrls] = useState<string[]>([])
  const [qrUrls, setQrUrls] = useState<string[]>([])
  const [coverUrls, setCoverUrls] = useState<string[]>([])
  const [user, setUser] = useState<User | null>(null)
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.sm
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (data) {
        setUser(data)
        form.setFieldsValue({
          name: data.name,
          bio: data.bio,
          city: data.city,
          category: data.category,
          shipping_address: data.shipping_address,
        })
        if (data.avatar_url) setAvatarUrls([data.avatar_url])
        if (data.wechat_qr_url) setQrUrls([data.wechat_qr_url])
        if (data.cover_image_url) setCoverUrls([data.cover_image_url])
      }
    }
    loadProfile()
  }, [form])

  const onSave = async (values: any) => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({
        ...values,
        avatar_url: avatarUrls[0] || null,
        wechat_qr_url: qrUrls[0] || null,
        cover_image_url: coverUrls[0] || null,
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      message.error('保存失败，请重试')
    } else {
      message.success('保存成功')
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const roleLabel = user?.role === 'admin' ? '管理员' : '手艺人'
  const roleColor = user?.role === 'admin' ? '#F5A623' : '#07C160'
  const catLabel = user?.category ? categoryLabels[user.category] : null

  return (
    <div style={{ maxWidth: isMobile ? '100%' : 640 }}>
      {/* 个人头像展示区 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 16,
          textAlign: isMobile ? 'center' : 'left',
        }}>
          <Avatar
            size={72}
            src={avatarUrls[0]}
            icon={!avatarUrls[0] ? <UserOutlined /> : undefined}
            style={{ backgroundColor: '#E8C99A', flexShrink: 0 }}
          >
            {!avatarUrls[0] && user?.name?.[0]}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <Text strong style={{ fontSize: 18 }}>{user?.name || '-'}</Text>
              <Tag color={roleColor} style={{ margin: 0 }}>{roleLabel}</Tag>
              {catLabel && <Tag color="orange">{catLabel}</Tag>}
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>{user?.email}</Text>
            {user?.city && (
              <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                📍 {user.city}
              </Text>
            )}
          </div>
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            loading={loggingOut}
            danger
            block={isMobile}
          >
            退出登录
          </Button>
        </div>
      </Card>

      <Title level={4}>编辑资料</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        这里的信息会展示在你的主页上，访客通过它认识你
      </Text>

      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item label="头像">
          <ImageUploader
            value={avatarUrls}
            onChange={setAvatarUrls}
            maxCount={1}
            label="上传头像"
          />
        </Form.Item>

        <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请填写姓名' }]}>
          <Input placeholder="你的名字" />
        </Form.Item>

        <Form.Item label="一句话介绍" name="bio">
          <Input.TextArea
            placeholder="用一两句话介绍你自己和你的手艺"
            rows={3}
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item label="所在城市" name="city">
          <Input placeholder="如：成都 · 武侯" />
        </Form.Item>

        <Form.Item label="品类" name="category">
          <Select options={categoryOptions} placeholder="选择你的主要品类" />
        </Form.Item>

        <Divider />

        <Form.Item label="发货地址" name="shipping_address">
          <Input.TextArea
            placeholder="详细发货地址，仅平台内部可见"
            rows={2}
          />
        </Form.Item>

        <Divider />

        <Form.Item
          label={
            <span>
              微信二维码
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                访客通过长按扫码加你微信
              </Text>
            </span>
          }
        >
          <ImageUploader
            value={qrUrls}
            onChange={setQrUrls}
            maxCount={1}
            label="上传微信二维码"
          />
          {qrUrls[0] && (
            <Card size="small" style={{ marginTop: 8, maxWidth: isMobile ? '100%' : 200, textAlign: 'center' }}>
              <img src={qrUrls[0]} alt="微信二维码预览" style={{ width: 120, height: 120, objectFit: 'contain' }} />
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                请确认二维码清晰可识别
              </Text>
            </Card>
          )}
        </Form.Item>

        <Form.Item
          label={
            <span>
              主页封面图
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                不上传则自动使用第一个产品图
              </Text>
            </span>
          }
        >
          <ImageUploader
            value={coverUrls}
            onChange={setCoverUrls}
            maxCount={1}
            label="上传主页封面图"
          />
          {coverUrls[0] && (
            <Card size="small" style={{ marginTop: 8, maxWidth: isMobile ? '100%' : 300 }}>
              <img src={coverUrls[0]} alt="封面图预览"
                style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                建议使用横向宽图，比例 16:9 或 2:1
              </Text>
            </Card>
          )}
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving} size="large">
              保存资料
            </Button>
            <Button icon={<LogoutOutlined />} onClick={handleLogout} loading={loggingOut} size="large">
              退出登录
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}
