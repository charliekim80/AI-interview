const express = require('express');
const router = express.Router();
const { getSupabase } = require('../db/supabase');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});
const upload = multer({
    storage, limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (['.pdf', '.doc', '.docx'].includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('PDF, DOC, DOCX만 허용됩니다.'));
    }
});

// GET /api/candidates
router.get('/', async (req, res) => {
    try {
        const supabase = await getSupabase();
        
        // jobs 조인 및 interviews 조인으로 최신 토큰 확인
        const { data: rows, error } = await supabase
            .from('candidates')
            .select(`
                *,
                jobs ( title ),
                interviews ( token, status, created_at )
            `)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const formattedRows = rows.map(c => {
            // 가장 최근의 유효한 면접 토큰 찾기
            const validInterviews = c.interviews ? c.interviews.filter(i => i.status !== 'Expired') : [];
            validInterviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            return {
                ...c,
                job_title: c.jobs?.title || null,
                interview_token: validInterviews.length > 0 ? validInterviews[0].token : null,
                jobs: undefined,
                interviews: undefined
            };
        });
        
        res.json(formattedRows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/candidates/stats
router.get('/stats', async (req, res) => {
    try {
        const supabase = await getSupabase();
        
        const { count: total } = await supabase.from('candidates').select('*', { count: 'exact', head: true });
        const { count: completed } = await supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('status', 'Completed');
        const { count: inProg } = await supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('status', 'In Progress');
        const { count: invited } = await supabase.from('interviews').select('*', { count: 'exact', head: true }).neq('status', 'Expired');
        
        // AI Score 평균 계산
        const { data: scores, error: scErr } = await supabase.from('candidates').select('ai_score').not('ai_score', 'is', null);
        let avgAiScore = null;
        if (!scErr && scores && scores.length > 0) {
            const sum = scores.reduce((acc, row) => acc + (row.ai_score || 0), 0);
            avgAiScore = Math.round((sum / scores.length) * 10) / 10;
        }

        res.json({
            totalCandidates: total || 0,
            completed: completed || 0,
            inProgress: inProg || 0,
            totalInterviews: invited || 0,
            avgAiScore
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/candidates — 다중 이력서 지원
router.post('/', upload.array('resumes', 3), async (req, res) => {
    const { name, email, phone, job_id, department, linkedin, notes } = req.body;
    if (!name || !email) return res.status(400).json({ error: '이름과 이메일은 필수입니다.' });

    const fileNames = req.files ? req.files.map(f => f.filename) : [];
    const resumePath = fileNames.length > 0 ? JSON.stringify(fileNames) : null;

    try {
        const supabase = await getSupabase();
        const { data: newRow, error: insertErr } = await supabase.from('candidates').insert([{
            name, email, phone: phone || null, job_id: job_id || null, 
            department: department || '', resume_path: resumePath, 
            linkedin: linkedin || null, notes: notes || null
        }]).select('*, jobs(title)').single();

        if (insertErr) throw insertErr;
        
        newRow.job_title = newRow.jobs?.title || null;
        delete newRow.jobs;

        res.status(201).json(newRow);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/candidates/:id — 완전 삭제 (모든 이력서 파일 + 면접 데이터 포함)
router.delete('/:id', async (req, res) => {
    try {
        const supabase = await getSupabase();
        const { data: c, error: fetchErr } = await supabase.from('candidates').select('*').eq('id', req.params.id).maybeSingle();
        if (fetchErr) throw fetchErr;
        if (!c) return res.status(404).json({ error: '지원자를 찾을 수 없습니다.' });

        // 이력서 로컬 파일들 삭제
        if (c.resume_path) {
            try {
                const paths = JSON.parse(c.resume_path);
                if (Array.isArray(paths)) {
                    paths.forEach(p => {
                        const fp = path.join(uploadDir, p);
                        if (fs.existsSync(fp)) fs.unlinkSync(fp);
                    });
                } else if (typeof paths === 'string') {
                    const fp = path.join(uploadDir, paths);
                    if (fs.existsSync(fp)) fs.unlinkSync(fp);
                }
            } catch (e) {
                const fp = path.join(uploadDir, c.resume_path);
                if (fs.existsSync(fp)) fs.unlinkSync(fp);
            }
        }

        // Supabase DB 삭제 (인터뷰는 CASCADE로 자동 삭제됨)
        const { error: delErr } = await supabase.from('candidates').delete().eq('id', req.params.id);
        if (delErr) throw delErr;

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/candidates/:id/resume
router.get('/:id/resume', async (req, res) => {
    try {
        const supabase = await getSupabase();
        const { data: c, error } = await supabase.from('candidates').select('resume_path').eq('id', req.params.id).maybeSingle();
        if (error) throw error;
        if (!c || !c.resume_path) return res.status(404).json({ error: '이력서를 찾을 수 없습니다.' });
        
        // For compatibility with single item download, we might serve the first file if it's an array
        let tgtPath = c.resume_path;
        try {
            const parsed = JSON.parse(c.resume_path);
            if (Array.isArray(parsed) && parsed.length > 0) tgtPath = parsed[0];
        } catch(e) {}

        const fp = path.join(uploadDir, tgtPath);
        if (!fs.existsSync(fp)) return res.status(404).json({ error: '파일이 없습니다.' });
        res.download(fp);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
