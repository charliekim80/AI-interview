# 구현 결과 (Implementation)

> **이 파일은 Codex(AI Developer)가 작업 완료 후 작성합니다.**
> Claude 리뷰어와 Antigravity QA가 이 파일을 참고합니다.

---

## Task ID: TASK-001
## 작업 완료 일시: 2026-08-09
## 브랜치: feature/pdf-export-html2pdf

### 구현 요약
window.print() 기반 PDF 저장 → html2pdf.js 기반 직접 다운로드 방식으로 교체

### 변경된 파일
| 파일 | 변경 유형 | 변경 내용 |
|---|---|---|
| admin_app/package.json | 수정 | html2pdf.js 의존성 추가 |
| admin_app/src/components/InterviewResultPanel.jsx | 수정 | handleExportPdf 함수 전면 교체, isPdfLoading state 추가, Loader2 아이콘 추가, pdf-score-text 클래스 추가 |
| admin_app/src/index.css | 수정 | print CSS에 .pdf-score-text fallback 추가, 주석 정리 |

### 주요 로직 설명
1. **html2pdf.js 연동**: `import html2pdf from 'html2pdf.js'` 추가
2. **파일명 자동 지정**: `${name}_AI면접분석_${날짜}.pdf` 형식으로 자동 생성
3. **그라디언트 텍스트 처리**: PDF 캡처 전 `.pdf-score-text` 요소의 webkit-text-fill-color를 에메랄드 색상으로 임시 치환, 완료 후 복원
4. **로딩 상태**: isPdfLoading state로 버튼 disabled + 스피너 표시
5. **html2canvas scale: 2**: 고해상도 캡처로 PDF 품질 향상
6. **pagebreak mode**: avoid-all로 카드 중간 페이지 나눔 방지

### 테스트 결과
- [ ] 서버 실행 확인 (node server.js)
- [ ] Admin App 빌드 확인 (npm run build) — 진행 중
- [ ] PDF 저장 파일명 확인
- [ ] 배경색 출력 확인

### Claude 리뷰 요청 포인트
- handleExportPdf의 try-finally 구조에서 그라디언트 복원 로직 누락 가능성 검토
- html2pdf.js pagebreak 설정이 긴 Q&A 목록에서 실제로 효과 있는지 검토

---

## Task ID: TASK-002
## 작업 완료 일시: 2026-08-09
## 브랜치: feature/pdf-export-modal-fix
## 구현자: Claude Code (Antigravity 작성 계획서 기반, orchestration을 Antigravity → Claude Code/Cowork로 전환하여 직접 구현)

### 구현 요약
html2canvas/jsPDF 이미지 캡처 방식을 완전히 제거하고, 브라우저 네이티브 `window.print()` +
Print CSS 조판 기반의 텍스트 PDF 저장 방식으로 전환. InterviewResultPanel.jsx(독립 페이지)와
InterviewResult.jsx(대시보드 모달)에 동일하게 적용.

### 변경된 파일
| 파일 | 변경 유형 | 변경 내용 |
|---|---|---|
| admin_app/package.json | 수정 | html2canvas, html2pdf.js, jspdf 의존성 제거 |
| admin_app/package-lock.json | 수정 | 위 제거에 따른 재생성 |
| admin_app/src/components/InterviewResultPanel.jsx | 수정 | handleExportPdf를 window.print() 기반으로 전면 교체, html2canvas/jsPDF/oklch Proxy 우회 로직·isPdfLoading·pdfRef 제거, print-card/print-answer-box/print-feedback-box 클래스 부여 |
| admin_app/src/components/InterviewResult.jsx | 수정 | 위와 동일한 내용을 모달 뷰어에도 적용 |
| admin_app/src/index.css | 수정 | @media print 블록 확장 — 시스템 폰트 강제 지정, .print-card 페이지 잘림 방지, 질문 타이틀/답변/AI피드백 박스 가독성 스타일 추가 |

### 주요 로직 설명
1. **handleExportPdf 단순화**: `document.title`을 `{이름}_AI면접분석_{날짜}`로 임시 변경 → `window.print()` 호출 → `finally`에서 원본 타이틀 복원. html2canvas 캡처, jsPDF 페이지네이션 계산, oklch/oklab `getComputedStyle` Proxy 우회 로직 전부 제거 (네이티브 인쇄 엔진은 oklch 등 최신 CSS 색상 함수를 문제없이 처리하므로 해당 우회 자체가 불필요해짐).
2. **로딩 스피너 제거**: `window.print()`는 호출 스택을 막는 동기 방식이라 React 상태 업데이트가 다이얼로그 표시 전에 커밋되지 않아 기존 `isPdfLoading` 스피너가 화면에 나타날 수 없는 구조였음 → 죽은 코드로 판단, `isPdfLoading`/`pdfRef`/`useRef` 임포트 함께 제거.
3. **Print CSS 조판**: `.print-card`(카드 잘림 방지 + 여백 + 테두리), `.print-answer-box`/`.print-feedback-box`(옅은 회색 배경 + 좌측 강조선), `.print-card p.font-semibold`(질문 타이틀 굵게), body에 시스템 고딕 폰트 스택 강제 지정.

