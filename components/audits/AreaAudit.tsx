
import React, { useState, useEffect, useMemo } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { useAuth } from '../../AuthContext';
import { AREAS } from '../../constants';
import { 
    submitAreaAudit, 
    submitActionPlan, 
    getAreaAudits, 
    deleteRecord, 
    updateAreaAudit 
} from '../../services/ipcService';
import { 
    SearchCode, 
    Save, 
    Clock, 
    Zap, 
    Trash2,
    Hand,
    Layers,
    Info,
    LayoutList,
    TrendingUp,
    BarChart3,
    Filter,
    RotateCcw,
    Sparkles,
    List,
    Edit3,
    Search,
    MapPin,
    ChevronLeft,
    X,
    MessageSquare,
    History,
    CheckCircle2,
    AlertCircle,
    FileUp,
    // Fix: Removed non-existent AddTask, Warning, PriorityHigh imports from lucide-react
    Timer,
    ChevronDown,
    ChevronUp,
    Settings,
    Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AUDIT_CATEGORIES = ["Hand Hygiene Infrastructure", "Environment", "Healthcare Waste Management"];

const CATEGORY_QUESTIONS: Record<string, string[]> = {
    "Hand Hygiene Infrastructure": [
        "Hand washing supplies are available and complete in wash areas (e.g. liquid soap, paper towels, running water).",
        "Hand wash sinks are clean and free from used equipment/inappropriate items.",
        "Cognitive aids promoting hand decontamination are available on all facilities.",
        "Hand sanitizers in dispensers are available, clean and stain free.",
        "The taps are not leaking.",
        "The drainage pipes are not leaking.",
        "Access to hand washing basin is clear (no equipment soaking in sink).",
        "Staff nails are short, clean and free from nail varnish."
    ],
    "Environment": [
        "The external entrance to the facility is clean and tidy.",
        "Floors including corners, edges are free of dust and cobwebs.",
        "All doors and walls are clean.",
        "Window surfaces, frames, tracks and ledges are clean and free of dust/marks.",
        "All high and low surfaces are free from dust and cobwebs.",
        "Air vents are clean and free from excessive dust.",
        "Work station equipment in clinical areas is visibly clean.",
        "Temperature records of medicine fridge are available.",
        "Drug trolley is clean and free from dust, spills, etc.",
        "Bathrooms/washrooms are clean.",
        "Mops and buckets are stored inverted.",
        "Schedule of area cleaning and disinfection is regularly done."
    ],
    "Healthcare Waste Management": [
        "HCWs are aware that a Healthcare Waste Management Policy exists.",
        "Color-coded waste bins are available (black, green and yellow).",
        "Appropriate color-coded bins are located in strategic areas.",
        "Waste bins contain appropriate kind of waste.",
        "Waste bins are covered.",
        "Waste bins are 3/4 full only.",
        "Waste bins are free from dirt, dust, blood and body fluid stain.",
        "Waste bins are free from insects and rodents.",
        "Cognitive aids on waste segregation are displayed."
    ]
};

interface Props {
  viewMode?: 'log' | 'list' | 'analysis';
}

const AreaAudit: React.FC<Props> = ({ viewMode: initialViewMode }) => {
    const { user, isAuthenticated, validatePassword } = useAuth();
    const [view, setView] = useState<'log' | 'list' | 'analysis'>(initialViewMode || 'log');
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState<string>('');
    const [auditHistory, setAuditHistory] = useState<any[]>([]);
    const [showActionPlanModal, setShowActionPlanModal] = useState(false);
    
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

    const [formData, setFormData] = useState<any>({
        date: new Date().toISOString().split('T')[0],
        area: '',
        areaOther: '',
        remarks: '',
        answers: {} as Record<string, string>
    });

    const loadHistory = async () => {
        setLoading(true);
        const data = await getAreaAudits();
        setAuditHistory(data);
        setLoading(false);
    };

    useEffect(() => { loadHistory(); }, []);

    const [apForm, setApForm] = useState({ 
        action: '', 
        targetDate: '', 
        personResponsible: '', 
        category: 'Walkrounds',
        area: '',
        areaOther: ''
    });

    const handleAnswerChange = (q: string, val: string) => {
        setFormData((prev: any) => ({
            ...prev,
            answers: { ...prev.answers, [q]: val }
        }));
    };

    const currentScore = useMemo(() => {
        const answers = Object.values(formData.answers);
        const yesCount = answers.filter(v => v === 'Yes').length;
        const total = answers.filter(v => v !== 'NA' && v !== '').length;
        return total > 0 ? Math.round((yesCount / total) * 100) : 0;
    }, [formData.answers]);

    const flaggedActionsCount = useMemo(() => {
        return Object.values(formData.answers).filter(v => v === 'No').length;
    }, [formData.answers]);

    const previousAudit = useMemo(() => {
        if (!formData.area || !category || auditHistory.length === 0) return null;
        return auditHistory
            .filter(a => a.area === formData.area && a.category === category)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }, [formData.area, category, auditHistory]);

    const previousScore = useMemo(() => {
        if (!previousAudit) return null;
        const answers = Object.values(previousAudit.answers || {});
        const yesCount = answers.filter(v => v === 'Yes').length;
        const total = answers.filter(v => v !== 'NA').length || 1;
        return Math.round((yesCount / total) * 100);
    }, [previousAudit]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!category || !formData.area) {
            alert("Please select category and ward.");
            return;
        }
        setLoading(true);
        await submitAreaAudit({ ...formData, category, score: currentScore });
        alert("Audit Logged.");
        setFormData({
            date: new Date().toISOString().split('T')[0],
            area: '', areaOther: '', remarks: '', answers: {}
        });
        setCategory('');
        setLoading(false);
        loadHistory();
    };

    const handleSaveActionPlan = async () => {
        await submitActionPlan({ ...apForm, category: category ? `Walkround: ${category}` : 'Walkrounds' });
        setShowActionPlanModal(false);
        setApForm({ action: '', targetDate: '', personResponsible: '', category: 'Walkrounds', area: '', areaOther: '' });
        alert("Action Plan Added.");
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
            await deleteRecord('audit_area', itemToDelete.id);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            loadHistory();
        } finally {
            setPasswordConfirmLoading(false);
        }
    };

    const trendData = useMemo(() => {
        if (!formData.area) return [];
        return auditHistory
            .filter(a => a.area === formData.area)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(a => ({
                date: a.date.split('-').slice(1).join('/'),
                score: a.score || 0
            }));
    }, [formData.area, auditHistory]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 min-h-screen pb-32">
            {/* View Pill Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex bg-gray-100 p-1 rounded-xl h-10">
                    <button onClick={() => setView('log')} className={`px-4 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-[#0d968b] shadow-sm' : 'text-gray-500'}`}><LayoutList size={14}/> Form</button>
                    <button onClick={() => setView('list')} className={`px-4 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'list' ? 'bg-white text-[#0d968b] shadow-sm' : 'text-gray-500'}`}><List size={14}/> History</button>
                    <button onClick={() => setView('analysis')} className={`px-4 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-[#0d968b] shadow-sm' : 'text-gray-500'}`}><TrendingUp size={14}/> Analytics</button>
                </div>
            </div>

            {view === 'log' ? (
                <>
                    {/* Header: Context Selection */}
                    <div className="flex flex-wrap items-end justify-between gap-6 mt-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-[#0d968b]/10 text-[#0d968b] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Live Audit</span>
                                <span className="text-slate-400 text-[10px] font-bold">MODE: WALKROUND</span>
                            </div>
                            <h1 className="text-[#111817] text-4xl font-black leading-tight tracking-[-0.033em]">
                                {formData.area ? `${formData.area} Walkround` : "Institutional Walkround"}
                            </h1>
                            <p className="text-slate-500 text-sm font-medium">Environmental Safety & IPC Compliance Inspection</p>
                        </div>
                        <div className="flex gap-4 items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex flex-col items-end px-4 border-r border-slate-100">
                                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Current Compliance</span>
                                <span className="text-3xl font-black text-[#0d968b]">{currentScore}%</span>
                            </div>
                            <button onClick={() => handleSubmit()} className="h-12 px-6 bg-slate-50 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest border border-slate-200 hover:bg-white transition-all">Save Draft</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">
                        {/* Left Column: Form Content */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            {/* Context Card */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#0d968b]/10 text-[#0d968b] rounded-xl"><Settings size={20}/></div>
                                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Audit Parameters</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Input label="Audit Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                                    <Select label="Ward / Area" options={AREAS} value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required />
                                    <Select label="Audit Category" options={AUDIT_CATEGORIES} value={category} onChange={e => { setCategory(e.target.value); setFormData({...formData, answers: {}}); }} required />
                                </div>
                            </div>

                            {category ? (
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                                    <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            {category.includes('Hand') ? <Hand size={18} className="text-[#0d968b]"/> : category.includes('Waste') ? <Trash2 size={18} className="text-[#0d968b]"/> : <Layers size={18} className="text-[#0d968b]"/>}
                                            <h2 className="text-slate-900 text-base font-black uppercase tracking-tight">{category}</h2>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {Object.keys(formData.answers).length} / {CATEGORY_QUESTIONS[category].length} Complete
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {CATEGORY_QUESTIONS[category].map((q, idx) => {
                                            const prevAns = previousAudit?.answers?.[q];
                                            return (
                                                <div key={idx} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-slate-50 transition-colors">
                                                    <div className="flex-1">
                                                        <p className="text-slate-700 text-sm font-bold leading-relaxed">{q}</p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            {prevAns && (
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    Prev: <span className={`italic font-black ${prevAns === 'Yes' ? 'text-[#0d968b]' : prevAns === 'No' ? 'text-rose-500' : ''}`}>{prevAns}</span>
                                                                </span>
                                                            )}
                                                            <span className="text-slate-200">•</span>
                                                            <span className="text-[10px] text-slate-300 font-medium">Standard Protocol 4.2</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        {['Yes', 'No', 'N/A'].map(opt => (
                                                            <button 
                                                                key={opt}
                                                                type="button"
                                                                onClick={() => handleAnswerChange(q, opt)}
                                                                className={`
                                                                    w-16 h-10 rounded-xl border-2 font-black uppercase text-[10px] transition-all
                                                                    ${formData.answers[q] === opt 
                                                                        ? 'bg-[#0d968b] border-[#0d968b] text-white shadow-lg scale-105' 
                                                                        : 'bg-white border-slate-100 text-slate-300 hover:border-[#0d968b]/30 hover:text-[#0d968b]'}
                                                                `}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
                                    <Info size={40} className="text-slate-200" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Select a category above to load the checklist</p>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Sidebar */}
                        <aside className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
                            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#0d968b]/20 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-[#0d968b]/10 text-[#0d968b] rounded-2xl"><History size={24}/></div>
                                    <div>
                                        <p className="text-[#0d968b] text-[9px] font-black uppercase tracking-[0.2em] leading-none">Intelligence Engine</p>
                                        <h3 className="text-slate-900 text-lg font-black uppercase tracking-tight mt-1">Historical Context</h3>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Last Audit Score</span>
                                        <span className="text-xl font-black text-slate-900">{previousScore ? `${previousScore}%` : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Last Inspection</span>
                                        <span className="text-xs font-black text-slate-900 uppercase">
                                            {previousAudit ? new Date(previousAudit.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}
                                        </span>
                                    </div>
                                </div>

                                {formData.area && (
                                    <div className="flex flex-col gap-4">
                                        <p className="text-slate-900 text-[10px] font-black uppercase tracking-widest">Recurring Issues (Last 3):</p>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-3 items-start p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                                <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                                                <p className="text-[11px] font-bold text-rose-700 leading-relaxed">Infrastructure damage has been flagged in multiple previous inspections.</p>
                                            </div>
                                            <div className="flex gap-3 items-start p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                                <p className="text-[11px] font-bold text-amber-700 leading-relaxed">Staff awareness regarding waste segregation requires continuous monitoring.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="w-full aspect-[16/9] bg-slate-50 rounded-[1.5rem] border border-slate-100 overflow-hidden relative group">
                                    {trendData.length > 0 ? (
                                        <div className="p-4 h-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={trendData}>
                                                    <defs>
                                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#0d968b" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#0d968b" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <Area type="monotone" dataKey="score" stroke="#0d968b" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-[8px] font-black text-[#0d968b] uppercase tracking-widest bg-white/80 px-2 py-1 rounded-full shadow-sm">Trend Analysis</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-300 font-black text-[10px] uppercase tracking-widest">No Trend Data</div>
                                    )}
                                </div>

                                <button onClick={() => setView('list')} className="w-full h-12 bg-slate-50 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest border border-slate-200 hover:bg-slate-100 transition-all">View Full History</button>
                            </div>

                            <div className="bg-[#0d968b] p-6 rounded-[2.5rem] text-white flex flex-col gap-4 shadow-xl">
                                <div className="flex items-center gap-3">
                                    <Clock size={20} className="text-white/50" />
                                    <span className="text-sm font-black uppercase">Progress Tracker</span>
                                </div>
                                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-white transition-all duration-1000" 
                                        style={{ width: `${(Object.keys(formData.answers).length / (CATEGORY_QUESTIONS[category]?.length || 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] font-bold text-white/70 uppercase">
                                    {Object.keys(formData.answers).length} of {CATEGORY_QUESTIONS[category]?.length || 0} items inspected
                                </p>
                            </div>
                        </aside>
                    </div>

                    {/* Bottom Sticky Footer */}
                    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 md:px-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 animate-in slide-in-from-bottom-full duration-500">
                        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6">
                            <div className="hidden md:flex items-center gap-8">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Current Score</span>
                                    <span className="text-2xl font-black text-[#0d968b]">{currentScore}% {currentScore >= 85 ? '(Pass)' : '(Deficient)'}</span>
                                </div>
                                <div className="h-10 w-px bg-slate-100"></div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Flagged Actions</span>
                                    <span className={`text-2xl font-black ${flaggedActionsCount > 0 ? 'text-rose-500' : 'text-slate-300'}`}>{flaggedActionsCount} Detected</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none h-14 px-8 bg-slate-50 border-2 border-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3">
                                    <FileUp size={18}/> Attach Photos
                                </button>
                                <button 
                                    onClick={() => { if(flaggedActionsCount > 0) { setApForm({...apForm, area: formData.area}); setShowActionPlanModal(true); } else { handleSubmit(); } }}
                                    className="flex-1 md:flex-none h-14 px-10 bg-[#0d968b] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-[#0d968b]/20 hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    {flaggedActionsCount > 0 ? <><Zap size={18} fill="white"/> Create Action Plan</> : <><Save size={18}/> Publish Audit</>}
                                </button>
                            </div>
                        </div>
                    </footer>
                </>
            ) : view === 'list' ? (
                <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 flex flex-col animate-in fade-in duration-500">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#0d968b]/10 text-[#0d968b] rounded-2xl shadow-sm"><List size={24}/></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase leading-none">Walkround History</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">Environmental Surveillance Archives</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-separate border-spacing-0">
                            <thead className="bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest border-b">
                                <tr>
                                    <th className="px-10 py-5">Date</th>
                                    <th className="px-10 py-5">Ward</th>
                                    <th className="px-10 py-5">Category</th>
                                    <th className="px-10 py-5 text-center">Score</th>
                                    <th className="px-10 py-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {auditHistory.map(audit => (
                                    <tr key={audit.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-10 py-5 font-bold text-slate-500">{audit.date}</td>
                                        <td className="px-10 py-5 font-black text-[#0d968b] uppercase">{audit.area}</td>
                                        <td className="px-10 py-5 text-slate-400 text-[10px] font-black uppercase tracking-tight">{audit.category}</td>
                                        <td className="px-10 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-full font-black text-[10px] border uppercase shadow-sm ${audit.score >= 85 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : audit.score >= 70 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                {audit.score}%
                                            </span>
                                        </td>
                                        <td className="px-10 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => { setFormData({...audit}); setCategory(audit.category); setView('log'); }} className="p-2.5 text-slate-300 hover:text-[#0d968b] hover:bg-[#0d968b]/5 rounded-xl transition-all"><Edit3 size={18}/></button>
                                                <button onClick={() => handleDeleteClick(audit)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Analytics View Placeholder */
                <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-200">
                    <TrendingUp size={48} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-lg font-black text-slate-900 uppercase">Institutional Safety Trends</h3>
                    <p className="text-sm text-slate-500 mt-2">Aggregate data visualization for Ward Performance over time.</p>
                </div>
            )}

            <PasswordConfirmModal
                show={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                loading={passwordConfirmLoading}
                title="Discard Walkround Record"
                description={`Permanently remove the audit session for ${itemToDelete?.area}?`}
            />

            {showActionPlanModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#0d968b] p-8 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Zap size={120} fill="white"/></div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">Close the Loop</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">Audit Deficiency Correction Plan</p>
                        </div>
                        <div className="p-10 flex flex-col gap-6">
                            <Select label="Target Ward" options={AREAS} value={apForm.area} onChange={e => setApForm({...apForm, area: e.target.value})} required />
                            <Input label="Corrective Action" value={apForm.action} onChange={e => setApForm({...apForm, action: e.target.value})} placeholder="Describe steps to fix issue..." required />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Target Date" type="date" value={apForm.targetDate} onChange={e => setApForm({...apForm, targetDate: e.target.value})} required />
                                <Input label="Responsible Person" value={apForm.personResponsible} onChange={e => setApForm({...apForm, personResponsible: e.target.value})} placeholder="Name" required />
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button type="button" onClick={() => setShowActionPlanModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                                <button type="button" onClick={handleSaveActionPlan} className="flex-1 py-4 bg-[#0d968b] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-[#0d968b]/20 transition-all hover:brightness-110 active:scale-95">Save Action Plan</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AreaAudit;
