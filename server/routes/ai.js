const express = require('express');
const router = express.Router();
const { getSupabase } = require('../db/supabase');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function getOpenAIKey() {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
        return process.env.OPENAI_API_KEY.trim();
    }
    try {
        const supabase = await getSupabase();
        const { data, error } = await supabase.from('settings').select('value').eq('key', 'openai_api_key').maybeSingle();
        if (error || !data) throw new Error('Not found in supabase');
        return data.value;
    } catch { 
        // fallback to local SQLite if Supabase not ready
        try {
            const localDb = require('../db/database');
            const row = await localDb.get("SELECT value FROM settings WHERE key='openai_api_key'");
            return row && row.value ? row.value : null;
        } catch { return null; }
    }
}

async function parseResume(filename) {
    if (!filename) return '';
    const fp = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(fp)) {
        console.error(`[AI] 이력서 파일 없음: ${fp}`);
        return '';
    }
    console.log(`[AI] 이력서 파싱 시작: ${filename}`);

    const ext = path.extname(filename).toLowerCase();
    try {
        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(fp);
            const data = await pdfParse(dataBuffer, { max: 5 });
            const text = data.text.trim().slice(0, 15000);
            console.log(`[AI] PDF 파싱 완료: ${text.length}자`);
            return text;
        } else if (ext === '.docx' || ext === '.doc') {
            const result = await mammoth.extractRawText({ path: fp });
            const text = result.value.trim().slice(0, 15000);
            console.log(`[AI] DOCX 파싱 완료: ${text.length}자`);
            return text;
        } else {
            console.warn(`[AI] 지원하지 않는 확장자: ${ext}`);
        }
    } catch (e) {
        console.error('[AI] 이력서 파싱 실패, Fallback 진행:', e.message);
    }
    return '';
}

function mockQuestions(jobTitle, candidateName) {
    return [
        `TecAce AI면접에 참여해주셔서 감사합니다. 먼저 간단하게 자기소개 부탁드립니다.`,
        `금번에 지원하신 ${jobTitle}과 관련된 업무 경력이 얼마나 되시는지, 그리고 주로 어떤 업무를 담당하셨는지 말씀해주세요.`,
        `지금까지 수행하신 프로젝트나 과제 중 가장 어려웠던 과제명은 무엇이며, 그 문제를 어떻게 진단하고 해결해나가셨는지 구체적으로 말씀해주세요.`,
        `팀 프로젝트를 수행하며 다른 구성원과 의견 충돌이 있었을 때 어떻게 대처하셨나요? 구체적인 사례를 들어 설명해주세요.`,
        `업무 환경이나 기술 스택이 급변했던 상황에서 어떻게 빠르게 학습하고 적응하셨나요? 최근 AI를 통해 해결하고 있는 업무가 있다면 함께 소개해주세요.`,
        `${jobTitle} 직무의 핵심 기술과 관련하여 실무에서 가장 자신 있는 부분이나, 기존 조직에서 좋은 성과를 창출했던 경험을 말씀해주세요.`,
        `복잡한 상황에서 업무의 우선순위를 정해야 할 때, 어떤 기준으로 결정하시는지 최근 사례를 바탕으로 말씀해주세요.`,
        `이직을 고려하게 되신 주된 이유가 무엇이며, 최종 합격하신다면 예상하시는 합류 가능 시점이 언제이신지 말씀해주세요.`,
        `금일 면접 이후 강남 사무실에서 대면 면접이 진행될 경우, 방문 가능하신 날짜를 알려주실 수 있을까요?`,
        `당사 입사 시 기대하시는 처우(연봉) 및 현재 연봉 수준을 말씀해 주시면 감사하겠습니다.`
    ];
}

