import { useState, useEffect } from 'react';
import {
    Users, CheckCircle2, PlayCircle, Search,
    Plus, Copy, Check, Eye, Award, Trash2, Filter, FileText, ChevronDown, UserX, Clock
} from 'lucide-react';
import api from '../api/client';

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

    const [uniqueCategories, setUniqueCategories] = useState([]);
    const [uniqueJobs, setUniqueJobs] = useState([]);

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

    const handleViewResult = (candidate) => {
        // App.jsx의 신규 네비게이션 로직 사용
        onNavigate('interview-result', candidate.id);
    };

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
        const d = new Date(dateString);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // Apply Filters
    const filtered = candidates.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory ? c.department === filterCategory : true;
        const matchJob = filterJob ? c.job_title === filterJob : true;
        const matchStatus = filterStatus ? c.status === filterStatus : true;

        return matchSearch && matchCat && matchJob && matchStatus;
    });

    const statCards = [
        { label: '전체 지원자', value: stats.totalCandidates ?? 0, icon: Users, color: 'indigo' },
        { label: '면접 완료', value: stats.completed ?? 0, icon: CheckCircle2, color: 'emerald' },
        { label: '진행 중', value: stats.inProgress ?? 0, icon: PlayCircle, color: 'amber' },
        { label: '평균 AI Score', value: stats.avgAiScore ? `${stats.avgAiScore}` : '-', icon: Award, color: 'blue' },
    ];


    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-6">
                {statCards.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
                                <p className="text-3xl font-black text-slate-800 mt-2">{loading ? '—' : s.value}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl bg-${s.color}-500/10 flex items-center justify-center border border-${s.color}-500/20`}>
                                <Icon className={`w-7 h-7 text-${s.color}-500 fill-${s.color}-500/20`} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Update List Board */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" /> Update List Board
                </h3>
                <div className="max-h-64 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                            {loading ? '활동 내역을 불러오는 중입니다...' : '최근 업데이트 이력이 없습니다.'}
                        </div>
                    ) : (
                        activities.map(act => (
                            <div key={act.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                                <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full shadow-sm ${act.type === 'created' ? 'bg-blue-500 shadow-blue-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`}></span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[13px] font-semibold truncate ${act.type === 'created' ? 'text-blue-700' : 'text-emerald-700'}`}>
                                        {act.message}
                                    </p>
                                </div>
                                <div className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap bg-white px-2 py-1 rounded-md border border-slate-200">
                                    {formatDateTime(act.timestamp)}
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

                    {/* Filters Row */}
                    <div className="mt-6 flex flex-wrap gap-3 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center pl-3 text-slate-400">
                            <Filter className="w-4 h-4" />
                        </div>
                        <div className="relative flex-1 min-w-[200px] border-r border-slate-100 pr-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="이름 또는 이메일 검색..." value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-transparent text-sm focus:outline-none placeholder-slate-400" />
                        </div>

                        <div className="relative min-w-[140px] px-2 border-r border-slate-100">
                            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full bg-transparent text-sm text-slate-700 font-medium focus:outline-none appearance-none cursor-pointer pr-6">
                                <option value="">모든 구분</option>
                                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="relative min-w-[160px] px-2 border-r border-slate-100">
                            <select value={filterJob} onChange={e => setFilterJob(e.target.value)} className="w-full bg-transparent text-sm text-slate-700 font-medium focus:outline-none appearance-none cursor-pointer pr-6">
                                <option value="">모든 직무</option>
                                {uniqueJobs.map(j => <option key={j} value={j}>{j}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="relative min-w-[130px] px-2">
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-transparent text-sm text-slate-700 font-medium focus:outline-none appearance-none cursor-pointer pr-6">
                                <option value="">모든 상태</option>
                                <option value="Invited">초대됨</option>
                                <option value="In Progress">진행 중</option>
                                <option value="Completed">완료</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-200">
                                {['등록일자', '구분', '이름 및 연락처', '지원 직무', '상태', 'AI Score', '면접 링크', '액션'].map(h => (
                                    <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider break-keep whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white relative">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-20 text-slate-400">데이터를 불러오는 중입니다...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-20 text-slate-400 bg-slate-50/50">조건에 맞는 지원자가 없습니다.</td></tr>
                            ) : filtered.map(c => {
                                const sc = statusConfig[c.status] || statusConfig['Registered'];
                                return (
                                    <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 text-sm tracking-tight font-medium text-slate-500 whitespace-nowrap">
                                            {formatDateTime(c.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700 break-keep">
                                            {c.department || '—'}
                                        </td>
                                        <td className="px-6 py-4 min-w-[200px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-200 flex-shrink-0">
                                                    {c.name[0]}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-800 text-[15px]">{c.name}</span>
                                                    <p className="text-[13px] text-slate-500 leading-tight mt-0.5">{c.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 min-w-[100px]">
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
                                        <td className="px-6 py-4 whitespace-nowrap min-w-[140px]">
                                            {c.interview_token ? (
                                                <button
                                                    onClick={() => handleCopyLink(c)}
                                                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-3 py-2 rounded-lg transition-colors border border-blue-100 hover:border-blue-600"
                                                >
                                                    {copiedId === c.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    {copiedId === c.id ? '복사 완료!' : '링크 복사'}
                                                </button>
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
                                            <div className="flex items-center justify-end gap-3 min-w-[240px]">
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
            </div>
        </div>
    );
}
