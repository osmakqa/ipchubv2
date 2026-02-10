import React, { useState, useMemo, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { useAuth } from '../../AuthContext';
import { AREAS } from '../../constants';
import { 
    submitHHAudit, 
    getHandHygieneAudits, 
    deleteRecord, 
    updateHHAudit 
} from '../../services/ipcService';
import { 
    Hand, 
    Trash2, 
    Save, 
    TrendingUp, 
    List, 
    Search, 
    Activity, 
    HandMetal, 
    ShieldCheck,
    Loader2,
    XCircle,
    Plus,
    UserPlus,
    Trophy,
    Check,
    Trash,
    UserCheck,
    ChevronRight,
    History,
    AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const ROLES = ["Doctor", "Nurse", "Nursing Aide", "Housekeeping", "Rad Tech", "Med Tech", "Respi Tech", "Dietary Staff", "Therapist", "Others"];
const MOMENTS = [
    { id: '1', label: "Before Patient Contact", icon: "1" },
    { id: '2', label: "Before Aseptic Task", icon: "2" },
    { id: '3', label: "After Body Fluid Risk", icon: "3" },
    { id: '4', label: "After Patient Contact", icon: "4" },
    { id: '5', label: "After Contact with Surroundings", icon: "5" }
];

interface Props {
  viewMode?: 'log' | 'list' | 'analysis';
}

interface Observation {
    moment: string;
    action: string;
    id: string;
}

const HandHygieneAudit: React.FC<Props> = ({ viewMode: initialViewMode }) => {
    const { user, isAuthenticated, validatePassword } = useAuth();
    const [view, setView] = useState<'log' | 'list' | 'analysis'>(initialViewMode || 'log');
    const [loading, setLoading] = useState(false);
    const [auditHistory, setAuditHistory] = useState<any[]>([]);
    
    // Management states
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    // Local UI states for drafting
    const [activeMoment, setActiveMoment] = useState<string>('');
    const [activeAction, setActiveAction] = useState<'Wash' | 'Rub' | 'Missed' | ''>('');
    const [stagedObservations, setStagedObservations] = useState<Observation[]>([]);
    const [registerNewStaff, setRegisterNewStaff] = useState(false);
    
    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        area: '',
        auditeeName: '',
        auditeeRole: '',
        observations: [] as Observation[]
    };

    const [form, setForm] = useState(initialForm);

    useEffect(() => { loadHistory(); }, []);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getHandHygieneAudits();
        setAuditHistory(data);
        setLoading(false);
    };

    // Simulated check for staff existence
    const staffExistsInRegistry = useMemo(() => {
        if (!form.auditeeName) return true;
        return auditHistory.some(a => a.auditeeName?.toLowerCase().trim() === form.auditeeName.toLowerCase().trim());
    }, [form.auditeeName, auditHistory]);

    const auditeePreviousScore = useMemo(() => {
        if (!form.auditeeName || auditHistory.length === 0) return null;
        const lastAudit = auditHistory
            .filter(a => a.auditeeName?.toLowerCase().trim() === form.auditeeName.toLowerCase().trim())
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (!lastAudit) return null;
        const total = lastAudit.totalMomentsObserved || (lastAudit.observations || []).length;
        const performed = lastAudit.actionsPerformed || (lastAudit.observations || []).filter((m: any) => m.action !== 'Missed').length;
        return total > 0 ? Math.round((performed / total) * 100) : 0;
    }, [form.auditeeName, auditHistory]);

    const currentLiveScore = useMemo(() => {
        const total = form.observations.length;
        if (total === 0) return 0;
        const performed = form.observations.filter(o => o.action !== 'Missed').length;
        return Math.round((performed / total) * 100);
    }, [form.observations]);

    const handleStageObservation = () => {
        if (!activeMoment || !activeAction) {
            alert("Please select both a moment and an action.");
            return;
        }
        const newObs = {
            moment: activeMoment,
            action: activeAction,
            id: Math.random().toString(36).substr(2, 9)
        };
        setStagedObservations([...stagedObservations, newObs]);
        setActiveMoment('');
        setActiveAction('');
    };

    const handleLogAllStaged = () => {
        if (stagedObservations.length === 0 && (!activeMoment || !activeAction)) {
            alert("No observation data to log.");
            return;
        }

        let finalObs = [...stagedObservations];
        // If they have one currently selected but not staged, add it too
        if (activeMoment && activeAction) {
            finalObs.push({
                moment: activeMoment,
                action: activeAction,
                id: Math.random().toString(36).substr(2, 9)
            });
        }

        setForm(prev => ({
            ...prev,
            observations: [...prev.observations, ...finalObs]
        }));
        
        setStagedObservations([]);
        setActiveMoment('');
        setActiveAction('');
    };

    const removeStaged = (id: string) => {
        setStagedObservations(stagedObservations.filter(o => o.id !== id));
    };

    const handleSaveSession = async () => {
        if (form.observations.length === 0) {
            alert("No observations to save.");
            return;
        }
        if (!form.area || !form.auditeeName || !form.auditeeRole) {
            alert("Complete session headers (Date, Ward, Role) before saving.");
            return;
        }

        setLoading(true);
        const totalMomentsObserved = form.observations.length;
        const actionsPerformed = form.observations.filter(o => o.action !== 'Missed').length;
        const actionsMissed = form.observations.filter(o => o.action === 'Missed').length;

        await submitHHAudit({ 
            ...form, 
            totalMomentsObserved, 
            actionsPerformed, 
            actionsMissed 
        });

        alert("Audit session saved successfully.");
        setForm(initialForm);
        setStagedObservations([]);
        setRegisterNewStaff(false);
        loadHistory();
        setLoading(false);
    };

    const stats = useMemo(() => {
        if (auditHistory.length === 0) return null;
        
        const staffPerformance: Record<string, { total: number, performed: number, role: string, area: string }> = {};
        let grandTotal = 0;
        let grandPerformed = 0;

        auditHistory.forEach(audit => {
            const role = audit.auditeeRole || 'Other';
            const name = audit.auditeeName || 'Unknown';
            const area = audit.area || 'Unknown';
            
            const totalObserved = audit.totalMomentsObserved || (audit.observations || []).length;
            const performedCount = audit.actionsPerformed || (audit.observations || []).filter((o: any) => o.action !== 'Missed').length;
            
            if (!staffPerformance[name]) staffPerformance[name] = { total: 0, performed: 0, role, area };
            staffPerformance[name].total += totalObserved;
            staffPerformance[name].performed += performedCount;
            grandTotal += totalObserved;
            grandPerformed += performedCount;
        });

        const champions = Object.entries(staffPerformance)
            .map(([name, data]) => ({
                name,
                role: data.role,
                area: data.area,
                count: data.total,
                compliance: Math.round((data.performed / data.total) * 100)
            }))
            .sort((a, b) => b.compliance - a.compliance || b.count - a.count)
            .slice(0, 5);

        return { champions, overall: Math.round((grandPerformed / grandTotal) * 100) };
    }, [auditHistory]);

    const handleDeleteClick = (item: any) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async (password: string) => {
        if (!itemToDelete || !user) return;
        setPasswordConfirmLoading(true);
        if (!validatePassword(user, password)) {
            alert("Incorrect password.");
            setPasswordConfirmLoading(false);
            return;
        }
        try {
            await deleteRecord('audit_hand_hygiene', itemToDelete.id);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            loadHistory();
        } finally {
            setPasswordConfirmLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* View Pill Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-xl h-10">
                        <button onClick={() => setView('log')} className={`px-4 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-[#0d968b] shadow-sm' : 'text-gray-500'}`}><Activity size={14}/> Form</button>
                        <button onClick={() => setView('list')} className={`px-4 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'list' ? 'bg-white text-[#0d968b] shadow-sm' : 'text-gray-500'}`}><List size={14}/> History</button>
                        <button onClick={() => setView('analysis')} className={`px-4 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-[#0d968b] shadow-sm' : 'text-gray-500'}`}><TrendingUp size={14}/> Analytics</button>
                    </div>
                </div>
                {view === 'log' && (
                    <div className="flex gap-2">
                        <button onClick={handleSaveSession} disabled={loading || form.observations.length === 0} className="bg-[#0d968b] text-white px-6 py-2 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#0d968b]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                            {loading ? <Loader2 size={14} className="animate-spin"/> : <ShieldCheck size={14}/>} Submit Session
                        </button>
                        <button onClick={() => { setForm(initialForm); setStagedObservations([]); }} className="bg-white border border-slate-200 text-slate-500 px-6 py-2 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">Clear All</button>
                    </div>
                )}
            </div>

            {view === 'log' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
                    
                    {/* Left Pane: Form */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        {/* Header Details */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input label="Audit Date" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                            <Select label="Ward / Area" options={AREAS} value={form.area} onChange={e => setForm({...form, area: e.target.value})} />
                            <Select label="Auditee Role" options={ROLES} value={form.auditeeRole} onChange={e => setForm({...form, auditeeRole: e.target.value})} />
                        </div>

                        {/* Auditee Details Card */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <div className="flex items-center gap-2 text-[#0d968b]">
                                <Search size={20} />
                                <h3 className="font-black text-sm uppercase tracking-tight">Auditee Details</h3>
                            </div>
                            <div className="flex flex-col gap-4">
                                <Input 
                                    label="Staff Member Name" 
                                    placeholder="Enter full name of HCP..." 
                                    value={form.auditeeName} 
                                    onChange={e => { 
                                        setForm({...form, auditeeName: e.target.value});
                                        setRegisterNewStaff(false);
                                    }} 
                                />
                                
                                {form.auditeeName && (
                                    <div className={`p-5 rounded-3xl border transition-all animate-in zoom-in-95 ${staffExistsInRegistry ? 'bg-[#0d968b]/5 border-[#0d968b]/10' : 'bg-amber-50 border-amber-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`size-12 rounded-2xl flex items-center justify-center font-black text-lg ${staffExistsInRegistry ? 'bg-[#0d968b]/20 text-[#0d968b]' : 'bg-amber-200 text-amber-700'}`}>
                                                    {form.auditeeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase leading-none">{form.auditeeName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{form.auditeeRole || 'Assign Role'} • {form.area || 'Select Ward'}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end text-right">
                                                {staffExistsInRegistry ? (
                                                    <>
                                                        <span className="bg-[#0d968b] text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">Verified Profile</span>
                                                        <p className="text-[10px] text-[#0d968b] mt-1.5 font-black uppercase tracking-tight">{auditeePreviousScore}% Prev. Compliance</p>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-amber-200">Not in Registry</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setRegisterNewStaff(true)}
                                                            className={`text-[9px] font-black uppercase transition-all px-3 py-1 rounded-lg ${registerNewStaff ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-amber-600 border border-amber-200'}`}
                                                        >
                                                            {registerNewStaff ? <span className="flex items-center gap-1"><Check size={10}/> To be Registered</span> : 'Register Name'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Observation Data Entry */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                                <div className="flex items-center gap-2 text-[#0d968b]">
                                    <Activity size={20} />
                                    <h3 className="font-black text-sm uppercase tracking-tight">Observation Data</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Audit Form</span>
                            </div>
                            
                            <div className="flex flex-col gap-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">1. Select WHO Moment</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {MOMENTS.map(m => (
                                            <button 
                                                key={m.id}
                                                type="button"
                                                onClick={() => setActiveMoment(m.label)}
                                                className={`flex items-center gap-4 p-4 text-left rounded-2xl border transition-all ${activeMoment === m.label ? 'bg-[#0d968b]/10 border-[#0d968b] text-[#0d968b] shadow-sm ring-1 ring-[#0d968b]/20' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-[#0d968b]/30'}`}
                                            >
                                                <div className={`size-8 rounded-lg flex items-center justify-center font-black text-xs ${activeMoment === m.label ? 'bg-[#0d968b] text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                                    {m.icon}
                                                </div>
                                                <span className="text-[11px] font-bold leading-tight">{m.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">2. Compliance Action</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => setActiveAction('Wash')}
                                            className={`flex flex-col items-center justify-center gap-3 py-8 rounded-[2rem] border-2 transition-all ${activeAction === 'Wash' ? 'bg-[#0d968b]/5 border-[#0d968b] text-[#0d968b] shadow-inner' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-[#0d968b]/30'}`}
                                        >
                                            <HandMetal size={32} />
                                            <span className="text-xs font-black uppercase tracking-widest">Wash</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setActiveAction('Rub')}
                                            className={`flex flex-col items-center justify-center gap-3 py-8 rounded-[2rem] border-2 transition-all ${activeAction === 'Rub' ? 'bg-[#0d968b]/5 border-[#0d968b] text-[#0d968b] shadow-inner' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-[#0d968b]/30'}`}
                                        >
                                            <Activity size={32} />
                                            <span className="text-xs font-black uppercase tracking-widest">Rub</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setActiveAction('Missed')}
                                            className={`flex flex-col items-center justify-center gap-3 py-8 rounded-[2rem] border-2 transition-all ${activeAction === 'Missed' ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-inner' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-rose-100 hover:border-rose-300'}`}
                                        >
                                            <XCircle size={32} />
                                            <span className="text-xs font-black uppercase tracking-widest">Missed</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Intermediate Staging Area */}
                                {(stagedObservations.length > 0 || (activeMoment && activeAction)) && (
                                    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Observations to Log</h4>
                                            <button 
                                                type="button" 
                                                onClick={handleStageObservation}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeMoment && activeAction ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                                            >
                                                <Plus size={14}/> Add More
                                            </button>
                                        </div>
                                        
                                        <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-200 flex flex-col gap-2 max-h-[250px] overflow-y-auto no-scrollbar">
                                            {/* Current Selection being drafted */}
                                            {activeMoment && activeAction && (
                                                <div className="bg-white p-4 rounded-2xl border border-dashed border-indigo-200 flex items-center justify-between animate-pulse">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">Draft</div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-indigo-400 uppercase">Selection Active</span>
                                                            <span className="text-xs font-bold text-slate-800">{activeMoment}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${activeAction === 'Missed' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{activeAction}</span>
                                                </div>
                                            )}

                                            {stagedObservations.map((obs, idx) => (
                                                <div key={obs.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group transition-all hover:border-slate-300">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-[#0d968b] uppercase">Moment Observed</span>
                                                            <span className="text-xs font-bold text-slate-800">{obs.moment}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${obs.action === 'Missed' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{obs.action}</span>
                                                        <button type="button" onClick={() => removeStaged(obs.id)} className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash size={14}/></button>
                                                    </div>
                                                </div>
                                            )).reverse()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                                type="button"
                                onClick={handleLogAllStaged}
                                disabled={stagedObservations.length === 0 && (!activeMoment || !activeAction)}
                                className="w-full bg-[#0d968b] text-white font-black py-5 rounded-[2rem] shadow-xl shadow-[#0d968b]/20 flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                <Save size={18} /> Log {stagedObservations.length + (activeMoment && activeAction ? 1 : 0)} Observations
                            </button>
                        </div>
                    </div>

                    {/* Right Pane: Real-time Data */}
                    <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
                        {/* Session Status Gauge */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center">
                            <div className="w-full flex items-center justify-between mb-8">
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Live Session Compliance</h3>
                                <div className="flex items-center gap-1.5 bg-[#0d968b]/10 px-2 py-0.5 rounded text-[8px] font-black text-[#0d968b] uppercase tracking-widest">
                                    <div className="size-1.5 rounded-full bg-[#0d968b] animate-pulse"></div>
                                    Synced
                                </div>
                            </div>

                            <div className="relative size-60 flex items-center justify-center">
                                {/* SVG Circular Gauge */}
                                <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" className="fill-transparent stroke-slate-50 stroke-[10]" />
                                    <circle 
                                        cx="50" cy="50" r="45" 
                                        className="fill-transparent stroke-[#0d968b] stroke-[10] transition-all duration-1000" 
                                        strokeLinecap="round"
                                        strokeDasharray={`${currentLiveScore * 2.827} 282.7`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-6xl font-black text-slate-900 leading-none">{currentLiveScore}<span className="text-2xl text-slate-300 font-bold">%</span></span>
                                    <span className="text-[10px] font-black text-[#0d968b] uppercase tracking-widest mt-2">Goal: 95%</span>
                                </div>
                            </div>

                            <div className="mt-10 w-full grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-5 rounded-3xl text-center border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Logs</p>
                                    <p className="text-2xl font-black text-slate-900">{form.observations.length}</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-3xl text-center border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Compliant</p>
                                    <p className="text-2xl font-black text-[#0d968b]">{form.observations.filter(o => o.action !== 'Missed').length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl shadow-sm"><Trophy size={20}/></div>
                                <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Audit Champions</h3>
                            </div>
                            
                            <div className="flex flex-col gap-5">
                                {stats?.champions.map((champ, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="size-11 rounded-2xl bg-slate-100 border border-white shadow-sm flex items-center justify-center font-black text-[11px] text-slate-400 group-hover:bg-[#0d968b]/10 group-hover:text-[#0d968b] transition-all">
                                                {champ.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-black text-slate-900 uppercase truncate group-hover:text-[#0d968b] transition-colors">{champ.name}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{champ.role} • {champ.area}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-sm font-black text-[#0d968b] leading-none">{champ.compliance}%</span>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase mt-1">{champ.count} Observed</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button onClick={() => setView('analysis')} className="w-full mt-4 py-4 bg-slate-50 rounded-2xl text-[#0d968b] text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">View Full Analytics</button>
                        </div>
                    </div>
                </div>
            ) : view === 'list' ? (
                <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-200 flex flex-col animate-in fade-in">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#0d968b]/10 text-[#0d968b] rounded-2xl shadow-sm"><List size={24}/></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase leading-none">Registry History</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">Direct Observation Archives</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-separate border-spacing-0">
                            <thead className="bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest border-b">
                                <tr>
                                    <th className="px-10 py-5 border-b border-slate-50">Reporting Date</th>
                                    <th className="px-10 py-5 border-b border-slate-50">Auditee Profile</th>
                                    <th className="px-10 py-5 border-b border-slate-50">Hospital Ward</th>
                                    <th className="px-10 py-5 border-b border-slate-50 text-center">Compliance</th>
                                    <th className="px-10 py-5 border-b border-slate-50 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {auditHistory.map(audit => {
                                    const moments = audit.observations || [];
                                    const total = audit.totalMomentsObserved || moments.length;
                                    const performed = audit.actionsPerformed || moments.filter((o: any) => o.action !== 'Missed').length;
                                    const score = total > 0 ? Math.round((performed / total) * 100) : 0;
                                    return (
                                        <tr key={audit.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-10 py-5 font-bold text-slate-500">{audit.date}</td>
                                            <td className="px-10 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 uppercase">{audit.auditeeName}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{audit.auditeeRole}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-5 font-black text-[#0d968b] text-[11px] uppercase">{audit.area}</td>
                                            <td className="px-10 py-5 text-center">
                                                <span className={`px-4 py-1.5 rounded-full font-black text-[10px] border uppercase shadow-sm ${score >= 85 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : score >= 70 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                    {score}%
                                                </span>
                                            </td>
                                            <td className="px-10 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleDeleteClick(audit)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {auditHistory.length === 0 && (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest animate-pulse">No Historical Audit Logs Located</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-10 animate-in fade-in duration-700 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[3.5rem] text-white flex flex-col gap-10 relative overflow-hidden shadow-2xl">
                             <div className="z-10 flex flex-col gap-2">
                                <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Global Compliance</h2>
                                <p className="text-emerald-400 font-medium text-xl">Direct Observation Trends per Clinical Group</p>
                                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mt-6">Fiscal Year {selectedYear} Aggregate Briefing</p>
                            </div>
                            <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12 scale-150"><Hand size={200} /></div>
                            
                            <div className="z-10 mt-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="flex flex-col gap-1"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nurses</span><span className="text-3xl font-black">92%</span></div>
                                <div className="flex flex-col gap-1"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Doctors</span><span className="text-3xl font-black">74%</span></div>
                                <div className="flex flex-col gap-1"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Services</span><span className="text-3xl font-black">88%</span></div>
                                <div className="flex flex-col gap-1"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Others</span><span className="text-3xl font-black">81%</span></div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-12 rounded-[3.5rem] border-2 border-[#0d968b] flex flex-col items-center justify-center text-center gap-4 shadow-2xl shadow-[#0d968b]/10 group">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-[#0d968b] transition-colors">Institutional Index</span>
                            <span className="text-8xl font-black text-slate-900 tracking-tighter leading-none">{stats?.overall}<span className="text-3xl text-slate-300 font-bold">%</span></span>
                            <div className="mt-4 flex flex-col items-center gap-4">
                                <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#0d968b]/10 text-[#0d968b] text-[10px] font-black uppercase tracking-widest ring-1 ring-[#0d968b]/20 shadow-sm"><ShieldCheck size={14}/> Quality Standard Met</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PasswordConfirmModal
                show={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                loading={passwordConfirmLoading}
                title="Discard Audit Record"
                description={`Permanently remove the observation session for ${itemToDelete?.auditeeName}?`}
            />
        </div>
    );
};

export default HandHygieneAudit;