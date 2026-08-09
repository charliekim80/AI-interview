# 현재 작업 지시 (Task)

> **이 파일은 찰리(Product Owner) 또는 Antigravity가 작성합니다.**
> AI Agent는 작업 시작 전 반드시 이 파일을 읽어야 합니다.

---

## 작업 ID: TASK-001
## 작업 유형: feature
## 담당자: Antigravity
## 우선순위: Medium
## 작업 상태: ✅ DONE — 병합·배포 완료 (PR #1, commit 8f461d5). 이후 TASK-002에서 window.print() 방식으로 전면 대체됨

## 작업 ID: TASK-002 (보완 및 모달 이식)
## 작업 유형: feature / refactor
## 담당자: Antigravity (계획) → Claude Code (구현)
## 우선순위: High
## 작업 상태: ✅ DONE — 병합·배포 완료 (PR #3, commit c37fccc). 배포 직후 모달 PDF 콘텐츠 유실 리그레션 발견 → TASK-003에서 수정

## 작업 ID: TASK-003 (PDF 인쇄 결과물 콘텐츠 유실 핫픽스 + 밀도 개선)
## 작업 유형: fix
## 담당자: 찰리(실물 PDF 확인·이슈 리포트) → Claude Code(원인 분석 및 구현)
## 우선순위: Critical
## 작업 상태: ✅ DONE — 병합·배포 완료 (PR #4, commit b70daae). 찰리 프로덕션 QA 확인 완료 (2026-08-09)

### 배경 및 목적
TASK-002 배포 후 찰리가 실제로 저장한 PDF를 확인한 결과, 대시보드 결과 뷰어 모달에서
저장한 PDF가 Question 1 도입부에서 내용이 전부 잘리고, 3페이지 모두 거의 동일한
내용이 반복되며, 대시보드 네브바/모바일 헤더/X버튼 등 인쇄되면 안 되는 UI가 배경에
비쳐 보이는 심각한 버그가 발견됨. 원인은 모달이 `position: fixed` + `max-h-[90vh]
overflow-y-auto`로 뷰포트에 클리핑되어 있어 `window.print()`가 내용을 정상적으로
여러 페이지에 풀어내지 못하기 때문. 아울러 답변/AI피드백 영역 비율을 3:1로 조정하고
전반적인 밀도를 높여 페이지 수를 줄이는 개선도 함께 진행.

### 요구사항
- [x] 모달(InterviewResult) 인쇄 시 전체 질문/답변이 잘리지 않고 모두 출력되도록 수정
- [x] 인쇄 시 대시보드 네브바/모바일 헤더/X버튼/배경 오버레이가 노출되지 않도록 수정
- [x] 답변 : AI피드백 영역을 3:1 비율로 고정 (Tailwind md: 브레이크포인트에 의존하지 않도록)
- [x] 카드 패딩/마진/폰트 축소로 인쇄 밀도 향상
- [x] 독립 페이지(InterviewResultPanel)와 모달(InterviewResult) 양쪽 모두 실제 PDF 파일로 직접 검증

### 영향 범위
- 변경 파일: admin_app/src/App.jsx, admin_app/src/components/Dashboard.jsx, admin_app/src/components/InterviewResult.jsx, admin_app/src/components/InterviewResultPanel.jsx, admin_app/src/index.css
- DB 변경: 없음
- API 변경: 없음

### 주의사항
- client_app/ 수정 금지
- server/ 수정 금지
- 기존 Excel 다운로드 기능 건드리지 말 것
- ⚠️ TASK-002가 이미 main에 병합·배포되어 있어, 이 버그가 수정되기 전까지는
  **현재 프로덕션에서 모달 뷰어로 저장하는 PDF가 실제로 깨져 있는 상태**임

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
