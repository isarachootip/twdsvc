# คู่มือพัฒนา SVCM ทีละ Step

ชุดนี้แตกแผนใน `docs/09_implementation_plan.md` ออกเป็น **30 step (00–29)** ให้รันกับ AI Coding Agent ได้ครั้งละ step
แต่ละไฟล์มีโครงเดียวกัน: **① ก่อนเริ่ม → ② Prompt คัดลอกไปวาง → ③ ตรวจผลเอง → ④ commit + tag**

## วิธีใช้ (ทำซ้ำทุก step)

```text
1. เปิดไฟล์ STEP-xx
2. git status ต้อง clean  +  docker compose up -d
3. เปิด AI Agent "session ใหม่" ที่ root ของ repo (Claude Code: พิมพ์ /clear หรือเปิด claude ใหม่)
4. คัดลอกกล่อง Prompt ใน ② ไปวาง → รอจนเสร็จ
5. ทำตารางตรวจผล ③ ทีละข้อ ไม่ผ่าน → ใช้ "Prompt แก้ปัญหา" ด้านล่าง
6. ผ่านครบ → รันคำสั่ง ④ (commit + tag) → ติ๊ก ☐ ในตารางด้านล่าง → ไป step ถัดไป
```

**ข้อควรจำ**
- 1 step = 1 session ของ AI (context สะอาด ทำงานแม่นกว่า)
- อย่าข้าม step — step หลังพึ่งของที่ step ก่อนสร้าง
- ก่อนเข้า step ใหม่ต้องมี tag ของ step ก่อนหน้า (`git tag` ดูได้) ใช้ย้อนกลับได้เสมอ
- step ที่ใหญ่ (11, 12, 14) อาจใช้เวลานาน ถ้า AI หยุดกลางทาง พิมพ์ "ทำต่อจากที่ค้าง ตามขอบเขต Step xx" ได้
- ใช้ `pnpm db:seed:demo` (มีตั้งแต่ Step 12) เพื่อรีเซ็ตข้อมูลตัวอย่างก่อนทดสอบหน้าจอ

## ความคืบหน้า

