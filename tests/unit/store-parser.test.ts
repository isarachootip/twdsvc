import assert from 'node:assert'
import { parseThaiAddress, parseStoreRecord } from '@/lib/parsers/store-parser'

console.log('--- Running Store Parser Unit Tests ---')

// 1. parseThaiAddress tests
const addr1 = '79 หมู่ 5 ตำบลวิชิต  อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83000 '
const parsed1 = parseThaiAddress(addr1)
assert.strictEqual(parsed1.province, 'ภูเก็ต')
assert.strictEqual(parsed1.district, 'เมืองภูเก็ต')
assert.strictEqual(parsed1.subdistrict, 'วิชิต')
assert.strictEqual(parsed1.postalCode, '83000')

const addr2 = '320 ม.3 ตำบลบ้านใหม่ อำเภอปากเกร็ด จังหวัดนนทบุรี 11120'
const parsed2 = parseThaiAddress(addr2)
assert.strictEqual(parsed2.province, 'นนทบุรี')
assert.strictEqual(parsed2.district, 'ปากเกร็ด')
assert.strictEqual(parsed2.subdistrict, 'บ้านใหม่')
assert.strictEqual(parsed2.postalCode, '11120')

const addrBkk = '88/1 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310'
const parsedBkk = parseThaiAddress(addrBkk)
assert.strictEqual(parsedBkk.province, 'กรุงเทพมหานคร')
assert.strictEqual(parsedBkk.district, 'ห้วยขวาง')
assert.strictEqual(parsedBkk.subdistrict, 'ห้วยขวาง')
assert.strictEqual(parsedBkk.postalCode, '10310')

// 2. parseStoreRecord tests
const rawSheet1 = {
  STORE: '60016',
  STCODE: '016',
  Sname_1: 'PKF',
  SName: 'Phuket Festival',
  SnameTH: 'ภูเก็ต เฟสติวัล',
  STTNAME: 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด (สาขาภูเก็ต เฟสติวัล)',
  THADDRESS: '79 หมู่ 5 ตำบลวิชิต  อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83000 ',
  Lat: '7.89241854',
  lng: '98.37053226',
  Opentime: '08:00',
  CloseTime: '21:00',
  STTEL: '1308',
  STOREGROUP: 'HBY',
  District: 'K.Tawat',
  ROM: 'TWB',
  Group_Email: 'TW District Manager 6',
}

const rawSheet2 = {
  STORE: '60016',
  RCVOpentime: '09:00',
  RCVCloseTime: '20:00',
}

const site = parseStoreRecord(rawSheet1, rawSheet2)
assert.strictEqual(site.code, '60016')
assert.strictEqual(site.stCode, '016')
assert.strictEqual(site.nickname, 'PKF')
assert.strictEqual(site.name, 'สาขาภูเก็ต เฟสติวัล')
assert.strictEqual(site.nameEn, 'Phuket Festival')
assert.strictEqual(site.legalName, 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด (สาขาภูเก็ต เฟสติวัล)')
assert.strictEqual(site.province, 'ภูเก็ต')
assert.strictEqual(site.district, 'เมืองภูเก็ต')
assert.strictEqual(site.subdistrict, 'วิชิต')
assert.strictEqual(site.postalCode, '83000')
assert.strictEqual(site.phone, '1308')
assert.strictEqual(site.storeGroup, 'HBY')
assert.strictEqual(site.rom, 'TWB')
assert.strictEqual(site.districtManager, 'K.Tawat')
assert.strictEqual(site.groupEmail, 'TW District Manager 6')
assert.strictEqual(site.openingHours, '08:00 - 21:00')
assert.strictEqual(site.rcvOpeningHours, '09:00 - 20:00')
assert.strictEqual(site.latitude, 7.89241854)
assert.strictEqual(site.longitude, 98.37053226)
assert.strictEqual(site.googleMapsUrl, 'https://maps.google.com/?q=7.89241854,98.37053226')
assert.strictEqual(site.type, 'BRANCH')
assert.strictEqual(site.active, true)

console.log('✅ All Store Parser Unit Tests Passed!')