// POST /api/ai/generate-questions
router.post('/generate-questions', async (req, res) => {
    const { job_id, candidate_id } = req.body;
    if (!job_id || !candidate_id) return res.status(400).json({ error: 'job_id와 candidate_id가 필요합니다.' });

    try {
        const supabase = await getSupabase();
        
        const { data: job, error: jErr } = await supabase.from('jobs').select('*').eq('id', job_id).maybeSingle();
        const { data: cData, error: cErr } = await supabase.from('candidates').select('*, jobs(title)').eq('id', candidate_id).maybeSingle();
        
        if (jErr || cErr || !job || !cData) return res.status(404).json({ error: 'Job 또는 지원자를 찾을 수 없습니다.' });

        const candidate = {
            ...cData,
            job_title: cData.jobs?.title || null
        };

        let parsedResume = '';
        if (candidate.resume_path) {
            try {
                const paths = JSON.parse(candidate.resume_path);
                if (Array.isArray(paths)) {
                    console.log(`[AI] 다중 이력서 파싱 시도: ${paths.length}개`);
                    const texts = await Promise.all(paths.map(p => parseResume(p)));
                    parsedResume = texts.filter(t => t).join('\n\n--- NEXT FILE ---\n\n');
                } else {
                    parsedResume = await parseResume(candidate.resume_path);
                }
            } catch (e) {
                parsedResume = await parseResume(candidate.resume_path);
            }
        }

        const apiKey = await getOpenAIKey();

        if (!apiKey) {
            return res.json({
                questions: mockQuestions(job.title, candidate.name),
                mode: 'mock',
                message: 'OpenAI API Key가 설정되지 않아 Mock 질문을 사용합니다.'
            });
        }

        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey });

        const systemPrompt = `당신은 15년 경력의 전문 채용 HR 컨설턴트입니다.
아래 규칙을 반드시 준수하여 면접 질문 정확히 10개를 생성하세요:

[질문 스타일 규칙 - 매우 중요]
- 모든 질문은 2~3문장 이내로 작성하세요.
- 질문 내에 "성격", "리더십" 같은 추상적 단어를 직접 사용하지 말고 구체적인 행동 사례를 유도하세요.
- 지원자의 이력서와 JD를 철저히 분석하여 맞춤화된 질문을 생성하세요.
- 출력 형식은 반드시 JSON 배열만 반환하세요.

[10개 질문 구조 - 필수 준수]
Q1: 반드시 "TecAce AI면접에 참여해주셔서 감사합니다. 먼저 간단하게 자기소개 부탁드립니다."로 시작하세요.
Q2: 지원한 [직무명]과 관련된 업무 경력 기간과 주요 담당 업무를 이력서 기반으로 확인하는 질문.
Q3: 수행 프로젝트 중 가장 어려웠던 과제명과 이를 어떻게 진단하고 해결했는지 구체적으로 묻는 질문.
Q4: JD의 협업 항목과 연계하여, 팀 내 의견 충돌 시 대처했던 구체적 사례를 묻는 질문.
Q5: 기술 스택이나 환경 변화 시 빠르게 학습하고 적응했던 경험과 최근 AI를 통해 해결하고 있는 업무소개를 묻는 질문.
Q6: JD의 핵심 기술과 연계하여, 실무 경험 중 자신 있는 부분 또는 기존 조직에서 좋은 성과를 창출한 부분을 묻는 질문.
Q7: 복잡한 상황에서 업무 우선순위를 결정하는 기준을 최근 사례를 통해 확인하는 질문.
Q8: 반드시 포함: "이직을 고려하게 되신 주된 이유가 무엇이며, 최종 합격하신다면 예상하시는 합류 가능 시점이 언제이신지 말씀해주세요."
Q9: 반드시 포함: "금일 면접 이후 강남 사무실에서 대면 면접이 진행될 경우, 방문 가능하신 날짜를 알려주실 수 있을까요?"
Q10: 반드시 포함: "당사 입사 시 기대하시는 처우(연봉) 및 현재 연봉수준을 말씀해 주시면 감사하겠습니다."

출력 형식: 반드시 JSON 배열만 반환. ["Q1내용", ..., "Q10내용"]
- 정확히 10개 요소 포함
- 각 질문은 자연스러운 대화체로 작성`;

        const userPrompt = `[지원하는 직무]
Job Title: ${job.title}
JD 내용: ${job.description || '없음'}
핵심기술: ${job.required_skills || '없음'}

[지원자 정보]
이름: ${candidate.name}
이력서: ${parsedResume || '이력서 없음'}

위 정보를 바탕으로 지원자 맞춤형 면접 질문 10개를 생성하세요.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.6,
            max_tokens: 2500,
        });

        const content = completion.choices[0].message.content.trim();
        const match = content.match(/\[[\s\S]*\]/);
        if (!match) throw new Error('JSON 파싱 실패');

        const questions = JSON.parse(match[0]);
        if (!Array.isArray(questions) || questions.length !== 10) {
            throw new Error(`질문 개수 불일치: ${questions.length}개 (10개 필요)`);
        }
        res.json({ questions, mode: 'ai' });

    } catch (e) {
        console.error('[AI] 질문 생성 오류:', e.message);
        try {
            const supabase = await getSupabase();
            const { data: job } = await supabase.from('jobs').select('title').eq('id', job_id).maybeSingle();
            const { data: candidate } = await supabase.from('candidates').select('name').eq('id', candidate_id).maybeSingle();
            res.json({
                questions: mockQuestions(job?.title || 'N/A', candidate?.name || 'N/A'),
                mode: 'mock',
                message: `AI 오류로 Mock 질문으로 대체합니다: ${e.message}`
            });
        } catch (fallbackErr) {
            res.status(500).json({ error: e.message });
        }
    }
});

// analyzeAnswers: interviews.js에서 require로 사용
async function analyzeAnswers(candidate, job, questions, answers) {
    const apiKey = await getOpenAIKey();

    if (!apiKey) {
        return {
            overallScore: Math.floor(Math.random() * 20) + 72,
            summary: '면접이 완료되었습니다. OpenAI API Key 설정 후 상세 분석을 받을 수 있습니다.',
            strengths: ['성실한 답변 태도', '직무 관련 경험 보유'],
            improvements: ['더 구체적인 사례 제시 권장'],
            recommendation: 'Review',
            answerAnalysis: questions.map((q, i) => ({
                question: q,
                answer: answers[i]?.answer || '',
                score: Math.floor(Math.random() * 20) + 68,
                feedback: '답변이 접수되었습니다.'
            }))
        };
    }

    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey });

    const qaText = questions.map((q, i) =>
        `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i]?.answer || '(답변 없음)'}`
    ).join('\n\n');

    const prompt = `당신은 HR 전문가입니다. 아래 면접 내용을 분석·평가하세요.

직무: ${job.title}
지원자: ${candidate.name}

${qaText}

다음 JSON으로 결과를 반환하세요:
{
  "overallScore": 0~100,
  "summary": "전반적 평가 2~3문장",
  "strengths": ["강점1","강점2","강점3"],
  "improvements": ["개선점1","개선점2"],
  "recommendation": "Highly Recommended / Recommended / Review / Not Recommended",
  "answerAnalysis": [{"question":"","answer":"","score":0~100,"feedback":""}]
}`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000,
        });
        const content = completion.choices[0].message.content.trim();
        const m = content.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('파싱 실패');
        return JSON.parse(m[0]);
    } catch (e) {
        return {
            overallScore: 70,
            summary: `분석 중 오류: ${e.message}`,
            strengths: ['면접 완료'],
            improvements: ['재분석 필요'],
            recommendation: 'Review',
            answerAnalysis: []
        };
    }
}

module.exports = router;
module.exports.analyzeAnswers = analyzeAnswers;
