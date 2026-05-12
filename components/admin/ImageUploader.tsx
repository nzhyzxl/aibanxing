'use client'
import { useState, useRef } from 'react'
import { Upload, Button, message, Image } from 'antd'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import imageCompression from 'browser-image-compression'

interface ImageUploaderProps {
  value?: string[]
  onChange?: (urls: string[]) => void
  maxCount?: number
  label?: string
}

export default function ImageUploader({
  value = [],
  onChange,
  maxCount = 6,
  label = '上传图片',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File) => {
    if (value.length >= maxCount) {
      message.warning(`最多上传 ${maxCount} 张图片`)
      return false
    }

    setUploading(true)
    try {
      // 压缩图片
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })

      // 上传到 OSS
      const formData = new FormData()
      formData.append('file', compressed, file.name)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')

      const { url } = await res.json()
      onChange?.([...value, url])
      message.success('上传成功')
    } catch (err) {
      message.error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
    return false // 阻止 antd 自动上传
  }

  const handleRemove = (url: string) => {
    onChange?.(value.filter(u => u !== url))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((url, i) => (
          <div key={url} className="relative group w-24 h-24">
            <Image
              src={url}
              alt={`图片${i + 1}`}
              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
              width={96}
              height={96}
            />
            <button
              onClick={() => handleRemove(url)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >
              ×
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 bg-amber-brand text-white text-xs px-1 rounded">
                封面
              </span>
            )}
          </div>
        ))}
      </div>

      {value.length < maxCount && (
        <Upload
          beforeUpload={handleUpload}
          showUploadList={false}
          accept="image/jpeg,image/png,image/webp"
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {label}（{value.length}/{maxCount}）
          </Button>
        </Upload>
      )}
      <p className="text-xs text-gray-400 mt-1">
        支持 JPG、PNG、WebP，单张不超过 5MB，上传时自动压缩
      </p>
    </div>
  )
}
