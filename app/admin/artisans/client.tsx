'use client'
import { useState } from 'react'
import { Table, Tag, Switch, Popconfirm, message, Typography, Input, InputNumber, Button, Modal, Form, Space } from 'antd'
import { SearchOutlined, EditOutlined } from '@ant-design/icons'
import type { User } from '@/lib/supabase'

const { Title } = Typography

const categoryLabels: Record<string, string> = {
  ceramics: '陶瓷',
  leather: '皮具',
  textile: '织物',
  food: '食品',
  handcraft: '手作',
  service: '服务',
}

export default function ArtisansClient({ initialArtisans }: { initialArtisans: User[] }) {
  const [artisans, setArtisans] = useState<User[]>(initialArtisans)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const updateSortOrder = async (id: string, sortOrder: number) => {
    try {
      const res = await fetch('/api/admin/artisans/sort-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, sort_order: sortOrder }),
      })
      if (!res.ok) throw new Error('Failed')
      setArtisans(artisans.map(a => a.id === id ? { ...a, sort_order: sortOrder } : a))
    } catch {
      message.error('更新排序失败')
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    setLoading(true)
    try {
      const res = await fetch('/api/admin/artisans/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      message.success(newStatus === 'suspended' ? '已禁用，该账号下所有产品已自动下架' : '已恢复正常')
      setArtisans(artisans.map(a => a.id === id ? { ...a, status: newStatus as any } : a))
    } catch {
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue({ name: user.name, email: user.email, password: '' })
    setEditOpen(true)
  }

  const handleUpdateAuth = async (values: { name: string; email: string; password: string }) => {
    if (!editingUser) return
    if (!values.password && values.email === editingUser.email && values.name === editingUser.name) {
      message.warning('未做任何修改')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/artisans/update-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          name: values.name !== editingUser.name ? values.name : undefined,
          email: values.email !== editingUser.email ? values.email : undefined,
          password: values.password || undefined,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || '更新失败')
      }
      if (result.note) message.warning(result.note)
      else message.success('已更新')
      setEditOpen(false)
      setArtisans(artisans.map(a => a.id === editingUser.id ? {
        ...a,
        name: values.name,
        email: values.email,
      } : a))
    } catch (err: any) {
      message.error(err.message || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const filtered = artisans.filter(
    a =>
      a.name.includes(search) ||
      a.email.includes(search) ||
      a.city?.includes(search)
  )

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    {
      title: '品类',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => (v ? <Tag color="orange">{categoryLabels[v] || v}</Tag> : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: User) => (
        <Popconfirm
          title={status === 'active' ? '确认禁用此账号？该匠人下所有产品将自动下架。' : '确认恢复此账号？'}
          onConfirm={() => toggleStatus(record.id, status)}
          okText="确认"
          cancelText="取消"
        >
          <Switch
            checked={status === 'active'}
            checkedChildren="正常"
            unCheckedChildren="已禁用"
          />
        </Popconfirm>
      ),
    },
    {
      title: '加入时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString('zh-CN'),
    },
    {
      title: '排序权重',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 100,
      render: (val: number, record: User) => (
        <InputNumber
          size="small"
          min={0}
          value={val ?? 0}
          onChange={(v) => v !== null && updateSortOrder(record.id, v)}
          style={{ width: 72 }}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: User) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        匠人管理
      </Title>
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索姓名、邮箱、城市"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 300 }}
      />
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Modal
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        title="编辑账号信息"
        footer={null}
        width={400}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateAuth} style={{ marginTop: 16 }}>
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="匠人姓名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="new@email.com" />
          </Form.Item>

          <Form.Item
            label="新密码（留空则不修改）"
            name="password"
            rules={[{ min: 6, message: '密码至少6位' }]}
          >
            <Input.Password placeholder="留空则保持不变" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saving}
                style={{ background: '#F5A623', borderColor: '#F5A623' }}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
