# TecAce AI Interview — 기술 아키텍처

## 전체 시스템 구조

```
사용자 브라우저
      │
      ├── /admin          → React Admin App (admin_app/dist/)
      ├── /interview      → Vanilla HTML Client (client_app/)
      │
      ▼
Node.js Express Server (server/server.js, 포트 3000)
      │
      ├── /api/auth       → 관리자 인증
      ├── /api/candidates → 지원자 관리 + 이력서 파싱
      ├── /api/interviews → 면접 세션 관리
      ├── /api/jobs       → 채용 포지션
      ├── /api/ai         → OpenAI 연동 (질문생성, 분석)
      ├── /api/settings   → 시스템 설정
      ├── /api/surveys    → 지원자 설문
      └── /api/stats      → 대시보드 통계
            │
            ├── Supabase (PostgreSQL) — Primary DB (운영)
            ├── SQLite (server/db/database.sqlite) — Local Fallback
            ├── OpenAI API — AI 기능
            ├── Resend / Nodemailer — 이메일 발송
            └── server/uploads/ — 이력서 파일 저장
```

## 주요 데이터 흐름

### 지원자 등록 → 면접 플로우
```
Admin → POST /api/candidates (이력서 업로드, Multer 처리)
     → POST /api/ai/generate-questions (OpenAI로 질문 생성)
     → POST /api/interviews (면접 링크 생성, UUID token)
     → 이메일 발송 (Resend)
     → 지원자가 /interview?token=TOKEN 접속
     → GET /api/interviews/:token (질문 조회)
     → PUT /api/interviews/:token/answer (답변 저장)
     → POST /api/ai/analyze (OpenAI로 결과 분석)
     → Admin에서 결과 조회
```

## Supabase DB 스키마

### candidates 테이블
```sql
id          SERIAL PRIMARY KEY
name        TEXT NOT NULL
email       TEXT NOT NULL
phone       TEXT
job_id      INTEGER (→ jobs.id)
department  TEXT
resume_path TEXT
linkedin    TEXT
notes       TEXT
status      TEXT DEFAULT 'Registered'
            -- Registered / Invited / In Progress / Completed
ai_score    REAL
created_at  TIMESTAMP DEFAULT NOW()
```

### interviews 테이블
```sql
id                  SERIAL PRIMARY KEY
candidate_id        INTEGER (→ candidates.id)
token               TEXT UNIQUE NOT NULL
all_questions       JSONB DEFAULT '[]'
confirmed_questions JSONB DEFAULT '[]'
answers             JSONB DEFAULT '[]'
ai_analysis         JSONB
status              TEXT DEFAULT 'Pending'
                    -- Pending / Active / Completed / Expired
created_at          TIMESTAMP DEFAULT NOW()
completed_at        TIMESTAMP
```

### jobs 테이블
```sql
id               SERIAL PRIMARY KEY
title            TEXT NOT NULL
department       TEXT
location         TEXT
employment_type  TEXT DEFAULT 'Full Time'
description      TEXT
required_skills  TEXT
preferred_skills TEXT
created_at       TIMESTAMP DEFAULT NOW()
```

### settings 테이블
```sql
key        TEXT PRIMARY KEY
value      TEXT NOT NULL DEFAULT ''
updated_at TIMESTAMP DEFAULT NOW()
```

## Admin App 컴포넌트 구조

```
App.jsx (라우팅 + 세션 관리)
├── Login.jsx              — 로그인 화면
├── Dashboard.jsx          — 메인 대시보드 (통계 + 지원자 목록)
├── JobsPanel.jsx          — 채용 포지션 관리
├── CandidatesPanel.jsx    — 지원자 등록 + 질문 생성
├── InterviewResultPanel.jsx — 면접 결과 조회
├── AnalyticsPanel.jsx     — 설문 분석
├── SettingsPanel.jsx      — API Key 설정
├── AISetupPanel.jsx       — AI 설정
└── InterviewResult.jsx    — 결과 상세
```

## 환경변수

### server/.env
```
PORT=3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx...  (선택 — Admin Settings에서도 입력 가능)
CLIENT_URL=http://localhost:5173
```

### admin_app/.env
```
VITE_API_BASE_URL=http://localhost:3000
```

## 로컬 개발 실행 방법

```bash
# 1. Backend 서버 실행
cd server
npm install
npm run dev    # nodemon server.js (포트 3000)

# 2. Admin App 개발 서버 실행
cd admin_app
npm install
npm run dev    # vite (포트 5173)

# 3. Admin App 빌드 (배포용)
cd admin_app
npm run build  # dist/ 생성 → server가 /admin 경로로 서빙
```

## Render 배포 구조

```
GitHub main merge
      │
      ▼
Render Auto Deploy
      │
      ├── Build Command: cd admin_app && npm install && npm run build
      └── Start Command: cd server && npm install && node server.js
```

---
*Last updated: 2026-08-09*
