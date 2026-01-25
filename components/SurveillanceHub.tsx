import React, { useState, useEffect } from 'react';
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
  BookOpen,
  Library,
  Bed,
  ClipboardList,
  Hand,
  CheckCircle2,
  FileBarChart,
  SearchCode,
  Presentation,
  MonitorPlay,
  Calendar,
  FileSpreadsheet,
  FileText,
  UserPlus,
  X,
  FileBadge
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

import { subscribeToReports } from '../services/ipcService';

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
    const [counts, setCounts] = useState({ hai: 0, notifiable: 0, tb: 0, isolation: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
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
            return () => { unsubHAI(); unsubNotif(); unsubTB(); unsubIso(); };
        }
    }, [isAuthenticated]);

    const handleQuickNav = (id: string) => setSearchParams({ module: id });
    
    const registryActions = [
      { label: 'Report HAI', path: '/report-hai', icon: <Activity size={18}/>, color: 'bg-blue-600' },
      { label: 'Register TB', path: '/report-ptb', icon: <Stethoscope size={18}/>, color: 'bg-amber-700' },
      { label: 'New Notifiable', path: '/report-disease', icon: <Bell size={18}/>, color: 'bg-red-600' },
      { label: 'Log Injury', path: '/report-needlestick', icon: <ShieldAlert size={18}/>, color: 'bg-red-500' },
      { label: 'Isolation Admit', path: '/report-isolation', icon: <ShieldCheck size={18}/>, color: 'bg-indigo-600' },
      { label: 'Add Lab Report', path: '/report-culture', icon: <FlaskConical size={18}/>, color: 'bg-teal-600' },
    ];

    const resourceActions = [
      { label: 'Antibiogram', module: 'culture', icon: <FlaskConical size={18}/>, color: 'bg-teal-600' },
      { label: 'IPC Manual', module: 'manual', icon: <BookOpen size={18}/>, color: 'bg-emerald-600' },
      { label: 'Pocket Guides', module: 'pocket-guides', icon: <FileBadge size={18}/>, color: 'bg-amber-600' },
      { label: 'References', module: 'references', icon: <Library size={18}/>, color: 'bg-slate-600' },
    ];

    const stats = [
      { id: 'hai', label: 'Active HAIs', value: counts.hai, icon: <Activity size={24}/>, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Registry' },
      { id: 'notifiable', label: 'New Notifiable', value: counts.notifiable, icon: <Bell size={24}/>, color: 'text-red-600', bg: 'bg-red-50', trend: 'Urgent' },
      { id: 'tb', label: 'Active TB Cases', value: counts.tb, icon: <Stethoscope size={24}/>, color: 'text-amber-700', bg: 'bg-amber-50', trend: 'Monitoring' }
    ];

    return (
        <div className="flex flex-col gap-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {/* Action Grid - Always Visible */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl">
                      <Library size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                        Registry Access & Resources
                      </h2>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Submit reports or access essential IPC protocols
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Surveillance Reporting</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                      {registryActions.map((action, i) => (
                        <button 
                          key={i} 
                          onClick={() => navigate(action.path)} 
                          className={`${action.color} text-white p-3 md:p-4 rounded-2xl flex flex-col items-center justify-center gap-2 md:gap-3 shadow-lg hover:brightness-110 active:scale-95 group transition-all`}
                        >
                          <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">{action.icon}</div>
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center leading-tight">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Clinical Guidelines</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                      {resourceActions.map((action, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleQuickNav(action.module)} 
                          className={`${action.color} text-white p-3 md:p-4 rounded-2xl flex flex-col items-center justify-center gap-2 md:gap-3 shadow-lg hover:brightness-110 active:scale-95 group transition-all`}
                        >
                          <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">{action.icon}</div>
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center leading-tight">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
            </div>

            {/* Data Cards - Auth Required */}
            {isAuthenticated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat) => (
                        <button key={stat.id} onClick={() => handleQuickNav(stat.id)} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 text-left hover:border-primary transition-all group min-h-[140px] md:min-h-[160px] animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex items-center justify-between"><div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform`}>{stat.icon}</div><span className={`text-[10px] font-black uppercase ${stat.color} ${stat.bg} px-2 py-1 rounded`}>{stat.trend}</span></div>
                            {loading ? <div className="h-8 w-1/2 bg-slate-100 animate-pulse rounded"></div> : (
                                <div><h3 className="text-2xl md:text-3xl font-black text-slate-900">{stat.value}</h3><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p></div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const AuditOverview: React.FC = () => {
    const [, setSearchParams] = useSearchParams();
    const handleQuickNav = (id: string) => setSearchParams({ module: id });

    const auditActions = [
      { id: 'audit-schedule', label: 'Schedule', icon: <Calendar size={18}/>, color: 'bg-teal-600', desc: 'Planning' },
      { id: 'hand-hygiene', label: 'Hand Hygiene', icon: <Hand size={18}/>, color: 'bg-emerald-600', desc: '5 Moments' },
      { id: 'area-audit', label: 'Walkrounds', icon: <SearchCode size={18}/>, color: 'bg-amber-600', desc: 'Inspection' },
      { id: 'hai-data', label: 'HAI Data', icon: <FileBarChart size={18}/>, color: 'bg-indigo-600', desc: 'Stat Logs' },
      { id: 'hai-bundles', label: 'Clinical Bundles', icon: <CheckCircle2 size={18}/>, color: 'bg-blue-600', desc: 'Compliance' },
      { id: 'action-plans', label: 'Action Tracker', icon: <ClipboardList size={18}/>, color: 'bg-rose-600', desc: 'Corrections' }
    ];

    return (
        <div className="flex flex-col gap-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-emerald-500/10 text-emerald-600 flex items-center justify-center rounded-xl"><ShieldCheck size={22} /></div>
                    <div><h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">Audit Dashboard</h2><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Select a focus area for quality oversight</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                  {auditActions.map((action, i) => (
                    <button key={i} onClick={() => handleQuickNav(action.id)} className={`${action.color} text-white p-3 md:p-4 rounded-2xl flex flex-col items-center justify-center gap-2 md:gap-3 shadow-lg hover:brightness-110 active:scale-95 group`}>
                      <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">{action.icon}</div>
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center leading-tight">{action.label}</span>
                    </button>
                  ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { id: 'hand-hygiene', label: 'Hand Hygiene', desc: 'WHO 5 Moments Audit', icon: <Hand size={24}/>, color: 'bg-emerald-50 text-emerald-600', stats: 'Compliance' },
                  { id: 'area-audit', label: 'Walkrounds', desc: 'Area Cleaning Audit', icon: <SearchCode size={24}/>, color: 'bg-amber-50 text-amber-600', stats: 'Safety' },
                  { id: 'hai-data', label: 'HAI Data', desc: 'Census & Device Days', icon: <FileBarChart size={24}/>, color: 'bg-indigo-50 text-indigo-600', stats: 'Rates' },
                  { id: 'hai-bundles', label: 'Clinical Bundles', desc: 'Care Adherence Checks', icon: <CheckCircle2 size={24}/>, color: 'bg-blue-50 text-blue-600', stats: 'Bundles' }
                ].map(card => (
                    <button key={card.id} onClick={() => handleQuickNav(card.id)} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 text-left hover:border-emerald-500 transition-all group min-h-[140px] md:min-h-[160px]">
                        <div className="flex items-center justify-between"><div className={`p-3 ${card.color} rounded-2xl group-hover:scale-110 transition-transform`}>{card.icon}</div><span className={`text-[10px] font-black uppercase ${card.color} px-2 py-1 rounded`}>{card.stats}</span></div>
                        <div><h3 className="text-xl font-black text-slate-900 uppercase leading-none">{card.label}</h3><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{card.desc}</p></div>
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
    { id: 'pocket-guides', label: 'Pocket Guides', icon: <FileBadge size={20} />, color: 'text-amber-600', component: Resources },
    { id: 'references', label: 'References', icon: <Library size={20} />, color: 'text-slate-600', component: Resources },
  ];

  const reportModules: ModuleConfig[] = [
    { id: 'overview', label: 'Surveillance Hub', icon: <LayoutDashboard size={20} />, color: 'text-slate-600', component: OverviewModule },
    { id: 'hai', label: 'HAI Registry', icon: <Activity size={20} />, color: 'text-blue-600', component: HAIDashboard },
    { id: 'notifiable', label: 'Notifiable Diseases', icon: <Bell size={20} />, color: 'text-red-600', component: NotifiableDashboard },
    { id: 'tb', label: 'TB Registry', icon: <Stethoscope size={20} />, color: 'text-amber-700', component: PTBDashboard },
    { id: 'isolation', label: 'Isolation Room', icon: <Bed size={20} />, color: 'text-indigo-600', component: IsolationDashboard },
    { id: 'needlestick', label: 'Sharps / Injury', icon: <ShieldAlert size={20} />, color: 'text-red-500', component: NeedlestickDashboard },
    { id: 'analytics', label: 'Contributors', icon: <FileSpreadsheet size={20} />, color: 'text-emerald-600', component: ReporterAnalytics },
  ];

  const auditModules: ModuleConfig[] = [
    { id: 'overview', label: 'Audit Hub', icon: <LayoutDashboard size={20} />, color: 'text-slate-600', component: AuditOverview },
    { id: 'audit-schedule', label: 'Schedule', icon: <Calendar size={20} />, color: 'text-teal-600', component: AuditSchedule },
    { id: 'hand-hygiene', label: 'Hand Hygiene', icon: <Hand size={20} />, color: 'text-emerald-600', component: HandHygieneAudit },
    { id: 'area-audit', label: 'Walkrounds', icon: <SearchCode size={20} />, color: 'text-amber-600', component: AreaAudit },
    { id: 'hai-data', label: 'HAI Data', icon: <FileBarChart size={20} />, color: 'text-indigo-600', component: HAIDataDashboard },
    { id: 'hai-bundles', label: 'Care Bundles', icon: <CheckCircle2 size={20} />, color: 'text-blue-600', component: HAIBundlesAudit },
    { id: 'action-plans', label: 'Action Tracker', icon: <ClipboardList size={20} />, color: 'text-rose-600', component: ActionPlanTracker },
  ];

  const presentModules: ModuleConfig[] = [
    { id: 'overview', label: 'Executive Hub', icon: <Presentation size={20} />, color: 'text-slate-800', component: ExecutiveDashboard },
    { id: 'hai', label: 'HAI Analytics', icon: <Activity size={20} />, color: 'text-blue-600', component: HAIDashboard },
    { id: 'notifiable', label: 'Notifiable Analytics', icon: <Bell size={20} />, color: 'text-red-600', component: NotifiableDashboard },
    { id: 'tb', label: 'TB Analytics', icon: <Stethoscope size={20} />, color: 'text-amber-700', component: PTBDashboard },
    { id: 'isolation', label: 'Isolation Analytics', icon: <Bed size={20} />, color: 'text-indigo-600', component: IsolationDashboard },
    { id: 'needlestick', label: 'Sharps Analytics', icon: <ShieldAlert size={20} />, color: 'text-red-500', component: NeedlestickDashboard },
  ];

  // Logic to hide specific registries when not logged in
  const filterModules = (mods: ModuleConfig[]) => {
    if (isAuthenticated) return mods;
    const restrictedIds = ['hai', 'notifiable', 'tb', 'isolation', 'needlestick', 'analytics'];
    return mods.filter(m => !restrictedIds.includes(m.id));
  };

  const mainModules = filterModules(appMode === 'report' ? reportModules : appMode === 'audit' ? auditModules : presentModules);
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
      {/* Sidebar Backdrop for Mobile */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] transition-opacity animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Enhanced Mobile Drawer Logic */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-16 z-[120] lg:z-50 h-screen lg:h-[calc(100vh-64px)] bg-slate-900 text-white transition-all duration-300 flex flex-col overflow-hidden
        ${isSidebarOpen ? 'w-72 lg:w-64 translate-x-0' : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>Navigation</span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto no-scrollbar pb-10">
          <div className="space-y-1">
            {mainModules.map(module => (
              <button 
                key={module.id} 
                onClick={() => handleModuleSelect(module.id)} 
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${activeModule === module.id ? getModeColor() + ' text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                title={module.label}
              >
                <div className="shrink-0">{module.icon}</div>
                <span className={`text-sm font-bold truncate transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>{module.label}</span>
              </button>
            ))}
          </div>
          <div className="space-y-1 pt-4 border-t border-slate-800">
            {universalModules.map(module => (
              <button 
                key={module.id} 
                onClick={() => handleModuleSelect(module.id)} 
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${activeModule === module.id ? (module.id === 'pocket-guides' ? 'bg-amber-600' : 'bg-teal-600') + ' text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                title={module.label}
              >
                <div className="shrink-0">{module.icon}</div>
                <span className={`text-sm font-bold truncate transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>{module.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile-only Close Label at Bottom */}
        <div className={`p-4 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <button onClick={() => setIsSidebarOpen(false)} className="w-full py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-white flex items-center justify-center gap-2">
                <X size={14}/> Close Sidebar
            </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between h-16">
           <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-400 shrink-0">
                <Menu size={20} />
              </button>
              <div className={`p-2 rounded-lg bg-slate-100 ${currentModule.id === 'overview' ? 'text-slate-400' : currentModule.color} shrink-0`}>
                {currentModule.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 leading-none mb-1 truncate">
                    {appMode === 'report' ? 'Institutional Surveillance Hub' : appMode === 'audit' ? 'Quality & Compliance Desk' : 'Executive Data Brief'}
                </span>
                <h1 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight truncate leading-tight">{currentModule.label}</h1>
              </div>
           </div>
        </header>
        <div className="flex-1 p-4 md:p-8">
           <div className="animate-in fade-in duration-500">
              <ActiveComponent 
                isNested={true} 
                type={activeModule === 'manual' ? 'policies' : activeModule === 'references' ? 'pathways' : activeModule === 'pocket-guides' ? 'pocket-guides' : undefined} 
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