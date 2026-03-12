const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const rawDb = new sqlite3.Database(DB_PATH);

// Promise 래퍼
const db = {
  all: (sql, params = []) => new Promise((resolve, reject) => {
    rawDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }),
};

async function migrate() {
    try {
        console.log('[Migrate] SQLite에서 설정 정보 읽는 중...');
        const settings = await db.all('SELECT * FROM settings');
        
        const urlObj = settings.find(s => s.key === 'supabase_url');
        const keyObj = settings.find(s => s.key === 'supabase_key');
        
        if (!urlObj || !urlObj.value || !keyObj || !keyObj.value) {
            console.error('[Migrate] 실패: Admin 설정 페이지에서 Supabase URL과 Key를 먼저 저장해야 합니다.');
            return;
        }

        const supabase = createClient(urlObj.value, keyObj.value);
        console.log(`[Migrate] Supabase 연결 성공! (${urlObj.value})`);

        // 1. Settings 복사
        console.log(`[Migrate] Settings ${settings.length}개 복사 중...`);
        for (const s of settings) {
             const { error } = await supabase.from('settings').upsert(s);
             if (error) console.error('[Migrate] Setting 에러:', error);
        }

        // 2. Jobs 복사
        const jobs = await db.all('SELECT * FROM jobs');
        console.log(`[Migrate] Jobs ${jobs.length}개 복사 중...`);
        if (jobs.length > 0) {
            const { error } = await supabase.from('jobs').upsert(jobs);
            if (error) console.error('[Migrate] Jobs 에러:', error);
        }

        // 3. Candidates 복사
        const candidates = await db.all('SELECT * FROM candidates');
        console.log(`[Migrate] Candidates ${candidates.length}개 복사 중...`);
        if (candidates.length > 0) {
             const { error } = await supabase.from('candidates').upsert(candidates);
             if (error) console.error('[Migrate] Candidates 에러:', error);
        }

        // 4. Interviews 복사
        const interviews = await db.all('SELECT * FROM interviews');
        console.log(`[Migrate] Interviews ${interviews.length}개 복사 중...`);
        if (interviews.length > 0) {
            // 시간 형식이 null인 빈 문자열 처리
            const cleanInterviews = interviews.map(i => ({
                ...i,
                completed_at: i.completed_at || null
            }));
            const { error } = await supabase.from('interviews').upsert(cleanInterviews);
            if (error) console.error('[Migrate] Interviews 에러:', error);
        }

        console.log('[Migrate] ✨ 모든 데이터 클라우드(Supabase) 이관 성공 완료!');
    } catch (e) {
        console.error('[Migrate] 강제 종료 오류:', e);
    } finally {
        rawDb.close();
        process.exit(0);
    }
}

migrate();
