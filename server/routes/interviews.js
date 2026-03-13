const express = require('express');
const router = express.Router();
const { getSupabase } = require('../db/supabase');
const { v4: uuidv4 } = require('uuid');
const { analyzeAnswers } = require('./ai');

// POST /api/interviews - 면접 세션 생성
router.post('/', async (req, res) => {
    const { candidate_id, all_questions, confirmed_questions, use_followup } = req.body;
    if (!candidate_id || !Array.isArray(confirmed_questions) || confirmed_questions.length === 0) {
        return res.status(400).json({ error: 'candidate_id와 1개 이상의 confirmed_questions가 필요합니다.' });
    }
    try {
        const supabase = await getSupabase();
        
        const { data: candidate, error: cErr } = await supabase.from('candidates').select('*').eq('id', candidate_id).maybeSingle();
        if (cErr) throw cErr;
        if (!candidate) return res.status(404).json({ error: '지원자를 찾을 수 없습니다.' });

        // 기존 Pending 세션 만료
        await supabase.from('interviews').update({ status: 'Expired' })
            .eq('candidate_id', candidate_id)
            .eq('status', 'Pending');

        const token = uuidv4();
        const { data: newRow, error: insertErr } = await supabase.from('interviews').insert([{
            candidate_id,
            token,
            all_questions: JSON.stringify(all_questions || confirmed_questions),
            confirmed_questions: JSON.stringify(confirmed_questions),
            use_followup: use_followup !== undefined ? use_followup : true,
            status: 'Pending'
        }]).select().single();
        if (insertErr) throw insertErr;

        await supabase.from('candidates').update({ status: 'Invited' }).eq('id', candidate_id);

        const host = req.get('host');
        const protocol = req.protocol;
        const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;

        res.status(201).json({
            id: newRow.id,
            token,
            interview_link: `${baseUrl}/interview?token=${token}`
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/interviews/candidate/:id - Admin용 면접 링크 조회
router.get('/candidate/:id', async (req, res) => {
    try {
        const supabase = await getSupabase();
        const { data: iRows, error } = await supabase.from('interviews')
            .select(`*, candidates ( name, email, jobs ( title ) )`)
            .eq('candidate_id', req.params.id).neq('status', 'Expired')
            .order('created_at', { ascending: false }).limit(1);

        if (error) throw error;
        if (!iRows || iRows.length === 0) return res.status(404).json({ error: '면접 세션이 없습니다.' });
        
        const row = iRows[0];
        res.json({
            ...row,
            candidate_name: row.candidates?.name,
            candidate_email: row.candidates?.email,
            job_title: row.candidates?.jobs?.title,
            confirmed_questions: JSON.parse(row.confirmed_questions || '[]'),
            answers: JSON.parse(row.answers || '[]'),
            ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null,
            interview_link: `${baseUrl}/interview?token=${row.token}`,
            candidates: undefined
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/interviews/:token - Client App용
router.get('/:token', async (req, res) => {
    try {
        const supabase = await getSupabase();
        const { data: row, error } = await supabase.from('interviews')
            .select(`*, candidates ( name, email, jobs ( title, department ) )`)
            .eq('token', req.params.token).maybeSingle();

        if (error) throw error;
        if (!row) return res.status(404).json({ error: '유효하지 않은 면접 링크입니다.' });
        if (row.status === 'Completed') return res.status(409).json({ error: '이미 완료된 면접입니다.' });
        if (row.status === 'Expired') return res.status(410).json({ error: '만료된 면접 링크입니다.' });
        
            res.json({
                token: row.token,
                candidate_id: row.candidate_id,
                candidate_name: row.candidates?.name,
                candidate_email: row.candidates?.email,
                job_title: row.candidates?.jobs?.title,
                job_id: row.candidates?.job_id,
                department: row.candidates?.jobs?.department,
                questions: JSON.parse(row.confirmed_questions || '[]'),
                status: row.status
            });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/interviews/:token/answers - STT 답변 제출
router.post('/:token/answers', async (req, res) => {
    const { answers } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers 배열이 필요합니다.' });
    
    try {
        const supabase = await getSupabase();
        const { data: row, error: fetchErr } = await supabase.from('interviews')
            .select(`*, candidates ( id, name, jobs ( title, department, description, required_skills ) )`)
            .eq('token', req.params.token).maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!row) return res.status(404).json({ error: '면접 세션을 찾을 수 없습니다.' });
        if (row.status === 'Completed') return res.status(409).json({ error: '이미 제출된 면접입니다.' });

        const candidateInfo = row.candidates;
        const jobInfo = candidateInfo?.jobs || {};

        // Update Interview to Complete First for UX responsivness
        await supabase.from('interviews').update({
            answers: JSON.stringify(answers),
            status: 'Completed',
            completed_at: new Date().toISOString()
        }).eq('token', req.params.token);
        
        await supabase.from('candidates').update({ status: 'In Progress' }).eq('id', candidateInfo.id);

        res.json({ success: true, message: '면접이 제출되었습니다. AI 분석 중...' });

        // 백그라운드 AI 분석
        const confirmedQs = JSON.parse(row.confirmed_questions || '[]');
        try {
            await supabase.from('candidates').update({ status: 'Analyzing' }).eq('id', candidateInfo.id);
            
            const analysis = await analyzeAnswers(
                { name: candidateInfo.name },
                { title: jobInfo.title, department: jobInfo.department, description: jobInfo.description, required_skills: jobInfo.required_skills },
                confirmedQs.map(q => typeof q === 'string' ? q : q.text), // 텍스트만 추출
                answers
            );
            
            await supabase.from('interviews').update({ ai_analysis: JSON.stringify(analysis) }).eq('token', req.params.token);
            await supabase.from('candidates').update({ ai_score: analysis.overallScore, status: 'Completed' }).eq('id', candidateInfo.id);
            console.log(`[AI] 분석 완료: ${candidateInfo.name} — Score: ${analysis.overallScore}`);
        } catch (e) {
            console.error('[AI] 분석 오류:', e.message);
            // 분석 실패 시에도 면접 상태는 Completed로 유지하되 지원자 상태를 Fail로 찍어 관리자 인지 유도
            await supabase.from('candidates').update({ status: 'Analysis Failed' }).eq('id', candidateInfo.id);
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/interviews/:token/result - 면접 결과 상세
router.get('/:token/result', async (req, res) => {
    try {
        const supabase = await getSupabase();
        const { data: row, error } = await supabase.from('interviews')
            .select(`*, candidates ( name, email, jobs ( title ) )`)
            .eq('token', req.params.token).maybeSingle();
            
        if (error) throw error;
        if (!row) return res.status(404).json({ error: '면접 결과를 찾을 수 없습니다.' });
        
        res.json({
            ...row,
            candidate_name: row.candidates?.name,
            candidate_email: row.candidates?.email,
            job_title: row.candidates?.jobs?.title,
            confirmed_questions: JSON.parse(row.confirmed_questions || '[]'),
            answers: JSON.parse(row.answers || '[]'),
            ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null,
            candidates: undefined
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/interviews/:token/reset - 면접 초기화 (재시작)
router.post('/:token/reset', async (req, res) => {
    try {
        const supabase = await getSupabase();
        const { data: row, error } = await supabase.from('interviews').select('*').eq('token', req.params.token).maybeSingle();
        if (error) throw error;
        if (!row) return res.status(404).json({ error: '면접 세션을 찾을 수 없습니다.' });

        await supabase.from('interviews').update({
            answers: null, ai_analysis: null, completed_at: null, status: 'Pending'
        }).eq('token', req.params.token);
        
        await supabase.from('candidates').update({ ai_score: null, status: 'Invited' }).eq('id', row.candidate_id);

        res.json({ success: true, message: '면접 링크가 초기화 되었습니다. 다시 진행 가능합니다.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/interviews/:token/survey - 면접 설문 제출 (Phase 14)
router.post('/:token/survey', async (req, res) => {
    const { rating, comment } = req.body;
    if (!rating) return res.status(400).json({ error: 'rating은 필수입니다.' });
    try {
        const supabase = await getSupabase();
        const { data: interview } = await supabase.from('interviews').select('id').eq('token', req.params.token).maybeSingle();
        if (!interview) return res.status(404).json({ error: '면접 세션을 찾을 수 없습니다.' });

        const { error } = await supabase.from('surveys').insert([{
            interview_id: interview.id,
            rating,
            comment: comment || ''
        }]);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
