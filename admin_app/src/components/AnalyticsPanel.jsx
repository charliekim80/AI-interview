import { useState, useEffect } from 'react';
import { BarChart2, Star, MessageSquare, Loader2, Calendar, Trash2 } from 'lucide-react';
import api from '../api/client';

export default function AnalyticsPanel() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/surveys');
            setSurveys(res.data);
            setError('');
        } catch (e) {
            console.error(e);
            setError('설문 데이터를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSurvey = async (id, name) => {
        if (!window.confirm(`"${name}" 지원자의 설문 피드백을 삭제하시겠습니까?`)) return;
        try {
            await api.delete(`/api/surveys/${id}`);
            fetchSurveys();
        } catch (e) {
            console.error(e);
            alert('설문 삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                <p>데이터를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
                <p>{error}</p>
                <button onClick={fetchSurveys} className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors">다시 시도</button>
            </div>
        );
    }

    // ── 통계 계산 ──
    const totalSurveys = surveys.length;
    const avgRating = totalSurveys > 0
        ? (surveys.reduce((sum, s) => sum + s.rating, 0) / totalSurveys).toFixed(1)
        : '0.0';

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    surveys.forEach(s => {
        if (distribution[s.rating] !== undefined) distribution[s.rating]++;
    });

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                ))}
            </div>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <div className="max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header & Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 평균 평점 카드 */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-sm border border-indigo-400 p-6 text-white flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                            <Star className="w-5 h-5 fill-white text-white" />
                        </div>
                        <h3 className="text-indigo-100 font-medium tracking-wide">Average Rating</h3>
                    </div>
                    <div className="mt-4 flex items-end gap-3">
                        <span className="text-5xl font-black">{avgRating}</span>
                        <span className="text-indigo-200 text-lg mb-1">/ 5.0</span>
                    </div>
                    <p className="mt-3 text-indigo-100 text-sm">총 {totalSurveys}명이 설문에 참여했습니다.</p>
                </div>

                {/* 분포 차트 카드 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:col-span-2">
                    <h3 className="text-slate-700 font-bold mb-5 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-indigo-500" /> 점수 분포 (Rating Distribution)
                    </h3>
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map(stars => {
                            const count = distribution[stars];
                            const percentage = totalSurveys > 0 ? (count / totalSurveys) * 100 : 0;
                            return (
                                <div key={stars} className="flex items-center gap-4 text-sm">
                                    <div className="w-12 text-slate-500 font-medium text-right">{stars} Stars</div>
                                    <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${stars >= 4 ? 'bg-emerald-400' : stars === 3 ? 'bg-amber-400' : 'bg-red-400'}`} 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-8 text-right font-bold text-slate-700">{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-500" /> 상세 피드백 내역
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">지원자들이 남긴 평점과 코멘트를 확인하세요.</p>
                    </div>
                </div>

                {surveys.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>아직 제출된 설문 결과가 없습니다.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-[180px]">지원자 (직무)</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-[120px]">평점</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">코멘트 (Comment)</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-[160px] text-right">응답 일시</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-[80px] text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {surveys.map((survey) => (
                                    <tr key={survey.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6 align-top">
                                            <div className="font-bold text-slate-800">{survey.candidate_name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{survey.job_title}</div>
                                        </td>
                                        <td className="py-4 px-6 align-top">
                                            <div className="flex flex-col gap-1">
                                                {renderStars(survey.rating)}
                                                <span className="text-xs font-bold text-slate-500">{survey.rating}.0</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 align-top">
                                            {survey.comment ? (
                                                <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">{survey.comment}</p>
                                            ) : (
                                                <span className="text-sm text-slate-300 italic">코멘트 없음</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 align-top text-right">
                                            <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(survey.created_at)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 align-top text-center">
                                            <button 
                                                onClick={() => handleDeleteSurvey(survey.id, survey.candidate_name)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="설문 삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
        </div>
    );
}
