import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import './globals.css';

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SVCM - Thaiwatsadu Service Center',
  description: 'ระบบศูนย์บริการซ่อมสินค้า ไทวัสดุ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="min-h-screen antialiased bg-surface-bg text-text font-sans">
        {children}
      </body>
    </html>
  );
}
