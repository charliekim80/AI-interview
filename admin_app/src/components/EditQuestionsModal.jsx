import { useState, useEffect } from 'react';
import { X, Edit3, Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import api from '../api/client';

// 대시보드에서 "초대됨(Invited)" 상태의 지원자에 한해 열리는 모달.
// 지원자가 아직 응시하지 않은(interviews.status === 'Pending') 면접의 confirmed_questions만 수정한다.
export default function EditQuestionsModal({ candidate, onClose, onSaved }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [locked, setLocked] = useState(false); // 서버 조회 결과 Pending이 아니면 true
    const [token, setToken] = useState(null);
    const [questions, setQuestions] = useState([]); // [{ text, use_followup }]
    const [editingIdx, setEditingIdx] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get(`/api/interviews/candidate/${candidate.id}`);
                if (cancelled) return;
                const data = res.data;
                setToken(data.token);
                const qs = (data.confirmed_questions || []).map(q =>
                    typeof q === 'string' ? { text: q, use_followup: false } : { text: q.text, use_followup: !!q.use_followup }
                );
                setQuestions(qs);
                if (data.status !== 'Pending') setLocked(true);
            } catch (e) {
                if (!cancelled) setLoadError(e.response?.data?.error || '질문을 불러오지 못했습니다.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [candidate.id]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const updateText = (idx, text) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, text } : q));
    };

    const toggleFollowup = (idx) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, use_followup: !q.use_followup } : q));
    };

    const removeQuestion = (idx) => {
        if (questions.length <= 1) {
            showToast('최소 1개의 질문은 남아 있어야 합니다.', 'error');
            return;
        }
        setQuestions(prev => prev.filter((_, i) => i !== idx));
        if (editingIdx === idx) setEditingIdx(null);
    };

    const handleSave = async () => {
        if (questions.some(q => !q.text.trim())) {
            showToast('빈 질문은 저장할 수 없습니다.', 'error');
            return;
        }
        try {
            setSaving(true);
            await api.put(`/api/interviews/${token}/questions`, { confirmed_questions: questions });
            showToast('질문이 수정되었습니다.');
            onSaved?.();
            setTimeout(() => onClose(), 600);
        } catch (e) {
            const msg = e.response?.data?.error || '저장에 실패했습니다.';
            showToast(msg, 'error');
            if (e.response?.status === 409) setLocked(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {toast && (
                <div className={`fixed top-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mt-8 mb-8 relative">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-blue-500" /> 면접 질문 수정
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">{candidate.name}님 — 아직 응시하지 않은 면접의 질문만 수정할 수 있습니다.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[65vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" /> 질문을 불러오는 중입니다...
                        </div>
                    ) : loadError ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                            <p className="text-sm text-slate-600">{loadError}</p>
                        </div>
                    ) : (
                        <>
                            {locked && (
                                <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl p-4">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>이미 지원자가 응시했거나 만료된 면접이라 더 이상 수정할 수 없습니다. 아래 내용은 참고용입니다.</span>
                                </div>
                            )}
                            <div className="space-y-3">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="rounded-xl border-2 border-slate-100 bg-slate-50/50">
                                        <div className="flex items-start gap-3 p-4">
                                            <span className="inline-flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <div className="flex-1">
                                                {editingIdx === idx ? (
                                                    <textarea
                                                        value={q.text}
                                                        onChange={e => updateText(idx, e.target.value)}
                                                        onBlur={() => setEditingIdx(null)}
                                                        autoFocus
                                                        rows={3}
                                                        disabled={locked}
                                                        className="w-full text-sm text-slate-800 bg-white border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-slate-800 leading-relaxed">{q.text}</p>
                                                )}
                                                <label className="flex items-center gap-2 cursor-pointer group mt-2 w-fit">
                                                    <div className="relative scale-75 origin-left">
                                                        <input type="checkbox" checked={q.use_followup} disabled={locked}
                                                            onChange={() => toggleFollowup(idx)}
                                                            className="sr-only peer" />
                                                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                                    </div>
                                                    <span className={`text-[11px] font-bold transition-colors ${q.use_followup ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                        심층 질문 {q.use_followup ? '활성화됨' : '비활성'}
                                                    </span>
                                                </label>
                                            </div>
                                            {!locked && (
                                                <div className="flex flex-col gap-1 flex-shrink-0">
                                                    <button onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="질문 수정">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => removeQuestion(idx)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="질문 삭제">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {!loading && !loadError && (
                    <div className="flex items-center justify-between p-6 border-t border-slate-100">
                        <p className="text-sm text-slate-500"><span className="font-bold text-blue-600">{questions.length}</span>개 질문</p>
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
                                닫기
                            </button>
                            {!locked && (
                                <button onClick={handleSave} disabled={saving}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    저장
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
