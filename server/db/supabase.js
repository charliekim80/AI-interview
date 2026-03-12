const { createClient } = require('@supabase/supabase-js');
const db = require('./database'); // Fallback to local SQLite for fetching keys if ENV is not set

let supabaseInstance = null;

async function getSupabase() {
    if (supabaseInstance) return supabaseInstance;

    // 1. 배포 환경 (Render) 에서는 환경 변수 사용
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
        supabaseInstance = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        return supabaseInstance;
    }

    // 2. 로컬 테스트 환경에서는 SQLite 에 저장된 설정값 사용
    try {
        const urlObj = await db.get("SELECT value FROM settings WHERE key='supabase_url'");
        const keyObj = await db.get("SELECT value FROM settings WHERE key='supabase_key'");
        if (urlObj && urlObj.value && keyObj && keyObj.value) {
            supabaseInstance = createClient(urlObj.value, keyObj.value);
            return supabaseInstance;
        }
    } catch (e) {
        // 무시하고 아래 에러 처리로 넘어감
    }

    throw new Error('Supabase 설정이 없습니다. 먼저 Admin Settings에서 DB 연동 설정을 저장하세요.');
}

module.exports = { getSupabase };
