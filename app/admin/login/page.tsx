'use client'
import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const { Title, Text } = Typography

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onLogin = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      message.error('邮箱或密码错误')
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FDFAF5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
    }}>
      <Card style={{ maxWidth: 360, width: '90%', borderRadius: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 4 }}>爱伴行</Title>
          <Text type="secondary">后台管理系统</Text>
        </div>
        <Form layout="vertical" onFinish={onLogin}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input size="large" placeholder="your@email.com" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true }]}>
            <Input.Password size="large" placeholder="••••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large"
              style={{ background: '#F5A623', borderColor: '#F5A623' }}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
