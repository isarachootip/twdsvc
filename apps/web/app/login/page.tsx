'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getHomeRouteForRole, Role } from '@svcm/shared';
import { LogIn, Lock, User, AlertCircle, Sparkles } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { username: 'admin', role: 'ADMIN', label: 'ผู้ดูแลระบบ (Admin)' },
  { username: 'cs.bangna', role: 'CS', label: 'CS สาขาบางนา' },
  { username: 'gr.bangna', role: 'GR', label: 'GR สาขาบางนา' },
  { username: 'dc.wangnoi', role: 'DC', label: 'DC วังน้อย' },
  { username: 'vd.bosch', role: 'VD', label: 'ศูนย์ซ่อม Bosch' },
  { username: 'vd.makita', role: 'VD', label: 'ศูนย์ซ่อม Makita' },
  { username: 's2.bangna', role: 'S2', label: 'สต็อกสาขา S2' },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const target = getHomeRouteForRole(user.role as Role);
      router.push(target);
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const loggedUser = await login(username.trim(), password);
      const target = getHomeRouteForRole(loggedUser.role as Role);
      router.push(target);
    } catch (err: any) {
      setError(err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (accUsername: string) => {
    setUsername(accUsername);
    setPassword('Passw0rd!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-surface rounded-card border border-border shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red text-white font-bold text-xl shadow-md">
            SC
          </div>
          <h1 className="text-xl font-bold text-text">
            Thaiwatsadu Service Center
          </h1>
          <p className="text-xs text-text-mute">
            ระบบศูนย์บริการและติดตามงานซ่อมสินค้า ไทวัสดุ (SVCM)
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-2 mb-1">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น admin, cs.bangna"
                className="w-full text-sm pl-9 pr-3 py-2 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red transition-colors"
                disabled={isSubmitting}
                autoFocus
              />
              <User className="w-4 h-4 text-text-mute absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-2 mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm pl-9 pr-3 py-2 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red transition-colors"
                disabled={isSubmitting}
              />
              <Lock className="w-4 h-4 text-text-mute absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-input bg-red hover:bg-red-dark text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          </button>
        </form>

        {/* Demo Fast Login Quick Selection */}
        <div className="pt-4 border-t border-border space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-2">
            <Sparkles className="w-3.5 h-3.5 text-amber" />
            <span>บัญชีทดสอบด่วน (Dev Demo):</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleQuickFill(acc.username)}
                className="text-left px-2.5 py-1.5 rounded-input bg-surface-2 hover:bg-border/60 text-text text-[11px] transition-colors border border-border flex items-center justify-between"
              >
                <span className="font-mono font-medium">{acc.username}</span>
                <span className="text-[10px] text-text-mute">{acc.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
