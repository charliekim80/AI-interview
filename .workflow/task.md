# 현재 작업 지시 (Task)

> **이 파일은 찰리(Product Owner) 또는 Antigravity가 작성합니다.**
> AI Agent는 작업 시작 전 반드시 이 파일을 읽어야 합니다.

---

## 작업 ID: TASK-001
## 작업 유형: feature
## 담당자: Antigravity
## 우선순위: Medium
## 작업 상태: IN PROGRESS

### 배경 및 목적
Interview Result 화면에 PDF 저장 버튼이 이미 존재하나 `window.print()` 방식으로
인쇄 다이얼로그가 뜨는 문제가 있음. html2pdf.js 라이브러리를 도입하여
버튼 클릭 시 PDF가 즉시 다운로드 되도록 개선.

### 요구사항
- [ ] 버튼 클릭 → PDF 즉시 다운로드 (인쇄 다이얼로그 없음)
- [ ] 파일명: {지원자이름}_AI면접분석_{날짜}.pdf
- [ ] A4 세로, 여백 적절히 설정
- [ ] 배경색/그라디언트 유지
- [ ] PDF 생성 중 로딩 상태 표시
- [ ] 희망연봉 포함 체크박스 반영

### 영향 범위
- 변경 파일: admin_app/package.json, admin_app/src/components/InterviewResultPanel.jsx, admin_app/src/index.css
- DB 변경: 없음
- API 변경: 없음

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
