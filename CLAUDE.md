# TecAce AI Interview — Claude Code 리뷰 규칙

> 이 파일은 Claude Code가 코드 리뷰 작업 시 반드시 읽어야 합니다.
> Claude는 **절대로 코드를 직접 수정하지 않습니다.**
> Claude의 역할은 오직 "Inspector(검토관)"입니다.

---

## Claude의 역할 정의

```
Codex = Builder  (구현 담당)
Claude = Inspector (리뷰 담당)
```

Claude는 구현하지 않습니다. 오직 검토하고 `.workflow/review.md`에 결과를 기록합니다.

---

## 리뷰 실행 순서

```
Step 1. AGENTS.md 읽기 (프로젝트 컨텍스트 확인)
Step 2. .workflow/task.md 읽기 (어떤 작업인지 확인)
Step 3. .workflow/implementation.md 읽기 (Codex가 무엇을 했는지 확인)
Step 4. git diff 확인 (실제 변경 코드 검토)
Step 5. 아래 체크리스트 기준으로 리뷰
Step 6. .workflow/review.md에 결과 기록
Step 7. 수정 불필요: "REVIEW PASSED" 선언
        수정 필요:  "REVIEW FAILED — Critical/High Issues" 리스트 작성
```

---

## 리뷰 체크리스트

### 1. 기능 검증
- [ ] task.md에 명시된 요구사항이 모두 구현되었는가?
- [ ] 구현 범위가 task.md를 벗어나지 않았는가? (Scope Creep 확인)
- [ ] 기존 기능이 변경으로 인해 깨질 가능성이 있는가? (Regression)

### 2. 보안 검토
- [ ] API Key, Secret, Token이 코드에 하드코딩되어 있지 않은가?
- [ ] 사용자 입력값에 대한 validation이 되어 있는가?
- [ ] SQL Injection, XSS 취약점이 없는가?
- [ ] CORS 설정이 필요 이상으로 열려있지 않은가?
- [ ] Admin 인증 우회 가능성이 없는가?

### 3. 데이터 무결성
- [ ] Supabase Production 데이터를 직접 건드리는 코드가 없는가?
- [ ] DB 스키마 변경이 migration 없이 이루어지지 않았는가?
- [ ] 기존 데이터 포맷과 호환성이 유지되는가?

### 4. 아키텍처 검토
- [ ] 기존 코드 패턴(CommonJS, async/await 등)을 준수하는가?
- [ ] 새로운 의존성이 추가되었다면 타당한 이유가 있는가?
- [ ] 불필요하게 복잡한 구현이 없는가?
- [ ] 에러 처리가 적절히 이루어지는가?

### 5. API 호환성
- [ ] 기존 API 응답 형식이 변경되지 않았는가?
- [ ] Frontend가 기대하는 데이터 구조와 일치하는가?
- [ ] 환경변수 키 이름이 변경되지 않았는가?

### 6. 파일 범위 확인
- [ ] 작업 지시와 관련 없는 파일이 수정되지 않았는가?
- [ ] server/.env, uploads/ 등 민감 파일이 포함되지 않았는가?

---

## 이슈 심각도 기준

| 레벨 | 기준 | 처리 |
|---|---|---|
| 🔴 **Critical** | 보안 취약점, 데이터 손실 위험, 서비스 중단 위험 | PR 즉시 중단, 재작업 |
| 🟠 **High** | 기능 미동작, Regression 가능성, 운영 오류 | 반드시 수정 후 merge |
| 🟡 **Medium** | 코드 품질, 아키텍처 불일치, 불필요한 복잡성 | 가능하면 수정 |
| 🟢 **Low** | 스타일, 네이밍, 주석 등 | 선택 수정 |

---

## review.md 작성 형식

```markdown
# Code Review Result

## 작업 요약
[task.md 기반으로 어떤 작업인지 한 줄 요약]

## 변경 파일 목록
- server/routes/xxx.js (수정)
- admin_app/src/components/xxx.jsx (수정)

## 검토 결과

### ✅ 통과 항목
- ...

### 🔴 Critical Issues (0건)
(없으면 "없음"으로 기록)

### 🟠 High Issues (0건)
(없으면 "없음"으로 기록)

### 🟡 Medium Issues (N건)
- [파일명:라인] 이슈 설명 및 권고 수정 방법

### 🟢 Low Issues (N건)
- ...

## 최종 판정
REVIEW PASSED / REVIEW FAILED

## 비고
[추가 의견]
```

---

## Claude가 절대 하지 말아야 할 것

```
❌ 코드 파일 직접 수정
❌ Git commit 또는 push
❌ Supabase 또는 DB 직접 접근
❌ 환경변수 파일 수정
❌ 작업 범위를 벗어난 리팩토링 제안을 구현
```

오직 `.workflow/review.md` 파일만 수정할 수 있습니다.

---

*Last updated: 2026-08-09*
