'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, Button, message, Image } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import imageCompression from 'browser-image-compression'

interface ImageUploaderProps {
  value?: string[]
  onChange?: React.Dispatch<React.SetStateAction<string[]>>
  maxCount?: number
  label?: string
}

export default function ImageUploader({
  value = [],
  onChange,
  maxCount = 6,
  label = '上传图片',
}: ImageUploaderProps) {
  const [uploadingCount, setUploadingCount] = useState(0)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const totalRef = useRef(value.length)

  useEffect(() => { totalRef.current = value.length }, [value.length])

  const handleUpload = async (file: File) => {
    if (totalRef.current >= maxCount) {
      message.warning(`最多上传 ${maxCount} 张图片`)
      return false
    }
    totalRef.current += 1
    setUploadingCount(c => c + 1)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })
      const formData = new FormData()
      formData.append('file', compressed, file.name)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      onChange?.((prev) => [...prev, url])
    } catch {
      totalRef.current -= 1
      message.error(`${file.name} 上传失败，请重试`)
    } finally {
      setUploadingCount(c => c - 1)
    }
    return false
  }

  const handleRemove = (url: string) => {
    onChange?.(value.filter(u => u !== url))
  }

  const handleDragStart = (i: number) => setDragIndex(i)

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (i !== dragOverIndex) setDragOverIndex(i)
  }

  const handleDrop = (i: number) => {
    if (dragIndex === null || dragIndex === i) {
      setDragIndex(null); setDragOverIndex(null); return
    }
    const next = [...value]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(i, 0, moved)
    onChange?.(next)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((url, i) => (
          <div
            key={url}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            className="relative group w-24 h-24 cursor-grab active:cursor-grabbing transition-all duration-150"
            style={{
              opacity: dragIndex === i ? 0.35 : 1,
              outline: dragOverIndex === i && dragIndex !== i ? '2px solid #F5A623' : 'none',
              borderRadius: 8,
              transform: dragOverIndex === i && dragIndex !== i ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            <Image
              src={url}
              alt={`图片${i + 1}`}
              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
              width={96}
              height={96}
              preview={{ mask: false }}
            />
            <button
              onClick={() => handleRemove(url)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs z-10"
            >
              ×
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 bg-[#F5A623] text-white text-xs px-1 rounded pointer-events-none">
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
          multiple
        >
          <Button icon={<UploadOutlined />} loading={uploadingCount > 0}>
            {label}（{value.length}/{maxCount}）
          </Button>
        </Upload>
      )}
      <p className="text-xs text-gray-400 mt-1">
        支持 JPG、PNG、WebP，单张不超过 5MB，上传时自动压缩。拖拽图片可调整顺序，第一张为封面。
      </p>
    </div>
  )
}
