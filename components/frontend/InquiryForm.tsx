'use client'
import { useState } from 'react'

interface Props {
  artisanId: string
  artisanName: string
  productId?: string
}

export default function InquiryForm({ artisanId, artisanName, productId }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_id: artisanId,
          product_id: productId,
          visitor_name: name,
          visitor_email: email,
          message,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <span className="text-3xl">✉️</span>
        <p className="text-[#2C2420] font-medium">Inquiry sent!</p>
        <p className="text-sm text-[#9E9189] text-center">
          {artisanName} will get back to you at <span className="text-[#2C2420]">{email}</span>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full text-left space-y-3">
      <div>
        <label className="block text-xs text-[#9E9189] mb-1">Your name</label>
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Jane Smith"
          className="w-full border border-[#E8DDD4] rounded-xl px-3 py-2 text-sm text-[#2C2420] bg-white focus:outline-none focus:border-[#F5A623] placeholder:text-[#C8B8AC]"
        />
      </div>
      <div>
        <label className="block text-xs text-[#9E9189] mb-1">Your email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="jane@example.com"
          className="w-full border border-[#E8DDD4] rounded-xl px-3 py-2 text-sm text-[#2C2420] bg-white focus:outline-none focus:border-[#F5A623] placeholder:text-[#C8B8AC]"
        />
      </div>
      <div>
        <label className="block text-xs text-[#9E9189] mb-1">Message (optional)</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="What are you interested in? Any questions about shipping or pricing?"
          rows={3}
          className="w-full border border-[#E8DDD4] rounded-xl px-3 py-2 text-sm text-[#2C2420] bg-white focus:outline-none focus:border-[#F5A623] placeholder:text-[#C8B8AC] resize-none"
        />
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full bg-[#F5A623] hover:bg-[#e09616] active:bg-[#c8851a] text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send inquiry'}
      </button>
      <p className="text-xs text-[#9E9189] text-center">
        {artisanName} will reply directly to your email.
      </p>
    </form>
  )
}
