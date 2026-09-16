# STEP-01 — สร้างโครง Monorepo

← [STEP-00](STEP-00_setup.md) · [สารบัญ](README.md) · ถัดไป → [STEP-02 — สร้าง Database Schema](STEP-02_database.md)

**เป้าหมาย:** มีโปรเจกต์เปล่าที่ web + api รันได้ และคุยกันได้
**เอกสารอ้างอิง:** AGENTS.md, docs/02_architecture.md §1–2
**ต้องผ่านก่อน:** tag `step-00`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: AGENTS.md, docs/02_architecture.md §1–2

## งานของ Step 01 — สร้างโครง Monorepo
เป้าหมาย: มีโปรเจกต์เปล่าที่ web + api รันได้ และคุยกันได้

ขอบเขตงาน:
1. สร้าง pnpm workspace + Turborepo ตามโครงสร้างใน 02 §2: `apps/web`, `apps/api`, `packages/shared`, `packages/db`, `packages/config`
2. `apps/web`: Next.js 15 (App Router, TypeScript, Tailwind) — หน้าแรกแสดงคำว่า "SVCM" และผลเรียก API health
3. `apps/api`: NestJS 11 — prefix `/api/v1`, endpoint `GET /api/v1/health` คืน `{status:'ok'}`, เปิด CORS ให้ web
4. `packages/shared`: TypeScript + Vitest (มี test ตัวอย่าง 1 ตัว), export ผ่าน `src/index.ts`
5. `packages/db`: โฟลเดอร์ว่างสำหรับ Prisma (ยังไม่ต้องใส่ schema)
6. `packages/config`: eslint + tsconfig base + prettier ใช้ร่วมกันทุก package
7. `docker-compose.yml`: postgres:16 (5432), redis:7 (6379), minio (9000/9001) + volume
8. `.env.example` ที่ root (DATABASE_URL, REDIS_URL, S3_*, JWT_SECRET, WEB_URL, API_URL) และให้ทุก app อ่าน env ได้
9. root scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `db:migrate`, `db:seed`, `e2e` (script ที่ยังไม่มีงานให้ echo ไว้ก่อน)
10. `.gitignore`, `README.md` สั้นๆ วิธีรัน

กติกา:
- ทำเฉพาะขอบเขตของ step นี้ ห้ามทำงานของ step ถัดไปล่วงหน้า
- ถ้าเอกสารไม่ชัดหรือขัดกัน ให้เลือกตามลำดับความจริงใน AGENTS.md และจดคำถามไว้ใน docs/OPEN_QUESTIONS.md
- เมื่อเสร็จ ให้รัน `pnpm lint && pnpm typecheck && pnpm test` จนผ่าน
- ห้าม git commit (ผมจะตรวจแล้ว commit เอง)

เมื่อเสร็จให้สรุป: (1) ไฟล์ที่สร้าง/แก้ (2) วิธีทดสอบด้วยมือทีละข้อ (3) สิ่งที่ยังไม่ได้ทำหรือคำถามค้าง
````

## ③ ตรวจผลด้วยตัวเอง (ติ๊กให้ครบก่อนไป step ถัดไป)
| # | ทำอะไร | ต้องเห็นอะไร | ผ่าน |
|---|--------|--------------|:----:|
| 1 | `pnpm i` แล้ว `cp .env.example .env` | ติดตั้งสำเร็จไม่มี error และมีไฟล์ .env | ☐ |
| 2 | `docker compose up -d` แล้ว `docker compose ps` | postgres, redis, minio สถานะ running | ☐ |
| 3 | `pnpm dev` แล้วเปิด http://localhost:4000/api/v1/health | `{"status":"ok"}` | ☐ |
| 4 | เปิด http://localhost:3000 | เห็น SVCM + สถานะ API ok | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |
| 6 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "chore: scaffold monorepo (web, api, shared, db, config)"
git tag step-01
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-00 && git clean -fd`
