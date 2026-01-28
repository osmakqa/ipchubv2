import React, { useState, useEffect, useMemo } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { useAuth } from '../../AuthContext';
import { getCensusLogs, submitCensusLog, getHAIReports, calculateInfectionRates, deleteCensusLog, updateCensusLog } from '../../services/ipcService';
import { AREAS } from '../../constants';
import { 
    Activity, 
    ClipboardList, 
    Save, 
    Clock, 
    Wind, 
    Droplets, 
    Syringe, 
    LayoutList,
    TrendingUp,
    Hash,
    CalendarX,
    List,
    Edit3,
    Trash2,
    Search,
    Users,
    X,
    BedDouble,
    CalendarDays,
    Check,
    Sparkles,
    Filter,
    ChevronRight,
    LayoutGrid
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    CartesianGrid, Legend
} from 'recharts';

// Helper to generate database-safe keys from ward names
const getWardSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const EXCLUDED_FROM_SURVEILLANCE = [
    "Chemotherapy Unit", 
    "Ambulatory Care Medicine Complex", 
    "Surgical Care Complex", 
    "LRDR",
    "Dialysis Unit",
    "Surgery Isolation Room",
    "Medicine Isolation Room",
    "ER Isolation Room"
];

const ALL_WARDS = AREAS.filter(a => a !== 'Other (specify)' && !EXCLUDED_FROM_SURVEILLANCE.includes(a));

const DEVICE_OPTIONS = Array.from({ length: 31 }, (_, i) => i.toString());

interface Props {
  isNested?: boolean;
  viewMode?: 'log' | 'list' | 'analysis';
}

