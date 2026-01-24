import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Bell, 
  Stethoscope, 
  ShieldCheck, 
  FlaskConical, 
  ShieldAlert,
  Menu,
  ChevronLeft,
  TrendingUp,
  Zap,
  BookOpen,
  Library,
  Bed,
  ClipboardList,
  Hand,
  CheckCircle2,
  FileBarChart,
  SearchCode,
  AlertTriangle,
  MapPin,
  Trash2,
  Presentation,
  MonitorPlay,
  Trophy,
  Sparkles,
  Calendar,
  Loader2,
  FileSpreadsheet,
  Radio,
  Terminal,
  Clock,
  FileText,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../AuthContext';

// Import Dashboards
import HAIDashboard from './dashboards/HAIDashboard';
import PTBDashboard from './dashboards/PTBDashboard';
import NTPDashboard from './dashboards/NTPDashboard';
import IsolationDashboard from './dashboards/IsolationDashboard';
import NotifiableDashboard from './dashboards/NotifiableDashboard';
import NeedlestickDashboard from './dashboards/NeedlestickDashboard';
import CultureDashboard from './dashboards/CultureDashboard';
import Resources from './Resources';
import ReporterAnalytics from './dashboards/ReporterAnalytics';

// Import Audit dashboards
import HandHygieneAudit from './audits/HandHygieneAudit';
import HAIBundlesAudit from './audits/HAIBundlesAudit';
import AreaAudit from './audits/AreaAudit';
import HAIDataDashboard from './audits/HAIDataDashboard';
import ActionPlanTracker from './audits/ActionPlanTracker';
import AuditSchedule from './audits/AuditSchedule';

// Import Presentation components
import ExecutiveDashboard from './dashboards/ExecutiveDashboard';

// Import AI Assistant
import AIAssistant from './ui/AIAssistant';

import { 
  subscribeToReports,
  getAreaAudits, 
  getActionPlans 
} from '../services/ipcService';

interface ModuleConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  component: React.ComponentType<any>;
}

