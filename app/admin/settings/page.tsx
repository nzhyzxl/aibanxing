'use client'
import { useEffect, useState } from 'react'
import {
  Typography, Input, Button, message, Spin,
  Card, Upload, Image, Divider
} from 'antd'
import { UploadOutlined, SaveOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'

const { Title, Text } = Typography

interface Setting {
  key: string
  value: string
  label: string
  type: 'text' | 'image' | 'textarea'
  updated_at: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setSettings(data)
        const v: Record<string, string> = {}
        data.forEach((s: Setting) => { v[s.key] = s.value || '' })
        setValues(v)
        setLoading(false)
      })
  }, [])

  const handleSave = async (key: string) => {
    setSaving(key)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: values[key] }),
    })
    setSaving(null)
    if (res.ok) {
      message.success('保存成功')
    } else {
      message.error('保存失败')
    }
  }

  const handleUpload = async (file: File, key: string) => {
    setUploading(key)
    try {
      // 上传到阿里云 OSS（通过后台 API）
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setValues(v => ({ ...v, [key]: data.url }))
        // 自动保存
        await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: data.url }),
        })
        message.success('上传并保存成功')
      } else {
        message.error('上传失败')
      }
    } catch {
      message.error('上传失败')
    }
    setUploading(null)
    return false // 阻止默认上传行为
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    )
  }

  // 按类型分组
  const imageSettings = settings.filter(s => s.type === 'image')
  const textSettings = settings.filter(s => s.type === 'text' || s.type === 'textarea')

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>系统设置</Title>

      {/* 图片设置 */}
      <Card title="图片配置" style={{ marginBottom: 24, borderRadius: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {imageSettings.map(s => (
            <div key={s.key}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>{s.label}</Text>

              {/* 当前图片预览 */}
              {values[s.key] && (
                <div style={{ marginBottom: 12 }}>
                  <Image
                    src={values[s.key]}
                    alt={s.label}
                    style={{ maxHeight: 160, borderRadius: 8, objectFit: 'cover' }}
                    width="100%"
                  />
                </div>
              )}

              {/* 上传新图片 */}
              <Upload
                beforeUpload={(file) => handleUpload(file, s.key)}
                showUploadList={false}
                accept="image/*"
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={uploading === s.key}
                  style={{ width: '100%' }}
                >
                  {uploading === s.key ? '上传中...' : '更换图片'}
                </Button>
              </Upload>

              {/* 或手动填 URL */}
              <Input
                value={values[s.key] || ''}
                onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}
                placeholder="或直接填入图片 URL"
                style={{ marginTop: 8 }}
                size="small"
              />
              <Button
                size="small"
                icon={<SaveOutlined />}
                loading={saving === s.key}
                onClick={() => handleSave(s.key)}
                style={{ marginTop: 6, width: '100%' }}
              >
                保存 URL
              </Button>

              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                最后更新：{new Date(s.updated_at).toLocaleString('zh-CN')}
              </Text>
            </div>
          ))}
        </div>
      </Card>

      {/* 文字设置 */}
      <Card title="文字配置" style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {textSettings.map((s, i) => (
            <div key={s.key}>
              {i > 0 && <Divider style={{ margin: '0 0 20px' }} />}
              <Text strong style={{ display: 'block', marginBottom: 8 }}>{s.label}</Text>
              {s.type === 'textarea' ? (
                <Input.TextArea
                  value={values[s.key] || ''}
                  onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}
                  rows={4}
                  style={{ marginBottom: 8 }}
                />
              ) : (
                <Input
                  value={values[s.key] || ''}
                  onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}
                  style={{ marginBottom: 8 }}
                />
              )}
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving === s.key}
                onClick={() => handleSave(s.key)}
                style={{ background: '#F5A623', borderColor: '#F5A623' }}
              >
                保存
              </Button>
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 12 }}>
                最后更新：{new Date(s.updated_at).toLocaleString('zh-CN')}
              </Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
