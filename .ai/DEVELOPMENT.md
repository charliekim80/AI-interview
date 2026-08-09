# TecAce AI Interview — 개발 가이드라인

## 1. 코딩 컨벤션

### Backend (server/)
- **모듈 시스템**: CommonJS (`require/module.exports`)
- **비동기**: `async/await` (Promise.then 체이닝 지양)
- **에러 처리**:
  ```javascript
  try {
    // ...
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
  ```
- **Supabase 사용**:
  ```javascript
  const { getSupabase } = require('../db/supabase');
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  ```

### Frontend (admin_app/)
- **모듈 시스템**: ES Modules (`import/export`)
- **상태 관리**: React useState/useEffect (외부 상태관리 라이브러리 없음)
- **스타일링**: TailwindCSS v4 유틸리티 클래스
- **아이콘**: lucide-react
- **API 호출**: axios 또는 fetch

## 2. 새 API 라우트 추가 방법

```javascript
// server/routes/새파일.js
const express = require('express');
const router = express.Router();
const { getSupabase } = require('../db/supabase');

router.get('/', async (req, res) => {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('table').select('*');
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

// server/server.js에 등록
app.use('/api/새경로', require('./routes/새파일'));
```

## 3. 새 React 컴포넌트 추가 방법

```jsx
// admin_app/src/components/새컴포넌트.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function 새컴포넌트() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/...`)
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4">
      {/* 컴포넌트 내용 */}
    </div>
  );
}

// App.jsx에서 import하여 사용
```

## 4. DB 스키마 변경 시 (향후 Migration 도입 후)

```bash
# 1. migration 파일 생성
supabase migration new 변경_설명

# 2. SQL 작성 (supabase/migrations/날짜_변경_설명.sql)
ALTER TABLE candidates ADD COLUMN 새컬럼 TEXT DEFAULT '';

# 3. 로컬 적용 테스트
supabase db reset

# 4. PR에 포함하여 배포
```

## 5. 테스트 방법 (현재 기준)

현재 자동화 테스트가 없으므로, 수동 테스트 체크리스트를 준수합니다.

### Backend 수동 테스트
```bash
# 서버 실행 확인
curl http://localhost:3000/api/health

# API 응답 확인
curl http://localhost:3000/api/stats
```

### Frontend 수동 테스트 시나리오
1. Admin 로그인
2. 포지션 등록 → 저장 확인
3. 지원자 등록 → 이력서 업로드 → AI 질문 생성
4. 면접 링크 생성 → 복사 확인
5. 인터뷰 앱 접속 → 답변 진행 → 제출
6. Admin에서 결과 확인

## 6. 자주 발생하는 오류와 해결법

### Supabase 연결 오류
```
오류: "Supabase 설정이 없습니다"
원인: server/.env에 SUPABASE_URL, SUPABASE_KEY 미설정
해결: server/.env 파일에 올바른 값 입력
```

### OpenAI API 오류
```
오류: "OpenAI API Key가 설정되지 않았습니다"
원인: Admin Settings에서 API Key 미설정
해결: Admin Panel → Settings → OpenAI API Key 입력
```

### Admin App 빌드 오류
```
오류: npm run build 실패
원인: 잘못된 import 경로, 문법 오류
해결: npm run dev로 개발 서버에서 먼저 오류 확인 후 수정
```

### CORS 오류
```
오류: "Access-Control-Allow-Origin" 에러
원인: API 요청이 /api/ 경로가 아닌 다른 경로로 요청됨
해결: 모든 API 요청은 /api/ 접두사 사용 확인
```

---
*Last updated: 2026-08-09*
