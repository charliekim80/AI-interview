import { useState, useEffect } from 'react';
import {
    BrainCircuit, Sparkles, ChevronDown, CheckCircle2, Loader2,
    ChevronRight, Copy, Check, Search, AlertCircle
} from 'lucide-react';
import api from '../api/client';

const steps = [
    { num: 1, label: 'Job 선택' },
    { num: 2, label: '지원자 선택' },
    { num: 3, label: 'AI 질문 생성' },
    { num: 4, label: '질문 확인·선택' },
    { num: 5, label: '링크 생성' },
];

export default function AISetupPanel() {
    const [jobs, setJobs] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [selectedJob, setSelectedJob] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [activeStep, setActiveStep] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [allQuestions, setAllQuestions] = useState([]);
    const [checkedIdx, setCheckedIdx] = useState(new Set());
    const [saving, setSaving] = useState(false);
    const [interviewLink, setInterviewLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [aiMode, setAiMode] = useState('');
    const [aiWarning, setAiWarning] = useState('');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        api.get('/api/jobs').then(r => setJobs(r.data)).catch(console.error);
        api.get('/api/candidates').then(r => setCandidates(r.data)).catch(console.error);
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleJobChange = (v) => {
        setSelectedJob(v);
        if (v) setActiveStep(Math.max(2, activeStep));
    };

    const handleCandidateChange = (v) => {
        setSelectedCandidate(v);
        if (v) setActiveStep(Math.max(3, activeStep));
    };

    const handleGenerate = async () => {
        if (!selectedJob || !selectedCandidate) {
            showToast('Job과 지원자를 모두 선택해주세요.', 'error'); return;
        }
        try {
            setGenerating(true);
            setAllQuestions([]);
            setCheckedIdx(new Set());
            setInterviewLink('');

            const res = await api.post('/api/ai/generate-questions', {
                job_id: parseInt(selectedJob),
                candidate_id: parseInt(selectedCandidate)
            });

            setAllQuestions(res.data.questions);
            setCheckedIdx(new Set(res.data.questions.map((_, i) => i))); // 전체 선택
            setAiMode(res.data.mode);
            setAiWarning(res.data.message || '');
            setActiveStep(4);
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setGenerating(false);
        }
    };

    const toggleCheck = (i) => {
        const s = new Set(checkedIdx);
        s.has(i) ? s.delete(i) : s.add(i);
        setCheckedIdx(s);
    };

    const handleCreateLink = async () => {
        const confirmed = allQuestions.filter((_, i) => checkedIdx.has(i));
        if (confirmed.length === 0) {
            showToast('최소 1개 이상의 질문을 선택하세요.', 'error'); return;
        }
        try {
            setSaving(true);
            const res = await api.post('/api/interviews', {
                candidate_id: parseInt(selectedCandidate),
                all_questions: allQuestions,
                confirmed_questions: confirmed
            });
            setInterviewLink(res.data.interview_link);
            setActiveStep(5);
            showToast('면접 링크가 생성되었습니다!');
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(interviewLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const selectedCandidateInfo = candidates.find(c => c.id === parseInt(selectedCandidate));
    const selectedJobInfo = jobs.find(j => j.id === parseInt(selectedJob));

    const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer";

    return (
        <div className="max-w-5xl">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">AI Interview Question Generator</h3>
                        <p className="text-sm text-slate-500">AI가 추천한 질문을 검토하고 면접 링크를 생성하세요</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-10 px-2">
                    {steps.map((step, i) => (
                        <div key={step.num} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all ${activeStep > step.num ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white' :
                                        activeStep === step.num ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200' :
                                            'bg-slate-100 text-slate-400'
                                    }`}>
                                    {activeStep > step.num ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                                </div>
                                <span className={`text-xs font-medium whitespace-nowrap ${activeStep >= step.num ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-3 mb-5 ${activeStep > step.num ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-10">
                    {/* Left: Controls */}
                    <div className="space-y-5">
                        {/* Step 1 */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs mr-2">1</span>
                                Job 선택
                            </label>
                            <div className="relative">
                                <select value={selectedJob} onChange={e => handleJobChange(e.target.value)} className={inputCls}>
                                    <option value="">포지션 선택...</option>
                                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.department})</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs mr-2">2</span>
                                지원자 선택
                            </label>
                            <div className="relative">
                                <select value={selectedCandidate} onChange={e => handleCandidateChange(e.target.value)} className={inputCls}>
                                    <option value="">지원자 선택...</option>
                                    {candidates.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} — {c.job_title || '직무 미지정'}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            {selectedCandidateInfo && (
                                <div className="mt-2 p-3 bg-purple-50 rounded-xl text-xs text-purple-700">
                                    <strong>{selectedCandidateInfo.name}</strong> · {selectedCandidateInfo.email}
                                </div>
                            )}
                        </div>

                        {/* Step 3 - Generate */}
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedJob || !selectedCandidate || generating}
                            className={`w-full py-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${selectedJob && selectedCandidate && !generating
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:-translate-y-0.5 shadow-sm shadow-purple-200'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {generating ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />AI 질문 생성 중...</>
                            ) : (
                                <><Sparkles className="w-4 h-4" />AI 질문 생성하기</>
                            )}
                        </button>

                        {aiWarning && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-xs text-amber-700 border border-amber-200">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                {aiWarning}
                            </div>
                        )}

                        {/* Step 5: Link */}
                        {interviewLink && (
                            <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl">
                                <p className="text-sm font-semibold text-emerald-700 mb-3">✅ 면접 링크 생성 완료!</p>
                                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs text-slate-600 break-all mb-3">
                                    {interviewLink}
                                </div>
                                <button onClick={handleCopy}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                                    {copied ? <><Check className="w-4 h-4" />복사됨!</> : <><Copy className="w-4 h-4" />링크 복사</>}
                                </button>
                                <p className="text-xs text-emerald-600 mt-2 text-center">이 링크를 지원자에게 전달하세요</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Questions */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-slate-700">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs mr-2">4</span>
                                질문 확인 및 선택
                                {allQuestions.length > 0 && (
                                    <span className="ml-2 text-xs font-medium text-slate-400">({checkedIdx.size}/{allQuestions.length} 선택)</span>
                                )}
                            </label>
                            {allQuestions.length > 0 && (
                                <div className="flex gap-2">
                                    <button onClick={() => setCheckedIdx(new Set(allQuestions.map((_, i) => i)))}
                                        className="text-xs text-blue-600 hover:underline">전체선택</button>
                                    <span className="text-slate-300">|</span>
                                    <button onClick={() => setCheckedIdx(new Set())}
                                        className="text-xs text-slate-400 hover:underline">전체해제</button>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 min-h-[400px]">
                            {allQuestions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-60 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mb-4">
                                        <BrainCircuit className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500">Step 1~2 완료 후<br />AI 질문 생성 버튼을 클릭하세요</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {aiMode === 'mock' && (
                                        <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                                            Mock 모드: Settings에서 OpenAI API Key를 입력하면 AI 맞춤 질문이 생성됩니다.
                                        </div>
                                    )}
                                    {allQuestions.map((q, i) => (
                                        <label key={i} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border-l-4 transition-all ${checkedIdx.has(i)
                                                ? 'bg-white border-blue-500 shadow-sm'
                                                : 'bg-slate-100 border-transparent opacity-60'
                                            }`}>
                                            <input type="checkbox" checked={checkedIdx.has(i)} onChange={() => toggleCheck(i)}
                                                className="mt-0.5 w-4 h-4 text-blue-500 rounded flex-shrink-0" />
                                            <div>
                                                <span className="text-xs font-bold text-blue-500 mr-1">Q{i + 1}.</span>
                                                <span className="text-sm text-slate-700 leading-relaxed">{q}</span>
                                            </div>
                                        </label>
                                    ))}

                                    <button
                                        onClick={handleCreateLink}
                                        disabled={checkedIdx.size === 0 || saving}
                                        className={`w-full mt-4 py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${checkedIdx.size > 0 && !saving
                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:-translate-y-0.5 shadow-sm'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />링크 생성 중...</> :
                                            <><CheckCircle2 className="w-4 h-4" />선택 질문으로 면접 링크 생성</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
