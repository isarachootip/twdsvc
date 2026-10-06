import type { VendorSetupFormData } from './types'

export const INITIAL_FORM: VendorSetupFormData = {
  store: {
    name: '',
    type: '',
    taxId: '',
    phone: '',
    email: '',
    lineId: '',
    branches: [
      {
        id: 'b-1',
        branchName: 'สาขาหลัก',
        address: '',
        province: 'กรุงเทพมหานคร',
        amphoe: '',
        phone: '',
        photo: null,
        radius: 30,
        vip: false,
        express: false,
      },
    ],
  },
  expertise: {
    appliances: {
      washing: true,
      fridge: true,
      air: false,
      tv: false,
      waterHeater: false,
      microwave: false,
    },
    isBrandAuthorized: false,
    defaultSlaDays: 7,
    warrantyDays: 90,
  },
  coverage: { coverage: {} },
  finance: {
    bank: 'กสิกรไทย',
    accNo: '',
    accName: '',
    commission: false,
    documents: { idcard: '', company: '', license: '', portfolio: [] },
  },
  agreements: {
    agreements: {
      sla: false,
      pdpa: false,
      standard: false,
      transportDamage: false,
      warrantyRepeat: false,
    },
    signatureUrl: '',
  },
}