const OverviewModule: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [, setSearchParams] = useSearchParams();
    const [counts, setCounts] = useState({ hai: 0, notifiable: 0, tb: 0, isolation: 0, ntp: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubHAI = subscribeToReports('reports_hai', 'validated', (data) => {
            setCounts(prev => ({ ...prev, hai: data.length }));
            setLoading(false);
        });
        const unsubNotif = subscribeToReports('reports_notifiable', 'validated', (data) => {
            setCounts(prev => ({ ...prev, notifiable: data.length }));
        });
        const unsubTB = subscribeToReports('reports_tb', 'validated', (data) => {
            setCounts(prev => ({ ...prev, tb: data.length }));
        });
        const unsubIso = subscribeToReports('reports_isolation', 'validated', (data) => {
            setCounts(prev => ({ ...prev, isolation: data.length }));
        });
        const unsubNTP = subscribeToReports('reports_ntp', 'validated', (data) => {
            setCounts(prev => ({ ...prev, ntp: data.length }));
        });
        return () => { unsubHAI(); unsubNotif(); unsubTB(); unsubIso(); unsubNTP(); };
    }, []);

    const handleQuickNav = (id: string) => setSearchParams({ module: id });
    
    const actions = [
      { label: 'Report HAI', path: '/report-hai', icon: <Activity size={18}/>, color: 'bg-blue-600' },
      { label: 'Register NTP', path: '/report-ntp', icon: <UserPlus size={18}/>, color: 'bg-amber-600' },
      { label: 'Register TB', path: '/report-ptb', icon: <Stethoscope size={18}/>, color: 'bg-amber-700' },
      { label: 'New Notifiable', path: '/report-disease', icon: <Bell size={18}/>, color: 'bg-red-600' },
      { label: 'Log Injury', path: '/report-needlestick', icon: <ShieldAlert size={18}/>, color: 'bg-red-500' },
      { label: 'Isolation Admit', path: '/report-isolation', icon: <ShieldCheck size={18}/>, color: 'bg-indigo-600' },
    ];

    const stats = [
      { id: 'hai', label: 'Active HAIs', value: counts.hai, icon: <Activity size={24}/>, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Registry' },
      { id: 'notifiable', label: 'New Notifiable', value: counts.notifiable, icon: <Bell size={24}/>, color: 'text-red-600', bg: 'bg-red-50', trend: 'Urgent' },
      { id: 'ntp', label: 'NTP Referrals', value: counts.ntp, icon: <FileText size={24}/>, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Program' },
      { id: 'tb', label: 'Active TB Cases', value: counts.tb, icon: <Stethoscope size={24}/>, color: 'text-amber-700', bg: 'bg-amber-50', trend: 'Monitoring' }
    ];

    const visibleActions = actions.filter(a => a.label !== 'Register NTP' || isAuthenticated);
    const visibleStats = stats.filter(s => s.id !== 'ntp' || isAuthenticated);

    return (
        <div className="flex flex-col gap-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl"><Zap size={22} fill="currentColor" /></div>
                    <div><h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Registry Access</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select a form to begin a new entry</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {visibleActions.map((action, i) => (
                    <button key={i} onClick={() => navigate(action.path)} className={`${action.color} text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg hover:brightness-110 active:scale-95 group`}>
                      <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">{action.icon}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{action.label}</span>
                    </button>
                  ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {visibleStats.map((stat) => (
                    <button key={stat.id} onClick={() => handleQuickNav(stat.id)} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 text-left hover:border-primary transition-all group min-h-[160px] animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between"><div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform`}>{stat.icon}</div><span className={`text-[10px] font-black uppercase ${stat.color} ${stat.bg} px-2 py-1 rounded`}>{stat.trend}</span></div>
                        {loading ? <div className="h-8 w-1/2 bg-slate-100 animate-pulse rounded"></div> : (
                            <div><h3 className="text-3xl font-black text-slate-900">{stat.value}</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p></div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

const AuditOverview: React.FC = () => {
    const [, setSearchParams] = useSearchParams();
    const [auditData, setAuditData] = useState({ recent: [] as any[], poor: [] as any[], openActions: 0, delayedActions: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuditData = async () => {
            const [areaAudits, actionPlans] = await Promise.all([getAreaAudits(), getActionPlans()]);
            const recent = areaAudits.slice(0, 5).map(a => {
                const answers = Object.values(a.answers || {});
                const yesCount = answers.filter(v => v === 'Yes').length;
                const total = answers.filter(v => v !== 'NA').length || 1;
                const score = Math.round((yesCount / total) * 100);
                return { area: a.area, date: a.dateLogged?.split('T')[0] || a.date, score: `${score}%`, color: score > 85 ? 'text-emerald-500' : 'text-amber-500' };
            });
            const poor = areaAudits
                .map(a => {
                    const answers = Object.values(a.answers || {});
                    const yesCount = answers.filter(v => v === 'Yes').length;
                    const total = answers.filter(v => v !== 'NA').length || 1;
                    const score = Math.round((yesCount / total) * 100);
                    return { area: a.area, factor: a.category || 'Compliance', score: `${score}%`, icon: <SearchCode size={14}/> };
                })
                .filter(a => parseInt(a.score) < 70)
                .slice(0, 3);
            setAuditData({ recent, poor, openActions: actionPlans.filter(p => p.status === 'pending').length, delayedActions: actionPlans.filter(p => p.status === 'failed-extended').length });
            setLoading(false);
        };
        fetchAuditData();
    }, []);

    const handleQuickNav = (id: string) => setSearchParams({ module: id });

    return (
        <div className="flex flex-col gap-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: 'hand-hygiene', label: 'Hand Hygiene', desc: 'WHO 5 Moments Audit', icon: <Hand size={24}/>, color: 'bg-emerald-50 text-emerald-600', stats: 'Compliance Tracker' },
                  { id: 'area-audit', label: 'Environmental', desc: 'Area Cleaning Audit', icon: <SearchCode size={24}/>, color: 'bg-amber-50 text-amber-600', stats: 'Safety Inspection' },
                  { id: 'hai-data', label: 'Surveillance', desc: 'Census & Device Days', icon: <FileBarChart size={24}/>, color: 'bg-indigo-50 text-indigo-600', stats: 'Infection Rates' },
                  { id: 'hai-bundles', label: 'Clinical Bundles', desc: 'VAP/CAUTI/CLABSI Checks', icon: <CheckCircle2 size={24}/>, color: 'bg-blue-50 text-blue-600', stats: 'Quality Assurance' }
                ].map(card => (
                    <button key={card.id} onClick={() => handleQuickNav(card.id)} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-4 hover:border-emerald-500 transition-all group">
                        <div className={`p-5 rounded-3xl ${card.color} group-hover:scale-110 transition-transform`}>{card.icon}</div>
                        <div><h3 className="text-xl font-black uppercase text-slate-900 leading-tight">{card.label}</h3><p className="text-xs font-bold text-slate-400 uppercase mt-1">{card.desc}</p></div>
                    </button>
                ))}
            </div>
        </div>
    );
};

const SurveillanceHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, appMode } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  
  const activeModule = searchParams.get('module') || 'overview';

  const universalModules: ModuleConfig[] = [
    { id: 'culture', label: 'Antibiogram', icon: <FlaskConical size={20} />, color: 'text-teal-600', component: CultureDashboard },
    { id: 'manual', label: 'IPC Manual', icon: <BookOpen size={20} />, color: 'text-emerald-600', component: Resources },
    { id: 'references', label: 'References', icon: <Library size={20} />, color: 'text-slate-600', component: Resources },
  ];

  const reportModules: ModuleConfig[] = [
    { id: 'overview', label: 'Surveillance Hub', icon: <LayoutDashboard size={20} />, color: 'text-slate-600', component: OverviewModule },
    { id: 'hai', label: 'HAI Registry', icon: <Activity size={20} />, color: 'text-blue-600', component: HAIDashboard },
    { id: 'notifiable', label: 'Notifiable Diseases', icon: <Bell size={20} />, color: 'text-red-600', component: NotifiableDashboard },
    { id: 'ntp', label: 'NTP Registry', icon: <FileText size={20} />, color: 'text-amber-600', component: NTPDashboard },
    { id: 'tb', label: 'TB Registry', icon: <Stethoscope size={20} />, color: 'text-amber-700', component: PTBDashboard },
    { id: 'isolation', label: 'Isolation Room', icon: <Bed size={20} />, color: 'text-indigo-600', component: IsolationDashboard },
    { id: 'needlestick', label: 'Sharps / Injury', icon: <ShieldAlert size={20} />, color: 'text-red-500', component: NeedlestickDashboard },
    { id: 'analytics', label: 'Contributors', icon: <FileSpreadsheet size={20} />, color: 'text-emerald-600', component: ReporterAnalytics },
  ].filter(m => m.id !== 'ntp' || isAuthenticated);

  const auditModules: ModuleConfig[] = [
    { id: 'overview', label: 'Audit Hub', icon: <LayoutDashboard size={20} />, color: 'text-slate-600', component: AuditOverview },
    { id: 'audit-schedule', label: 'Schedule', icon: <Calendar size={20} />, color: 'text-teal-600', component: AuditSchedule },
    { id: 'hand-hygiene', label: 'Hand Hygiene', icon: <Hand size={20} />, color: 'text-emerald-600', component: HandHygieneAudit },
    { id: 'area-audit', label: 'Environmental', icon: <SearchCode size={20} />, color: 'text-amber-600', component: AreaAudit },
    { id: 'hai-data', label: 'Registry Logs', icon: <FileBarChart size={20} />, color: 'text-indigo-600', component: HAIDataDashboard },
    { id: 'hai-bundles', label: 'Care Bundles', icon: <CheckCircle2 size={20} />, color: 'text-blue-600', component: HAIBundlesAudit },
    { id: 'action-plans', label: 'Action Tracker', icon: <ClipboardList size={20} />, color: 'text-rose-600', component: ActionPlanTracker },
  ];

  const presentModules: ModuleConfig[] = [
    { id: 'overview', label: 'Executive Brief', icon: <MonitorPlay size={20} />, color: 'text-slate-600', component: ExecutiveDashboard },
    { id: 'hai', label: 'HAI Analysis', icon: <Activity size={20} />, color: 'text-blue-600', component: HAIDashboard },
    { id: 'notifiable', label: 'Epidemiology', icon: <Bell size={20} />, color: 'text-red-600', component: NotifiableDashboard },
    { id: 'tb', label: 'TB Surveillance', icon: <Stethoscope size={20} />, color: 'text-amber-700', component: PTBDashboard },
    { id: 'isolation', label: 'Isolation Room', icon: <ShieldCheck size={20} />, color: 'text-indigo-600', component: IsolationDashboard },
    { id: 'area-audit', label: 'Safety Audit', icon: <SearchCode size={20} />, color: 'text-amber-600', component: AreaAudit },
    { id: 'hand-hygiene', label: 'Hand Hygiene', icon: <Hand size={20} />, color: 'text-emerald-600', component: HandHygieneAudit },
    { id: 'hai-data', label: 'Statistical Logs', icon: <FileBarChart size={20} />, color: 'text-indigo-600', component: HAIDataDashboard },
    { id: 'action-plans', label: 'Action Tracker', icon: <ClipboardList size={20} />, color: 'text-rose-600', component: ActionPlanTracker },
  ].filter(m => m.id !== 'ntp' || isAuthenticated);

  const mainModules = appMode === 'report' ? reportModules : appMode === 'audit' ? auditModules : presentModules;
  const allModules = [...mainModules, ...universalModules];
  const currentModule = allModules.find(m => m.id === activeModule) || allModules[0];
  const ActiveComponent = currentModule.component;

  const handleModuleSelect = (id: string) => {
    setSearchParams({ module: id });
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const getModeColor = () => {
    if (appMode === 'report') return 'bg-primary';
    if (appMode === 'audit') return 'bg-emerald-600';
    return 'bg-slate-800';
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-slate-50 relative">
      <aside className={`fixed lg:sticky top-16 z-50 h-[calc(100vh-64px)] bg-slate-900 text-white transition-all duration-300 flex flex-col overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-0 lg:w-20'}`}>
        <div className="p-6 flex items-center justify-between min-w-[256px] lg:min-w-0">
          {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Navigation</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400">
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar min-w-[256px] lg:min-w-0 pb-10">
          <div className="space-y-1">
            {mainModules.map(module => (
              <button key={module.id} onClick={() => handleModuleSelect(module.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${activeModule === module.id ? getModeColor() + ' text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                {module.icon}
                {isSidebarOpen && <span className="text-sm font-bold truncate">{module.label}</span>}
              </button>
            ))}
          </div>
          <div className="space-y-1 pt-4 border-t border-slate-800">
            {universalModules.map(module => (
              <button key={module.id} onClick={() => handleModuleSelect(module.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${activeModule === module.id ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                {module.icon}
                {isSidebarOpen && <span className="text-sm font-bold truncate">{module.label}</span>}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-slate-100 ${currentModule.color}`}>{currentModule.icon}</div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">{appMode === 'report' ? 'Institutional Surveillance Hub' : 'Institutional Compliance Desk'}</span>
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate leading-tight">{currentModule.label}</h1>
              </div>
           </div>
        </header>
        <div className="flex-1 p-8">
           <div className="animate-in fade-in duration-500">
              <ActiveComponent 
                isNested={true} 
                type={activeModule === 'manual' ? 'policies' : activeModule === 'references' ? 'pathways' : undefined} 
                title={currentModule.label} 
                viewMode={appMode === 'present' && activeModule !== 'overview' ? 'analysis' : undefined} 
              />
           </div>
        </div>
      </main>
      <AIAssistant />
    </div>
  );
};

export default SurveillanceHub;