const express = require('express');
const router = express.Router();
const { getSupabase } = require('../db/supabase');
const localDb = require('../db/database');
const { verifyMailConfig } = require('../utils/mail');

router.post('/test-email', async (req, res) => {
    const { resend_api_key, to_email } = req.body;
    if (!resend_api_key) {
        return res.status(400).json({ error: 'Resend API Key를 입력해주세요.' });
    }

    try {
        const result = await verifyMailConfig(resend_api_key, to_email);
        res.json({ success: true, message: '테스트 메일이 발송되었습니다! 수신함을 확인해 주세요.' });
    } catch (e) {
        console.error('[Settings] 메일 테스트 실패:', e.message, e.statusCode || '', e.resendName || '');
        
        let hint = 'Resend API Key가 정확한지 확인해 주세요. (re_로 시작)';
        if (e.resendName === 'validation_error' || e.message?.includes('not verified')) {
            hint = '도메인 미등록 시 Resend 가입 이메일로만 수신 가능합니다. resend.com > Domains에서 도메인을 등록하거나, 가입 이메일로 테스트하세요.';
        } else if (e.statusCode === 403 || e.resendName === 'authentication_error') {
            hint = 'API Key가 유효하지 않습니다. resend.com에서 새 Key를 발급받아 주세요.';
        } else if (e.statusCode === 429) {
            hint = '일일 발송 한도(100건)를 초과했습니다. 내일 다시 시도해 주세요.';
        }
        
        res.status(500).json({ 
            error: '메일 발송 실패', 
            details: e.message,
            hint
        });
    }
});

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
        
        const sensitiveKeys = ['openai_api_key', 'supabase_key', 'github_token', 'render_api_key', 'resend_api_key'];
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
