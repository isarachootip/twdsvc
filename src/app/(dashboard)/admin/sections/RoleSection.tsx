'use client'

import { useState } from 'react'
import { MenuMatrix } from './MenuMatrix'
import { UsersAdmin } from './UsersAdmin'

export function RoleSection() {
  const [tab, setTab] = useState<'matrix' | 'users'>('matrix')
  return (
    <>
      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'matrix' ? 'active' : ''}`}
          onClick={() => setTab('matrix')}
        >
          สิทธิ์การเข้าถึงเมนู
        </button>
        <button
          className={`tab-btn ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
        >
          จัดการผู้ใช้
        </button>
      </div>
      {tab === 'matrix' ? <MenuMatrix /> : <UsersAdmin />}
    </>
  )
}
