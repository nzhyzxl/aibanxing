'use client'
import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Table, Typography, Button } from 'antd'
import { UserOutlined, AppstoreOutlined, MailOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({ artisans: 0, products: 0, pendingInvitations: 0 })
  const [recentInvitations, setRecentInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats({
          artisans: data.artisans,
          products: data.products,
          pendingInvitations: data.pendingInvitations,
        })
        setRecentInvitations(data.recentInvitations || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const invitationColumns = [
    { title: '被邀请人', dataIndex: 'invitee_name', key: 'invitee_name' },
    { title: '邀请人', key: 'inviter', render: (_: any, r: any) => r.inviter?.name || '-' },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => new Date(v).toLocaleDateString('zh-CN') },
    {
      title: '', key: 'action',
      render: () => (
        <Button size="small" type="link" onClick={() => router.push('/admin/invitations')}>
          去审核
        </Button>
      )
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>控制台</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#FEF6E9' }}>
            <Statistic title="在线匠人" value={stats.artisans} prefix={<UserOutlined style={{ color: '#F5A623' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#EBF3FB' }}>
            <Statistic title="上架产品" value={stats.products} prefix={<AppstoreOutlined style={{ color: '#2E6DA4' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: stats.pendingInvitations > 0 ? '#FFF1F0' : '#F6FFED' }}>
            <Statistic
              title="待审核邀请"
              value={stats.pendingInvitations}
              prefix={<MailOutlined style={{ color: stats.pendingInvitations > 0 ? '#FF4D4F' : '#52C41A' }} />}
              valueStyle={{ color: stats.pendingInvitations > 0 ? '#FF4D4F' : '#52C41A' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F6FFED' }}>
            <Statistic title="已上架" value={stats.products} prefix={<CheckCircleOutlined style={{ color: '#52C41A' }} />} />
          </Card>
        </Col>
      </Row>

      {recentInvitations.length > 0 && (
        <Card
          title="待审核邀请"
          bordered={false}
          style={{ borderRadius: 12 }}
          extra={<Button type="link" onClick={() => router.push('/admin/invitations')}>查看全部</Button>}
        >
          <Table
            columns={invitationColumns}
            dataSource={recentInvitations}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {recentInvitations.length === 0 && !loading && (
        <Card bordered={false} style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 32, color: '#52C41A', marginBottom: 12 }} />
          <p style={{ color: '#9E9189' }}>暂无待审核的邀请，一切正常 ✓</p>
        </Card>
      )}
    </div>
  )
}
