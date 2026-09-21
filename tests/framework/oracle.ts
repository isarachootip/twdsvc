/**
 * Authoritative Specification Oracle for Thai Watsadu Repair Center System (SVCM)
 * Derived strictly from ORIGINAL_REQUEST.md, PROJECT.md, and docs/system-design/
 */

export const SPEC_ORACLE = {
  // 19 Complete Job Stages (04_workflow_state_machine.md §1)
  STAGES: [
    'PENDING_VENDOR_ASSIGNMENT',
    'CS_OPENED',
    'GR_RECEIVED',
    'GR_PACKED',
    'OUTBOUND_TO_DC',
    'AT_DC_OUTBOUND',
    'OUTBOUND_TO_VD',
    'VD_INSPECTING',
    'WAITING_APPROVAL',
    'REPAIRING',
    'RETURN_PACKING',
    'INBOUND_TO_DC',
    'AT_DC_INBOUND',
    'INBOUND_TO_BRANCH',
    'GR_RETURN_RECEIVED',
    'READY_FOR_PICKUP',
    'CLOSED_REPAIRED',
    'CLOSED_NOT_REPAIRED',
    'CANCELLED',
  ] as const,

  // 16 Complete SlaSteps (05_business_rules.md §4)
  SLA_STEPS: [
    { seq: 1, code: 'CS_HANDOVER', name: 'CS เปิดใบแจ้งซ่อม → ส่งมอบ GR', startEvent: 'JOB_OPENED', stopEvent: 'GR_RECEIVED', hours: 24, owner: 'CS', pausable: false },
    { seq: 2, code: 'GR_PACK', name: 'GR Pack สินค้าลงกล่อง', startEvent: 'GR_RECEIVED', stopEvent: 'GR_PACKED', hours: 4, owner: 'GR', pausable: false },
    { seq: 3, code: 'CARRIER_PICKUP_BRANCH', name: 'DC/VD/3PL เข้ารับสินค้าที่สาขา', startEvent: 'GR_PACKED', stopEvent: 'OUTBOUND_HANDED_OFF', hours: 24, owner: 'CARRIER', pausable: false },
    { seq: 4, code: 'GR_HANDOFF', name: 'GR ส่งมอบให้ DC/VD/3PL', startEvent: 'SHIPMENT_DISPATCHED', stopEvent: 'OUTBOUND_HANDED_OFF', hours: 4, owner: 'GR', pausable: false },
    { seq: 5, code: 'DC_RECEIVE_LOCATION', name: 'DC รับเข้า Location', startEvent: 'OUTBOUND_HANDED_OFF', stopEvent: 'DC_RECEIVED_OUTBOUND', hours: 4, owner: 'DC', condition: 'channel=DC', pausable: false },
    { seq: 6, code: 'VD_PICKUP_AT_DC', name: 'VD เข้ารับสินค้าที่ DC', startEvent: 'DC_RECEIVED_OUTBOUND', stopEvent: 'DC_HANDED_OFF_VD', hours: 24, owner: 'VD', condition: 'channel=DC', pausable: false },
    { seq: 7, code: 'VD_RECEIVE', name: 'สินค้าถึงศูนย์ VD', startEvent: 'DC_HANDED_OFF_VD', stopEvent: 'VD_RECEIVED', hours: 24, owner: 'CARRIER', pausable: false },
    { seq: 8, code: 'VD_QUOTE', name: 'VD ประเมิน/เสนอราคา', startEvent: 'VD_RECEIVED', stopEvent: 'QUOTE_SENT', hours: 48, owner: 'VD', pausable: false },
    { seq: 9, code: 'CUSTOMER_APPROVAL', name: 'รอลูกค้าอนุมัติ', startEvent: 'QUOTE_SENT', stopEvent: 'CUSTOMER_APPROVED', hours: 48, owner: 'CUSTOMER', condition: 'type=CUSTOMER', pausable: false },
    { seq: 10, code: 'VD_REPAIR', name: 'VD ระยะเวลาซ่อม', startEvent: 'CUSTOMER_APPROVED', stopEvent: 'REPAIR_FINISHED', hours: 168, owner: 'VD', pausable: true },
    { seq: 11, code: 'VD_RETURN_PACK', name: 'VD Pack ส่งคืน 3PL/DC/สาขา', startEvent: 'REPAIR_FINISHED', stopEvent: 'RETURN_PACKED', hours: 24, owner: 'VD', pausable: false },
    { seq: 12, code: 'DC_RETURN_RECEIVE', name: 'DC รับคืนจาก VD', startEvent: 'RETURN_PACKED', stopEvent: 'DC_RECEIVED_INBOUND', hours: 24, owner: 'DC', condition: 'channel=DC', pausable: false },
    { seq: 13, code: 'DC_DISPATCH_BRANCH', name: 'DC ส่งคืนกลับสาขา', startEvent: 'DC_RECEIVED_INBOUND', stopEvent: 'DC_DISPATCHED_TO_BRANCH', hours: 24, owner: 'DC', condition: 'channel=DC', pausable: false },
    { seq: 14, code: 'GR_RETURN_RECEIVE', name: 'สินค้าคืนถึงสาขา (GR รับคืน)', startEvent: 'DC_DISPATCHED_TO_BRANCH', stopEvent: 'GR_RETURN_RECEIVED', hours: 24, owner: 'CARRIER', pausable: false },
    { seq: 15, code: 'GR_DELIVER_CS', name: 'GR ส่งมอบ CS', startEvent: 'GR_RETURN_RECEIVED', stopEvent: 'DELIVERED_TO_CS', hours: 4, owner: 'GR', pausable: false },
    { seq: 16, code: 'CUSTOMER_PICKUP', name: 'ลูกค้าเข้ารับสินค้า / ปิดงาน', startEvent: 'DELIVERED_TO_CS', stopEvent: 'JOB_CLOSED', hours: 168, owner: 'CS', pausable: false },
  ],

  // Intake Fee Rules (05_business_rules.md §1.1)
  calcIntakeFees(params: {
    jobType: 'CUSTOMER' | 'STOCK'
    hasWarranty: boolean
    shippingMethod: 'STANDARD' | 'EXPRESS'
    size: 'SMALL' | 'LARGE'
  }): { operationFeeSatang: number; shippingFeeSatang: number; totalSatang: number } {
    if (params.jobType === 'STOCK') {
      return { operationFeeSatang: 0, shippingFeeSatang: 0, totalSatang: 0 }
    }
    const opFee = params.size === 'SMALL' ? 15000 : 30000 // 150.00 THB or 300.00 THB in satang
    const shipFee = params.shippingMethod === 'EXPRESS' ? (params.size === 'SMALL' ? 8000 : 25000) : 0

    if (params.shippingMethod === 'EXPRESS') {
      return {
        operationFeeSatang: opFee,
        shippingFeeSatang: shipFee,
        totalSatang: opFee + shipFee,
      }
    }

    // STANDARD
    const finalOpFee = params.hasWarranty ? 0 : opFee
    return {
      operationFeeSatang: finalOpFee,
      shippingFeeSatang: 0,
      totalSatang: finalOpFee,
    }
  },

  // Quotation Math (05_business_rules.md §2.1)
  calcQuoteTotals(lines: Array<{ unitPriceSatang: number; quantity: number }>, vatRate = 0.07): {
    subtotalSatang: number
    vatSatang: number
    totalSatang: number
  } {
    const subtotal = lines.reduce((sum, l) => sum + l.unitPriceSatang * l.quantity, 0)
    const vatSatang = Math.floor(subtotal * vatRate + 0.5) // Half-up rounding
    const totalSatang = subtotal + vatSatang
    return { subtotalSatang: subtotal, vatSatang, totalSatang }
  },

  // Operation Fee Credit & Balance Settlement (05_business_rules.md §1.3)
  calcCustomerBalance(params: {
    operationFeePaidSatang: number
    quoteTotalSatang: number
    additionalPaymentsSatang: number
  }): {
    creditSatang: number
    netPayableSatang: number
    outstandingBalanceSatang: number
  } {
    // Credit is limited to min(operationFeePaid, quoteTotal)
    const creditSatang = Math.min(params.operationFeePaidSatang, params.quoteTotalSatang)
    const netPayableSatang = params.quoteTotalSatang - creditSatang
    const outstandingBalanceSatang = Math.max(0, netPayableSatang - params.additionalPaymentsSatang)
    return { creditSatang, netPayableSatang, outstandingBalanceSatang }
  },

  // Vendor Payout Settlement (05_business_rules.md §7)
  calcVendorPayout(params: {
    subtotalSatang: number // Ex-VAT repair total
    gpPct: number // e.g. 18.0
    deductionsSatang: number
  }): {
    repairAmountSatang: number
    gpAmountSatang: number
    netVendorPayableSatang: number
  } {
    const repairAmountSatang = params.subtotalSatang
    const gpAmountSatang = Math.floor((repairAmountSatang * params.gpPct) / 100 + 0.5)
    const netVendorPayableSatang = repairAmountSatang - gpAmountSatang - params.deductionsSatang
    return { repairAmountSatang, gpAmountSatang, netVendorPayableSatang }
  },

  // Location Coordinate Validation (07_screens.md §GR, §DC)
  LOCATION_REGEX: {
    GR: /^[A-Z]-\d{2}-\d{2}$/i, // e.g. A-04-11
    DC: /^DC-\d{2}-[A-Z]$/i,   // e.g. DC-01-A
  },

  // RBAC Permission Matrix (08_rbac.md §2)
  RBAC_MENU_MATRIX: {
    ADMIN: ['exec', 'analytics', 'jobs', 'cs', 'gr', 'dc', 'vd', 'tradein', 's2', 'vd_payment', 'admin'],
    EXECUTIVE: ['exec', 'analytics', 'jobs', 'vd_payment'],
    CS: ['cs', 'jobs', 'tradein'],
    GR: ['gr', 'jobs'],
    DC: ['dc', 'jobs'],
    VD: ['vd', 'jobs'],
    S2: ['s2', 'jobs'],
  } as Record<string, string[]>,

  // 13 Prototypes Route Mapping (report.md §2)
  PROTOTYPE_ROUTES: [
    { id: 1, name: 'App Shell / Menu', path: '/jobs' },
    { id: 2, name: 'Executive Dashboard', path: '/exec' },
    { id: 3, name: 'Operations Analytics', path: '/analytics' },
    { id: 4, name: 'All Jobs Table & Detail', path: '/jobs' },
    { id: 5, name: 'CS Intake', path: '/cs/new' },
    { id: 6, name: 'CS Pickup & Queues', path: '/cs' },
    { id: 7, name: 'GR 5 Queues', path: '/gr' },
    { id: 8, name: 'DC 5 Queues', path: '/dc' },
    { id: 9, name: 'VD 5 Queues', path: '/vd' },
    { id: 10, name: 'VD Fullscreen Quote', path: '/vd/jobs/:id/quote' },
    { id: 11, name: 'Customer Quote Portal', path: '/q/:token' },
    { id: 12, name: 'Customer Payment Portal', path: '/pay/:token' },
    { id: 13, name: 'Customer Tracking', path: '/t/:token' },
    { id: 14, name: 'Delivery Scheduling', path: '/d/:token' },
    { id: 15, name: 'Customer Survey', path: '/s/:token' },
    { id: 16, name: 'Trade-in System', path: '/tradein' },
    { id: 17, name: 'Branch Stock Repair', path: '/s2' },
    { id: 18, name: 'Vendor Payout Report', path: '/reports/vd-payment' },
    { id: 19, name: 'Admin 12 Categories', path: '/admin' },
  ],

  // Token Expiries in days (08_rbac.md §6)
  TOKEN_EXPIRIES_DAYS: {
    TRACKING: 90,
    QUOTE: 7,
    PAYMENT: 7,
    DRIVER: 2,
    CSAT: 14,
  },
}
