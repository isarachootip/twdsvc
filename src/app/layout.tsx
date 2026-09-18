import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: 'Thaiwasadu Service Center',
  description: 'ระบบบริหารงานศูนย์บริการซ่อม',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className={`${sarabun.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
