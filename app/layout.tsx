import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

export const metadata: Metadata = {
  title: '爱伴行 AiBanXing',
  description: '用爱与善意，陪伴美好流转',
  openGraph: {
    title: '爱伴行 AiBanXing',
    description: '每一件好物，都有人为它作证',
    type: 'website',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/share-default.png`,
        width: 300,
        height: 300,
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}
