'use client'
import { useState } from 'react'
import { Table, Button, Tag, Space, Modal, message, Typography, Card } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { Invitation, User } from '@/lib/supabase'

const { Title, Text, Paragraph } = Typography

type InvitationWithInviter = Invitation & { inviter: User }

export default function InvitationsClient({ initialInvitations }: { initialInvitations: InvitationWithInviter[] }) {
  const [invitations, setInvitations] = useState<InvitationWithInviter[]>(initialInvitations)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<InvitationWithInviter | null>(null)

  const fetchInvitations = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/invitations/list')
    if (res.ok) {
      const data = await res.json()
      setInvitations(data as InvitationWithInviter[])
    }
    setLoading(false)
  }

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setLoading(true)
    const res = await fetch('/api/admin/invitations/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })

    if (!res.ok) {
      message.error('操作失败')
    } else {
      message.success(status === 'approved' ? '已通过，请手动为被邀请人创建账号' : '已拒绝')
      setDetail(null)
      fetchInvitations()
    }
    setLoading(false)
  }

  const statusTag = (s: string) => {
    const map: Record<string, [string, string]> = {
      pending: ['orange', '待审核'],
      approved: ['green', '已通过'],
      rejected: ['red', '已拒绝'],
    }
    const [color, label] = map[s] || ['default', s]
    return <Tag color={color}>{label}</Tag>
  }

  const columns = [
    { title: '被邀请人', dataIndex: 'invitee_name', key: 'invitee_name' },
    { title: '邮箱', dataIndex: 'invitee_email', key: 'invitee_email' },
    {
      title: '邀请人',
      key: 'inviter',
      render: (_: any, r: InvitationWithInviter) => r.inviter?.name || '-',
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: statusTag },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, r: InvitationWithInviter) => (
        <Space>
          <Button size="small" onClick={() => setDetail(r)}>查看背书</Button>
          {r.status === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />}
                onClick={() => handleReview(r.id, 'approved')}>通过</Button>
              <Button size="small" danger icon={<CloseOutlined />}
                onClick={() => handleReview(r.id, 'rejected')}>拒绝</Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>邀请审核</Title>
      <Table
        columns={columns}
        dataSource={invitations}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Modal
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={detail?.status === 'pending' ? [
          <Button key="reject" danger onClick={() => handleReview(detail!.id, 'rejected')}>拒绝</Button>,
          <Button key="approve" type="primary" onClick={() => handleReview(detail!.id, 'approved')}>通过</Button>,
        ] : null}
        title="邀请详情"
      >
        {detail && (
          <Card variant="borderless">
            <p><Text strong>被邀请人：</Text>{detail.invitee_name}（{detail.invitee_email}）</p>
            <p><Text strong>邀请人：</Text>{detail.inviter?.name}</p>
            <div style={{ marginTop: 12 }}>
              <Text strong>背书内容：</Text>
              <Paragraph
                style={{
                  marginTop: 8,
                  padding: '12px 16px',
                  background: '#FEF6E9',
                  borderLeft: '3px solid #F5A623',
                  borderRadius: 4,
                }}
              >
                {detail.endorsement}
              </Paragraph>
            </div>
          </Card>
        )}
      </Modal>
    </div>
  )
}
