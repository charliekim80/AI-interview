const express = require('express');
const router = express.Router();
const { getSupabase } = require('../db/supabase');
const localDb = require('../db/database');

router.get('/:key', async (req, res) => {
    try {
        let val = '';
        let exists = false;
        
        try {
            const supabase = await getSupabase();
            const { data, error } = await supabase.from('settings').select('value').eq('key', req.params.key).maybeSingle();
            if (!error && data) {
                val = data.value;
                exists = true;
            }
        } catch (e) {
            // Fallback to local DB if Supabase isn't configured yet
            const row = await localDb.get('SELECT value FROM settings WHERE key = ?', [req.params.key]);
            if (row) {
                val = row.value;
                exists = true;
            }
        }
        
        const sensitiveKeys = ['openai_api_key', 'supabase_key', 'github_token', 'render_api_key'];
        if (sensitiveKeys.includes(req.params.key) && val) {
            val = val.slice(0, 4) + '••••••••••••••••••••••••••••••••••••••••';
        }
        res.json({ key: req.params.key, value: val, exists });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key가 필요합니다.' });
    try {
        // 1. 항상 로컬 설정에 백업 (로컬 구동 시 연결값 참조를 위함)
        try {
            await localDb.run(
                `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now','localtime'))
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
                [key, value || '']
            );
        } catch (localErr) { 
            console.warn('[Settings] 로컬 DB 저장 에러:', localErr.message); 
        }

        // 2. Supabase가 연결 가능한 상태면 클라우드에도 동기화
        try {
            const supabase = await getSupabase();
            const { error } = await supabase.from('settings').upsert({
                key, 
                value: value || '',
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
            if (error) console.error('[Settings] Supabase 동기화 에러:', error.message);
        } catch (cloudErr) {
            console.warn('[Settings] Supabase 연동 정보 대기 중이거나 연결 안 됨');
        }

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
