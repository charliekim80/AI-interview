import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, Settings, BrainCircuit, ClipboardList, LogOut, ChevronLeft, ChevronRight, Menu, X, BarChart2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import JobsPanel from './components/JobsPanel';
import CandidatesPanel from './components/CandidatesPanel';
import SettingsPanel from './components/SettingsPanel';
import InterviewResultPanel from './components/InterviewResultPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import Login from './components/Login';
import './App.css';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Job Position', icon: FileText },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'interview-result', label: 'Interview Result', icon: ClipboardList },
];

const sectionLabels = {
  dashboard: 'Dashboard',
  jobs: 'Job Position',
  candidates: 'Candidates',
  'interview-result': 'Interview Result',
  analytics: 'Analytics',
  settings: 'Settings',
};

const sectionDescriptions = {
  dashboard: '전체 지원자 현황 및 면접 결과/링크를 관리하세요',
  jobs: '채용 포지션을 등록하고 관리하세요',
  candidates: '지원자를 등록하고 AI 면접 질문을 생성하세요',
  'interview-result': 'Job Position과 지원자를 선택하여 면접 결과를 조회하고 Excel로 내보낼 수 있습니다',
  analytics: '지원자들의 설문 피드백 결과와 종합 통계를 확인하세요',
  settings: 'OpenAI API Key 및 알림 설정',
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [active, setActive] = useState('dashboard');
  const [activeCandidateId, setActiveCandidateId] = useState(null);
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (Date.now() - parsed.at < 24 * 60 * 60 * 1000) {
          setIsLoggedIn(true);
          setUser({ name: parsed.name, email: parsed.email });
        } else {
          localStorage.removeItem('admin_session');
        }
      } catch (e) {
        localStorage.removeItem('admin_session');
      }
    }
  }, []);

  const handleLoginSuccess = () => {
    const session = JSON.parse(localStorage.getItem('admin_session'));
    setIsLoggedIn(true);
    setUser({ name: session.name, email: session.email });
    setActive('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleNavigate = (page, data = null) => {
    setActive(page);
    setIsMobileMenuOpen(false); // 페이지 이동 시 모바일 메뉴 닫기
    if (page === 'interview-result' && data) {
      setActiveCandidateId(data);
    } else if (page === 'candidates' && data) {
      window.candidatesInitialData = data;
    }
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    switch (active) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'jobs': return <JobsPanel />;
      case 'candidates': return <CandidatesPanel />;
      case 'interview-result': return <InterviewResultPanel initialCandidateId={activeCandidateId} />;
      case 'analytics': return <AnalyticsPanel />;
      case 'settings': return <SettingsPanel />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  const sidebarVisibleWidth = isSidebarOpen ? 'w-64' : 'w-20';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      
      {/* Mobile Header */}
      <div className="no-print lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}TecAceAI.png`} alt="TecAce Logo" className="h-8 w-8 object-contain" />
          <span className="font-bold text-sm tracking-tight">TecAce AI</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${sidebarVisibleWidth} flex flex-col fixed h-full z-40 transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        
        {/* Toggle Button (Desktop only) */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-blue-600 text-white rounded-full items-center justify-center shadow-lg hover:bg-blue-500 transition-colors z-50"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className={`p-6 border-b border-slate-700/50 overflow-hidden ${!isSidebarOpen && 'lg:px-4'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center flex-shrink-0 transition-all ${!isSidebarOpen && 'lg:scale-75'}`}>
              <img src={`${import.meta.env.BASE_URL}TecAceAI.png`} alt="TecAce Logo" className="h-[46px] w-[46px] object-contain" />
            </div>
            {isSidebarOpen && (
              <div className="whitespace-nowrap">
                <h1 className="text-xl font-bold text-white tracking-tight">TecAce</h1>
                <p className="text-xs text-slate-400">AI Interview Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
          <div className={`px-4 mb-2 ${!isSidebarOpen && 'lg:text-center'}`}>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isSidebarOpen ? 'Menu' : '••'}
            </span>
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => { setActive(item.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all ${isActive
                  ? 'text-blue-400 border-l-4 border-blue-400 bg-gradient-to-r from-blue-500/20 to-transparent'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-l-4 border-transparent'
                  } ${!isSidebarOpen && 'lg:px-0 lg:justify-center'}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Settings + User */}
        <div className="border-t border-slate-700/50">
          <button onClick={() => { setActive('analytics'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all ${active === 'analytics'
              ? 'text-blue-400 bg-slate-800/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              } ${!isSidebarOpen && 'lg:px-0 lg:justify-center'}`}>
            <BarChart2 className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Analytics</span>}
          </button>
          <button onClick={() => { setActive('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-4 border-t border-slate-800/50 transition-all ${active === 'settings'
              ? 'text-blue-400 bg-slate-800/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              } ${!isSidebarOpen && 'lg:px-0 lg:justify-center'}`}>
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Settings</span>}
          </button>
          <div className="p-4 border-t border-slate-800/50">
            <div className={`bg-slate-800/50 rounded-xl flex items-center justify-between group px-4 py-3 ${!isSidebarOpen && 'lg:px-2 lg:py-2 lg:justify-center'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user?.name?.substring(0, 2) || 'AD'}
                </div>
                {isSidebarOpen && (
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.name || 'HR Admin'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email || 'hr@tecace.com'}</p>
                  </div>
                )}
              </div>
              {isSidebarOpen && (
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="로그아웃">
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Header (Desktop) */}
        <header className="hidden lg:block bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">{sectionLabels[active]}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{sectionDescriptions[active]}</p>
        </header>

        <main className="p-4 lg:p-8 min-h-screen">
          <div className="no-print lg:hidden mb-6">
            <h2 className="text-xl font-bold text-slate-800">{sectionLabels[active]}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{sectionDescriptions[active]}</p>
          </div>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
