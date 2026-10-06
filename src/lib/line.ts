/**
 * LINE Messaging API Integration (LINE Official Notification / Push)
 */

import { getIntegrationConfig } from '@/lib/services/integration-config.service'

export interface SendLineResult {
  success: boolean
  mode: 'live' | 'simulated'
  messageId?: string
  error?: string
}

export interface LineMessage {
  type: string
  [key: string]: unknown
}

/**
 * Send a push message to a LINE user or group
 */
export async function sendLinePush(toUserId: string, messages: LineMessage[]): Promise<SendLineResult> {
  const LINE_CHANNEL_ACCESS_TOKEN = (await getIntegrationConfig()).LINE_CHANNEL_ACCESS_TOKEN
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.log(`[LINE Simulated Push] to ${toUserId}:`, JSON.stringify(messages, null, 2))
    return { success: true, mode: 'simulated' }
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: toUserId,
        messages,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[LINE Error]', res.status, errText)
      return { success: false, mode: 'live', error: errText }
    }

    return { success: true, mode: 'live' }
  } catch (err) {
    console.error('[LINE Exception]', err)
    return { success: false, mode: 'live', error: err instanceof Error ? err.message : 'LINE request failed' }
  }
}

/**
 * Send quotation Flex Message to customer via LINE
 */
export async function sendQuoteFlexMessage(
  toUserId: string,
  data: {
    jobNo: string
    productName: string
    brandName: string
    totalAmount: number
    repairDays: number
    quoteUrl: string
  }
): Promise<SendLineResult> {
  const flexMessage = {
    type: 'flex',
    altText: `ใบเสนอราคาซ่อมสินค้า ${data.jobNo} — Thaiwasadu Service Center`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#C8102E',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'THAIWASADU SERVICE CENTER',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'xs',
          },
          {
            type: 'text',
            text: 'ใบเสนอราคาซ่อมสินค้า',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'เลขที่ใบแจ้งซ่อม', size: 'xs', color: '#6B6459', flex: 2 },
              { type: 'text', text: data.jobNo, size: 'xs', weight: 'bold', color: '#2B2723', flex: 3 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'สินค้า', size: 'xs', color: '#6B6459', flex: 2 },
              { type: 'text', text: `${data.productName} (${data.brandName})`, size: 'xs', color: '#2B2723', flex: 3, wrap: true },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'ระยะเวลาซ่อม', size: 'xs', color: '#6B6459', flex: 2 },
              { type: 'text', text: `${data.repairDays} วัน`, size: 'xs', color: '#2B2723', flex: 3 },
            ],
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              { type: 'text', text: 'ยอดรวมทั้งสิ้น', size: 'sm', weight: 'bold', color: '#2B2723' },
              { type: 'text', text: `฿${data.totalAmount.toLocaleString()}`, size: 'lg', weight: 'bold', color: '#C8102E', align: 'end' },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#C8102E',
            action: {
              type: 'uri',
              label: 'ดูใบเสนอราคาและอนุมัติ',
              uri: data.quoteUrl,
            },
          },
        ],
      },
    },
  }

  return sendLinePush(toUserId, [flexMessage])
}

/**
 * Send Job Status Tracking link to customer
 */
export async function sendJobStatusFlexMessage(
  toUserId: string,
  data: {
    jobNo: string
    productName: string
    stageName: string
    trackingUrl: string
  }
): Promise<SendLineResult> {
  const flexMessage = {
    type: 'flex',
    altText: `แจ้งเตือนสถานะงานซ่อม ${data.jobNo}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          { type: 'text', text: 'แจ้งสถานะงานซ่อม', weight: 'bold', size: 'md', color: '#C8102E' },
          { type: 'text', text: `ใบแจ้งซ่อม: ${data.jobNo}`, size: 'sm', color: '#2B2723', weight: 'bold' },
          { type: 'text', text: `สินค้า: ${data.productName}`, size: 'xs', color: '#6B6459' },
          { type: 'text', text: `สถานะปัจจุบัน: ${data.stageName}`, size: 'sm', color: '#185FA5', weight: 'bold' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'uri',
              label: 'ตรวจสอบสถานะงาน',
              uri: data.trackingUrl,
            },
          },
        ],
      },
    },
  }

  return sendLinePush(toUserId, [flexMessage])
}
