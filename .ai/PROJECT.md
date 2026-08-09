# TecAce AI Interview — 프로젝트 컨텍스트

## 서비스 정보

| 항목 | 내용 |
|---|---|
| **서비스명** | TecAce AI Interview Platform |
| **버전** | v1.3.1 |
| **목적** | AI 기반 채용 면접 자동화 |
| **운영 URL** | https://[render-domain]/admin |
| **인터뷰 URL** | https://[render-domain]/interview?token=TOKEN |

## 운영 현황

- **Admin 앱**: React 19 + Vite 7, Render에서 서빙 (server/의 /admin 경로)
- **Client 앱**: Vanilla HTML, Render에서 서빙 (server/의 /interview 경로)
- **Backend**: Node.js Express, Render에 배포
- **Database**: Supabase (PostgreSQL) — Production
- **AI**: OpenAI API (GPT-4 계열)

## 현재 활성 기능

1. 관리자 로그인 (LocalStorage 세션 기반)
2. 채용 포지션(JD) 등록/관리
3. 지원자 등록 + 이력서(PDF/DOCX) 업로드
4. AI 맞춤 질문 생성 (OpenAI)
5. AI 심층질문(Follow-up) — 답변 부족 시 자동 추가 질문
6. 면접 초대 링크 생성 + 이메일 발송
7. 지원자 인터뷰 진행 (텍스트 답변)
8. AI 결과 분석 (종합점수, 강점/약점, 추천 등급)
9. 대시보드 통계
10. Excel 다운로드

## 향후 계획 (Backlog)

- Supabase Preview Branch 연동
- Render Preview 서비스 설정
- Supabase Migration 체계 도입
- 클라이언트 앱 모듈화 (현재 단일 HTML 57KB)
- Admin 인증 강화 (Supabase Auth 또는 JWT)

## 연락처

- **Product Owner**: Charlie
- **AI PM**: Antigravity
- **AI Developer**: Codex
- **AI Reviewer**: Claude

---
*Last updated: 2026-08-09*
