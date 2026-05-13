'use client'
import { useState, useEffect, useRef } from 'react'
import { Modal, Button, Spin, Typography, message } from 'antd'
import { CheckCircleFilled, CloseCircleFilled, ReloadOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'

const { Text } = Typography

interface WechatBindModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type BindStatus = 'idle' | 'loading' | 'waiting' | 'success' | 'expired' | 'error'

export default function WechatBindModal({ open, onClose, onSuccess }: WechatBindModalProps) {
  const [status, setStatus] = useState<BindStatus>('idle')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [token, setToken] = useState('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const startBind = async () => {
    setStatus('loading')
    setQrDataUrl('')
    setToken('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setStatus('error'); return }

      const res = await fetch('/api/auth/wechat-bind', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!data.bindUrl) { setStatus('error'); return }

      setToken(data.token)
      console.log('[bind] token:', data.token, 'bindUrl:', data.bindUrl)

      const qr = await QRCode.toDataURL(data.bindUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#2C2420', light: '#FFFFFF' },
      })
      setQrDataUrl(qr)
      setStatus('waiting')

      // 开始轮询
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/auth/wechat-bind-status?token=${data.token}&t=${Date.now()}`, { cache: 'no-store' })
          const result = await r.json()
          console.log('[bind-poll] status:', result.status)

          if (result.status === 'done') {
            stopPoll()
            setStatus('success')
            message.success('微信绑定成功 🎉')
            setTimeout(() => { onSuccess(); onClose() }, 1500)
          } else if (result.status === 'expired') {
            stopPoll()
            setStatus('expired')
          } else if (result.status === 'not_found') {
            stopPoll()
            setStatus('error')
            console.error('[bind-poll] token not found:', data.token)
          }
        } catch (e) {
          console.error('[bind-poll] fetch error:', e)
        }
      }, 2000)

    } catch {
      setStatus('error')
    }
  }

  // 打开时自动开始
  useEffect(() => {
    if (open) {
      startBind()
    } else {
      stopPoll()
      setStatus('idle')
      setQrDataUrl('')
    }
    return () => stopPoll()
  }, [open])

  const handleClose = () => {
    stopPoll()
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={320}
      centered
      title="绑定微信"
    >
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>

        {/* 加载中 */}
        {status === 'loading' && (
          <div style={{ padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#9E9189', fontSize: 14 }}>生成二维码中...</p>
          </div>
        )}

        {/* 等待扫码 */}
        {status === 'waiting' && qrDataUrl && (
          <>
            <div style={{
              background: '#FEF6E9',
              borderRadius: 16,
              padding: 16,
              display: 'inline-block',
              marginBottom: 12,
            }}>
              <img src={qrDataUrl} alt="绑定二维码" style={{ width: 168, height: 168, display: 'block' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2420', marginBottom: 6 }}>
              用手机微信扫描二维码
            </p>
            <p style={{ fontSize: 13, color: '#9E9189', lineHeight: 1.6 }}>
              扫码后在手机上确认授权，即可完成绑定
            </p>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Spin size="small" />
              <Text style={{ fontSize: 12, color: '#9E9189' }}>等待扫码...</Text>
            </div>
            <p style={{ fontSize: 11, color: '#C0B8B0', marginTop: 8 }}>
              二维码10分钟内有效
            </p>
          </>
        )}

        {/* 成功 */}
        {status === 'success' && (
          <div style={{ padding: '32px 0' }}>
            <CheckCircleFilled style={{ fontSize: 56, color: '#07C160', marginBottom: 16, display: 'block' }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#07C160' }}>绑定成功！</p>
            <p style={{ fontSize: 13, color: '#9E9189', marginTop: 8 }}>
              现在可以用微信扫码登录后台了 🎉
            </p>
          </div>
        )}

        {/* 过期 */}
        {status === 'expired' && (
          <div style={{ padding: '24px 0' }}>
            <CloseCircleFilled style={{ fontSize: 48, color: '#F5A623', marginBottom: 12, display: 'block' }} />
            <p style={{ fontSize: 15, color: '#2C2420', marginBottom: 8 }}>二维码已过期</p>
            <Button
              icon={<ReloadOutlined />}
              onClick={startBind}
              style={{ borderColor: '#F5A623', color: '#F5A623' }}
            >
              重新生成
            </Button>
          </div>
        )}

        {/* 错误 */}
        {status === 'error' && (
          <div style={{ padding: '24px 0' }}>
            <CloseCircleFilled style={{ fontSize: 48, color: '#FF4D4F', marginBottom: 12, display: 'block' }} />
            <p style={{ fontSize: 15, color: '#2C2420', marginBottom: 8 }}>生成失败，请重试</p>
            <Button onClick={startBind} style={{ borderColor: '#F5A623', color: '#F5A623' }}>
              重试
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
