import React, { useState, useMemo, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { useAuth } from '../../AuthContext';
import { AREAS } from '../../constants';
import { submitHHAudit, submitActionPlan, getHandHygieneAudits, deleteRecord, updateHHAudit } from '../../services/ipcService';
import { 
    Hand, 
    User, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Plus, 
    Trash2, 
    Save, 
    ShieldCheck,
    Briefcase,
    Zap,
    LayoutList,
    TrendingUp,
    BarChart3,
    Filter,
    RotateCcw,
    Loader2,
    Trophy,
    Star,
    Sparkles,
    MessageSquareQuote,
    List,
    Edit3,
    Search,
    MapPin,
    ChevronLeft,
    PlusCircle,
    // Add missing X icon import
    X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const ROLES = ["Doctor", "Nurse", "Nursing Aide", "Housekeeping", "Rad Tech", "Med Tech", "Respi Tech", "Dietary Staff", "Therapist", "Others (specify)"];
const MOMENTS = ["1. Before touching patient", "2. Before aseptic proc.", "3. After body fluid exposure", "4. After touching patient", "5. After touching surroundings"];
const ACTIONS = ["Hand Rub", "Hand Wash", "Missed"];

interface MomentEntry {
    moment: string;
    action: string;
    usedGloves: boolean;
    remarks?: string;
}

interface Props {
  viewMode?: 'log' | 'list' | 'analysis';
}

const HandHygieneAudit: React.FC<Props> = ({ viewMode: initialViewMode }) => {
    const { user, isAuthenticated, validatePassword } = useAuth();
    const [view, setView] = useState<'log' | 'list' | 'analysis'>(initialViewMode || 'log');
    const [loading, setLoading] = useState(false);
    const [auditHistory, setAuditHistory] = useState<any[]>([]);
    const [showActionPlanModal, setShowActionPlanModal] = useState(false);
    
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        area: '',
        areaOther: '',
        auditeeName: '',
        auditeeRole: '',
        auditeeRoleOther: '',
        moments: [{ moment: '', action: '', usedGloves: false, remarks: '' }] as MomentEntry[]
    };

    const [form, setForm] = useState(initialForm);

    const [apForm, setApForm] = useState({ 
        action: '', 
        targetDate: '', 
        personResponsible: '', 
        category: 'Hand Hygiene',
        area: '',
        areaOther: ''
    });

    useEffect(() => {
        if (view === 'analysis' || view === 'list') loadHistory();
    }, [view]);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getHandHygieneAudits();
        setAuditHistory(data);
        setLoading(false);
    };

    const handleAddMoment = () => {
        if (form.moments.length >= 10) return;
        setForm(prev => ({ ...prev, moments: [...prev.moments, { moment: '', action: '', usedGloves: false, remarks: '' }] }));
    };

    const handleRemoveMoment = (idx: number) => {
        setForm(prev => ({ ...prev, moments: prev.moments.filter((_, i) => i !== idx) }));
    };

    const updateMoment = (idx: number, field: keyof MomentEntry, val: any) => {
        const newMoments = [...form.moments];
        newMoments[idx] = { ...newMoments[idx], [field]: val };
        setForm(prev => ({ ...prev, moments: newMoments }));
    };

    const handleSubmit = async () => {
        setLoading(true);

        const totalMomentsObserved = form.moments.length;
        const actionsPerformed = form.moments.filter(m => m.action === 'Hand Rub' || m.action === 'Hand Wash').length;
        const actionsMissed = form.moments.filter(m => m.action === 'Missed').length;

        await submitHHAudit({ 
            ...form, 
            totalMomentsObserved, 
            actionsPerformed, 
            actionsMissed 
        });

        alert("Direct Observation Logged.");
        setForm(initialForm);
        setLoading(false);
        if (view !== 'log') loadHistory();
    };

    const handleSaveActionPlan = async () => {
        await submitActionPlan(apForm);
        setShowActionPlanModal(false);
        setApForm({ action: '', targetDate: '', personResponsible: '', category: 'Hand Hygiene', area: '', areaOther: '' });
        alert("Action Plan Added.");
    };

    const handleEditItem = (item: any) => {
        setEditingItem({ ...item });
    };

    const handleUpdateItem = async () => {
        if (!editingItem) return;
        setLoading(true);
        try {
            await updateHHAudit(editingItem);
            setEditingItem(null);
            loadHistory();
        } finally {
            setLoading(false);
        }
    };

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

    const stats = useMemo(() => {
        if (auditHistory.length === 0) return null;
        
        const roleCompliance: Record<string, { total: number, performed: number }> = {};
        const areaCompliance: Record<string, { total: number, performed: number }> = {};
        const staffPerformance: Record<string, { total: number, performed: number, role: string }> = {};
        let grandTotal = 0;
        let grandPerformed = 0;

        const filteredByYear = auditHistory.filter(a => {
            const date = a.date ? new Date(a.date) : new Date();
            return date.getFullYear().toString() === selectedYear;
        });

        if (filteredByYear.length === 0) return null;

        filteredByYear.forEach(audit => {
            const role = audit.auditeeRole || 'Other';
            const area = audit.area || 'Unknown';
            const name = audit.auditeeName || 'Unknown Staff';
            
            const totalObserved = audit.totalMomentsObserved !== undefined ? audit.totalMomentsObserved : (audit.moments || []).length;
            const performedCount = audit.actionsPerformed !== undefined ? audit.actionsPerformed : (audit.moments || []).filter((m: any) => m.action !== 'Missed').length;
            
            if (!roleCompliance[role]) roleCompliance[role] = { total: 0, performed: 0 };
            if (!areaCompliance[area]) areaCompliance[area] = { total: 0, performed: 0 };
            if (!staffPerformance[name]) staffPerformance[name] = { total: 0, performed: 0, role };

            roleCompliance[role].total += totalObserved;
            areaCompliance[area].total += totalObserved;
            grandTotal += totalObserved;

            roleCompliance[role].performed += performedCount;
            areaCompliance[area].performed += performedCount;
            grandPerformed += performedCount;

            staffPerformance[name].total += totalObserved;
            staffPerformance[name].performed += performedCount;
        });

        const roleData = Object.entries(roleCompliance).map(([name, data]) => ({
            name,
            compliance: Math.round((data.performed / data.total) * 100)
        }));

        const areaData = Object.entries(areaCompliance).map(([name, data]) => ({
            name,
            score: Math.round((data.performed / data.total) * 100)
        })).sort((a, b) => b.score - a.score).slice(0, 5);

        const champions = Object.entries(staffPerformance)
            .map(([name, data]) => ({
                name,
                role: data.role,
                count: data.performed,
                compliance: Math.round((data.performed / data.total) * 100)
            }))
            .filter(staff => staff.count > 0)
            .sort((a, b) => b.compliance - a.compliance || b.count - a.count)
            .slice(0, 5);

        return { roleData, areaData, champions, overall: Math.round((grandPerformed / grandTotal) * 100) };
    }, [auditHistory, selectedYear]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex bg-gray-100 p-1 rounded-lg h-10">
                    <button onClick={() => setView('log')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}><LayoutList size={14}/> Log</button>
                    <button onClick={() => setView('list')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}><List size={14}/> List</button>
                    <button onClick={() => setView('analysis')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}><TrendingUp size={14}/> Analysis</button>
                </div>
            </div>

            {view === 'log' ? (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Hand size={24} /></div>
                            <div><h2 className="text-xl font-black text-slate-900 uppercase">Direct Observation Audit</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">WHO 5 Moments Recording</p></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Input label="Audit Date" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                        <div className="flex flex-col gap-2">
                            <Select label="Ward" options={AREAS} value={form.area} onChange={e => setForm({...form, area: e.target.value})} />
                            {form.area === 'Other (specify)' && <Input label="Specify Area" value={form.areaOther} onChange={e => setForm({...form, areaOther: e.target.value})} />}
                        </div>
                        <Input label="Auditee Name" value={form.auditeeName} onChange={e => setForm({...form, auditeeName: e.target.value})} placeholder="Full Name" />
                        <div className="flex flex-col gap-2">
                            <Select label="Auditee Role" options={ROLES} value={form.auditeeRole} onChange={e => setForm({...form, auditeeRole: e.target.value})} />
                            {form.auditeeRole === 'Others (specify)' && <Input label="Specify Role" value={form.auditeeRoleOther} onChange={e => setForm({...form, auditeeRoleOther: e.target.value})} />}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">Observations <span className="bg-slate-100 px-2 py-0.5 rounded text-[8px]">{form.moments.length}/10</span></h3>
                        </div>
                        
                        <div className="space-y-3">
                            {form.moments.map((entry, idx) => (
                                <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-4 items-end animate-in fade-in slide-in-from-right-2 duration-300">
                                    <div className="lg:col-span-1 flex items-center justify-center h-full"><span className="text-xs font-black text-slate-400">#{idx + 1}</span></div>
                                    <div className="lg:col-span-4"><Select label="WHO Moment" options={MOMENTS} value={entry.moment} onChange={e => updateMoment(idx, 'moment', e.target.value)} placeholder="Select Moment..." /></div>
                                    <div className="lg:col-span-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Action Taken</label>
                                        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                                            {ACTIONS.map(a => (
                                                <button key={a} type="button" onClick={() => updateMoment(idx, 'action', a)} className={`flex-1 text-[10px] font-black py-1.5 rounded-md transition-all ${entry.action === a ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                    {a === 'Missed' ? '✖' : a === 'Hand Rub' ? '💧' : '🧼'} {a.split(' ')[1] || a}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        {entry.action === 'Missed' && (
                                            <div className="animate-in zoom-in-95">
                                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Used Gloves?</label>
                                                <div className="flex gap-1">
                                                    <button type="button" onClick={() => updateMoment(idx, 'usedGloves', true)} className={`flex-1 text-[10px] font-black py-2 rounded-lg border transition-all ${entry.usedGloves ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>Yes</button>
                                                    <button type="button" onClick={() => updateMoment(idx, 'usedGloves', false)} className={`flex-1 text-[10px] font-black py-2 rounded-lg border transition-all ${!entry.usedGloves ? 'bg-slate-600 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>No</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="lg:col-span-1 flex justify-end">
                                        {form.moments.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveMoment(idx)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                                        )}
                                    </div>
                                    <div className="lg:col-span-11 lg:col-start-2">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"><MessageSquareQuote size={14} /></div>
                                            <input className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white placeholder:text-slate-300 font-bold text-slate-600" placeholder="Remarks (Optional)" value={entry.remarks || ''} onChange={e => updateMoment(idx, 'remarks', e.target.value)}/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={handleAddMoment} disabled={form.moments.length >= 10} className="mt-2 w-full py-3 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 text-emerald-600 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 hover:border-emerald-400 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed">
                            <Plus size={16}/> Add Opportunity
                        </button>
                    </div>

                    <div className="border-t border-slate-100 pt-6 flex flex-col items-center gap-4">
                        <button onClick={handleSubmit} disabled={loading || !form.area || !form.auditeeRole || !form.auditeeName} className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                            {loading ? <Clock size={24} className="animate-spin" /> : <Save size={24} />} Publish Audit Results
                        </button>
                        
                        <button type="button" onClick={() => setShowActionPlanModal(true)} className="w-full h-12 bg-white border-2 border-emerald-100 text-emerald-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 hover:border-emerald-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                            <Zap size={18} className="fill-emerald-600 text-emerald-600" /> Create Correction Action Plan
                        </button>
                    </div>
                </div>
            ) : view === 'list' ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><List size={18}/></div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 uppercase">Audit Records</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historical observation data</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b text-[10px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Auditee</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Ward</th>
                                    <th className="px-6 py-4 text-center">Compliance</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {auditHistory.map(audit => {
                                    const moments = audit.moments || [];
                                    const performed = audit.actionsPerformed !== undefined ? audit.actionsPerformed : moments.filter((m: any) => m.action !== 'Missed').length;
                                    const total = audit.totalMomentsObserved !== undefined ? audit.totalMomentsObserved : moments.length;
                                    const score = total > 0 ? Math.round((performed / total) * 100) : 0;
                                    return (
                                        <tr key={audit.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-3 font-medium text-slate-600">{audit.date}</td>
                                            <td className="px-6 py-3 font-black text-emerald-600 uppercase">{audit.auditeeName}</td>
                                            <td className="px-6 py-3 text-slate-500 text-[10px] font-bold uppercase">{audit.auditeeRole}</td>
                                            <td className="px-6 py-3 font-bold text-slate-700 text-xs">{audit.area}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full font-black text-[9px] border uppercase ${score >= 85 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : score >= 70 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {score}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEditItem(audit)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit3 size={16}/></button>
                                                    <button onClick={() => handleDeleteClick(audit)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                    {loading ? <Loader2 className="animate-spin mx-auto text-slate-300" size={48} /> : !stats ? (
                        <div className="p-20 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Awaiting first audit entry for {selectedYear}</div>
                    ) : (
                        <>
                            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:hidden">
                                <div className="flex items-center gap-3 min-w-max">
                                    <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                                        <Filter size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select className="text-[10px] border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none font-black uppercase bg-slate-50/50 text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                            <option value="2023">2023</option>
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                            <option value="2026">2026</option>
                                        </select>
                                    </div>
                                    <button onClick={() => { setSelectedYear(new Date().getFullYear().toString()); loadHistory(); }} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-all"><RotateCcw size={14} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-emerald-900 p-8 rounded-[2rem] text-white flex flex-col gap-6 overflow-hidden relative shadow-lg">
                                    <div className="z-10 flex flex-col gap-2">
                                        <h2 className="text-3xl font-black tracking-tight uppercase">Compliance Rates</h2>
                                        <p className="text-emerald-300 font-medium text-base">Direct Observation Trends per Staff Group</p>
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Annual {selectedYear} Report</p>
                                    </div>
                                    <div className="z-10 h-64 mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.roleData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#fff', fontSize: 10}} />
                                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#fff', fontSize: 10}} />
                                                <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                                                <Bar dataKey="compliance" fill="#34d399" radius={[6, 6, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="absolute top-0 right-0 p-8 opacity-10 text-white"><Hand size={180} /></div>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] border-2 border-emerald-500 flex flex-col items-center justify-center text-center gap-2 shadow-xl shadow-emerald-500/10">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-600">Institutional Aggregate</span>
                                    <span className="text-6xl font-black text-slate-900">{stats.overall}%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Compliance</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                        <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-3">
                                            <Trophy size={18} className="text-amber-500" /> HH Champions (Top 5)
                                        </h3>
                                        <Star size={16} className="text-amber-400 fill-current" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {stats.champions.map((staff, idx) => (
                                            <div key={staff.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-emerald-500 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-8 rounded-lg flex items-center justify-center font-black text-[10px] ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-400' : idx === 2 ? 'bg-orange-50 text-orange-400' : 'bg-white text-slate-300'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black uppercase text-slate-400 leading-none">{staff.role}</span>
                                                        <span className="text-xs font-black text-slate-800 uppercase truncate max-w-[120px]">{staff.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-base font-black text-emerald-600 leading-none">{staff.compliance}%</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mt-1">{staff.count} Actions</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                        <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-3">
                                            <BarChart3 size={18} className="text-emerald-600" /> Top Performing Areas
                                        </h3>
                                        <ShieldCheck size={16} className="text-emerald-500" />
                                    </div>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.areaData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                                <XAxis type="number" domain={[0, 100]} hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} width={90} />
                                                <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                                                    {stats.areaData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.score > 85 ? '#10b981' : entry.score > 75 ? '#3b82f6' : '#f59e0b'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-slate-50">
                                        <p className="text-[9px] font-bold text-slate-300 italic">Ranking based on year-to-date compliance percentage.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Edit Audit Log</h3>
                                <p className="text-xs opacity-80 font-bold uppercase tracking-widest">{editingItem.auditeeName}</p>
                            </div>
                            {/* Fixed: Added missing X icon import */}
                            <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 flex flex-col gap-6">
                            <Input label="Auditee Name" value={editingItem.auditeeName} onChange={e => setEditingItem({...editingItem, auditeeName: e.target.value})} />
                            <Select label="Role" options={ROLES} value={editingItem.auditeeRole} onChange={e => setEditingItem({...editingItem, auditeeRole: e.target.value})} />
                            <Select label="Ward" options={AREAS} value={editingItem.area} onChange={e => setEditingItem({...editingItem, area: e.target.value})} />
                            <div className="flex gap-4 mt-4">
                                <button onClick={() => setEditingItem(null)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                                <button onClick={handleUpdateItem} className="flex-1 py-3 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-emerald-700 transition-all">Save Changes</button>
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
                title="Confirm Record Deletion"
                description={`Permanently delete the audit record for ${itemToDelete?.auditeeName}?`}
            />

            {showActionPlanModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-emerald-600 p-6 text-white text-center">
                            <Zap size={32} className="mx-auto mb-2" fill="currentColor" />
                            <h3 className="text-lg font-black uppercase">Create Action Plan</h3>
                            <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Hand Hygiene Correction</p>
                        </div>
                        <div className="p-8 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Select label="Target Ward" options={AREAS} value={apForm.area} onChange={e => setApForm({...apForm, area: e.target.value})} />
                            </div>
                            <Input label="Correction Action" value={apForm.action} onChange={e => setApForm({...apForm, action: e.target.value})} placeholder="e.g. Provide pocket alcohol dispensers" />
                            <Input label="Target Date" type="date" value={apForm.targetDate} onChange={e => setApForm({...apForm, targetDate: e.target.value})} />
                            <Input label="Person Responsible" value={apForm.personResponsible} onChange={e => setApForm({...apForm, personResponsible: e.target.value})} />
                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setShowActionPlanModal(false)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl">Cancel</button>
                                <button type="button" onClick={handleSaveActionPlan} className="flex-1 py-3 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-emerald-700 transition-all">Save Action</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HandHygieneAudit;
