import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'

// Default PromptPay ID: Thai Tax ID or Mobile number from env or fallback
const DEFAULT_PROMPTPAY_ID = process.env.PROMPTPAY_ID || '0105561000000'

/**
 * Generates an EMVCo-compliant PromptPay QR code as a Data URL (base64 PNG)
 * @param amount - Amount in Thai Baht
 * @param promptpayId - Phone number (08x...) or National ID / Tax ID (13 digits)
 */
export async function generatePromptPayQR(
  amount: number,
  promptpayId: string = DEFAULT_PROMPTPAY_ID
): Promise<{ payload: string; qrDataUrl: string }> {
  const payload = generatePayload(promptpayId, { amount })
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 260,
    margin: 2,
    color: {
      dark: '#1B2430',
      light: '#FFFFFF',
    },
  })
  return { payload, qrDataUrl }
}