| เสร็จ | Step | Phase | งาน | ผลลัพธ์ที่ได้ |
|:----:|------|-------|-----|--------------|
| ☐ | [00](STEP-00_setup.md) | เตรียมเครื่อง | เตรียมเครื่องและ Repository (ทำเอง) | เครื่องพร้อม มีเอกสารใน repo |
| ☐ | [01](STEP-01_scaffold.md) | 0 Foundation | สร้างโครง Monorepo | มีโปรเจกต์เปล่าที่ web + api รันได้ และคุยกันได้ |
| ☐ | [02](STEP-02_database.md) | 0 Foundation | สร้าง Database Schema | มีตารางครบตาม data model และ API ต่อ DB ได้ |
| ☐ | [03](STEP-03_seed.md) | 0 Foundation | ใส่ข้อมูลตั้งต้น (Seed) | มี master data และผู้ใช้ทดสอบครบทุก role |
| ☐ | [04](STEP-04_rules-money.md) | 0 Foundation | Business Rules ส่วนเงิน (pure functions) | มีฟังก์ชันคำนวณเงินที่ถูกต้องและมี test ครอบคลุม |
| ☐ | [05](STEP-05_rules-ops.md) | 0 Foundation | Business Rules ส่วนงาน (routing, SLA, โปร, จ่าย VD) | logic หลักที่ซับซ้อนทั้งหมดอยู่ใน pure function พร้อม test |
| ☐ | [06](STEP-06_ui-kit.md) | 0 Foundation | Design System & Component กลาง | หน้าตาเหมือน prototype และมี component ที่ทุกหน้าจอใช้ซ้ำ |
| ☐ | [07](STEP-07_auth-shell.md) | 0 Foundation | Login, สิทธิ์ผู้ใช้ และ App Shell | ผู้ใช้ login แล้วเห็นเมนูตาม role ของตัวเอง |
| ☐ | [08](STEP-08_integrations.md) | 0 Foundation | Integration Adapters (mock), อัปโหลดภาพ, Worker | มีช่องทางเชื่อมระบบภายนอกแบบจำลอง และถ่าย/อัปโหลดภาพได้จริง |
| ☐ | [09](STEP-09_admin-1.md) | 1 Admin | หน้าตั้งค่าระบบหลังบ้าน ส่วนที่ 1 | Admin จัดการข้อมูลพื้นฐานได้เอง |
| ☐ | [10](STEP-10_admin-2.md) | 1 Admin | หน้าตั้งค่าระบบหลังบ้าน ส่วนที่ 2 | Admin ตั้งค่า VD, การจับคู่, SLA, สิทธิ์ และโปรโมชั่นได้ครบ |
| ☐ | [11](STEP-11_engine-1.md) | 2 Engine | Job Engine ส่วนที่ 1 (เปิดงาน → สินค้าถึง VD) | หัวใจของระบบ: เปลี่ยนสถานะงานได้ถูกต้องตาม state machine |
| ☐ | [12](STEP-12_engine-2.md) | 2 Engine | Job Engine ส่วนที่ 2 (เสนอราคา → ปิดงาน) + SLA cron + demo data | state machine ครบทุก action และมีงานตัวอย่างทุกสถานะไว้ทดสอบหน้าจอ |
| ☐ | [13](STEP-13_cs-open.md) | 3 Operations | หน้าจอ CS เปิดใบแจ้งซ่อม | CS เปิดงานจริงจากหน้าจอได้ครบ |
| ☐ | [14](STEP-14_gr.md) | 3 Operations | Queue Framework + หน้าจอ GR | GR ทำงานได้ครบ 5 คิว และได้ component คิวที่ DC/VD จะใช้ต่อ |
| ☐ | [15](STEP-15_jobs-list.md) | 3 Operations | หน้างานซ่อมทั้งหมด + รายละเอียดงาน | ทุก role ค้นหาและดูประวัติงานได้ พร้อม KPI SLA |
| ☐ | [16](STEP-16_dc.md) | 3 Operations | หน้าจอ DC + จัดรถ + หน้าคนรถ | DC ทำงานได้ครบ 5 คิว และคนรถเปิดลิงก์บนมือถือได้ |
| ☐ | [17](STEP-17_vd-receive.md) | 3 Operations | หน้าจอ VD: งานรอรับ + จำลอง 3PL | VD รับงานเข้าศูนย์ได้ทั้ง 3 ช่องทาง |
| ☐ | [18](STEP-18_vd-quote.md) | 3 Operations | VD ประเมิน + เสนอราคา | VD ออกใบเสนอราคาและส่งให้ลูกค้าได้ |
| ☐ | [19](STEP-19_public-pages.md) | 3 Operations | หน้าลูกค้า: ใบเสนอราคา / ติดตามงาน / ชำระเงิน | ลูกค้าอนุมัติ/ไม่อนุมัติและจ่ายเงินผ่านมือถือได้ |
| ☐ | [20](STEP-20_return-flow.md) | 3 Operations | ขาซ่อมและส่งคืน: VD → DC → GR | สินค้ากลับถึงสาขาได้ครบทุกช่องทาง |
| ☐ | [21](STEP-21_cs-close.md) | 4 Close & Finance | CS คิวรับคืน + ปิดงาน + แบบประเมิน | ปิดวงจรงานลูกค้าได้ครบทั้งกรณีอนุมัติและไม่อนุมัติ |
| ☐ | [22](STEP-22_tradein.md) | 4 Close & Finance | Trade-in / คูปอง | CS ออกคูปองส่วนลดได้ทั้ง 2 ประเภท |
| ☐ | [23](STEP-23_s2.md) | 4 Close & Finance | S2 งานซ่อมสต็อกสาขา | สาขาส่งสินค้าสต็อกไปซ่อมได้โดยไม่มีขั้นตอนการเงิน |
| ☐ | [24](STEP-24_payout.md) | 4 Close & Finance | รายงานจ่ายเงิน VD | Admin สรุปและส่งทำจ่าย VD ตามรอบได้ |
| ☐ | [25](STEP-25_analytics.md) | 5 Dashboards & Quality | Dashboard Overview | ผู้จัดการเห็นภาพรวมปฏิบัติการจากข้อมูลจริง |
| ☐ | [26](STEP-26_executive.md) | 5 Dashboards & Quality | Executive Dashboard + PDF | ผู้บริหารเห็นผลประกอบการ สุขภาพงาน และประเด็นที่ต้องพิจารณา |
| ☐ | [27](STEP-27_e2e.md) | 5 Dashboards & Quality | E2E Test ครบ 12 Scenario | มีชุดทดสอบอัตโนมัติยืนยันว่าระบบทั้งเส้นทางทำงานถูก |
| ☐ | [28](STEP-28_hardening.md) | 5 Dashboards & Quality | Security, Performance และ Production Build | พร้อมขึ้นระบบทดสอบกับผู้ใช้จริง |
| ☐ | [29](STEP-29_real-integrations.md) | 6 Go-live | เชื่อมระบบภายนอกจริง (ทำเมื่อได้ API จากผู้ให้บริการ) | เปลี่ยนจาก mock เป็นระบบจริงทีละตัวโดยไม่กระทบส่วนอื่น |

