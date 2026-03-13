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
            const data = await pdfParse(dataBuffer, { max: 10 }); // 최대 10페이지까지 확장
            let text = data.text.trim();
            // 불필요한 공백 및 제어문자 정제
            text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ''); 
            text = text.replace(/\s+/g, ' ').slice(0, 20000); 
            console.log(`[AI] PDF 파싱 완료: ${text.length}자`);
            return text;
        } else if (ext === '.docx' || ext === '.doc') {
            const result = await mammoth.extractRawText({ path: fp });
            let text = result.value.trim().slice(0, 20000);
            console.log(`[AI] DOCX 파싱 완료: ${text.length}자`);
            return text;
        } else {
            console.warn(`[AI] 지원하지 않는 확장자: ${ext}`);
        }
    } catch (e) {
        console.error('[AI] 이력서 파싱 실패, Fallback 진행:', e.message);
    }
    
    // 최종적으로 텍스트가 너무 짧으면 로그만 남기고 빈 값 반환 (LLM이 나중에 '이력서 없음' 문구로 처리하도록)
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

        const systemPrompt = `당신은 15년 경력의 베테랑 전문 채용 HR 컨설턴트입니다.
아래 규칙을 반드시 준수하여 면접 질문 정확히 10개를 생성하세요:

[핵심 미션]
- 지원자의 [이력서]에 기재된 구체적인 프로젝트 경험, 기술 스택, 성과를 [Job Description(JD)]의 요구사항 및 우대사항과 정교하게 매칭하여 질문을 구성하세요.
- JD에 명시된 핵심 역량(Core Competency)이 실제로 지원자에게 있는지 검증하는 것이 가장 큰 목적입니다.

[질문 스타일 규칙 - 매우 중요]
- 모든 질문은 2~3문장 이내로 작성하세요.
- 질문 내에 "성격", "리더십" 같은 추상적 단어를 직접 사용하지 말고 구체적인 행동 사례(STAR 기법 유도)를 이끌어내세요.
- 지원자의 이력서 내용이 부족한 경우, 해당 JD 직무를 수행하기 위해 반드시 필요한 실무 시나리오 기반 질문으로 보완하세요.
- 출력 형식은 반드시 JSON 배열만 반환하세요.

[10개 질문 구조 - 필수 준수]
Q1: 반드시 "TecAce AI면접에 참여해주셔서 감사합니다. 먼저 간단하게 자기소개 부탁드립니다."로 시작하세요.
Q2: 지원한 [직무명]과 관련된 이력서 상의 특정 프로젝트나 경력을 언급하며, 그 안에서의 역할과 기여도를 확인하는 질문.
Q3: 이력서에 명시된 기술적 난관 혹은 JD 상의 예상되는 문제 상황을 어떻게 해결했는지 구체적으로 묻는 질문.
Q4: JD의 협업/조직문화 항목과 연계하여, 팀 내 의견 충돌 시 논리적으로 설득하거나 중재했던 구체적 사례를 묻는 질문.
Q5: JD의 핵심 기술 스택 트렌드와 연계하여, 새로운 기술을 습득했던 경험과 현재 AI 툴을 실무에 어떻게 활용하고 있는지 묻는 질문.
Q6: JD의 주요 업무(Responsibilities) 항목을 수행하기 위한 지원자만의 차별화된 실무 강점이나 성과를 이력서 기반으로 묻는 질문.
Q7: 업무가 몰리거나 우선순위가 충돌하는 긴박한 상황에서 어떤 논리적 기준으로 판단하고 행동하는지 확인하는 질문.
Q8: 반드시 포함: "이직을 고려하게 되신 주된 이유가 무엇이며, 최종 합격하신다면 예상하시는 합류 가능 시점이 언제이신지 말씀해주세요."
Q9: 반드시 포함: "금일 면접 이후 강남 사무실에서 대면 면접이 진행될 경우, 방문 가능하신 날짜를 알려주실 수 있을까요?"
Q10: 반드시 포함: "당사 입사 시 기대하시는 처우(연봉) 및 현재 연봉수준을 말씀해 주시면 감사하겠습니다."

출력 형식: 반드시 JSON 배열만 반환. ["Q1내용", ..., "Q10내용"]
- 정확히 10개 요소 포함
- 각 질문은 실제 면접관이 옆에서 묻는 듯한 정중하고 자연스러운 대화체로 작성`;

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

// POST /api/ai/follow-up
router.post('/follow-up', async (req, res) => {
    const { question, answer, job_id, candidate_id } = req.body;
    if (!question || !answer) return res.status(400).json({ error: '데이터가 부족합니다.' });

    try {
        const apiKey = await getOpenAIKey();
        if (!apiKey) return res.json({ followUp: null }); // API 키 없으면 스킵

        const supabase = await getSupabase();
        const { data: job } = await supabase.from('jobs').select('title, description').eq('id', job_id).maybeSingle();

        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey });

        const systemPrompt = `당신은 심층 면접 전문가입니다.
지원자의 답변을 바탕으로, 해당 답변의 진위여부를 확인하거나 구체적인 기술적/상황적 근거를 묻는 '꼬리 질문'을 딱 1개만 생성하세요.

[규칙]
- 질문은 1~2문장으로 짧고 명확하게 하세요.
- "방금 말씀하신 내용 중 ~부분에 대해 더 자세히 설명해주시겠습니까?" 같은 형식을 취하세요.
- 답변이 너무 모호하거나 짧다면 구체적인 사례를 요청하세요.
- 만약 이미 충분히 구체적이라면 "null"을 반환하여 꼬리 질문을 생략하세요.
- 출력 형식: 반드시 JSON 형태 {"followUp": "질문내용" 또는 null}`;

        const userPrompt = `[메인 질문]: ${question}
[지원자 답변]: ${answer}
[지원 직무]: ${job?.title || 'N/A'}

위 답변에 대해 심층 질문이 필요하다면 생성하고, 필요 없다면 null을 반환하세요.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 500,
        });

        const content = completion.choices[0].message.content.trim();
        const m = content.match(/\{[\s\S]*\}/);
        if (!m) return res.json({ followUp: null });
        
        const result = JSON.parse(m[0]);
        res.json(result);

    } catch (e) {
        console.error('[AI] 꼬리질문 생성 오류:', e.message);
        res.json({ followUp: null });
    }
});

module.exports = router;
module.exports.analyzeAnswers = analyzeAnswers;
