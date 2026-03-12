import React, { useState } from 'react';
import { 
  LayoutDashboard, FileText, Users, BrainCircuit, Bell, ChevronDown, 
  Download, Search, Plus, Upload, Sparkles, CheckCircle2, Clock, 
  PlayCircle, Eye, Award, Send, X, FileUp, Linkedin, StickyNote,
  Building2, MapPin, Briefcase, ListChecks, Star, Loader2, ChevronRight
} from 'lucide-react';

// Dummy Data
const jobTitles = ['All Positions', 'Backend Developer', 'Product Manager', 'Data Analyst', 'AI Engineer'];

const candidates = [
  { id: 1, name: 'Kim Minjun', email: 'minjun.kim@email.com', jobTitle: 'Backend Developer', status: 'Completed', aiScore: 92, appliedDate: '2025-02-28', hasResume: true },
  { id: 2, name: 'Park Soyeon', email: 'soyeon.park@email.com', jobTitle: 'Product Manager', status: 'On Process', aiScore: 88, appliedDate: '2025-02-27', hasResume: true },
  { id: 3, name: 'Lee Jihoon', email: 'jihoon.lee@email.com', jobTitle: 'Data Analyst', status: 'On Process', aiScore: null, appliedDate: '2025-02-26', hasResume: true },
  { id: 4, name: 'Choi Yuna', email: 'yuna.choi@email.com', jobTitle: 'AI Engineer', status: 'Invited', aiScore: null, appliedDate: '2025-02-25', hasResume: true },
  { id: 5, name: 'Jung Taehyung', email: 'taehyung.jung@email.com', jobTitle: 'Backend Developer', status: 'Invited', aiScore: null, appliedDate: '2025-02-24', hasResume: true },
  { id: 6, name: 'Kang Minji', email: 'minji.kang@email.com', jobTitle: 'Product Manager', status: 'Completed', aiScore: 95, appliedDate: '2025-02-23', hasResume: true },
  { id: 7, name: 'Yoon Seojin', email: 'seojin.yoon@email.com', jobTitle: 'Data Analyst', status: 'Completed', aiScore: 85, appliedDate: '2025-02-22', hasResume: true },
  { id: 8, name: 'Han Jiwoo', email: 'jiwoo.han@email.com', jobTitle: 'AI Engineer', status: 'On Process', aiScore: 91, appliedDate: '2025-02-21', hasResume: true },
];

const generatedQuestions = [
  "Explain your experience with Python backend development and RESTful API design.",
  "Describe a project where you handled large-scale datasets and optimized performance.",
  "How do you approach debugging complex distributed system issues?",
  "Tell us about a challenging team collaboration experience and how you resolved conflicts.",
  "Walk us through your experience with cloud infrastructure (AWS/GCP/Azure).",
  "How do you ensure code quality and maintainability in your projects?"
];

