# TecAce AI Interview — AI Agent 공통 운영 규칙

> 이 파일은 모든 AI Agent(Codex, Claude, Antigravity)가 작업 시작 전에 반드시 읽어야 합니다.
> 이 규칙은 Production 서비스를 안전하게 보호하기 위한 최우선 기준입니다.

---

## 프로젝트 개요

**서비스명**: TecAce AI Interview Platform  
**목적**: AI 기반 채용 면접 자동화 플랫폼  
**운영자**: TecAce HR Team  

### 주요 사용자
- **Admin (채용 담당자)**: `/admin` 경로로 접속, React Admin 앱 사용
- **Candidate (지원자)**: `/interview?token=xxx` 경로로 접속, 단일 HTML 앱 사용

### 핵심 서비스 플로우
```
Admin → 포지션 등록 → 지원자 등록 + 이력서 업로드
     → AI 질문 생성 (OpenAI) → 면접 링크 생성
     → 지원자 인터뷰 진행 → AI 분석 → 결과 확인
```

---

## 프로젝트 구조

```
AI_Interview/
├── client_app/               # 지원자용 인터뷰 앱 (Vanilla HTML, 57KB 단일 파일)
│   └── ai-interview-app.html
├── admin_app/                # 관리자용 Admin Panel (React 19 + Vite 7)
│   └── src/components/       # 9개 컴포넌트
├── server/                   # Node.js Express Backend (포트 3000)
│   ├── routes/               # 7개 API 라우트 (ai, auth, candidates, interviews, jobs, settings, surveys)
│   ├── db/
│   │   ├── supabase.js       # Supabase 클라이언트 (Primary DB)
│   │   └── database.js       # SQLite (로컬 fallback only)
│   └── uploads/              # 이력서 파일 저장소
├── AGENTS.md                 # 이 파일 — AI 공통 규칙
├── CLAUDE.md                 # Claude 전용 리뷰 규칙
├── .ai/                      # 프로젝트 컨텍스트 문서
└── .workflow/                # AI 작업 인수인계 파일
```

---

## ⛔ PRODUCTION SAFETY RULES (절대 위반 금지)

```
1. main 브랜치에 직접 커밋하지 말 것
2. Production Supabase 데이터를 직접 수정하지 말 것
3. server/.env 파일을 수정하거나 노출하지 말 것
4. API Key, Secret, Token 등 민감정보를 코드에 하드코딩하지 말 것
5. server/uploads/ 내 실제 이력서 파일을 삭제하거나 이동하지 말 것
6. 승인 없이 Production에 직접 배포하지 말 것
```

---

## 개발 프로세스 (필수 준수)

모든 개발 작업은 아래 순서로 수행합니다.

```
Step 1. .workflow/task.md 읽기 (현재 작업 지시 확인)
Step 2. .ai/ARCHITECTURE.md 읽기 (관련 구조 파악)
Step 3. feature branch 생성 (main에서 직접 작업 금지)
Step 4. 최소한의 변경만 구현 (관련 없는 코드 수정 금지)
Step 5. 관련 테스트 실행
Step 6. .workflow/implementation.md에 구현 내용 기록
Step 7. Claude 리뷰 요청
Step 8. 리뷰 결과 반영
Step 9. PR 생성
Step 10. Antigravity QA 대기
Step 11. 승인 후 merge
```

---

## 브랜치 네이밍 규칙

```
feature/[기능명]      예: feature/interview-result-chart
fix/[버그명]          예: fix/login-session-expire
refactor/[대상]       예: refactor/ai-route-cleanup
chore/[작업명]        예: chore/update-dependencies
```

---

## 데이터베이스 규칙

- **Primary DB**: Supabase (PostgreSQL) — 모든 운영 데이터
- **Local Fallback**: SQLite — 로컬 개발 시 Supabase 연결이 없을 때만 사용
- **스키마 변경**: 반드시 `supabase/migrations/` 디렉토리에 migration 파일로 작성
- **직접 수정 금지**: Supabase Dashboard에서 Production 스키마를 직접 수정하지 말 것

### 주요 테이블
| 테이블 | 설명 |
|---|---|
| `candidates` | 지원자 정보 (name, email, phone, job_id, status, ai_score) |
| `interviews` | 면접 세션 (token, questions, answers, ai_analysis, status) |
| `jobs` | 채용 포지션 (title, department, description, required_skills) |
| `settings` | 시스템 설정 (openai_api_key, supabase_url 등) |

---

## API 구조

| 경로 | 파일 | 설명 |
|---|---|---|
| `/api/auth` | routes/auth.js | 관리자 인증 |
| `/api/candidates` | routes/candidates.js | 지원자 CRUD + 이력서 업로드 |
| `/api/interviews` | routes/interviews.js | 면접 세션 관리 |
| `/api/jobs` | routes/jobs.js | 채용 포지션 관리 |
| `/api/ai` | routes/ai.js | OpenAI 연동 (질문생성, 결과분석) |
| `/api/settings` | routes/settings.js | 시스템 설정 |
| `/api/surveys` | routes/surveys.js | 지원자 만족도 설문 |
| `/api/stats` | server.js | 대시보드 통계 |

---

## 코드 작성 규칙

### Backend (server/)
- Node.js CommonJS (`require/module.exports`) 방식 유지
- 비동기 처리는 `async/await` 사용
- 에러 처리: try-catch + `res.status(500).json({ error: e.message })`
- 환경변수는 `process.env.XXX` 방식만 사용

### Frontend (admin_app/)
- React 19 + ES Modules (`import/export`)
- TailwindCSS v4 유틸리티 클래스 사용
- 컴포넌트는 `src/components/` 디렉토리에 위치
- API 호출은 `src/api/` 또는 컴포넌트 내부 axios 사용

### Client App (client_app/)
- Vanilla JS + HTML 단일 파일 구조 유지
- 수정 시 매우 신중하게 접근 (운영 중인 지원자 인터뷰 화면)

---

## Definition of Done (완료 기준)

아래 조건이 모두 충족되어야 PR을 생성할 수 있습니다.

- [ ] feature branch에서 작업 완료
- [ ] 서버 빌드/실행 오류 없음 (`node server.js`)
- [ ] Admin App 빌드 오류 없음 (`npm run build`)
- [ ] 관련 기능 수동 테스트 완료
- [ ] `.workflow/implementation.md` 작성 완료
- [ ] Claude 리뷰 완료 (Critical/High 이슈 없음)
- [ ] `.workflow/review.md` 작성 완료

---

## 금지 사항 (Scope Creep 방지)

작업 지시에 없는 아래 행위는 절대 하지 말 것:

- 지시되지 않은 다른 파일 수정
- 의존성(dependencies) 임의 추가
- 기존 API 응답 형식 변경
- DB 스키마 임의 변경
- 환경변수 추가/삭제
- 포트 번호 변경

---

*Last updated: 2026-08-09*
