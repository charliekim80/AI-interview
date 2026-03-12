import { useState } from 'react';
import { LayoutDashboard, FileText, Users, Settings, BrainCircuit, ClipboardList } from 'lucide-react';
import Dashboard from './components/Dashboard';
import JobsPanel from './components/JobsPanel';
import CandidatesPanel from './components/CandidatesPanel';
import SettingsPanel from './components/SettingsPanel';
import InterviewResultPanel from './components/InterviewResultPanel';
import './App.css';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Job Title', icon: FileText },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'interview-result', label: 'Interview Result', icon: ClipboardList },
];

const sectionLabels = {
  dashboard: 'Dashboard',
  jobs: 'Job Title',
  candidates: 'Candidates',
  'interview-result': 'Interview Result',
  settings: 'Settings',
};

const sectionDescriptions = {
  dashboard: '전체 지원자 현황 및 면접 결과/링크를 관리하세요',
  jobs: '채용 포지션을 등록하고 관리하세요',
  candidates: '지원자를 등록하고 AI 면접 질문을 생성하세요',
  'interview-result': 'Job Title과 지원자를 선택하여 면접 결과를 조회하고 Excel로 내보낼 수 있습니다',
  settings: 'OpenAI API Key 및 분류/부서 설정',
};

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [activeCandidateId, setActiveCandidateId] = useState(null);

  const handleNavigate = (page, data = null) => {
    setActive(page);
    if (page === 'interview-result' && data) {
      setActiveCandidateId(data);
    } else if (page !== 'interview-result') {
      // 결과 페이지가 아닌 곳으로 갈 때는 초기화하거나 유지 (필요에 따라)
    }
  };

  const renderContent = () => {
    switch (active) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'jobs': return <JobsPanel />;
      case 'candidates': return <CandidatesPanel />;
      case 'interview-result': return <InterviewResultPanel initialCandidateId={activeCandidateId} />;
      case 'settings': return <SettingsPanel />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col fixed h-full" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <img src="/TecAceAI.png" alt="TecAce Logo" className="h-[46px] w-[46px] object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">TecAce</h1>
              <p className="text-xs text-slate-400">AI Interview Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6">
          <div className="px-4 mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Menu</span>
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all ${isActive
                  ? 'text-blue-400 border-l-4 border-blue-400 bg-gradient-to-r from-blue-500/20 to-transparent'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-l-4 border-transparent'
                  }`}>
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom: Settings + User */}
        <div className="border-t border-slate-700/50">
          <button onClick={() => setActive('settings')}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all ${active === 'settings'
              ? 'text-blue-400 bg-slate-800/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}>
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
          </button>
          <div className="p-4">
            <div className="bg-slate-800/50 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                HR
              </div>
              <div>
                <p className="text-sm font-medium text-white">HR Admin</p>
                <p className="text-xs text-slate-400">hr@tecace.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">{sectionLabels[active]}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{sectionDescriptions[active]}</p>
        </header>

        <main className="p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
