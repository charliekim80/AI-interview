# 현재 작업 지시 (Task)

> **이 파일은 찰리(Product Owner) 또는 Antigravity가 작성합니다.**
> AI Agent는 작업 시작 전 반드시 이 파일을 읽어야 합니다.

---

## 작업 상태: IDLE (대기 중)

현재 진행 중인 작업이 없습니다.

---

## 작업 지시 양식 (예시)

```
## 작업 ID: TASK-001
## 작업 유형: feature / fix / refactor / chore
## 담당자: Codex
## 우선순위: High / Medium / Low

### 배경 및 목적
[왜 이 작업이 필요한지]

### 요구사항
- [ ] 요구사항 1
- [ ] 요구사항 2

### 영향 범위
- 변경 예상 파일: server/routes/xxx.js, admin_app/src/components/xxx.jsx
- DB 변경 필요 여부: Yes / No
- API 변경 필요 여부: Yes / No

### 완료 기준 (Definition of Done)
- [ ] 기능 동작 확인
- [ ] 빌드 오류 없음
- [ ] implementation.md 작성 완료
- [ ] Claude 리뷰 완료

### 주의사항
[특별히 조심해야 할 것]

### 참고 문서
- .ai/ARCHITECTURE.md
- .ai/DEVELOPMENT.md
```

---
*Last updated: 2026-08-09*
