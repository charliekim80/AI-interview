import { useState, useEffect } from 'react';
import {
    Users, CheckCircle2, PlayCircle, Search,
    Plus, Copy, Check, Eye, Award, Trash2, Filter, FileText, ChevronDown, UserX, Clock, X
} from 'lucide-react';
import api from '../api/client';
import InterviewResult from './InterviewResult';

const statusConfig = {
    'Registered': { color: 'bg-slate-100 text-slate-600 border-slate-200', label: '등록됨' },
    'Invited': { color: 'bg-blue-100 text-blue-700 border-blue-200', label: '초대됨' },
    'In Progress': { color: 'bg-amber-100 text-amber-700 border-amber-200', label: '진행 중' },
    'Completed': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: '완료' },
};

export default function Dashboard({ onNavigate }) {
    const [candidates, setCandidates] = useState([]);
    const [stats, setStats] = useState({});
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterJob, setFilterJob] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [copiedId, setCopiedId] = useState(null);
    const [toast, setToast] = useState(null);

    // Result Modal state
    const [modalCandidate, setModalCandidate] = useState(null);
    const [modalResultData, setModalResultData] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const [uniqueCategories, setUniqueCategories] = useState([]);
    const [uniqueJobs, setUniqueJobs] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cRes, sRes, aRes] = await Promise.all([
                api.get('/api/candidates'),
                api.get('/api/stats'),
                api.get('/api/stats/activities')
            ]);

            const data = cRes.data;
            setCandidates(data);
            setStats(sRes.data);
            setActivities(aRes.data);

            // Extract unique categories and jobs for filters
            const cats = [...new Set(data.map(c => c.department).filter(Boolean))];
            const jobs = [...new Set(data.map(c => c.job_title).filter(Boolean))];

            setUniqueCategories(cats);
            setUniqueJobs(jobs);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async (candidate) => {
        if (!candidate.interview_token) {
            alert('면접 링크가 없습니다.');
            return;
        }
        // 현재 접속 도메인(window.location.origin)을 기준으로 링크 생성 (localhost 방지)
        const baseUrl = window.location.origin.includes('localhost') ? 'https://ai-interview-ivn0.onrender.com' : window.location.origin;
        const link = `${baseUrl}/interview?token=${candidate.interview_token}`;
        await navigator.clipboard.writeText(link);
        setCopiedId(candidate.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleExpireLink = async (candidate) => {
        if (!candidate.interview_token) return;
        if (!window.confirm(`${candidate.name}님의 면접 링크를 즉시 만료시키겠습니까?\n만료 후에는 지원자가 접속할 수 없으며 상태가 초기화됩니다.`)) return;

        try {
            await api.post(`/api/interviews/${candidate.interview_token}/expire`);
            showToast('면접 링크가 만료되었습니다.');
            fetchData();
        } catch (e) {
            showToast('만료 처리 실패: ' + e.message, 'error');
        }
    };

    const handleViewResult = async (candidate) => {
        // 모달로 결과 열기
        try {
            setModalLoading(true);
            setModalCandidate(candidate);
            setModalResultData(null);
            const res = await api.get(`/api/interviews/${candidate.interview_token}/result`);
            setModalResultData(res.data);
        } catch (e) {
            showToast('결과 조회 실패: ' + e.message, 'error');
            setModalCandidate(null);
        } finally {
            setModalLoading(false);
        }
    };

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') { setModalCandidate(null); setModalResultData(null); } };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const handleResetInterview = async (candidate) => {
        if (!candidate.interview_token) {
            alert('면접 링크가 없습니다. Candidates 페이지에서 AI 질문을 생성해주세요.');
            return;
        }
        if (!window.confirm(`"${candidate.name}" 지원자의 면접 결과를 초기화하고 재면접 상태로 변경하시겠습니까?\n기존 답변과 AI 분석 결과가 삭제됩니다.`)) return;

        try {
            await api.post(`/api/interviews/${candidate.interview_token}/reset`);
            showToast(`${candidate.name} 지원자의 면접이 초기화되었습니다.`);
            fetchData();
        } catch (e) {
            showToast('초기화 실패: ' + e.message, 'error');
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDeleteCandidate = async (candidate) => {
        if (!window.confirm(`"${candidate.name}" 지원자를 완전히 삭제하시겠습니까?\n이력서와 면접 데이터가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`)) return;
        try {
            await api.delete(`/api/candidates/${candidate.id}`);
            showToast(`${candidate.name} 지원자가 삭제되었습니다.`);
            fetchData();
        } catch (e) {
            showToast('삭제 실패: ' + e.message, 'error');
        }
    };

    const handleDownloadResume = async (candidate) => {
        if (!candidate.resume_path) {
            alert('등록된 이력서 파일이 없습니다.');
            return;
        }
        try {
            const res = await api.get(`/api/candidates/${candidate.id}/resume`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;

            let filename = candidate.resume_path;
            try {
                const parsed = JSON.parse(filename);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    filename = parsed[0];
                } else if (typeof parsed === 'string') {
                    filename = parsed;
                }
            } catch (err) {}

            const extMatch = filename.match(/\.([^.]+)$/);
            const ext = extMatch ? extMatch[1] : 'pdf';

            link.setAttribute('download', `${candidate.name}_이력서.${ext}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            alert('이력서 다운로드에 실패했습니다. (지원하지 않거나 파일 누락)');
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        try {
            // 타임존 정보(Z 또는 +09:00 등)가 없고, 공백이 포함된 SQL 스타일 날짜인 경우 T와 Z를 보정
            let normalized = dateString;
            if (typeof normalized === 'string' && !normalized.includes('Z') && !normalized.includes('+')) {
                // '2026-03-21 01:00:00' -> '2026-03-21T01:00:00Z'
                normalized = normalized.replace(' ', 'T') + 'Z';
            }
            
            const d = new Date(normalized);
            
            const formatForTz = (tz, label) => {
                const dateParts = new Intl.DateTimeFormat('ko-KR', {
                    year: '2-digit', month: '2-digit', day: '2-digit', timeZone: tz
                }).format(d).replace(/\. /g, '.').replace(/\.$/, '');
                const timeParts = new Intl.DateTimeFormat('ko-KR', {
                    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz
                }).format(d);
                return `${dateParts} ${timeParts} (${label})`;
            };

            return (
                <div className="flex flex-col space-y-0.5">
                    <span className="block">{formatForTz('Asia/Seoul', 'KST')}</span>
                    <span className="block text-[11px] text-slate-400">{formatForTz('America/Los_Angeles', 'PST')}</span>
                </div>
            );
        } catch (e) {
            return dateString;
        }
    };

    // Apply Filters
    const filtered = candidates.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory ? c.department === filterCategory : true;
        const matchJob = filterJob ? c.job_title === filterJob : true;
        const matchStatus = filterStatus ? c.status === filterStatus : true;

        return matchSearch && matchCat && matchJob && matchStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterCategory, filterJob, filterStatus, itemsPerPage]);

    const statCards = [
        { label: '전체 지원자', value: stats.totalCandidates ?? 0, borderColor: 'border-l-indigo-500' },
        { label: '면접 완료', value: stats.completed ?? 0, borderColor: 'border-l-emerald-500' },
        { label: '진행 중', value: stats.inProgress ?? 0, borderColor: 'border-l-amber-500' },
        { label: '평균 AI Score', value: stats.avgAiScore ? `${stats.avgAiScore}` : '-', borderColor: 'border-l-blue-500' },
    ];


    return (
        <div className="space-y-6 w-full">
            {/* Result Modal */}
            {modalCandidate && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
                    onClick={(e) => { if (e.target === e.currentTarget) { setModalCandidate(null); setModalResultData(null); } }}
                >
                    <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl mt-8 mb-8 relative">
                        <button
                            onClick={() => { setModalCandidate(null); setModalResultData(null); }}
                            className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6 overflow-y-auto max-h-[90vh]">
                            {modalLoading ? (
                                <div className="flex items-center justify-center py-24 text-slate-400">결과를 불러오는 중입니다...</div>
                            ) : (
                                <InterviewResult
                                    candidate={modalCandidate}
                                    resultData={modalResultData}
                                    onBack={() => { setModalCandidate(null); setModalResultData(null); }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6">
                {statCards.map((s, i) => {
                    return (
                        <div key={i} className={`bg-white rounded-xl p-6 shadow-sm border border-slate-100 border-l-[6px] ${s.borderColor} flex items-center justify-between transition-transform hover:scale-[1.02]`}>
                            <div>
                                <span className="text-[13px] font-bold text-slate-400 uppercase tracking-tight">{s.label}</span>
                                <p className="text-3xl font-black text-slate-800 mt-1">{loading ? '—' : s.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Update List Board */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h3 className="text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> The Latest Updates
                </h3>
                <div className="max-h-40 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-4 text-slate-400 text-sm">
                            {loading ? '활동 내역을 불러오는 중입니다...' : '최근 업데이트 이력이 없습니다.'}
                        </div>
                    ) : (
                        activities.map(act => (
                            <div key={act.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                                <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${act.type === 'created' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                                <div className="flex-1 flex items-center min-w-0 gap-2">
                                    <p className={`text-[12px] font-semibold truncate ${act.type === 'created' ? 'text-blue-700' : 'text-emerald-700'}`}>
                                        {act.message}
                                    </p>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">
                                        {formatDateTime(act.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>


            {/* Main Table Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header & Controls */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" /> 지원자 목록
                            </h3>
                            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="새로고침">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                            </button>
                        </div>
                        <button
                            onClick={() => onNavigate('candidates')}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:-translate-y-0.5 transition-all shadow-sm shadow-blue-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            지원자 등록 및 질문 생성
                        </button>
                    </div>

                    {/* Separated Search and Filters area */}
                    <div className="mt-6 space-y-3">
                        {/* Search Bar */}
                        <div className="relative bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="이름 또는 이메일로 검색하세요..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-transparent text-sm focus:outline-none placeholder-slate-400"
                            />
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap gap-2">
                            <div className="relative min-w-[120px]">
                                <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))} className="w-full h-10 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 appearance-none cursor-pointer">
                                    <option value="10">10개씩 보기</option>
                                    <option value="20">20개씩 보기</option>
                                    <option value="50">50개씩 보기</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="flex items-center px-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider h-10">
                                <Filter className="w-3.5 h-3.5 mr-2" /> Filters
                            </div>
                            
                            <div className="relative min-w-[160px]">
                                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full h-10 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 appearance-none cursor-pointer">
                                    <option value="">모든 구분</option>
                                    {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="relative min-w-[180px]">
                                <select value={filterJob} onChange={e => setFilterJob(e.target.value)} className="w-full h-10 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 appearance-none cursor-pointer">
                                    <option value="">모든 직무</option>
                                    {uniqueJobs.map(j => <option key={j} value={j}>{j}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="relative min-w-[140px]">
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full h-10 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 appearance-none cursor-pointer">
                                    <option value="">모든 상태</option>
                                    <option value="Invited">초대됨</option>
                                    <option value="In Progress">진행 중</option>
                                    <option value="Completed">완료</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[600px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-200">
                                {['등록일자', '구분', '이름 및 연락처', '지원 직무', '상태', 'AI Score', '면접 링크', '액션'].map((h, i) => {
                                    let widthClass = '';
                                    if (i === 0) widthClass = 'w-28 min-w-[112px]';          // 등록일자
                                    if (i === 1) widthClass = 'min-w-[120px]';               // 구분
                                    if (i === 2) widthClass = 'min-w-[160px]';               // 이름/연락처
                                    if (i === 3) widthClass = 'min-w-[160px]';               // 지원 직무
                                    if (i === 4) widthClass = 'w-24 min-w-[96px]';           // 상태
                                    if (i === 5) widthClass = 'w-24 min-w-[96px]';           // AI Score
                                    if (i === 6) widthClass = 'min-w-[150px]';               // 링크
                                    // i===7 액션: 자동 확장

                                    return (
                                        <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider break-keep whitespace-nowrap text-center ${widthClass}`}>{h}</th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white relative">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-20 text-slate-400">데이터를 불러오는 중입니다...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-20 text-slate-400 bg-slate-50/50">조건에 맞는 지원자가 없습니다.</td></tr>
                            ) : paginated.map(c => {
                                const sc = statusConfig[c.status] || statusConfig['Registered'];
                                return (
                                    <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 text-sm tracking-tight font-medium text-slate-500 whitespace-nowrap">
                                            {formatDateTime(c.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700 break-keep">
                                            {c.department || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 flex-shrink-0">
                                                    {c.name[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="font-bold text-slate-800 text-sm truncate block">{c.name}</span>
                                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 min-w-[200px] w-[200px] max-w-[200px]">
                                            <span className="text-[13px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 bg-opacity-80 rounded-lg inline-block">
                                                {c.job_title || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${sc.color}`}>
                                                {sc.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {c.ai_score ? (
                                                <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-3 py-1.5 rounded-xl w-fit">
                                                    <Award className="w-4 h-4 text-emerald-600" />
                                                    <span className="text-emerald-700 font-black text-sm">{c.ai_score}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-sm font-medium">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap min-w-[160px]">
                                            {c.interview_token ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleCopyLink(c)}
                                                        className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-3 py-2 rounded-lg transition-colors border border-blue-100 hover:border-blue-600 flex-1"
                                                    >
                                                        {copiedId === c.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        <span>{copiedId === c.id ? '복사 완료!' : '링크 복사'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleExpireLink(c)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                        title="링크 만료"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => onNavigate('candidates', c)}
                                                    className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-500 px-3 py-2 rounded-lg transition-colors border border-amber-100 hover:border-amber-500"
                                                >
                                                    <Plus className="w-4 h-4" /> 질문 생성
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3 min-w-[220px]">
                                                {/* 결과 뷰어 or 진행중 상태 텍스트 */}
                                                <div className="flex-1">
                                                    {c.status === 'Completed' ? (
                                                        <button
                                                            onClick={() => handleViewResult(c)}
                                                            className="flex items-center justify-center gap-1.5 w-full text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-100 px-3 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> 결과 뷰어
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                                                            진행중
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 고정 액션 버튼 그룹: 우측 정렬 유지 */}
                                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button
                                                        onClick={() => handleDownloadResume(c)}
                                                        className={`p-2 rounded-lg transition-colors border ${c.resume_path ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-100' : 'text-slate-100 cursor-not-allowed border-transparent'}`}
                                                        title={c.resume_path ? "이력서 다운로드" : "이력서 없음"}
                                                        disabled={!c.resume_path}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleResetInterview(c)}
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100"
                                                        title="면접 결과 초기화 (재시작)"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteCandidate(c)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                        title="지원자 완전 삭제"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && filtered.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-400">
                            Total <span className="text-slate-600">{filtered.length}</span> candidates
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentPage === 1 ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-slate-600 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600'}`}
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1 px-4 text-xs font-black text-slate-700">
                                <span>{currentPage}</span>
                                <span className="text-slate-300 font-medium">/</span>
                                <span className="text-slate-400 font-medium">{totalPages}</span>
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentPage === totalPages ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-slate-600 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
