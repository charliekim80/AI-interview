import { useState, useEffect } from 'react';
import { FileSpreadsheet, ChevronDown, Award, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api/client';

export default function InterviewResultPanel({ initialCandidateId }) {
    const [jobs, setJobs] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [filteredCandidates, setFilteredCandidates] = useState([]);

    const [selectedJobId, setSelectedJobId] = useState('');
    const [selectedCandidateId, setSelectedCandidateId] = useState('');

    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [candidateInfo, setCandidateInfo] = useState(null);
    const [includeSalary, setIncludeSalary] = useState(true);

    const [toast, setToast] = useState(null);

    useEffect(() => {
        api.get('/api/jobs').then(r => setJobs(r.data)).catch(console.error);
        api.get('/api/candidates').then(r => {
            setCandidates(r.data);
            // 만약 Dashboard에서 ID를 넘겨받았다면 초기값 설정
            if (initialCandidateId) {
                setSelectedCandidateId(String(initialCandidateId));
            }
        }).catch(console.error);
    }, [initialCandidateId]);

    // 초기 ID가 있을 때 자동으로 결과 조회
    useEffect(() => {
        if (initialCandidateId && candidates.length > 0 && selectedCandidateId === String(initialCandidateId)) {
            handleViewResult();
        }
    }, [selectedCandidateId, candidates]);

    useEffect(() => {
        if (selectedJobId) {
            const filtered = candidates.filter(c => String(c.job_id) === String(selectedJobId) && c.interview_token);
            setFilteredCandidates(filtered);
            // 초기 로드 중에는 초기화하지 않음
            if (!initialCandidateId) setSelectedCandidateId('');
            setResultData(null);
        } else {
            const withToken = candidates.filter(c => c.interview_token);
            setFilteredCandidates(withToken);
        }
    }, [selectedJobId, candidates]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleViewResult = async () => {
        if (!selectedCandidateId) { showToast('지원자를 선택해주세요.', 'error'); return; }
        const candidate = filteredCandidates.find(c => String(c.id) === String(selectedCandidateId));
        if (!candidate?.interview_token) { showToast('면접 링크가 없는 지원자입니다.', 'error'); return; }

        try {
            setLoading(true);
            const res = await api.get(`/api/interviews/${candidate.interview_token}/result`);
            setResultData(res.data);
            setCandidateInfo(candidate);
        } catch (e) {
            showToast(e.message || '결과를 불러오지 못했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!resultData || !resultData.ai_analysis) return;
        const { overallScore, recommendation, summary, strengths = [], improvements = [], answerAnalysis = [] } = resultData.ai_analysis;

        // Q10(index 9) 항목 조건부 필터링
        const exportAnswers = includeSalary ? answerAnalysis : answerAnalysis.filter((_, i) => i !== 9);

        const infoData = [
            ['항목', '내용'],
            ['지원자 이름', candidateInfo.name],
            ['이메일', candidateInfo.email],
            ['지원 직무', candidateInfo.job_title],
            ['구분', candidateInfo.department || '—'],
            ['AI 종합 점수', overallScore],
            ['추천 결과', recommendation],
            ['종합 평가', summary],
            ['주요 강점', strengths.join('\n')],
            ['개선 및 참고사항', improvements.join('\n')]
        ];

        const qnaData = [['문항 번호', '질문 내용', '지원자 답변', 'AI 평가 (피드백)', '부분 점수']];
        exportAnswers.forEach((a, index) => {
            qnaData.push([`Q${index + 1}`, a.question, a.answer, a.feedback, a.score]);
        });

        const wb = XLSX.utils.book_new();
        const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
        const wsQnA = XLSX.utils.aoa_to_sheet(qnaData);
        
        // 시트 스타일링 (열 너비 조절)
        wsInfo['!cols'] = [{ wch: 20 }, { wch: 80 }];
        wsQnA['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 60 }, { wch: 60 }, { wch: 10 }];

        XLSX.utils.book_append_sheet(wb, wsInfo, "면접 종합 결과");
        XLSX.utils.book_append_sheet(wb, wsQnA, "질문별 상세 분석");
        XLSX.writeFile(wb, `${candidateInfo.name}_AI면접결과_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const selectCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-black appearance-none cursor-pointer pr-10";

    return (
        <div className="max-w-5xl space-y-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {toast.msg}
                </div>
            )}

            {/* ─── Selection Card ─── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">면접 결과 조회</h3>
                        <p className="text-sm text-slate-500">Job Title과 지원자를 선택하여 면접 결과를 확인하세요</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-5 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Job Title 필터</label>
                        <div className="relative">
                            <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className={selectCls}>
                                <option value="">전체 직무</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">지원자 선택 *</label>
                        <div className="relative">
                            <select value={selectedCandidateId} onChange={e => setSelectedCandidateId(e.target.value)} className={selectCls}>
                                <option value="">지원자 선택...</option>
                                {filteredCandidates.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.status === 'Completed' ? '완료' : '진행중'})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <button onClick={handleViewResult} disabled={loading || !selectedCandidateId}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                        결과 조회
                    </button>
                </div>
            </div>

            {/* ─── Result View ─── */}
            {resultData && (
                <>
                    {!resultData.ai_analysis ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                            <p className="text-slate-500">아직 AI 분석이 완료되지 않았습니다.</p>
                            <p className="text-sm text-slate-400 mt-2">면접이 제출된 직후 시스템이 자동으로 분석을 진행합니다. 잠시 후 다시 조회해주세요.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header Row */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{candidateInfo.name} — 면접 분석 결과</h2>
                                    <p className="text-sm text-slate-500 mt-1">{candidateInfo.department || '미분류'} · {candidateInfo.job_title}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors">
                                        <input type="checkbox" checked={includeSalary} onChange={e => setIncludeSalary(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                                        <span className="font-semibold text-slate-700">희망연봉 포함</span>
                                    </label>
                                    <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg">
                                        <FileSpreadsheet className="w-4 h-4" /> Excel 다운로드
                                    </button>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                                <div className="flex items-start gap-8">
                                    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 min-w-[200px]">
                                        <Award className="w-10 h-10 text-emerald-500 mb-2" />
                                        <p className="text-sm font-semibold text-emerald-700 mb-1">AI 종합 점수</p>
                                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                                            {resultData.ai_analysis.overallScore}
                                        </div>
                                        <div className="mt-4 px-4 py-1.5 bg-white rounded-full shadow-sm text-emerald-700 font-bold text-sm border border-emerald-100">
                                            {resultData.ai_analysis.recommendation}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-blue-500" /> 종합 평가
                                            </h4>
                                            <p className="text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                                {resultData.ai_analysis.summary}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                                                <p className="font-bold text-blue-800 mb-3">주요 강점</p>
                                                <ul className="space-y-2">
                                                    {(resultData.ai_analysis.strengths || []).map((s, i) => (
                                                        <li key={i} className="text-sm text-blue-700 flex items-start gap-2"><span className="text-blue-400">•</span>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
                                                <p className="font-bold text-amber-800 mb-3">개선 및 참고사항</p>
                                                <ul className="space-y-2">
                                                    {(resultData.ai_analysis.improvements || []).map((s, i) => (
                                                        <li key={i} className="text-sm text-amber-700 flex items-start gap-2"><span className="text-amber-400">•</span>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* QnA Grid */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-800">질문별 상세 분석</h3>
                                {(resultData.ai_analysis.answerAnalysis || []).map((a, i) => {
                                    if (!includeSalary && i === 9) return null;
                                    return (
                                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                            <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-start justify-between gap-4">
                                                <div>
                                                    <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg mb-2 shadow-sm">Question {i + 1}</span>
                                                    <p className="font-semibold text-slate-800 text-lg">{a.question}</p>
                                                </div>
                                                <div className="bg-white px-4 py-2 border border-emerald-100 rounded-xl shadow-sm text-center min-w-[80px]">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Score</p>
                                                    <p className="text-xl font-black text-emerald-600 leading-none">{a.score}</p>
                                                </div>
                                            </div>
                                            <div className="p-5 grid grid-cols-2 gap-5">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">지원자 답변</p>
                                                    <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">{a.answer || '답변 없음'}</div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">AI 피드백</p>
                                                    <div className="bg-emerald-50/50 p-4 rounded-xl text-emerald-800 text-sm leading-relaxed whitespace-pre-wrap border border-emerald-100">{a.feedback}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
