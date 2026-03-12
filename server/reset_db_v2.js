require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const db = require('./db/database');

async function getKeys() {
    let url = process.env.SUPABASE_URL;
    let key = process.env.SUPABASE_KEY;
    if (!url || !key) {
        try {
            const urlObj = await db.get("SELECT value FROM settings WHERE key='supabase_url'");
            const keyObj = await db.get("SELECT value FROM settings WHERE key='supabase_key'");
            url = urlObj?.value;
            key = keyObj?.value;
            console.log("[Notice] Using keys from local SQLite.");
        } catch (e) {
            console.error("[Error] Failed to fetch keys from local DB:", e.message);
        }
    }
    return { url, key };
}

(async () => {
    try {
        const { url: supabaseUrl, key: supabaseKey } = await getKeys();

        if (!supabaseUrl || !supabaseKey) {
            console.error("[Error] Supabase URL or Key not found in ENV or Local DB!");
            process.exit(1);
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("1. Clearing 'interviews' table...");
        const { error: e1 } = await supabase.from('interviews').delete().neq('id', 0);
        if(e1) console.error("E1:", e1.message);
        
        console.log("2. Clearing 'candidates' table...");
        const { error: e2 } = await supabase.from('candidates').delete().neq('id', 0);
        if(e2) console.error("E2:", e2.message);

        console.log("3. Creating 1 New Sample Candidate...");
        // id를 명시하지 않음으로써 충돌 방지 및 신규 시퀀스 채번 유도
        const sampleCandidate = {
            name: '홍길동 (신규 샘플)',
            email: 'sample@tecace.com',
            phone: '010-1234-5678',
            department: '개발팀',
            status: 'Registered',
            resume_path: '[]' 
        };
        
        const { data, error: insertErr } = await supabase.from('candidates').insert([sampleCandidate]).select();
        
        if (insertErr) {
            console.error("Insert Error:", insertErr.message);
        } else {
            console.log("🎉 Sample Data Created Successfully:", data);
        }
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
