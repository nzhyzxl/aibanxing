'use client'
import { useEffect, useState } from 'react'
import { Form, Input, Select, Button, message, Typography, Divider, Card } from 'antd'
import { supabase } from '@/lib/supabase'
import ImageUploader from '@/components/admin/ImageUploader'
import type { User } from '@/lib/supabase'

const { Title, Text } = Typography

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
  const [avatarUrls, setAvatarUrls] = useState<string[]>([])
  const [qrUrls, setQrUrls] = useState<string[]>([])
  const [user, setUser] = useState<User | null>(null)

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
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      message.error('保存失败，请重试')
    } else {
      message.success('保存成功')
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Title level={4}>我的资料</Title>
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
            <Card size="small" style={{ marginTop: 8, maxWidth: 200, textAlign: 'center' }}>
              <img src={qrUrls[0]} alt="微信二维码预览" style={{ width: 120, height: 120, objectFit: 'contain' }} />
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                请确认二维码清晰可识别
              </Text>
            </Card>
          )}
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} size="large">
            保存资料
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
