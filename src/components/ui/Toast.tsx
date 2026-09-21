'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

interface ConfirmOpts { title?: string; message: string; okText?: string; cancelText?: string; danger?: boolean; input?: { label: string; placeholder?: string; required?: boolean } }
interface Ctx {
  toast: (msg: string, type?: 'info' | 'success' | 'error') => void
  confirm: (opts: ConfirmOpts) => Promise<boolean>
  prompt: (opts: ConfirmOpts & { input: NonNullable<ConfirmOpts['input']> }) => Promise<string | null>
}

const ToastCtx = createContext<Ctx | null>(null)

export function useToast(): Ctx {
  const c = useContext(ToastCtx)
  if (!c) {
    return {
      toast: (m: string) => { if (typeof window !== 'undefined') console.log(m) },
      confirm: async (o: ConfirmOpts) => (typeof window !== 'undefined' ? window.confirm(o.message) : false),
      prompt: async (o: ConfirmOpts) => (typeof window !== 'undefined' ? window.prompt(o.message) : null),
    }
  }
  return c
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [t, setT] = useState<{ msg: string; type: string } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: string | boolean | null) => void; mode: 'confirm' | 'prompt' }) | null>(null)
  const [val, setVal] = useState('')

  const toast = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setT({ msg, type })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setT(null), type === 'error' ? 5000 : 3200)
  }, [])

  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>(resolve => {
    setVal('')
    setDlg({ ...opts, mode: 'confirm', resolve: v => resolve(!!v) })
  }), [])

  const prompt = useCallback((opts: ConfirmOpts & { input: NonNullable<ConfirmOpts['input']> }) => new Promise<string | null>(resolve => {
    setVal('')
    setDlg({ ...opts, mode: 'prompt', resolve: v => resolve(typeof v === 'string' ? v : null) })
  }), [])

  const close = (ok: boolean) => {
    if (!dlg) return
    if (ok && dlg.mode === 'prompt' && dlg.input?.required && !val.trim()) return
    dlg.resolve(ok ? (dlg.mode === 'prompt' ? val.trim() : true) : dlg.mode === 'prompt' ? null : false)
    setDlg(null)
  }

  return (
    <ToastCtx.Provider value={{ toast, confirm, prompt }}>
      {children}
      {t && <div className={`toast ${t.type}`} role="status">{t.msg}</div>}
      {dlg && (
        <div className="modal-overlay" style={{ zIndex: 150 }} onClick={() => close(false)}>
          <div className="modal-box narrow" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{dlg.title ?? 'ยืนยันการทำรายการ'}</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: 0, whiteSpace: 'pre-line' }}>{dlg.message}</p>
            {dlg.mode === 'prompt' && dlg.input && (
              <div className="field" style={{ marginTop: 12 }}>
                <label>{dlg.input.label}</label>
                <textarea className="inp" autoFocus value={val} placeholder={dlg.input.placeholder} onChange={e => setVal(e.target.value)} />
              </div>
            )}
            <div className="modal-actions">
              <button className="btn" onClick={() => close(false)}>{dlg.cancelText ?? 'ยกเลิก'}</button>
              <button className="btn btn-primary" autoFocus={dlg.mode === 'confirm'} disabled={dlg.mode === 'prompt' && dlg.input?.required && !val.trim()} onClick={() => close(true)}>{dlg.okText ?? 'ยืนยัน'}</button>
            </div>
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  )
}
