import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ProductMasterView } from '@/components/products'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-4">
        <p className="page-title">Product Master (ข้อมูลสินค้า 302,475 SKU)</p>
        <p className="page-sub">ค้นหาและตรวจสอบข้อมูลสินค้า กรองตาม Brand, Category, Status พร้อมดูข้อมูลครบ 32 Fields</p>
      </div>
      <Suspense fallback={<div className="p-8 text-center text-gray-400">กำลังโหลด...</div>}>
        <ProductMasterView />
      </Suspense>
    </div>
  )
}
