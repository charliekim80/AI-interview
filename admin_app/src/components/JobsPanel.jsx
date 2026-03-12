import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, ChevronDown, CheckCircle2, Building2, MapPin, Briefcase, ChevronUp } from 'lucide-react';
import api from '../api/client';

export default function JobsPanel() {
    const [jobs, setJobs] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedJobId, setExpandedJobId] = useState(null);
    const [form, setForm] = useState({
        title: '', department: '', location: '',
        employment_type: 'Full Time', description: '', required_skills: '', preferred_skills: ''
    });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    useEffect(() => {
        fetchJobs();
        fetchDepartments();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/jobs');
            setJobs(res.data);
        } catch (e) { showToast(e.message, 'error'); }
        finally { setLoading(false); }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/api/settings/departments');
            if (res.data.exists && res.data.value) {
                const depts = JSON.parse(res.data.value);
                setDepartments(depts);
                if (depts.length > 0 && !form.department) {
                    setForm(f => ({ ...f, department: depts[0] }));
                }
            } else {
                const defaultDepts = ['Engineering', 'Product', 'Design', 'Data Science', 'Marketing', 'Sales', 'HR'];
                setDepartments(defaultDepts);
                if (!form.department) setForm(f => ({ ...f, department: defaultDepts[0] }));
            }
        } catch (e) {
            console.error(e);
        }
    }

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(''), 3000);
    };

    const handleSave = async () => {
        if (!form.title.trim()) { showToast('Job Title은 필수입니다.', 'error'); return; }
        try {
            setSaving(true);
            await api.post('/api/jobs', form);
            setForm({ title: '', department: departments[0] || 'Engineering', location: '', employment_type: 'Full Time', description: '', required_skills: '', preferred_skills: '' });
            await fetchJobs();
            showToast('Job이 등록되었습니다!');
        } catch (e) { showToast(e.message, 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (e, id, title) => {
        e.stopPropagation();
        if (!window.confirm(`"${title}"을 삭제하시겠습니까?`)) return;
        try {
            await api.delete(`/api/jobs/${id}`);
            if (expandedJobId === id) setExpandedJobId(null);
            await fetchJobs();
            showToast('Job이 삭제되었습니다.');
        } catch (e) { showToast(e.message, 'error'); }
    };

    const toggleExpand = (id) => {
        setExpandedJobId(prev => prev === id ? null : id);
    };

    const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black bg-white";

    return (
        <div className="max-w-5xl space-y-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Create Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-black">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">새 Job 등록</h3>
                        <p className="text-sm text-slate-500">채용 포지션 정보를 입력하세요</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Job Title *</label>
                            <input type="text" placeholder="예: Senior Backend Developer" value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">구분</label>
                            <div className="relative">
                                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                                    className={`${inputCls} appearance-none cursor-pointer pr-10`}>
                                    {departments.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-1" />근무지
                            </label>
                            <input type="text" placeholder="예: 서울, 대한민국 (Remote 가능)" value={form.location}
                                onChange={e => setForm({ ...form, location: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Briefcase className="w-4 h-4 inline mr-1" />고용 형태
                            </label>
                            <div className="flex gap-4 mt-1">
                                {['Full Time', 'Contract', 'Internship'].map(t => (
                                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="emp" value={t} checked={form.employment_type === t}
                                            onChange={() => setForm({ ...form, employment_type: t })} className="text-blue-500" />
                                        <span className="text-sm text-slate-700">{t}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Job Description (직무 설명, 필수/우대 스킬 등 모두 포함)</label>
                        <textarea rows={8} placeholder="직무 설명, 주요 책임, 기대 역할, 필요 스킬을 한 번에 입력하세요..." value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputCls} resize-none`} />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button onClick={handleSave} disabled={saving}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50">
                            <CheckCircle2 className="w-4 h-4" />
                            {saving ? '저장 중...' : 'Job 저장'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Job List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-black">
                <h3 className="font-bold text-slate-800 mb-4">등록된 Job 목록 ({jobs.length})</h3>
                {loading ? (
                    <p className="text-slate-400 text-center py-8">로딩 중...</p>
                ) : jobs.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">등록된 Job이 없습니다.</p>
                ) : (
                    <div className="space-y-3">
                        {jobs.map(job => {
                            const isExpanded = expandedJobId === job.id;
                            
                            return (
                                <div key={job.id} 
                                     onClick={() => toggleExpand(job.id)}
                                     className="bg-slate-50 rounded-xl overflow-hidden hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{job.title}</p>
                                                <p className="text-xs text-slate-500">{job.department} · {job.location || '위치 미지정'} · {job.employment_type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => handleDelete(e, job.id, job.title)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="삭제">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="p-2 text-slate-400">
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Drill-down 컨텐츠 */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 pt-2 border-t border-slate-200 bg-white ml-14 mr-4 mt-1 rounded-xl shadow-sm mb-4 cursor-default" onClick={e => e.stopPropagation()}>
                                            <h4 className="text-sm font-bold text-slate-700 mt-3 mb-2">Job Description</h4>
                                            <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                {job.description || '작성된 직무 설명이 없습니다.'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