### 테스트 결과
- [x] Admin App 빌드 확인 (`npm run build`) — 성공, 번들 크기 1.2MB→630KB로 감소 (html2canvas/jspdf 관련 vendor 청크 완전 제거)
- [x] ESLint 확인 — 수정한 3개 파일 기준 신규 에러 없음 (InterviewResultPanel.jsx의 기존 useEffect deps 경고 2건은 이번 변경과 무관한 사전 존재 이슈)
- [x] 로컬 서버 + Admin 앱 구동 후 브라우저로 실제 동작 확인 (정휘원 지원자, 완료된 인터뷰 데이터 사용)
  - 모달 뷰어(InterviewResult.jsx) PDF 저장 버튼 클릭 → `document.title`이 `정휘원_AI면접분석_2026-08-09`로 정상 변경 → `window.print()` 정상 호출 → `finally`에서 원본 타이틀로 정상 복원 확인
  - 독립 페이지(InterviewResultPanel.jsx)에서도 동일하게 확인
  - 콘솔 에러 없음 (oklch/oklab 관련 에러 클래스 자체가 구조적으로 제거됨)
  - `.print-card`(16개) / `.print-answer-box`(15개) / `.print-feedback-box`(15개) / `.pdf-score-text`(1개) 클래스가 의도한 DOM 요소에 정상 적용되고, `@media print` 스타일시트가 의도한 규칙 그대로 로드됨을 DOM/CSSOM 검사로 확인

### 특이사항
- 이 브라우저 자동화 환경에서는 `window.print()` 호출 시 네이티브 인쇄 다이얼로그의 렌더링/응답 방식이 실제 데스크톱 Chrome과 달라 `computer` 툴의 클릭 확인이 한 차례 타임아웃되었음 (페이지 자체는 정상 — 이후 `document.title` 복원까지 정상 확인됨). 실제 데스크톱 브라우저에서는 표준 인쇄창이 뜨는 것이 정상 동작이므로 찰리 QA 시 실제 브라우저에서 "PDF로 저장" 대상 선택 후 저장까지 최종 확인 필요.
- `admin_app/dist/`는 gitignore 대상이라 재빌드 결과물은 커밋 대상 아님. 기존에 추적되던 구버전 dist 파일 4개는 이번 세션 이전부터 삭제 상태로 잡혀 있던 것이며 이번 작업 범위와 무관.

### Claude 리뷰 요청 포인트
- window.print() 동기 호출 구조에서 document.title 변경/복원 타이밍이 실제 Chrome/Edge/Safari 등 브라우저별 인쇄 다이얼로그 파일명 프리필에 의도대로 반영되는지 (Chrome/Edge 확인됨, Firefox는 브라우저 특성상 title 기반 프리필 미지원 가능)
- `.bg-white, [class*="rounded"] { break-inside: avoid; }` 기존 광역 규칙과 신규 `.print-card` 규칙이 중복 적용되는 부분이 있는데 유지할지, `.print-card`로 일원화할지

---

## Task ID: TASK-003
## 작업 완료 일시: 2026-08-09
## 브랜치: fix/pdf-print-content-loss

### 구현 요약
찰리가 업로드한 실제 PDF를 PyMuPDF로 렌더링해 원인을 특정 — 모달의 `fixed + max-h-[90vh]
overflow-y-auto` 클리핑 때문에 window.print()가 내용을 거의 다 유실하는 Critical 버그를
발견·수정. 추가로 답변:AI피드백 = 3:1 그리드 고정 및 인쇄 밀도 개선 진행.

### 변경된 파일
| 파일 | 변경 유형 | 변경 내용 |
|---|---|---|
| admin_app/src/components/Dashboard.jsx | 수정 | 모달 백드롭/패널/콘텐츠에 print-modal-* 클래스, X버튼에 no-print, Stats+테이블 영역을 모달 열림 시 조건부 no-print로 래핑 |
| admin_app/src/App.jsx | 수정 | 모바일 헤더 바 + 반응형 중복 타이틀에 no-print 추가 (인쇄 시 유효 뷰포트 폭이 lg 브레이크포인트 미만으로 계산되어 lg:hidden 요소가 노출되는 문제) |
| admin_app/src/components/InterviewResult.jsx, InterviewResultPanel.jsx | 수정 | 답변/피드백 그리드에 print-qa-grid, 카드 헤더에 print-qa-header, 점수 카드에 print-summary-card 클래스 추가 |
| admin_app/src/index.css | 수정 | .print-modal-backdrop/panel/content(fixed·overflow 해제 + break-inside:auto로 범용 규칙 예외 처리), .print-qa-grid(3:1 고정 그리드), 카드 마진·패딩·폰트 축소 |

