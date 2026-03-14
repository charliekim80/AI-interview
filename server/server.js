require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────
const corsOptions = {
    origin: true, // 모든 Origin 허용 (Prototype 단계에서 확실한 해봉을 위해 전면 개방)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
};

// CORS는 API 요청에만 적용하여 정적 파일(JS/CSS) 로딩 차단 방지
app.use('/api', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files ────────────────────────────────────────────
// 이력서 파일 서빙
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Client App HTML 서빙 (/interview?token=xxx 경로)
const clientAppPath = path.join(__dirname, '../client_app');
app.use('/client', express.static(clientAppPath));

// /interview 경로로 접속하면 client app HTML을 반환
app.get('/interview', (req, res) => {
    const htmlPath = path.join(clientAppPath, 'ai-interview-app.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.status(404).send('<h1>Client App을 찾을 수 없습니다.</h1><p>client_app/ai-interview-app.html 파일을 확인하세요.</p>');
    }
});

// Admin App 정적 배포 서빙 (/admin)
const adminAppPath = path.join(__dirname, '../admin_app/dist');
app.use('/admin', express.static(adminAppPath));
app.get('/admin/*', (req, res) => {
    const idxPath = path.join(adminAppPath, 'index.html');
    if (fs.existsSync(idxPath)) res.sendFile(idxPath);
    else res.status(404).send('<h2>Admin App 빌드 폴더를 찾을 수 없습니다. (먼저 admin_app 폴더에서 npm run build를 실행하세요)</h2>');
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/surveys', require('./routes/surveys'));

// Dashboard stats 라우트
app.get('/api/stats', async (req, res) => {
    try {
        const { getSupabase } = require('./db/supabase');
        const supabase = await getSupabase();
        
        const { count: total } = await supabase.from('candidates').select('*', { count: 'exact', head: true });
        const { count: completed } = await supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('status', 'Completed');
        const { count: inProgress } = await supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('status', 'In Progress');
        const { count: invited } = await supabase.from('interviews').select('*', { count: 'exact', head: true }).neq('status', 'Expired');
        
        const { data: scores } = await supabase.from('candidates').select('ai_score').not('ai_score', 'is', null);
        let avgAiScore = null;
        if (scores && scores.length > 0) {
            const sum = scores.reduce((acc, row) => acc + (row.ai_score || 0), 0);
            avgAiScore = Math.round((sum / scores.length) * 10) / 10;
        }

        res.json({
            totalCandidates: total || 0,
            completed: completed || 0,
            inProgress: inProgress || 0,
            totalInterviews: invited || 0,
            avgAiScore
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: 'v1.3.1-cors-fixed', timestamp: new Date().toISOString(), port: PORT });
});

// ─── Root ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.redirect('/admin');
});

// ─── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '파일 크기가 10MB를 초과합니다.' });
    }
    res.status(500).json({ error: err.message || '서버 오류가 발생했습니다.' });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log('================================================');
    console.log(`  TecAce AI Interview Server`);
    console.log(`  http://localhost:${PORT}`);
    console.log(`  Interview App: http://localhost:${PORT}/interview?token=TOKEN`);
    console.log('================================================');
});
