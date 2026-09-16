# SVCM — Thaiwatsadu Service Center Management System

ระบบบริหารจัดการศูนย์บริการซ่อมสินค้า ไทวัสดุ (SVCM)

## Tech Stack
- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 15 (App Router, Tailwind CSS, TypeScript)
- **Backend**: NestJS 11 (REST API, TypeScript)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache & Queue**: Redis 7 + BullMQ
- **Object Storage**: MinIO / S3

## Quick Start

### 1. Prerequisites
- Node.js 22 LTS
- pnpm 9+
- Docker Desktop

### 2. Setup & Run
```bash
# ติดตั้ง dependencies
pnpm install

# คัดลอก .env
cp .env.example .env

# รัน services (PostgreSQL, Redis, MinIO)
docker compose up -d

# รันโหมด Development (Web: 3000, API: 4000)
pnpm dev
```

### 3. Verify
- Web: [http://localhost:3000](http://localhost:3000)
- API Health: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
- MinIO Console: [http://localhost:9001](http://localhost:9001) (minioadmin / minioadmin)

### 4. Scripts
- `pnpm dev` : รันทุก app พร้อมกัน
- `pnpm build` : คอมไพล์ทุก package
- `pnpm lint` : ตรวจสอบโค้ด
- `pnpm typecheck` : ตรวจสอบ TypeScript Types
- `pnpm test` : รัน Unit Tests (Vitest)