### 주요 로직 설명
1. **모달 언랩**: `.print-modal-backdrop { position:static; overflow:visible; ... }` 등으로 인쇄 시 모달을 일반 문서 흐름으로 전환. 단, 이 요소들이 `rounded-*` 클래스를 가져 기존 범용 `break-inside:avoid` 규칙에 걸리면 전체 리포트가 한 페이지에 안 들어간다고 판단해 통째로 다음 페이지로 밀려 첫 페이지가 비는 부작용이 있어, `break-inside:auto !important`로 별도 예외 처리.
2. **반응형 브레이크포인트 함정**: 인쇄 시 브라우저가 계산하는 유효 뷰포트 폭이 화면 뷰포트(1400px)가 아니라 페이지 폭 기준이라 `lg:`(1024px) 브레이크포인트 미만으로 떨어짐 → `lg:hidden` 모바일 전용 요소들이 인쇄에서 노출됨. `no-print`로 명시적 처리. 같은 이유로 `md:grid-cols-2`도 무너질 수 있어 답변/피드백 그리드는 `print-qa-grid`로 브레이크포인트에 의존하지 않는 explicit grid-template-columns(3fr 1fr)로 대체.
3. **밀도 개선**: 카드 margin-bottom 24px→10px, 카드/그리드 패딩 축소, 본문 폰트 11pt→10pt·9.5pt, 점수 폰트 축소.

### 테스트 결과
- [x] Admin App 빌드 확인 (`npm run build`) — 성공
- [x] ESLint — 신규 에러 0건 (기존 이슈만 잔존)
- [x] **실제 PDF 파일 기준 검증** (지난 세션의 교훈 반영): `puppeteer-core`로 기존 로컬 Chrome을 구동해 로그인 → 모달/독립 페이지 각각 열기 → `emulateMediaType('print')` → `page.pdf()`로 실제 PDF 생성 → PyMuPDF로 렌더링해 픽셀 단위 육안 확인
  - 모달: 3페이지(전부 중복·Q1에서 잘림) → 12페이지(Q1~Q10 + 꼬리질문 전체 정상 출력)로 수정 확인
  - 독립 페이지: 12페이지, 처음부터 콘텐츠 정상 출력 확인 (이 경로는 애초에 fixed 모달 구조가 아니라 문제 없었음)
  - 두 경로 모두 네브바/모바일헤더/X버튼/백드롭 노출 없음, 3:1 그리드 정상 적용, 페이지 잘림 없음을 렌더링된 이미지로 직접 확인

### 특이사항
- TASK-002가 이미 main에 배포되어 있어, 이 수정이 병합되기 전까지 프로덕션의 모달 PDF 저장은 실제로 깨져 있는 상태입니다.
- 이번 검증에 사용한 `puppeteer-core`(scratchpad에 격리 설치, 기존 로컬 Chrome 재사용)는 프로젝트 의존성에 포함되지 않았고 검증 목적으로만 사용했습니다.

### Claude 리뷰 요청 포인트
- `no-print`를 조건부(`modalCandidate ? 'no-print' : ''`)로만 준 이유(모달이 없을 때 대시보드 자체를 인쇄하는 경로는 원래 지원 대상이 아니었음)가 타당한지
- 12페이지가 이 특정 지원자(답변이 유난히 길고 꼬리질문이 많음) 기준 결과라 실제로는 지원자별 편차가 클 수 있음 — 평균적인 지원자 기준으로 한 번 더 확인 권장

---

## 작성 양식 (예시)

```
## Task ID: TASK-001
## 작업 완료 일시: 2026-XX-XX

### 구현 요약
[한 줄로 무엇을 구현했는지]

### 변경된 파일
| 파일 | 변경 유형 | 변경 내용 |
|---|---|---|
| server/routes/xxx.js | 수정 | ... |
| admin_app/src/components/xxx.jsx | 수정 | ... |

### 주요 로직 설명
[핵심 구현 내용 설명]

### 테스트 결과
- [ ] 서버 실행 확인 (node server.js)
- [ ] Admin App 빌드 확인 (npm run build)
- [ ] 기능 수동 테스트 통과

### 특이사항
[예상치 못한 사항, 주의사항]

### Claude 리뷰 요청 포인트
[특별히 검토해달라는 부분]
```

---
*Last updated: 2026-08-09*