**Milestone ที่ลองใช้งานได้จริง:** หลัง Step 07 = login ได้ · หลัง Step 14 = เปิดงาน + GR ได้ · หลัง Step 20 = งานเดินครบเส้นทางไป-กลับ · หลัง Step 24 = ปิดวงจรการเงิน · หลัง Step 28 = พร้อมขึ้นระบบทดสอบ · Step 29 = ทำซ้ำต่อ 1 ระบบภายนอกที่จะเชื่อมจริง

---

## Prompt แก้ปัญหา

### เมื่อข้อตรวจผลไม่ผ่าน / มี error
````text
เรากำลังทำ Step XX ตาม docs/steps/STEP-XX_*.md
ข้อตรวจผลที่ไม่ผ่าน: ข้อ N — "<คัดลอกข้อความในตาราง>"
สิ่งที่เกิดขึ้นจริง: <อธิบาย / วาง error ทั้งหมด / แนบภาพหน้าจอ>
ขั้นตอนที่ทำให้เกิด: <1..2..3..>

ให้หาสาเหตุก่อน อธิบายสั้นๆ แล้วแก้ให้ตรงจุด ห้ามแก้เกินขอบเขต step นี้
แก้เสร็จให้รัน pnpm lint && pnpm typecheck && pnpm test และบอกวิธีตรวจซ้ำ
````

### ตรวจงานก่อน commit (แนะนำทำทุก step)
````text
ตรวจงานที่ยังไม่ได้ commit (git diff) เทียบกับขอบเขตของ docs/steps/STEP-XX_*.md และ AGENTS.md
ตอบเป็นรายการ: (1) ขอบเขตข้อไหนยังไม่ครบ (2) มีการฝ่า Hard rules ใน AGENTS.md ไหม
(3) มีโค้ดที่เกินขอบเขต step ไหม (4) test ที่ควรมีแต่ยังไม่มี — ห้ามแก้ไฟล์ แค่รายงาน
````

### AI หยุดกลางทาง / context เต็ม
````text
เรากำลังทำ Step XX ตาม docs/steps/STEP-XX_*.md แต่ session ก่อนหน้าหยุดกลางทาง
ให้ดู git status และ git diff เพื่อดูว่าทำอะไรไปแล้ว เทียบกับขอบเขตงานในไฟล์ step
แล้วทำส่วนที่เหลือให้เสร็จ ตามกติกาเดิม
````

### อยากเริ่ม step ใหม่ทั้งหมด
```bash
git reset --hard step-<ก่อนหน้า> && git clean -fd
```

### เจอเรื่องที่เอกสารไม่ได้ระบุ
ให้ AI จดใน `docs/OPEN_QUESTIONS.md` แล้วทำตามค่าเริ่มต้นที่ปลอดภัยไปก่อน — เมื่อได้คำตอบจากเจ้าของระบบ ให้แก้เอกสาร `docs/0x` ก่อน แล้วค่อยสั่ง AI แก้โค้ด
