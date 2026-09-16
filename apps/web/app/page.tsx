'use client';

import { useEffect, useState } from 'react';
import { APP_NAME, APP_TITLE, HealthCheckResponse } from '@svcm/shared';
import { Activity, CheckCircle2, XCircle, RefreshCw, Server, Globe } from 'lucide-react';

export default function HomePage() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/health`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      const data: HealthCheckResponse = await res.json();
      setHealth(data);
    } catch (err: any) {
      setError(err?.message || 'Cannot connect to API server');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24 bg-[#FAF7F2]">
      <div className="z-10 w-full max-w-2xl bg-white border border-[#E4DED2] rounded-2xl shadow-sm p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-[#E4DED2] pb-6">
          <div className="w-14 h-14 rounded-xl bg-[#C8102E] text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {APP_NAME.slice(0, 3)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#2B2723] tracking-tight">{APP_NAME}</h1>
            <p className="text-sm text-[#6B6459]">{APP_TITLE}</p>
          </div>
        </div>

        {/* Step-01 Banner */}
        <div className="bg-[#FAF7F2] border border-[#D2C9B8] rounded-xl p-4 flex items-start space-x-3">
          <Activity className="w-5 h-5 text-[#C8102E] mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-[#2B2723]">Step 01 — Monorepo Scaffold</span>
            <p className="text-[#6B6459] mt-0.5">
              โครงสร้าง Turborepo + pnpm workspaces พร้อม Next.js 15 (Frontend) และ NestJS 11 (Backend API)
            </p>
          </div>
        </div>

        {/* System Services Status */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9A9384]">
            สถานะการเชื่อมต่อระบบ (System Status)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Web App Status */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-[#E4DED2] bg-white">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-[#185FA5]" />
                <div>
                  <div className="text-sm font-medium text-[#2B2723]">Frontend Web</div>
                  <div className="text-xs text-[#9A9384]">Port 3000 (Next.js 15)</div>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Online
              </span>
            </div>

            {/* API Status */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-[#E4DED2] bg-white">
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5 text-[#C8102E]" />
                <div>
                  <div className="text-sm font-medium text-[#2B2723]">Backend API</div>
                  <div className="text-xs text-[#9A9384]">Port 4000 (NestJS 11)</div>
                </div>
              </div>

              {loading ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Checking
                </span>
              ) : health?.status === 'ok' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                  <XCircle className="w-3 h-3 mr-1" /> Disconnected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* API Response Details */}
        <div className="rounded-xl border border-[#E4DED2] bg-[#FAF7F2] p-4 text-xs font-mono">
          <div className="flex justify-between items-center mb-2 font-sans font-medium text-[#6B6459]">
            <span>GET /api/v1/health Response:</span>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="text-xs text-[#185FA5] hover:underline flex items-center gap-1 font-sans"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> รีเฟรช
            </button>
          </div>

          {loading ? (
            <div className="text-[#9A9384]">Loading API response...</div>
          ) : error ? (
            <div className="text-rose-600 font-sans">
              ⚠️ {error}
              <div className="text-[#9A9384] text-[11px] mt-1">
                กรุณาตรวจสอบว่า `apps/api` กำลังรันอยู่ที่ port 4000 หรือไม่
              </div>
            </div>
          ) : (
            <pre className="text-emerald-700 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(health, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-2 text-xs text-[#9A9384] border-t border-[#E4DED2]">
          SVCM Thaiwatsadu Service Center · Phase 0 Foundation
        </div>
      </div>
    </main>
  );
}
