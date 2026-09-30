export type PhotoSlotId = 'front' | 'side' | 'top' | 'bottom' | 'serial_no'

export interface PhotoSlotConfig {
  id: PhotoSlotId
  index: number
  title: string
  shortTitle: string
  description: string
  tips: string
  defaultFileName: string
}

export const PHOTO_SLOTS: PhotoSlotConfig[] = [
  {
    id: 'front',
    index: 1,
    title: '1. รูปด้านหน้า',
    shortTitle: 'ด้านหน้า',
    description: 'ถ่ายภาพมุมตรงด้านหน้าให้เห็นสภาพรวมทั้งหมดของสินค้า',
    tips: 'วางสินค้าในมุมระนาบตรง แสงสว่างเพียงพอ ไม่ให้มีเงาบดบัง',
    defaultFileName: 'photo_front.jpg',
  },
  {
    id: 'side',
    index: 2,
    title: '2. รูปด้านข้าง',
    shortTitle: 'ด้านข้าง',
    description: 'ถ่ายภาพด้านข้างตัวเครื่องให้เห็นรอยต่อ สวิตช์ หรือจุดเชื่อม',
    tips: 'ให้เห็นมุมเอียงหรือด้านข้างที่เห็นรอยแตกหักหรือตำหนิชัดเจน',
    defaultFileName: 'photo_side.jpg',
  },
  {
    id: 'top',
    index: 3,
    title: '3. รูปด้านบน',
    shortTitle: 'ด้านบน',
    description: 'ถ่ายภาพมุมบน (Top View) ให้เห็นปุ่มควบคุมหรือด้ามจับ',
    tips: 'ถ่ายจากมุมสูงลงมาตรงๆ ให้เห็นพื้นผิวด้านบนทั้งหมด',
    defaultFileName: 'photo_top.jpg',
  },
  {
    id: 'bottom',
    index: 4,
    title: '4. รูปด้านล่าง',
    shortTitle: 'ด้านล่าง',
    description: 'ถ่ายภาพมุมใต้ฐานสินค้า ให้เห็นฐานรองหรือช่องระบาย',
    tips: 'พลิกหรือยกถ่ายฐานเครื่องให้เห็นรอยขูดขีดหรือสภาพฐานรอง',
    defaultFileName: 'photo_bottom.jpg',
  },
  {
    id: 'serial_no',
    index: 5,
    title: '5. รูป Serial_no',
    shortTitle: 'Serial No.',
    description: 'ถ่ายภาพป้ายสเปกเครื่อง (Nameplate) / สติ๊กเกอร์บาร์โค้ด',
    tips: 'โฟกัสให้คมชัด ตัวเลขและตัวอักษร S/N และ Model ต้องอ่านออกได้ชัดเจน',
    defaultFileName: 'photo_serial_no.jpg',
  },
]
