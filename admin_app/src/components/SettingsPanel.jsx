import { useState, useEffect } from 'react';
import { KeyRound, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Info, Building2, Plus, X } from 'lucide-react';
import api from '../api/client';

export default function SettingsPanel() {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [hasKey, setHasKey] = useState(false);
    const [saving, setSaving] = useState(false);

    // Infra states
    const [infraKeys, setInfraKeys] = useState({ supabase_url: '', supabase_key: '', github_token: '', render_api_key: '' });
    const [hasInfra, setHasInfra] = useState({ supabase_url: false, supabase_key: false, github_token: false, render_api_key: false });
    const [showInfra, setShowInfra] = useState({ supabase_url: false, supabase_key: false, github_token: false, render_api_key: false });
    const [savingInfra, setSavingInfra] = useState(false);

    // Departments state
    const [departments, setDepartments] = useState([]);
    const [newDept, setNewDept] = useState('');
    const [savingDept, setSavingDept] = useState(false);

    const [toast, setToast] = useState(null);

    useEffect(() => {
        api.get('/api/settings/openai_api_key')
            .then(r => {
                if (r.data.exists) {
                    setHasKey(true);
                    setApiKey(r.data.value); // 마스킹된 값
                }
            })
            .catch(console.error);

        ['supabase_url', 'supabase_key', 'github_token', 'render_api_key'].forEach(k => {
            api.get(`/api/settings/${k}`).then(r => {
                if (r.data.exists) {
                    setHasInfra(prev => ({ ...prev, [k]: true }));
                    setInfraKeys(prev => ({ ...prev, [k]: r.data.value }));
                }
            }).catch(console.error);
        });

        api.get('/api/settings/departments')
            .then(r => {
                if (r.data.exists && r.data.value) {
                    setDepartments(JSON.parse(r.data.value));
                } else {
                    // Default departments
                    setDepartments(['Engineering', 'Product', 'Design', 'Data Science', 'Marketing', 'Sales', 'HR']);
                }
            })
            .catch(console.error);
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleSave = async () => {
        if (!apiKey.trim() || apiKey.includes('•')) {
            showToast('유효한 API Key를 입력해주세요.', 'error'); return;
        }
        if (!apiKey.startsWith('sk-')) {
            showToast('OpenAI API Key는 "sk-"로 시작해야 합니다.', 'error'); return;
        }
        try {
            setSaving(true);
            await api.post('/api/settings', { key: 'openai_api_key', value: apiKey.trim() });
            setHasKey(true);
            showToast('API Key가 저장되었습니다! AI 질문 생성이 활성화됩니다.');
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleClear = async () => {
        if (!window.confirm('API Key를 삭제하시겠습니까? 삭제 후에는 Mock 모드로 동작합니다.')) return;
        try {
            await api.post('/api/settings', { key: 'openai_api_key', value: '' });
            setApiKey('');
            setHasKey(false);
            showToast('API Key가 삭제되었습니다.');
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    const handleSaveInfra = async (key) => {
        const val = infraKeys[key].trim();
        if (!val || val.includes('•')) { showToast('유효한 값을 입력해주세요.', 'error'); return; }
        try {
            setSavingInfra(true);
            await api.post('/api/settings', { key, value: val });
            setHasInfra(prev => ({ ...prev, [key]: true }));
            showToast('설정이 저장되었습니다.');
        } catch (e) { showToast(e.message, 'error'); }
        finally { setSavingInfra(false); }
    };

    const handleClearInfra = async (key) => {
        if (!window.confirm('이 설정을 삭제하시겠습니까? 관련 기능(DB/배포)이 작동하지 않을 수 있습니다.')) return;
        try {
            await api.post('/api/settings', { key, value: '' });
            setInfraKeys(prev => ({ ...prev, [key]: '' }));
            setHasInfra(prev => ({ ...prev, [key]: false }));
            showToast('설정이 삭제되었습니다.');
        } catch (e) { showToast(e.message, 'error'); }
    };

    const handleAddDept = async () => {
        if (!newDept.trim()) return;
        if (departments.includes(newDept.trim())) {
            showToast('이미 존재하는 부서입니다.', 'error');
            return;
        }
        const updated = [...departments, newDept.trim()];
        try {
            setSavingDept(true);
            await api.post('/api/settings', { key: 'departments', value: JSON.stringify(updated) });
            setDepartments(updated);
            setNewDept('');
            showToast('부서가 추가되었습니다.');
        } catch (e) { showToast(e.message, 'error'); }
        finally { setSavingDept(false); }
    };

    const handleRemoveDept = async (dept) => {
        if (!window.confirm(`"${dept}" 부서를 삭제하시겠습니까?`)) return;
        const updated = departments.filter(d => d !== dept);
        try {
            setSavingDept(true);
            await api.post('/api/settings', { key: 'departments', value: JSON.stringify(updated) });
            setDepartments(updated);
            showToast('부서가 삭제되었습니다.');
        } catch (e) { showToast(e.message, 'error'); }
        finally { setSavingDept(false); }
    };

    return (
        <div className="max-w-2xl space-y-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {toast.msg}
                </div>
            )}

            {/* API Settings Box */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-black">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <KeyRound className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">API Settings</h3>
                        <p className="text-sm text-slate-500">AI 서비스 연동 설정</p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${hasKey ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                    {hasKey ? (
                        <><CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-700">OpenAI API 연결됨</p>
                                <p className="text-xs text-emerald-600">AI 질문 생성 및 답변 분석이 활성화되어 있습니다.</p>
                            </div></>
                    ) : (
                        <><AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-amber-700">OpenAI API Key 미설정</p>
                                <p className="text-xs text-amber-600">현재 Mock 모드로 동작 중입니다. Key 입력 시 AI 기능이 활성화됩니다.</p>
                            </div></>
                    )}
                </div>

                {/* API Key Input */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            OpenAI API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                placeholder="sk-proj-..."
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                            />
                            <button onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">
                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
                                className="text-blue-500 hover:underline">platform.openai.com</a>에서 발급받은 API Key를 입력하세요.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleSave} disabled={saving}
                            className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50">
                            <Save className="w-4 h-4" />
                            {saving ? '저장 중...' : 'API Key 저장'}
                        </button>
                        {hasKey && (
                            <button onClick={handleClear}
                                className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
                                초기화
                            </button>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="mt-8 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                            <p className="font-semibold mb-2">Mock 모드 vs AI 모드</p>
                            <ul className="space-y-1 text-xs text-blue-600">
                                <li>• <strong>Mock 모드</strong>: API Key 없이 기본 질문 템플릿 사용</li>
                                <li>• <strong>AI 모드</strong>: Job Description + 지원자 정보 기반 맞춤형 질문 생성</li>
                                <li>• <strong>답변 분석</strong>: AI 모드에서만 정확한 면접 점수·평가 분석 제공</li>
                                <li>• 사용 모델: <strong>gpt-4o-mini</strong> (비용 효율이 높음)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deployment & Infrastructure Box */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-black">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <Save className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Deployment & Infrastructure</h3>
                        <p className="text-sm text-slate-500">배포 서버 및 외부 데이터베이스(Supabase 등) 연동 설정</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {[
                        { id: 'supabase_url', label: 'Supabase URL', placeholder: 'https://xxx.supabase.co', desc: 'PostgreSQL DB 접속 도메인', secret: false },
                        { id: 'supabase_key', label: 'Supabase API Key', placeholder: 'eyJ...', desc: 'DB 인증용 (anon 또는 service_role)', secret: true },
                        { id: 'github_token', label: 'GitHub Token', placeholder: 'ghp_...', desc: 'Render.com 연동 및 소스코드 관리용', secret: true },
                        { id: 'render_api_key', label: 'Render.com API Key', placeholder: 'rnd_...', desc: '무중단 배포 확인 및 트리거용', secret: true },
                    ].map(item => (
                        <div key={item.id} className="pt-4 border-t border-slate-100 first:pt-0 first:border-0">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">{item.label}</label>
                            <p className="text-xs text-slate-500 mb-3">{item.desc}</p>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type={item.secret && !showInfra[item.id] ? 'password' : 'text'}
                                        placeholder={item.placeholder}
                                        value={infraKeys[item.id]}
                                        onChange={e => setInfraKeys(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                    />
                                    {item.secret && (
                                        <button onClick={() => setShowInfra(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showInfra[item.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => handleSaveInfra(item.id)} disabled={savingInfra}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                                    저장
                                </button>
                                {hasInfra[item.id] && (
                                    <button onClick={() => handleClearInfra(item.id)}
                                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition">
                                        삭제
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Department Settings Box */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-black">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Category Settings (분류)</h3>
                        <p className="text-sm text-slate-500">Job Title에 사용할 분류(구분) 목록 관리</p>
                    </div>
                </div>

                <div className="flex gap-3 mb-6">
                    <input
                        type="text"
                        value={newDept}
                        onChange={e => setNewDept(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddDept()}
                        placeholder="새로운 분류명 입력 (예: 26년 Cloud 1차)..."
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-slate-50 bg-white"
                        disabled={savingDept}
                    />
                    <button
                        onClick={handleAddDept}
                        disabled={savingDept || !newDept.trim()}
                        className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                        추가
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {departments.map(dept => (
                        <div key={dept} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm border border-slate-200">
                            <span>{dept}</span>
                            <button
                                onClick={() => handleRemoveDept(dept)}
                                disabled={savingDept}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    {departments.length === 0 && (
                        <p className="text-sm text-slate-400">등록된 분류가 없습니다. 새 분류를 추가해주세요.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