const statusConfig = {
  'Invited': { color: 'bg-blue-100 text-blue-700', icon: Send, korean: '초대됨' },
  'On Process': { color: 'bg-amber-100 text-amber-700', icon: PlayCircle, korean: '진행 중' },
  'Completed': { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, korean: '완료됨' },
};

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState('All Positions');
  const [aiStep, setAiStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  const filteredCandidates = selectedJob === 'All Positions' 
    ? candidates 
    : candidates.filter(c => c.jobTitle === selectedJob);

  const handleGenerateQuestions = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setQuestionsGenerated(true);
      setAiStep(4);
    }, 2000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Job Title', icon: FileText },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'ai-setup', label: 'AI Interview Setup', icon: BrainCircuit },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
        
        * { box-sizing: border-box; }
        
        .sidebar-gradient {
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        }
        
        .nav-item-active {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%);
          border-left: 3px solid #3b82f6;
        }
        
        .card-shadow {
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04);
        }
        
        .table-row:hover {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.03) 0%, transparent 100%);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          transition: all 0.2s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
        }
        
        .step-active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        
        .step-completed {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .question-card {
          border-left: 3px solid #3b82f6;
          transition: all 0.2s ease;
        }
        
        .question-card:hover {
          transform: translateX(4px);
          border-left-color: #2563eb;
        }
        
        .upload-zone {
          border: 2px dashed #cbd5e1;
          transition: all 0.2s ease;
        }
        
        .upload-zone:hover {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.02);
        }
        
        .input-field {
          transition: all 0.2s ease;
        }
        
        .input-field:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .score-badge {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }
        
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 1; }
        }
        
        .generating-pulse {
          animation: pulse-ring 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Left Sidebar */}
      <aside className="w-64 sidebar-gradient text-white flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>TecAce</h1>
              <p className="text-xs text-slate-400">AI Interview Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          <div className="px-4 mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Menu</span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all ${
                  isActive 
                    ? 'nav-item-active text-blue-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                AI
              </div>
              <div>
                <p className="text-sm font-medium text-white">AI Credits</p>
                <p className="text-xs text-slate-400">847 remaining</p>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {navItems.find(n => n.id === activeSection)?.label}
            </h2>
            <p className="text-sm text-slate-500">
              {activeSection === 'dashboard' && 'Manage and track all candidates'}
              {activeSection === 'jobs' && 'Create and manage job postings'}
              {activeSection === 'candidates' && 'Register new candidates'}
              {activeSection === 'ai-setup' && 'Generate AI interview questions'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                HR
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">HR Admin</p>
                <p className="text-xs text-slate-400">hr@tecace.com</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8">
          {/* SCREEN 1: Dashboard */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: 'Total Candidates', value: '248', change: '+12%', color: 'blue' },
                  { label: 'Active Interviews', value: '34', change: '+5%', color: 'purple' },
                  { label: 'Completed Today', value: '8', change: '+2', color: 'emerald' },
                  { label: 'Avg AI Score', value: '87.4', change: '+3.2', color: 'amber' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 card-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                      <span className={`text-xs font-medium text-${stat.color}-600 bg-${stat.color}-50 px-2 py-1 rounded-full`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Filter and Table */}
              <div className="bg-white rounded-2xl card-shadow">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <select 
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                      >
                        {jobTitles.map(job => (
                          <option key={job} value={job}>{job}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search candidates..." 
                        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveSection('candidates')}
                    className="btn-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Candidate
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Title</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resume</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Interview Status</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Score</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCandidates.map((candidate) => {
                        const status = statusConfig[candidate.status];
                        const StatusIcon = status.icon;
                        return (
                          <tr key={candidate.id} className="table-row transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
                                  {candidate.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="font-medium text-slate-800">{candidate.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm">{candidate.email}</td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                                {candidate.jobTitle}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {candidate.hasResume && (
                                <button className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {candidate.status}
                                <span className="text-[10px] opacity-70">({status.korean})</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {candidate.aiScore ? (
                                <span className="score-badge text-emerald-700 font-bold px-3 py-1 rounded-lg text-sm">
                                  {candidate.aiScore}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-sm">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm">{candidate.appliedDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Showing <span className="font-medium">{filteredCandidates.length}</span> of <span className="font-medium">{candidates.length}</span> candidates
                  </p>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Previous</button>
                    <button className="px-3 py-1.5 text-sm text-white bg-blue-500 rounded-lg">1</button>
                    <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">2</button>
                    <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">3</button>
                    <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Next</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 2: Job Description Creation */}
          {activeSection === 'jobs' && (
            <div className="max-w-4xl">
              <div className="bg-white rounded-2xl card-shadow p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Create New Job Posting
                    </h3>
                    <p className="text-sm text-slate-500">Fill in the details to create a new position</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Job Title *</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Senior Backend Developer"
                        className="input-field w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                      <div className="relative">
                        <select className="input-field appearance-none w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer bg-white">
                          <option>Engineering</option>
                          <option>Product</option>
                          <option>Design</option>
                          <option>Data Science</option>
                          <option>Marketing</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Location *
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g., Seoul, South Korea (Remote)"
                        className="input-field w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Briefcase className="w-4 h-4 inline mr-1" />
                        Employment Type *
                      </label>
                      <div className="flex gap-3">
                        {['Full Time', 'Contract', 'Internship'].map((type, i) => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="employmentType" 
                              defaultChecked={i === 0}
                              className="w-4 h-4 text-blue-500 focus:ring-blue-500/20"
                            />
                            <span className="text-sm text-slate-700">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Job Description *</label>
                    <textarea 
                      rows={6}
                      placeholder="Describe the role, responsibilities, and what success looks like in this position..."
                      className="input-field w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <ListChecks className="w-4 h-4 inline mr-1" />
                        Required Skills *
                      </label>
                      <textarea 
                        rows={4}
                        placeholder="Python, Django, PostgreSQL, RESTful APIs..."
                        className="input-field w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Star className="w-4 h-4 inline mr-1" />
                        Preferred Skills
                      </label>
                      <textarea 
                        rows={4}
                        placeholder="Kubernetes, GraphQL, Machine Learning..."
                        className="input-field w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                    <button className="btn-primary text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Save Job Posting
                    </button>
                    <button className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: Candidate Registration */}
          {activeSection === 'candidates' && (
            <div className="max-w-4xl">
              <div className="bg-white rounded-2xl card-shadow p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Register New Candidate
                    </h3>
                    <p className="text-sm text-slate-500">Add a candidate for a specific job position</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Candidate Name *</label>
                      <input 
                        type="text" 
                        placeholder="Full name"
                        className="input-field w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                      <input 
                        type="email" 
                        placeholder="candidate@email.com"
                        className="input-field w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="+82 10-1234-5678 (optional)"
                        className="input-field w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Job Title *</label>
                      <div className="relative">
                        <select className="input-field appearance-none w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer bg-white">
                          <option>Select a title...</option>
                          <option>Backend Developer</option>
                          <option>Product Manager</option>
                          <option>Data Analyst</option>
                          <option>AI Engineer</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Resume *</label>
                    <div className="upload-zone rounded-2xl p-8 text-center cursor-pointer">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Drag & drop resume here, or <span className="text-blue-500">browse</span>
                      </p>
                      <p className="text-xs text-slate-400">Supports PDF, DOC, DOCX (Max 10MB)</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                      <StickyNote className="w-4 h-4" />
                      Optional Information
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                          <Linkedin className="w-4 h-4 inline mr-1" />
                          LinkedIn Profile
                        </label>
                        <input 
                          type="url" 
                          placeholder="https://linkedin.com/in/..."
                          className="input-field w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Notes</label>
                        <input 
                          type="text" 
                          placeholder="Internal notes about this candidate..."
                          className="input-field w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                    <button className="btn-primary text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Candidate
                    </button>
                    <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Add & Send Interview Invitation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: AI Interview Question Generator */}
          {activeSection === 'ai-setup' && (
            <div className="max-w-5xl">
              <div className="bg-white rounded-2xl card-shadow p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      AI Interview Question Generator
                    </h3>
                    <p className="text-sm text-slate-500">Generate personalized interview questions using AI analysis</p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-10 px-4">
                  {[
                    { num: 1, label: 'Select Job' },
                    { num: 2, label: 'Select Candidate' },
                    { num: 3, label: 'AI Analysis' },
                    { num: 4, label: 'Questions' },
                  ].map((step, i) => (
                    <React.Fragment key={step.num}>
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all ${
                          aiStep > step.num 
                            ? 'step-completed text-white' 
                            : aiStep === step.num 
                              ? 'step-active text-white generating-pulse' 
                              : 'bg-slate-200 text-slate-500'
                        }`}>
                          {aiStep > step.num ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                        </div>
                        <span className={`text-xs font-medium ${aiStep >= step.num ? 'text-slate-700' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                      </div>
                      {i < 3 && (
                        <div className={`flex-1 h-0.5 mx-4 ${aiStep > step.num ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* Left Side - Input */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Step 1: Select Job Title</label>
                      <div className="relative">
                        <select 
                          className="input-field appearance-none w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer bg-white"
                          onChange={() => setAiStep(Math.max(aiStep, 2))}
                        >
                          <option>Select a position...</option>
                          <option>Backend Developer</option>
                          <option>Product Manager</option>
                          <option>Data Analyst</option>
                          <option>AI Engineer</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Step 2: Select Candidate Resume</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <select 
                          className="input-field appearance-none w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer bg-white"
                          onChange={() => setAiStep(Math.max(aiStep, 3))}
                        >
                          <option>Search and select a candidate...</option>
                          {candidates.map(candidate => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.name} — {candidate.jobTitle} ({candidate.email})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Select from registered candidates with uploaded resumes</p>
                    </div>

                    {aiStep >= 3 && (
                      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center">
                            <BrainCircuit className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">Step 3: AI Resume Analysis</p>
                            <p className="text-xs text-slate-500">Analyzing skills and experience</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {['Python', 'Django', 'PostgreSQL', 'AWS', 'Docker'].map((skill, i) => (
                            <span key={skill} className="inline-block bg-white text-violet-700 text-xs font-medium px-3 py-1 rounded-full mr-2 border border-violet-200">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleGenerateQuestions}
                      disabled={aiStep < 3 || isGenerating}
                      className={`w-full py-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        aiStep >= 3 && !isGenerating
                          ? 'btn-primary text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Questions...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate AI Interview Questions
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Side - Generated Questions */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-slate-700">Step 4: Generated Interview Questions</label>
                      {questionsGenerated && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          6 Questions Ready
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-6 min-h-[400px]">
                      {!questionsGenerated ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mb-4">
                            <BrainCircuit className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-500">
                            Complete steps 1-3 to generate<br />personalized interview questions
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {generatedQuestions.map((question, i) => (
                            <div key={i} className="question-card bg-white p-4 rounded-xl">
                              <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {i + 1}
                                </span>
                                <p className="text-sm text-slate-700 leading-relaxed">{question}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {questionsGenerated && (
                      <div className="flex items-center gap-4 mt-6">
                        <button className="btn-primary text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 flex-1 justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                          Save Interview Questions
                        </button>
                        <button className="px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Regenerate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-violet-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <BrainCircuit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-800 mb-1">How AI Interview Questions Work</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Our AI analyzes the job description requirements and the candidate's resume to generate personalized interview questions. 
                      These questions are designed to assess both technical skills and soft skills relevant to the position. 
                      The generated questions will be used in the mobile interview app where candidates record their responses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
