import { useState, useEffect, useRef } from 'react';
import { Users, Upload, ChevronDown, Linkedin, StickyNote, X, FileText, Bot, Loader2, CheckCircle2, Link2, Copy, Check, Edit3 } from 'lucide-react';
import api from '../api/client';

export default function CandidatesPanel() {
    const [jobs, setJobs] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', phone: '', job_id: '', department: '', linkedin: '', notes: '' });
    const [resumeFiles, setResumeFiles] = useState([]); // 다중 파일 배열
    const [saving, setSaving] = useState(false); // 지원자 등록 중
    const [loadingAI, setLoadingAI] = useState(false); // AI 질문 생성 중
    const [loadingLink, setLoadingLink] = useState(false); // 링크 생성 중
    const [loadingStage, setLoadingStage] = useState('');
    const [toast, setToast] = useState(null);

    // Step 2: Generated questions state
    const [generatedQuestions, setGeneratedQuestions] = useState(null); // null = step1, array = step2
    const [selectedQuestions, setSelectedQuestions] = useState([]);   // 체크된 질문 번호
    const [editingIdx, setEditingIdx] = useState(null);               // 인라인 편집 중 인덱스
    const [createdCandidateId, setCreatedCandidateId] = useState(null);
    const [interviewLink, setInterviewLink] = useState(null); // 최종 생성 링크
    const [copied, setCopied] = useState(false);
    const fileRef = useRef();

    useEffect(() => {
        api.get('/api/jobs').then(r => {
            setJobs(r.data);
            if (r.data.length > 0) {
                setForm(f => ({ ...f, job_id: r.data[0].id }));
            }
        }).catch(console.error);

        // Settings에서 구분(departments) 목록 불러오기
        api.get('/api/settings/departments').then(r => {
            if (r.data.exists && r.data.value) {
                try {
                    const parsed = JSON.parse(r.data.value);
                    setDepartments(Array.isArray(parsed) ? parsed : []);
                } catch { setDepartments([]); }
            }
        }).catch(console.error);
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // 새 파일들을 포함했을 때의 전체 상태 계산
        const newFiles = [...resumeFiles];
        let totalSize = newFiles.reduce((acc, f) => acc + f.size, 0);
        let errorMsg = '';

        for (const file of files) {
            if (newFiles.length >= 3) {
                errorMsg = '이력서는 최대 3개까지만 첨부할 수 있습니다.';
                break;
            }
            const ext = file.name.split('.').pop().toLowerCase();
            if (!['pdf', 'doc', 'docx'].includes(ext)) {
                errorMsg = 'PDF, DOC, DOCX 파일만 가능합니다.';
                continue;
            }
            if (totalSize + file.size > 10 * 1024 * 1024) {
                errorMsg = '전체 파일 크기의 합은 10MB 이하여야 합니다.';
                break;
            }
            newFiles.push(file);
            totalSize += file.size;
        }

        if (errorMsg) showToast(errorMsg, 'error');
        setResumeFiles(newFiles);
        // input 초기화 (같은 파일을 다시 올릴 수 있도록)
        e.target.value = '';
    };

    const removeFile = (index) => {
        setResumeFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileChange({ target: { files } });
    };

    // ===== STEP 1: 지원자 등록 + AI 질문 생성 =====
    const handleGenerateQuestions = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.job_id) {
            showToast('이름, 이메일, 지원 직무는 필수입니다.', 'error'); return;
        }

        let candidateId = null;
        try {
            setSaving(true);
            setLoadingStage('지원자 정보 및 이력서 등록 중...');

            // Step 1: 지원자 등록
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
            resumeFiles.forEach(file => fd.append('resumes', file));

            const resCandidate = await api.post('/api/candidates', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            candidateId = resCandidate.data.id;
            setCreatedCandidateId(candidateId);

            // Step 2: AI 질문 생성
            setLoadingStage('이력서 및 직무를 분석하여 AI 질문 생성 중 (최대 30초)...');
            setLoadingAI(true);

            const resAI = await api.post('/api/ai/generate-questions', {
                job_id: form.job_id,
                candidate_id: candidateId
            });

            if (!resAI.data.questions || resAI.data.questions.length === 0) {
                throw new Error('생성된 AI 질문이 없습니다.');
            }

            // 생성 완료 → 기본값으로 모든 질문 선택 해제 (인사담당자가 직접 선택하도록 변경)
            setGeneratedQuestions(resAI.data.questions);
            setSelectedQuestions([]); 

        } catch (e) {
            console.error(e);
            showToast(e.message || '처리 중 오류가 발생했습니다.', 'error');

            // 롤백: 지원자 삭제
            if (candidateId) {
                try {
                    setLoadingStage('오류 발생: 등록된 정보 초기화 중...');
                    await api.delete(`/api/candidates/${candidateId}`);
                    setCreatedCandidateId(null);
                } catch (rollbackError) { console.error('롤백 실패:', rollbackError); }
            }
        } finally {
            setSaving(false);
            setLoadingAI(false);
            setLoadingStage('');
        }
    };

    // ===== STEP 2: 선택한 질문으로 면접 링크 생성 =====
    const handleCreateLink = async () => {
        if (!createdCandidateId) { showToast('오류: 지원자 정보가 없습니다.', 'error'); return; }
        if (selectedQuestions.length === 0) { showToast('면접에 포함할 질문을 1개 이상 선택해주세요.', 'error'); return; }

        try {
            setLoadingLink(true);
            setLoadingStage('면접 초대 링크 생성 중...');

            const confirmedQs = selectedQuestions.sort((a, b) => a - b).map(i => generatedQuestions[i]);

            const resLink = await api.post('/api/interviews', {
                candidate_id: createdCandidateId,
                all_questions: generatedQuestions,
                confirmed_questions: confirmedQs
            });

            setInterviewLink(resLink.data.interview_link);

        } catch (e) {
            showToast(e.message || '링크 생성 실패', 'error');
        } finally {
            setLoadingLink(false);
            setLoadingStage('');
        }
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(interviewLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setForm({ name: '', email: '', phone: '', job_id: jobs[0]?.id || '', department: '', linkedin: '', notes: '' });
        setResumeFiles([]);
        setGeneratedQuestions(null);
        setSelectedQuestions([]);
        setCreatedCandidateId(null);
        setInterviewLink(null);
        setEditingIdx(null);
    };

    const toggleQuestion = (idx) => {
        setSelectedQuestions(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const toggleAllQuestions = () => {
        if (selectedQuestions.length === generatedQuestions.length) {
            setSelectedQuestions([]);
        } else {
            setSelectedQuestions(generatedQuestions.map((_, i) => i));
        }
    };

    const updateQuestionText = (idx, newText) => {
        setGeneratedQuestions(prev => prev.map((q, i) => i === idx ? newText : q));
    };

    const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-black";

    const isTransacting = saving || loadingAI || loadingLink;

    return (
        <div className="max-w-4xl relative">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {toast.msg}
                </div>
            )}

            {/* 전체 화면 로딩 스피너 */}
            {isTransacting && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4 text-center">
                        <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                        <h3 className="text-lg font-bold text-slate-800">처리 중입니다</h3>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">{loadingStage}</p>
                        <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg">창을 새로고침하거나 닫지 마세요.</p>
                    </div>
                </div>
            )}

            {/* ─── STEP 1: 지원자 정보 입력 ─── */}
            {!generatedQuestions && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">지원자 등록</h3>
                            <p className="text-sm text-slate-500">정보와 이력서를 입력한 후, AI 질문 생성 버튼을 클릭하세요</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {/* 구분 + 지원 직무 */}
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">구분 (Category)</label>
                                <div className="relative">
                                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                                        className={`${inputCls} appearance-none cursor-pointer`}>
                                        <option value="">구분 선택 (선택사항)</option>
                                        {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">지원 직무 *</label>
                                <div className="relative">
                                    <select value={form.job_id} onChange={e => setForm({ ...form, job_id: e.target.value })}
                                        className={`${inputCls} appearance-none cursor-pointer`}>
                                        <option value="" disabled>직무 선택...</option>
                                        {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* 이름 + 이메일 */}
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">이름 *</label>
                                <input type="text" placeholder="홍길동" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">이메일 *</label>
                                <input type="email" placeholder="candidate@email.com" value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">전화번호</label>
                                <input type="tel" placeholder="010-1234-5678 (선택)" value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
                            </div>
                        </div>

                        {/* Resume Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">이력서 업로드 <span className="text-slate-400 font-normal">(최대 3개, 합계 10MB 이내)</span></label>
                            
                            {/* 파일 선택 영역: 3개 미만일 때만 활성화 시각화 */}
                            {resumeFiles.length < 3 ? (
                                <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                                    onClick={() => fileRef.current.click()}
                                    className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-blue-50/30 bg-white mb-4">
                                    <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                                        <Upload className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">파일을 드래그하거나 <span className="text-blue-500">클릭</span>하여 업로드</p>
                                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX 지원</p>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center bg-slate-50 mb-4 opacity-60">
                                    <p className="text-sm font-medium text-slate-500">최대 3개의 이력서가 모두 첨부되었습니다.</p>
                                </div>
                            )}

                            {/* 첨부된 파일 목록 */}
                            {resumeFiles.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {resumeFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                                                    <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFile(idx)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex justify-end pr-1">
                                        <p className="text-[11px] font-medium text-slate-400">
                                            전체 용량: <span className={resumeFiles.reduce((acc, f) => acc + f.size, 0) > 9 * 1024 * 1024 ? 'text-red-500' : ''}>
                                                {(resumeFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB
                                            </span> / 10 MB
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Optional */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                                <StickyNote className="w-4 h-4" /> 선택 정보
                            </h4>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2"><Linkedin className="w-4 h-4 inline mr-1" />LinkedIn</label>
                                    <input type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin}
                                        onChange={e => setForm({ ...form, linkedin: e.target.value })} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">메모</label>
                                    <input type="text" placeholder="내부 메모..." value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button onClick={handleGenerateQuestions} disabled={isTransacting}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                                {isTransacting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                                AI 질문 생성
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── STEP 2: 질문 선택 및 편집 ─── */}
            {generatedQuestions && !interviewLink && (
                <div className="space-y-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Bot className="w-6 h-6 text-blue-500" /> AI 생성 질문 목록
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">면접에 반영할 질문을 선택하고 필요시 내용을 수정하세요.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={toggleAllQuestions}
                                    className={`text-sm font-bold px-4 py-2 rounded-xl transition-all border ${
                                        selectedQuestions.length === generatedQuestions.length
                                        ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                        : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                                    }`}
                                >
                                    {selectedQuestions.length === generatedQuestions.length ? '전체 해제' : '전체 선택'}
                                </button>
                                <button onClick={handleReset} className="text-sm text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-4 py-2 rounded-xl transition-colors">
                                    처음부터 다시
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {generatedQuestions.map((q, idx) => (
                                <div key={idx} className={`rounded-xl border-2 transition-all ${selectedQuestions.includes(idx) ? 'border-blue-400 bg-blue-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                    <div className="flex items-start gap-4 p-4">
                                        <div className="flex items-center pt-1">
                                            <input type="checkbox"
                                                checked={selectedQuestions.includes(idx)}
                                                onChange={() => toggleQuestion(idx)}
                                                className="w-4 h-4 rounded text-blue-600 cursor-pointer" />
                                        </div>
                                        <div className="flex-1">
                                            <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-md mb-2 ${idx === 0 ? 'bg-blue-100 text-blue-700' : idx === 1 ? 'bg-indigo-100 text-indigo-700' : idx <= 4 ? 'bg-purple-100 text-purple-700' : idx <= 7 ? 'bg-violet-100 text-violet-700' : idx === 8 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                Q{idx + 1} {
                                                    idx === 0 ? '자기소개' : 
                                                    idx === 1 ? '경력검증' : 
                                                    idx === 2 ? '난관극복' : 
                                                    idx === 3 ? '팀워크' : 
                                                    idx === 4 ? '적응/AI' : 
                                                    idx === 5 ? '기술/성과' : 
                                                    idx === 6 ? '판단력' : 
                                                    idx === 7 ? '이직/합류' : 
                                                    idx === 8 ? '대면면접' : '처우기대'
                                                }
                                            </span>
                                            {editingIdx === idx ? (
                                                <textarea
                                                    value={q}
                                                    onChange={e => updateQuestionText(idx, e.target.value)}
                                                    onBlur={() => setEditingIdx(null)}
                                                    autoFocus
                                                    rows={3}
                                                    className="w-full text-sm text-slate-800 bg-white border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                                />
                                            ) : (
                                                <p className="text-sm text-slate-800 leading-relaxed">{q}</p>
                                            )}
                                        </div>
                                        <button onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                                            title="질문 수정">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                <span className="font-bold text-blue-600">{selectedQuestions.length}</span> / {generatedQuestions.length}개 선택됨
                            </p>
                            <button onClick={handleCreateLink} disabled={loadingLink || selectedQuestions.length === 0}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50">
                                {loadingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                                면접 초대링크 생성
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── STEP 3: 링크 생성 완료 ─── */}
            {interviewLink && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">면접 초대 링크 생성 완료!</h3>
                        <p className="text-emerald-50 opacity-90 text-sm">선택하신 질문({selectedQuestions.length}개)이 포함된 면접 링크가 발급됩니다.</p>
                    </div>
                    <div className="p-8 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">면접 전용 링크</label>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1">
                                <input type="text" readOnly value={interviewLink} className="flex-1 bg-transparent px-3 text-sm text-slate-600 outline-none" />
                                <button onClick={handleCopyLink} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    {copied ? '복사됨!' : '복사'}
                                </button>
                            </div>
                        </div>
                        <button onClick={handleReset} className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors mt-4">
                            새 지원자 등록하기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
