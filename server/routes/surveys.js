const express = require('express');
const router = express.Router();
const { getSupabase } = require('../db/supabase');

// GET /api/surveys - Analytics 용 설문 전체 결과 조회
router.get('/', async (req, res) => {
    try {
        const supabase = await getSupabase();
        
        // surveys 테이블과 interviews를 조인하고, 연관된 candidates, jobs 정보를 가져옴
        const { data, error } = await supabase
            .from('surveys')
            .select(`
                id,
                rating,
                comment,
                created_at,
                interviews!inner (
                    candidates!inner (
                        name,
                        jobs (
                            title
                        )
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 프론트엔드에서 사용하기 쉽게 데이터 Flatten
        const formattedData = data.map(item => {
            const candidate = item.interviews?.candidates;
            return {
                id: item.id,
                rating: item.rating,
                comment: item.comment || '',
                created_at: item.created_at,
                candidate_name: candidate?.name || '알 수 없음',
                job_title: candidate?.jobs?.title || '미분류'
            };
        });

        res.json(formattedData);
    } catch (e) {
        console.error('[Surveys] GET Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/surveys/:id - 특정 설문 결과 삭제
router.delete('/:id', async (req, res) => {
    try {
        const supabase = await getSupabase();
        const { error } = await supabase
            .from('surveys')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error('[Surveys] DELETE Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
