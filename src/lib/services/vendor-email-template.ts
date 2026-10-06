export interface ApprovalEmailInput {
  storeName: string
  username: string
  tempPassword: string
  loginUrl: string
}

export interface BuiltEmail {
  subject: string
  text: string
  html: string
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Pure builder for the vendor-approved email (plain text + HTML). */
export function buildApprovalEmail(input: ApprovalEmailInput): BuiltEmail {
  const { storeName, username, tempPassword, loginUrl } = input
  const subject = 'ใบสมัครคู่ค้าศูนย์บริการได้รับการอนุมัติ — Thaiwasadu Service Center'
  const text = [
    `เรียน ${storeName}`,
    '',
    'ใบสมัครคู่ค้าศูนย์บริการของคุณได้รับการอนุมัติแล้ว',
    `เข้าสู่ระบบที่: ${loginUrl}`,
    `ชื่อผู้ใช้: ${username}`,
    `รหัสผ่านชั่วคราว: ${tempPassword}`,
    '',
    'กรุณาเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก และห้ามเปิดเผยอีเมลฉบับนี้แก่ผู้อื่น',
  ].join('\n')
  const html = `<div style="font-family:Sarabun,sans-serif;max-width:480px">
<h2 style="color:#C8102E">อนุมัติใบสมัครคู่ค้าแล้ว</h2>
<p>เรียน ${escapeHtml(storeName)}</p>
<p>เข้าสู่ระบบที่ <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>
<p>ชื่อผู้ใช้: <b>${escapeHtml(username)}</b><br>รหัสผ่านชั่วคราว: <b style="font-family:monospace">${escapeHtml(tempPassword)}</b></p>
<p style="color:#6B6459;font-size:12px">กรุณาเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก และห้ามเปิดเผยอีเมลฉบับนี้แก่ผู้อื่น</p>
</div>`
  return { subject, text, html }
}
