# 현재 작업 지시 (Task)

> **이 파일은 찰리(Product Owner) 또는 Antigravity가 작성합니다.**
> AI Agent는 작업 시작 전 반드시 이 파일을 읽어야 합니다.

---

## 작업 ID: TASK-001
## 작업 유형: feature
## 담당자: Antigravity
## 우선순위: Medium
## 작업 상태: IN PROGRESS

## 작업 ID: TASK-002 (보완 및 모달 이식)
## 작업 유형: feature / refactor
## 담당자: Antigravity (계획) → Claude Code (구현)
## 우선순위: High
## 작업 상태: 구현 완료 (Claude 리뷰 / Antigravity QA 대기)

### 배경 및 목적
html2canvas 이미지 캡처 방식의 텍스트 복사 불가능 문제 및 페이지 잘림 문제를 해결하기 위해, 
정교한 Print CSS 튜닝과 window.print() 우회 파일명 지정을 적용한 텍스트 기반 PDF 출력 방식으로 전환. 
대시보드 모달 결과뷰어(InterviewResult.jsx)와 독립 페이지(InterviewResultPanel.jsx) 모두 적용.

### 요구사항
- [x] jspdf / html2canvas 라이브러리 제거 및 번들 용량 축소
- [x] window.print() 기반 파일명 임시 우회 적용 (`지원자_AI면접분석_날짜.pdf`)
- [x] 질문별 카드에 break-inside: avoid; 및 .print-card 클래스 부여하여 페이지 끊김 해결
- [x] 인쇄물 가독성을 극대화한 글로벌 Print CSS 스타일 튜닝
- [x] 텍스트 복사(드래그) 100% 지원 여부 확인 (html2canvas 이미지 캡처 완전 제거로 구조적으로 보장됨)

### 영향 범위
- 변경 파일: admin_app/package.json, admin_app/package-lock.json, admin_app/src/components/InterviewResultPanel.jsx, admin_app/src/components/InterviewResult.jsx, admin_app/src/index.css
- DB 변경: 없음
- API 변경: 없음

### 주의사항
- client_app/ 수정 금지
- server/ 수정 금지

### 주의사항
- client_app/ 수정 금지
- server/ 수정 금지
- 기존 Excel 다운로드 기능 건드리지 말 것

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
