import { buildApprovalEmail } from './vendor-email-template'
import { getIntegrationConfig } from './integration-config.service'
import { createSmtpTransport, readSmtpSettings } from './smtp-transport'
import type { VendorCredentials } from './vendor-account.service'

export interface NotifyResult {
  sent: boolean
  mode: 'live' | 'simulated'
  error?: string
}

/**
 * Sends the approval email AFTER the approval transaction committed. Never throws:
 * a mail failure must not undo the approval — the caller falls back to showing the
 * credentials to the admin. Without SMTP settings (config screen or .env) it simulates
 * (logs recipient only, never the password), mirroring lib/line.ts.
 */
export async function sendApprovalEmail(
  to: string | null | undefined,
  storeName: string,
  credentials: VendorCredentials
): Promise<NotifyResult> {
  if (!to) return { sent: false, mode: 'live', error: 'ไม่มีอีเมลของผู้สมัคร' }

  const cfg = await getIntegrationConfig()
  const smtp = readSmtpSettings(cfg)
  if (!smtp) {
    console.log(`[Email Simulated] approval notice to ${to} (SMTP not configured)`)
    return { sent: false, mode: 'simulated' }
  }

  const loginUrl = `${cfg.APP_BASE_URL || 'http://localhost:3000'}/login`
  const mail = buildApprovalEmail({ storeName, username: credentials.username, tempPassword: credentials.tempPassword, loginUrl })

  try {
    await createSmtpTransport(smtp).sendMail({ from: smtp.from, to, subject: mail.subject, text: mail.text, html: mail.html })
    return { sent: true, mode: 'live' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ส่งอีเมลไม่สำเร็จ'
    console.error('[Email Error]', message)
    return { sent: false, mode: 'live', error: message }
  }
}
