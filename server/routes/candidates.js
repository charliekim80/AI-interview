const express = require('express');
const router = express.Router();
const { getSupabase } = require('../db/supabase');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({
    storage, limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (['.pdf', '.doc', '.docx'].includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('PDF, DOC, DOCX만 허용됩니다.'));
    }
});

// Supabase Storage 'resumes' 버킷이 없으면 자동 생성
async function ensureBucket(supabase) {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === 'resumes');
    if (!exists) {
        console.log('[Storage] resumes 버킷이 없어 자동 생성합니다.');
        const { error } = await supabase.storage.createBucket('resumes', { public: false });
        if (error) throw new Error(`버킷 생성 실패: ${error.message}`);
    }
}

// GET /api/candidates
router.get('/', async (req, res) => {
    try {
        const supabase = await getSupabase();
        
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

// POST /api/candidates — Supabase Storage 연동
router.post('/', upload.array('resumes', 3), async (req, res) => {
    const { name, email, phone, job_id, department, linkedin, notes } = req.body;
    if (!name || !email) return res.status(400).json({ error: '이름과 이메일은 필수입니다.' });

    try {
        const supabase = await getSupabase();
        const uploadedFiles = [];

        if (req.files && req.files.length > 0) {
            await ensureBucket(supabase);
            for (const file of req.files) {
                const ext = path.extname(file.originalname);
                const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
                const { data, error } = await supabase.storage
                    .from('resumes')
                    .upload(fileName, file.buffer, { contentType: file.mimetype });
                
                if (error) throw error;
                uploadedFiles.push(fileName);
            }
        }

        const resumePath = uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : null;

        const { data: newRow, error: insertErr } = await supabase.from('candidates').insert([{
            name, email, phone: phone || null, job_id: job_id || null, 
            department: department || '', resume_path: resumePath, 
            linkedin: linkedin || null, notes: notes || null
        }]).select('*, jobs(title)').single();

        if (insertErr) throw insertErr;
        
        newRow.job_title = newRow.jobs?.title || null;
        delete newRow.jobs;

        res.status(201).json(newRow);
    } catch (e) { 
        console.error('[Candidates] Create Error:', e.message);
        res.status(500).json({ error: e.message }); 
    }
});

// PUT /api/candidates/:id — 지원자 정보 업데이트
router.put('/:id', upload.array('resumes', 3), async (req, res) => {
    const { name, email, phone, job_id, department, linkedin, notes } = req.body;
    const { id } = req.params;

    try {
        const supabase = await getSupabase();
        
        const { data: existing, error: fetchErr } = await supabase.from('candidates').select('*').eq('id', id).maybeSingle();
        if (fetchErr) throw fetchErr;
        if (!existing) return res.status(404).json({ error: '지원자를 찾을 수 없습니다.' });

        let resumePath = existing.resume_path;
        if (req.files && req.files.length > 0) {
            const uploadedFiles = [];
            await ensureBucket(supabase);
            for (const file of req.files) {
                const ext = path.extname(file.originalname);
                const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
                const { error } = await supabase.storage.from('resumes').upload(fileName, file.buffer, { contentType: file.mimetype });
                if (error) throw error;
                uploadedFiles.push(fileName);
            }
            resumePath = JSON.stringify(uploadedFiles);
            
            // 기존 파일 삭제
            if (existing.resume_path) {
                try {
                    const oldPaths = JSON.parse(existing.resume_path);
                    const pathsToDel = Array.isArray(oldPaths) ? oldPaths : [oldPaths];
                    await supabase.storage.from('resumes').remove(pathsToDel);
                } catch(e) {}
            }
        }

        const { data: updated, error: updateErr } = await supabase
            .from('candidates')
            .update({
                name, email, phone: phone || null, job_id: job_id || null,
                department: department || '', resume_path: resumePath,
                linkedin: linkedin || null, notes: notes || null,
                updated_at: new Date()
            })
            .eq('id', id)
            .select('*, jobs(title)')
            .single();

        if (updateErr) throw updateErr;

        updated.job_title = updated.jobs?.title || null;
        delete updated.jobs;

        res.json(updated);
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

// DELETE /api/candidates/:id — 완전 삭제 (Supabase Storage 파일 포함)
router.delete('/:id', async (req, res) => {
    try {
        const supabase = await getSupabase();
        const { data: c, error: fetchErr } = await supabase.from('candidates').select('*').eq('id', req.params.id).maybeSingle();
        if (fetchErr) throw fetchErr;
        if (!c) return res.status(404).json({ error: '지원자를 찾을 수 없습니다.' });

        // Supabase Storage 파일들 삭제
        if (c.resume_path) {
            try {
                const paths = JSON.parse(c.resume_path);
                const pathsToDel = Array.isArray(paths) ? paths : [paths];
                await supabase.storage.from('resumes').remove(pathsToDel);
            } catch (e) {
                console.error('[Delete] File Removal Error:', e.message);
            }
        }

        const { error: delErr } = await supabase.from('candidates').delete().eq('id', req.params.id);
        if (delErr) throw delErr;

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/candidates/:id/resume — Supabase Storage에서 Signed URL 발급
router.get('/:id/resume', async (req, res) => {
    try {
        const supabase = await getSupabase();
        const { data: c, error } = await supabase.from('candidates').select('resume_path').eq('id', req.params.id).maybeSingle();
        if (error) throw error;
        if (!c || !c.resume_path) return res.status(404).json({ error: '이력서를 찾을 수 없습니다.' });
        
        let tgtPath = c.resume_path;
        try {
            const parsed = JSON.parse(c.resume_path);
            if (Array.isArray(parsed) && parsed.length > 0) tgtPath = parsed[0];
            else if (typeof parsed === 'string') tgtPath = parsed;
        } catch(e) {}

        const { data, error: sErr } = await supabase.storage.from('resumes').createSignedUrl(tgtPath, 60);
        if (sErr) throw sErr;
        
        res.redirect(data.signedUrl);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
