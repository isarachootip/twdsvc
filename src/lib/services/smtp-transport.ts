import nodemailer, { type Transporter } from 'nodemailer'
import type { IntegrationValues } from './integration-config.service'

export interface SmtpSettings {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

/** Returns null when SMTP is not (fully) configured: host and from are required. */
export function readSmtpSettings(cfg: IntegrationValues): SmtpSettings | null {
  if (!cfg.SMTP_HOST || !cfg.SMTP_FROM) return null
  const port = Number(cfg.SMTP_PORT) || 587
  return { host: cfg.SMTP_HOST, port, user: cfg.SMTP_USER, pass: cfg.SMTP_PASS, from: cfg.SMTP_FROM }
}

export function createSmtpTransport(s: SmtpSettings): Transporter {
  return nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.port === 465,
    auth: s.user ? { user: s.user, pass: s.pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
}