const HAIDataDashboard: React.FC<Props> = ({ isNested, viewMode: initialViewMode }) => {
    const { user, isAuthenticated, validatePassword } = useAuth();
    const [view, setView] = useState<'log' | 'list' | 'analysis'>(initialViewMode || 'log');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [infections, setInfections] = useState<any[]>([]);
    
    const [editingLog, setEditingLog] = useState<any | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [logToDelete, setLogToDelete] = useState<string | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

    // Search and Filter for Wards
    const [wardSearch, setWardSearch] = useState('');
    const [activeOnly, setActiveOnly] = useState(false);

    // Device Table state - keyed by ward slug
    const [deviceGrid, setDeviceGrid] = useState<Record<string, { vent: string, ifc: string, central: string }>>({});

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        overallCensus: '',
        icuCensus: '',
        picuCensus: '',
        nicuCensus: '',
        medicineCensus: '',
        cohortCensus: ''
    });

    // Initialize grid for all wards
    useEffect(() => {
        const initialGrid: Record<string, any> = {};
        ALL_WARDS.forEach(w => {
            initialGrid[getWardSlug(w)] = { vent: '', ifc: '', central: '' };
        });
        setDeviceGrid(initialGrid);
    }, []);

    useEffect(() => { 
        if (initialViewMode) setView(initialViewMode); 
    }, [initialViewMode]);

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (view === 'log' && Object.keys(deviceGrid).length > 0) {
            const existingLog = logs.find(l => l.date === formData.date);
            if (existingLog) {
                setFormData(prev => ({
                    ...prev,
                    overallCensus: existingLog.overall?.toString() || '',
                    icuCensus: existingLog.icu?.toString() || '',
                    picuCensus: existingLog.picu?.toString() || '',
                    nicuCensus: existingLog.nicu?.toString() || '',
                    medicineCensus: existingLog.medicine?.toString() || '',
                    cohortCensus: existingLog.cohort?.toString() || ''
                }));
                
                const newGrid: any = {};
                ALL_WARDS.forEach(w => {
                    const slug = getWardSlug(w);
                    newGrid[slug] = {
                        vent: existingLog[`${slug}Vent`]?.toString() || '',
                        ifc: existingLog[`${slug}Ifc`]?.toString() || '',
                        central: existingLog[`${slug}Central`]?.toString() || ''
                    };
                });
                setDeviceGrid(newGrid);
            } else {
                setFormData(prev => ({
                    ...prev,
                    overallCensus: '', icuCensus: '', picuCensus: '', nicuCensus: '', medicineCensus: '', cohortCensus: ''
                }));
                const resetGrid: any = {};
                ALL_WARDS.forEach(w => {
                    resetGrid[getWardSlug(w)] = { vent: '', ifc: '', central: '' };
                });
                setDeviceGrid(resetGrid);
            }
        }
    }, [formData.date, logs, view]);

    const loadData = async () => {
        setLoading(true);
        const [cLogs, hReports] = await Promise.all([getCensusLogs(), getHAIReports()]);
        setLogs(cLogs);
        setInfections(hReports);
        setLoading(false);
    };

    const updateGridCell = (slug: string, device: 'vent' | 'ifc' | 'central', value: string) => {
        setDeviceGrid(prev => ({
            ...prev,
            [slug]: { ...prev[slug], [device]: value }
        }));
    };

    const handleInputChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: any = {
            date: formData.date,
            overall: parseInt(formData.overallCensus || '0', 10),
            icu: parseInt(formData.icuCensus || '0', 10),
            picu: parseInt(formData.picuCensus || '0', 10),
            nicu: parseInt(formData.nicuCensus || '0', 10),
            medicine: parseInt(formData.medicineCensus || '0', 10),
            cohort: parseInt(formData.cohortCensus || '0', 10),
        };
        
        let totalVent = 0, totalIfc = 0, totalCentral = 0;

        ALL_WARDS.forEach(w => {
            const slug = getWardSlug(w);
            const v = parseInt(deviceGrid[slug]?.vent || '0', 10);
            const i = parseInt(deviceGrid[slug]?.ifc || '0', 10);
            const c = parseInt(deviceGrid[slug]?.central || '0', 10);
            
            payload[`${slug}Vent`] = v;
            payload[`${slug}Ifc`] = i;
            payload[`${slug}Central`] = c;
            
            totalVent += v;
            totalIfc += i;
            totalCentral += c;
        });

        payload.overallVent = totalVent;
        payload.overallIfc = totalIfc;
        payload.overallCentral = totalCentral;

        try {
            await submitCensusLog(payload);
            alert("Institutional Census Logged Successfully.");
            loadData();
        } catch (error) {
            alert("Failed to save entry.");
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => calculateInfectionRates(logs, infections), [logs, infections]);

    const filteredWards = useMemo(() => {
        let list = ALL_WARDS;
        if (wardSearch) {
            list = list.filter(w => w.toLowerCase().includes(wardSearch.toLowerCase()));
        }
        if (activeOnly) {
            list = list.filter(w => {
                const s = getWardSlug(w);
                return deviceGrid[s]?.vent || deviceGrid[s]?.ifc || deviceGrid[s]?.central;
            });
        }
        return list;
    }, [wardSearch, activeOnly, deviceGrid]);

    const currentDayLog = useMemo(() => {
        return logs.find(l => l.date === formData.date);
    }, [logs, formData.date]);

    const missingDates = useMemo(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const missing = [];
        const current = new Date(startOfMonth);
        
        while (current <= yesterday) {
            const dateStr = current.toISOString().split('T')[0];
            const hasLog = logs.some(l => l.date === dateStr);
            if (!hasLog) {
                missing.push(dateStr);
            }
            current.setDate(current.getDate() + 1);
        }
        return missing.reverse();
    }, [logs]);

    const handleEditLog = (log: any) => setEditingLog({ ...log });

    const handleUpdateLog = async () => {
        if (!editingLog) return;
        setLoading(true);
        try {
            await updateCensusLog(editingLog);
            setEditingLog(null);
            loadData();
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (date: string) => {
        setLogToDelete(date);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async (password: string) => {
        if (!logToDelete || !user) return;
        setPasswordConfirmLoading(true);
        if (!validatePassword(user, password)) {
            alert("Incorrect password.");
            setPasswordConfirmLoading(false);
            return;
        }
        try {
            await deleteCensusLog(logToDelete);
            setShowDeleteConfirm(false);
            setLogToDelete(null);
            loadData();
        } finally {
            setPasswordConfirmLoading(false);
        }
    };

    const RateCard = ({ title, rates }: { title: string, rates: any }) => (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50 pb-2">{title}</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">HAP</span><span className="text-xl font-black text-slate-800">{rates.hap}</span></div>
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">VAP</span><span className="text-xl font-black text-blue-600">{rates.vap}</span></div>
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">CAUTI</span><span className="text-xl font-black text-amber-600">{rates.cauti}</span></div>
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">CLABSI</span><span className="text-xl font-black text-red-600">{rates.clabsi}</span></div>
            </div>
            <div className="mt-2 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase text-slate-500">Aggregate</span>
                <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black">{rates.overall}</span>
            </div>
        </div>
    );

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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        <form onSubmit={handleLogSubmit} className="bg-white p-4 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8 md:gap-10 animate-in fade-in duration-500">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 md:p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-sm"><ClipboardList size={24}/></div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase leading-none tracking-tight">Institutional Census</h2>
                                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">Daily Surveillance Registry</p>
                                    </div>
                                </div>
                                <div className="w-full md:w-56">
                                    <Input label="Registry Date" type="date" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} required />
                                </div>
                            </div>

                            {/* Section A: Patient Census */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><BedDouble size={18}/></div>
                                    <h3 className="text-[10px] md:text-sm font-black uppercase text-slate-900 tracking-wider">A. Patient Census Summary</h3>
                                </div>
                                
                                <div className="overflow-hidden rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-inner bg-slate-50/30">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-emerald-600 text-white">
                                                <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-left">Ward Category</th>
                                                <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center">Count</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white/50">
                                            {[
                                                { label: 'Hospital Overall', key: 'overallCensus' },
                                                { label: 'Intensive Care (ICU)', key: 'icuCensus' },
                                                { label: 'Pedia ICU (PICU)', key: 'picuCensus' },
                                                { label: 'Neonatal ICU (NICU)', key: 'nicuCensus' },
                                                { label: 'Medicine Ward', key: 'medicineCensus' }
                                            ].map((row) => (
                                                <tr key={row.key} className="hover:bg-white transition-colors group">
                                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                                        <span className="text-[10px] md:text-xs font-black text-slate-700 uppercase">{row.label}</span>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                                        <div className="relative max-w-[100px] md:max-w-[120px] mx-auto">
                                                            <input 
                                                                type="number"
                                                                className={`
                                                                    w-full h-10 md:h-12 rounded-xl border-2 transition-all text-center font-black text-base md:text-lg
                                                                    ${(formData as any)[row.key] ? 'bg-white border-emerald-500 text-emerald-600 shadow-sm' : 'bg-white/30 border-transparent text-slate-300 hover:border-slate-200'}
                                                                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none
                                                                `}
                                                                placeholder="0"
                                                                value={(formData as any)[row.key]}
                                                                onChange={(e) => handleInputChange(row.key, e.target.value)}
                                                            />
                                                            {(formData as any)[row.key] && (
                                                                <div className="absolute -top-1 -right-1 pointer-events-none text-emerald-500 bg-white rounded-full shadow-sm">
                                                                    <Check size={14} strokeWidth={4} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Section B: Device Surveillance - Mobile Optimized Card Grid */}
                            <div className="flex flex-col gap-6 pt-6 border-t border-slate-100">
                                <div className="sticky top-0 z-20 bg-white pb-4 flex flex-col gap-4">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Activity size={18}/></div>
                                            <h3 className="text-[10px] md:text-sm font-black uppercase text-slate-900 tracking-wider">B. Device Surveillance</h3>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setActiveOnly(!activeOnly)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${activeOnly ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                                        >
                                            <LayoutGrid size={12}/> {activeOnly ? 'Active Only' : 'All Wards'}
                                        </button>
                                    </div>
                                    
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text"
                                            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Find hospital area..."
                                            value={wardSearch}
                                            onChange={(e) => setWardSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                {/* TABLE VIEW (Desktop) / CARD VIEW (Mobile) */}
                                <div className="grid grid-cols-1 gap-4 md:gap-0 md:block">
                                    {/* Desktop Header Hidden on Mobile */}
                                    <div className="hidden md:grid grid-cols-12 bg-slate-900 text-white rounded-t-3xl overflow-hidden py-4 px-6 mb-px">
                                        <div className="col-span-6 text-[10px] font-black uppercase tracking-widest">Hospital Ward</div>
                                        <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-1"><Wind size={14} className="text-blue-400"/> Ventilator</div>
                                        <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-1"><Droplets size={14} className="text-amber-400"/> Catheter</div>
                                        <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-1"><Syringe size={14} className="text-rose-400"/> Central Line</div>
                                    </div>

                                    <div className="flex flex-col gap-4 md:gap-0">
                                        {filteredWards.map((w, idx) => {
                                            const slug = getWardSlug(w);
                                            return (
                                                <div 
                                                    key={slug} 
                                                    className={`
                                                        bg-white md:bg-transparent rounded-2xl md:rounded-none border border-slate-200 md:border-b md:border-x-0 md:border-t-0 p-5 md:p-0 
                                                        md:grid md:grid-cols-12 md:items-center hover:bg-slate-50 transition-colors duration-200 group
                                                        ${idx % 2 === 0 ? 'md:bg-white/30' : 'md:bg-white/60'}
                                                    `}
                                                >
                                                    <div className="col-span-6 md:px-6 mb-4 md:mb-0">
                                                        <span className="text-xs md:text-sm font-black text-slate-700 uppercase flex items-center gap-2">
                                                            <div className="md:hidden size-1.5 rounded-full bg-blue-500"></div>
                                                            {w}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Row of Inputs - Desktop standard, Mobile grid */}
                                                    <div className="grid grid-cols-3 md:col-span-6 gap-2 md:gap-0 md:pr-4">
                                                        {[
                                                            { type: 'vent', color: 'blue', icon: Wind },
                                                            { type: 'ifc', color: 'amber', icon: Droplets },
                                                            { type: 'central', color: 'rose', icon: Syringe }
                                                        ].map((d) => (
                                                            <div key={d.type} className="flex flex-col md:block gap-1.5 col-span-1 md:px-2 py-0 md:py-3">
                                                                <div className="md:hidden flex items-center justify-center mb-1">
                                                                    <d.icon size={12} className={`text-${d.color}-500`} />
                                                                </div>
                                                                <div className="relative">
                                                                    <select 
                                                                        className={`
                                                                            w-full h-11 md:h-12 rounded-xl md:rounded-lg border-2 transition-all cursor-pointer appearance-none text-center font-black text-base
                                                                            ${deviceGrid[slug]?.[d.type as any] ? `bg-white border-${d.color}-500 text-${d.color}-600 shadow-sm` : 'bg-slate-50/50 md:bg-white/30 border-transparent text-slate-300 hover:border-slate-200'}
                                                                            focus:ring-2 focus:ring-${d.color}-500 outline-none
                                                                        `}
                                                                        value={deviceGrid[slug]?.[d.type as any] || ''}
                                                                        onChange={(e) => updateGridCell(slug, d.type as any, e.target.value)}
                                                                    >
                                                                        <option value="">-</option>
                                                                        {DEVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                    {deviceGrid[slug]?.[d.type as any] && (
                                                                        <div className={`absolute -top-1 -right-1 pointer-events-none text-${d.color}-500 bg-white rounded-full shadow-sm`}>
                                                                            <Check size={12} strokeWidth={4} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {filteredWards.length === 0 && (
                                            <div className="p-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
                                                <Search size={40} className="text-slate-200" />
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No matching areas found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase italic text-center px-4 tracking-tight leading-relaxed">Registry totals for Patient and Device days are calculated globally upon submission.</p>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button disabled={loading} className="w-full md:w-fit h-16 bg-slate-900 text-white px-16 rounded-2xl md:rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                                    {loading ? <Clock size={24} className="animate-spin" /> : <Save size={24} />} 
                                    Submit Surveillance Data
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24 print:hidden">
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl"><Hash size={24}/></div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase leading-none">Day Snapshot</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(formData.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                            
                            {!currentDayLog ? (
                                <div className="py-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center gap-4">
                                    <Clock size={32} className="text-slate-200" />
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Awaiting Surveillance Entry</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
                                        <div className="flex items-center gap-3"><Users size={18} className="text-emerald-400"/><span className="font-black text-xs uppercase tracking-wider">Total Census</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overall || '0'}</span>
                                    </div>
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
                                        <div className="flex items-center gap-3"><Wind size={18} className="text-blue-400"/><span className="font-black text-xs uppercase tracking-wider">Vent Days</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overallVent || '0'}</span>
                                    </div>
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
                                        <div className="flex items-center gap-3"><Droplets size={18} className="text-amber-400"/><span className="font-black text-xs uppercase tracking-wider">IFC Days</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overallIfc || '0'}</span>
                                    </div>
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
                                        <div className="flex items-center gap-3"><Syringe size={18} className="text-rose-400"/><span className="font-black text-xs uppercase tracking-wider">Central Days</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overallCentral || '0'}</span>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-2">
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Detailed Breakdown</h3>
                                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {ALL_WARDS.map(w => {
                                                const slug = getWardSlug(w);
                                                const vCount = currentDayLog[`${slug}Vent`] || 0;
                                                const iCount = currentDayLog[`${slug}Ifc`] || 0;
                                                const cCount = currentDayLog[`${slug}Central`] || 0;
                                                if (vCount === 0 && iCount === 0 && cCount === 0) return null;

                                                return (
                                                    <div key={slug} className="group p-3 rounded-xl border bg-white border-slate-100 flex items-center justify-between animate-in fade-in">
                                                        <span className="text-[10px] font-black uppercase text-slate-600 truncate mr-4">{w}</span>
                                                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                                                            <div className="flex items-center gap-1"><span>V:</span><span className="font-black text-blue-600">{vCount}</span></div>
                                                            <div className="flex items-center gap-1"><span>I:</span><span className="font-black text-amber-600">{iCount}</span></div>
                                                            <div className="flex items-center gap-1"><span>C:</span><span className="font-black text-rose-600">{cCount}</span></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-6 border-t border-slate-100 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CalendarX size={18} className="text-rose-500" />
                                        <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight">Missing Records</h3>
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{missingDates.length} days</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {missingDates.slice(0, 6).map(d => (
                                        <button key={d} onClick={() => setFormData(prev => ({...prev, date: d}))} className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase hover:bg-rose-100 transition-all active:scale-95">
                                            {new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : view === 'list' ? (
                <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-md overflow-hidden border border-gray-200 flex flex-col animate-in fade-in duration-500">
                    <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><List size={22}/></div>
                            <div>
                                <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase leading-none">Registry History</h2>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Census Archives</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b text-[9px] md:text-[10px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Registry Date</th>
                                    <th className="px-6 py-4">Total Patients</th>
                                    <th className="px-4 py-4 text-blue-600">Vent Days</th>
                                    <th className="px-4 py-4 text-amber-600">IFC Days</th>
                                    <th className="px-4 py-4 text-rose-600">Central Days</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map(log => (
                                    <tr key={log.date} className="hover:bg-indigo-50 transition-colors group">
                                        <td className="px-6 py-3 font-black text-slate-900">{log.date}</td>
                                        <td className="px-6 py-3 font-bold text-slate-600">{log.overall || 0}</td>
                                        <td className="px-4 py-3 font-bold text-blue-600">{log.overallVent || 0}</td>
                                        <td className="px-4 py-3 font-bold text-amber-600">{log.overallIfc || 0}</td>
                                        <td className="px-4 py-3 font-bold text-rose-600">{log.overallCentral || 0}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => { setFormData(prev => ({...prev, date: log.date})); setView('log'); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={16}/></button>
                                                <button onClick={() => handleDeleteClick(log.date)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-white flex flex-col gap-8 md:gap-10 relative overflow-hidden shadow-2xl">
                            <div className="z-10 flex flex-col gap-2">
                                <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none">Infection Rates</h2>
                                <p className="text-slate-400 font-medium text-lg md:text-xl">Incidence per 1,000 Patient/Device Days</p>
                            </div>
                            <div className="z-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-4">
                                <div className="flex flex-col gap-1"><span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">HAP Rate</span><span className="text-3xl md:text-4xl font-black">{stats.overall.hap}</span></div>
                                <div className="flex flex-col gap-1"><span className="text-[10px] font-black uppercase tracking-widest text-blue-400">VAP Rate</span><span className="text-3xl md:text-4xl font-black">{stats.overall.vap}</span></div>
                                <div className="flex flex-col gap-1"><span className="text-[10px] font-black uppercase tracking-widest text-amber-400">CAUTI Rate</span><span className="text-3xl md:text-4xl font-black">{stats.overall.cauti}</span></div>
                                <div className="flex flex-col gap-1"><span className="text-[10px] font-black uppercase tracking-widest text-rose-400">CLABSI Rate</span><span className="text-3xl md:text-4xl font-black">{stats.overall.clabsi}</span></div>
                            </div>
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12"><Activity size={200} /></div>
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] border-2 border-primary flex flex-col items-center justify-center text-center gap-3 shadow-xl shadow-primary/5">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Aggregate Load</span>
                            <span className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">{stats.overall.overall}</span>
                            <div className="mt-4 flex flex-col items-center">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Institutional Index</span>
                                <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest"><TrendingUp size={14}/> Quality Validated</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 pb-6 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shadow-sm"><CalendarDays size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight leading-none">Surveillance Trends</h3>
                                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">Historical Device-Day Distribution</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-5 py-2 rounded-xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archive Window: Last 12 Months</span></div>
                        </div>
                        <div className="overflow-x-auto rounded-[2rem] border border-slate-50 bg-slate-50/30">
                            <table className="w-full text-sm text-left min-w-[800px] border-separate border-spacing-0">
                                <thead className="bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-8 py-5 border-b border-slate-100">Reporting Date</th>
                                        <th className="px-8 py-5 border-b border-slate-100">Hosp. Census</th>
                                        <th className="px-8 py-5 border-b border-slate-100 text-blue-600">MV Days</th>
                                        <th className="px-8 py-5 border-b border-slate-100 text-amber-600">IFC Days</th>
                                        <th className="px-8 py-5 border-b border-slate-100 text-rose-600">CVC Days</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {logs.slice(0, 12).map(m => (
                                        <tr key={m.date} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-5 font-black text-slate-900 border-r border-slate-50">{m.date}</td>
                                            <td className="px-8 py-5 font-bold text-slate-700">{(m.overall || 0).toLocaleString()}</td>
                                            <td className="px-8 py-5 font-black text-blue-700">{(m.overallVent || 0).toLocaleString()}</td>
                                            <td className="px-8 py-5 font-black text-amber-700">{(m.overallIfc || 0).toLocaleString()}</td>
                                            <td className="px-8 py-5 font-black text-rose-700">{(m.overallCentral || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest animate-pulse">No Historical Surveillance Logs Located</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <RateCard title="Intensive Care (ICU)" rates={stats.icu} />
                        <RateCard title="Pedia ICU (PICU)" rates={stats.picu} />
                        <RateCard title="Neonatal ICU (NICU)" rates={stats.nicu} />
                        <RateCard title="Medicine Ward" rates={stats.medicine} />
                        <RateCard title="Cohort Unit" rates={stats.cohort} />
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingLog && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Edit Surveillance Log</h3>
                                <p className="text-xs opacity-80 font-bold uppercase tracking-widest">{editingLog.date}</p>
                            </div>
                            <button onClick={() => setEditingLog(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
                            <div className="flex flex-col gap-4">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Global Aggregates</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Total Patients" type="number" value={editingLog.overall} onChange={e => setEditingLog({...editingLog, overall: e.target.value})} placeholder="0" />
                                    <Input label="Total Vent Days" type="number" value={editingLog.overallVent} onChange={e => setEditingLog({...editingLog, overallVent: e.target.value})} placeholder="0" />
                                    <Input label="Total IFC Days" type="number" value={editingLog.overallIfc} onChange={e => setEditingLog({...editingLog, overallIfc: e.target.value})} placeholder="0" />
                                    <Input label="Total Central Days" type="number" value={editingLog.overallCentral} onChange={e => setEditingLog({...editingLog, overallCentral: e.target.value})} placeholder="0" />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-4 mt-2">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Rate-Critical Units</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="ICU" type="number" value={editingLog.icu} onChange={e => setEditingLog({...editingLog, icu: e.target.value})} placeholder="0" />
                                    <Input label="PICU" type="number" value={editingLog.picu} onChange={e => setEditingLog({...editingLog, picu: e.target.value})} placeholder="0" />
                                    <Input label="NICU" type="number" value={editingLog.nicu} onChange={e => setEditingLog({...editingLog, nicu: e.target.value})} placeholder="0" />
                                    <Input label="Med Ward" type="number" value={editingLog.medicine} onChange={e => setEditingLog({...editingLog, medicine: e.target.value})} placeholder="0" />
                                    <Input label="Cohort" type="number" value={editingLog.cohort} onChange={e => setEditingLog({...editingLog, cohort: e.target.value})} placeholder="0" />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6 sticky bottom-0 bg-white pt-4">
                                <button onClick={() => setEditingLog(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all border border-slate-100">Cancel</button>
                                <button onClick={handleUpdateLog} className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Save Changes</button>
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
                title="Confirm Census Deletion"
                description={`Permanently delete the surveillance census for ${logToDelete}?`}
            />
        </div>
    );
};

export default HAIDataDashboard;