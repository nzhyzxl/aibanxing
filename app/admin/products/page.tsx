'use client'
import { useEffect, useState } from 'react'
import {
  Table, Button, Switch, Space, Modal, Form, Input,
  Select, InputNumber, Tag, message, Typography, Popconfirm, Image
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import ImageUploader from '@/components/admin/ImageUploader'
import { supabase } from '@/lib/supabase'
import type { Product, User } from '@/lib/supabase'

const { Title, Text } = Typography

type ProductWithArtisan = Product & { artisan: User }

const CATEGORY_OPTIONS = [
  { value: 'ceramics', label: '陶瓷' },
  { value: 'leather', label: '皮具' },
  { value: 'textile', label: '织物' },
  { value: 'food', label: '食品' },
  { value: 'handcraft', label: '手作' },
  { value: 'service', label: '服务' },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithArtisan[]>([])
  const [artisans, setArtisans] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null)
  const [form] = Form.useForm()

  const fetchProducts = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/products')
    if (res.ok) {
      const data = await res.json()
      setProducts(data as ProductWithArtisan[])
    }
    setLoading(false)
  }

  const fetchArtisans = async () => {
    const res = await fetch('/api/admin/artisans/list')
    if (res.ok) {
      const data = (await res.json()) as User[]
      if (currentUser?.role === 'artisan') {
        setArtisans(data.filter((a) => a.id === currentUser.id))
      } else {
        setArtisans(data)
      }
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setCurrentUser({ id: session.user.id, role: data?.role || 'artisan' })
      }
    })
  }, [])

  useEffect(() => {
    if (currentUser) fetchArtisans()
  }, [currentUser])

  const openCreate = () => {
    setEditing(null)
    setImages([])
    form.resetFields()
    if (currentUser?.role === 'artisan') {
      form.setFieldsValue({ artisan_id: currentUser.id })
    }
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setImages(product.images || [])
    form.setFieldsValue({
      artisan_id: product.artisan_id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
    })
    setModalOpen(true)
  }

  const onSave = async (values: any) => {
    if (images.length === 0) {
      message.warning('请至少上传一张产品图片')
      return
    }
    setSaving(true)
    const payload = { ...values, images }

    if (editing) {
      const res = await fetch(`/api/admin/products/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { message.error('保存失败') }
      else { message.success('已更新') }
    } else {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { message.error('保存失败') }
      else { message.success('已创建，默认未上架') }
    }

    setSaving(false)
    setModalOpen(false)
    fetchProducts()
  }

  const togglePublish = async (id: string, current: boolean) => {
    const res = await fetch('/api/admin/products/toggle-publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_published: !current }),
    })
    if (!res.ok) {
      message.error('操作失败')
    } else {
      message.success(!current ? '已上架' : '已下架')
      fetchProducts()
    }
  }

  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      message.error('删除失败')
    } else {
      message.success('已删除')
      fetchProducts()
    }
  }

  const columns = [
    {
      title: '产品图',
      dataIndex: 'images',
      key: 'images',
      width: 70,
      render: (imgs: string[]) => imgs?.[0] ? (
        <Image src={imgs[0]} alt="" width={48} height={48}
          style={{ objectFit: 'cover', borderRadius: 8 }} />
      ) : <div style={{ width: 48, height: 48, background: '#F5EFE6', borderRadius: 8 }} />
    },
    { title: '产品名', dataIndex: 'name', key: 'name' },
    {
      title: '匠人',
      key: 'artisan',
      render: (_: any, r: ProductWithArtisan) => r.artisan?.name || '-'
    },
    {
      title: '品类',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => {
        const label = CATEGORY_OPTIONS.find(c => c.value === v)?.label
        return label ? <Tag color="orange">{label}</Tag> : '-'
      }
    },
    {
      title: '初心价',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => v ? `¥${v}` : <Text type="secondary">询价</Text>
    },
    {
      title: '上架状态',
      key: 'is_published',
      render: (_: any, r: Product) => (
        <Switch
          checked={r.is_published}
          checkedChildren="已上架"
          unCheckedChildren="未上架"
          onChange={() => togglePublish(r.id, r.is_published)}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, r: Product) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm
            title="确认删除这个产品？删除后不可恢复"
            onConfirm={() => deleteProduct(r.id)}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>产品管理</Title>
        <Button type="primary" icon={<PlusOutlined />}
          style={{ background: '#F5A623', borderColor: '#F5A623' }}
          onClick={openCreate}>
          新增产品
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={editing ? '编辑产品' : '新增产品'}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={onSave} style={{ marginTop: 16 }}>
          <Form.Item label="所属匠人" name="artisan_id" rules={[{ required: true, message: '请选择匠人' }]}>
            <Select
              placeholder="选择匠人"
              options={artisans.map(a => ({ value: a.id, label: a.name }))}
              disabled={!!editing || currentUser?.role === 'artisan'}
            />
          </Form.Item>

          <Form.Item label="产品名称" name="name" rules={[{ required: true, message: '请填写产品名称' }]}>
            <Input placeholder="产品名称" />
          </Form.Item>

          <Form.Item label="一句话介绍" name="description">
            <Input.TextArea rows={2} placeholder="简单描述这个产品" maxLength={100} showCount />
          </Form.Item>

          <Form.Item label="品类" name="category">
            <Select options={CATEGORY_OPTIONS} placeholder="选择品类" />
          </Form.Item>

          <Form.Item label="初心价（留空表示询价）" name="price">
            <InputNumber
              prefix="¥" min={0} precision={2} style={{ width: '100%' }}
              placeholder="留空则显示「询价」"
            />
          </Form.Item>

          <Form.Item label="产品图片（最多6张，第一张为封面）">
            <ImageUploader value={images} onChange={setImages} maxCount={6} label="上传图片" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saving}
                style={{ background: '#F5A623', borderColor: '#F5A623' }}>
                {editing ? '保存修改' : '创建产品'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
