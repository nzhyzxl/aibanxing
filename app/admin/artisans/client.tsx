'use client'
import { useState } from 'react'
import { Table, Tag, Switch, Popconfirm, message, Typography, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
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
    } catch (err) {
      message.error('操作失败')
    } finally {
      setLoading(false)
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
    </div>
  )
}
