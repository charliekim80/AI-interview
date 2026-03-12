require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const db = require('./db/database');

(async () => {
    try {
        let supabaseUrl = process.env.SUPABASE_URL;
        let supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl) {
            const u = await db.get("SELECT value FROM settings WHERE key='supabase_url'");
            const k = await db.get("SELECT value FROM settings WHERE key='supabase_key'");
            if(u) supabaseUrl = u.value;
            if(k) supabaseKey = k.value;
        }

        if (!supabaseUrl || !supabaseKey) {
            console.error("Supabase URL or Key not found!");
            process.exit(1);
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("1. Clearing 'interviews' table...");
        const { error: err1 } = await supabase.from('interviews').delete().neq('id', 0);
        if(err1) console.error(err1);
        
        console.log("2. Clearing 'candidates' table...");
        const { error: err2 } = await supabase.from('candidates').delete().neq('id', 0);
        if(err2) console.error(err2);

        console.log("3. Creating 1 Sample Candidate...");
        const sampleCandidate = {
            name: '홍길동 (Sample)',
            email: 'sample@tecace.com',
            phone: '010-1234-5678',
            department: '개발팀 (Sample)',
            status: 'Registered',
            resume_path: '[]' // 빈 JSON 배열 문자열
        };
        
        const { data, error: insertErr } = await supabase.from('candidates').insert([sampleCandidate]).select();
        
        if (insertErr) {
            console.error("Insert Error:", insertErr.message);
        } else {
            console.log("Sample Data Created Successfully:", data);
        }
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
