'use client'
import { useEffect, useState } from 'react'
import {
  Table, Button, Modal, Form, Input, InputNumber,
  Switch, Space, message, Typography, Tag, Select, Alert
} from 'antd'
import { PlusOutlined, GiftOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'

const { Title, Text } = Typography

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [referrers, setReferrers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setArtisanId(user.id)
    })
  }, [])

  const fetchData = async () => {
    if (!artisanId) return
    setLoading(true)

    const res = await fetch(`/api/admin/transactions?artisan_id=${artisanId}`)
    const data = await res.json()
    if (res.ok) {
      setTransactions(data.transactions)
      setProducts(data.products)
      setReferrers(data.referrers)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (artisanId) fetchData()
  }, [artisanId])

  const onSave = async (values: any) => {
    if (!artisanId) return
    setSaving(true)
    const res = await fetch('/api/admin/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, artisan_id: artisanId }),
    })
    setSaving(false)
    if (!res.ok) {
      message.error('保存失败')
    } else {
      message.success('成交记录已添加')
      setModalOpen(false)
      form.resetFields()
      fetchData()
    }
  }

  const toggleSettled = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_settled: !current }),
    })
    if (!res.ok) { message.error('操作失败') } else {
      message.success(!current ? '已标记为已发红包 🧧' : '已取消')
      fetchData()
    }
  }

  const totalAmount = transactions.reduce((s, t) => s + (t.amount || 0), 0)
  const pendingGifts = transactions.filter(t => t.thank_you_amount && !t.is_settled)

  const columns = [
    { title: '产品', key: 'product', render: (_: any, r: any) => r.product?.name || r.note || '-' },
    { title: '买家', dataIndex: 'buyer_name', key: 'buyer_name' },
    {
      title: '引荐人', key: 'referrer',
      render: (_: any, r: any) => {
        const name = r.referrer?.wechat_nickname || r.referrer?.name
        return name ? <Tag color="orange">🧧 {name}</Tag> : <Text type="secondary">无</Text>
      }
    },
    { title: '成交金额', dataIndex: 'amount', key: 'amount', render: (v: number) => v ? `¥${v}` : '-' },
    {
      title: '感谢红包', dataIndex: 'thank_you_amount', key: 'thank_you_amount',
      render: (v: number) => v ? <Text style={{ color: '#F5A623' }}>¥{v}</Text> : '-'
    },
    {
      title: '红包状态', key: 'is_settled',
      render: (_: any, r: any) => r.thank_you_amount ? (
        <Switch checked={r.is_settled} checkedChildren="已发出" unCheckedChildren="未发"
          onChange={() => toggleSettled(r.id, r.is_settled)} />
      ) : '-'
    },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => new Date(v).toLocaleDateString('zh-CN') },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>成交记录</Title>
        <Button type="primary" icon={<PlusOutlined />}
          style={{ background: '#F5A623', borderColor: '#F5A623' }}
          onClick={() => setModalOpen(true)}>
          记录一笔成交
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#FEF6E9', borderRadius: 12, padding: '12px 20px', flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>总成交额</Text>
          <div style={{ fontSize: 20, fontWeight: 600 }}>¥{totalAmount}</div>
        </div>
        <div style={{ background: pendingGifts.length > 0 ? '#FFF7E6' : '#F6FFED', borderRadius: 12, padding: '12px 20px', flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>待发红包</Text>
          <div style={{ fontSize: 20, fontWeight: 600, color: pendingGifts.length > 0 ? '#F5A623' : '#52C41A' }}>
            {pendingGifts.length} 笔
          </div>
        </div>
      </div>

      {pendingGifts.length > 0 && (
        <Alert type="warning" showIcon icon={<GiftOutlined />}
          message={`有 ${pendingGifts.length} 笔感谢红包还未发出，记得通过微信发给引荐人 🧧`}
          style={{ marginBottom: 16, borderRadius: 8 }} />
      )}

      <Table columns={columns} dataSource={transactions} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} size="middle" />

      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} title="记录一笔成交" footer={null} width={480}>
        <Form form={form} layout="vertical" onFinish={onSave} style={{ marginTop: 16 }}>
          <Form.Item label="成交产品" name="product_id">
            <Select placeholder="选择产品（可选）" options={products.map((p: any) => ({ value: p.id, label: p.name }))} allowClear />
          </Form.Item>
          <Form.Item label="买家名字" name="buyer_name" rules={[{ required: true, message: '请填写买家名字' }]}>
            <Input placeholder="买家的微信昵称或姓名" />
          </Form.Item>
          <Form.Item label="引荐人" name="referrer_id" extra="选择是谁把这位买家带来的，买家自己找来的则不填">
            <Select placeholder="选择引荐人（可选）"
              options={referrers.map((r: any) => ({ value: r.id, label: r.wechat_nickname || r.name }))}
              allowClear />
          </Form.Item>
          <Form.Item label="成交金额" name="amount">
            <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} placeholder="可选填" />
          </Form.Item>
          <Form.Item label="感谢红包金额" name="thank_you_amount" extra="你打算发给引荐人多少感谢红包？留空则不记录">
            <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} placeholder="留空则不发红包" />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={2} placeholder="可选，记录一些背景信息" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving} style={{ background: '#F5A623', borderColor: '#F5A623' }}>保存</Button>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
