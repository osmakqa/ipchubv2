import React, { useState, useEffect, useMemo } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { useAuth } from '../../AuthContext';
import { getCensusLogs, submitCensusLog, getHAIReports, calculateInfectionRates, deleteCensusLog, updateCensusLog } from '../../services/ipcService';
import { AREAS } from '../../constants';
import { 
    Activity, 
    BarChart2, 
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
    ChevronLeft,
    Sparkles,
    Users,
    X,
    BedDouble
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    CartesianGrid, LineChart, Line, Legend, Cell 
} from 'recharts';

const ANALYTICAL_WARDS = [
    { label: 'Overall Hospital', prefix: 'overall' },
    { label: 'ICU', prefix: 'icu' },
    { label: 'NICU', prefix: 'nicu' },
    { label: 'PICU', prefix: 'picu' },
    { label: 'Medicine Ward', prefix: 'med' }, 
    { label: 'Cohort', prefix: 'cohort' }
];

interface Props {
  viewMode?: 'log' | 'list' | 'analysis';
}

const HAIDataDashboard: React.FC<Props> = ({ viewMode: initialViewMode }) => {
    const { user, isAuthenticated, validatePassword } = useAuth();
    const [view, setView] = useState<'log' | 'list' | 'analysis'>(initialViewMode || 'log');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [infections, setInfections] = useState<any[]>([]);
    
    const [editingLog, setEditingLog] = useState<any | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [logToDelete, setLogToDelete] = useState<string | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        // Patient Census
        overallCensus: '',
        icuCensus: '',
        picuCensus: '',
        nicuCensus: '',
        medicineCensus: '',
        // Ward Specific Device Days
        areaName: 'Overall Hospital',
        ventCount: '',
        ifcCount: '',
        centralCount: ''
    });

    useEffect(() => { 
        if (initialViewMode) setView(initialViewMode); 
    }, [initialViewMode]);

    const areaOptions = useMemo(() => ["Overall Hospital", ...AREAS], []);

    const currentPrefix = useMemo(() => {
        const area = formData.areaName;
        if (area === "Overall Hospital") return "overall";
        if (area === "ICU") return "icu";
        if (area === "NICU") return "nicu";
        if (area === "PICU" || area === "Pedia ICU") return "picu";
        if (area === "Medicine Ward") return "med";
        if (area === "Cohort") return "cohort";
        return area.toLowerCase().replace(/\s+/g, '');
    }, [formData.areaName]);

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (view === 'log') {
            const existingLog = logs.find(l => l.date === formData.date);
            if (existingLog) {
                setFormData(prev => ({
                    ...prev,
                    overallCensus: existingLog.overall?.toString() || '',
                    icuCensus: existingLog.icu?.toString() || '',
                    picuCensus: existingLog.picu?.toString() || '',
                    nicuCensus: existingLog.nicu?.toString() || '',
                    medicineCensus: existingLog.medicine?.toString() || '',
                    ventCount: existingLog[`${currentPrefix}Vent`]?.toString() || '',
                    ifcCount: existingLog[`${currentPrefix}Ifc`]?.toString() || '',
                    centralCount: existingLog[`${currentPrefix}Central`]?.toString() || ''
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    overallCensus: '',
                    icuCensus: '',
                    picuCensus: '',
                    nicuCensus: '',
                    medicineCensus: '',
                    ventCount: '',
                    ifcCount: '',
                    centralCount: '',
                }));
            }
        }
    }, [formData.date, currentPrefix, logs, view]);

    const loadData = async () => {
        setLoading(true);
        const [cLogs, hReports] = await Promise.all([getCensusLogs(), getHAIReports()]);
        setLogs(cLogs);
        setInfections(hReports);
        setLoading(false);
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
        };
        
        payload[`${currentPrefix}Vent`] = parseInt(formData.ventCount || '0', 10);
        payload[`${currentPrefix}Ifc`] = parseInt(formData.ifcCount || '0', 10);
        payload[`${currentPrefix}Central`] = parseInt(formData.centralCount || '0', 10);

        try {
            await submitCensusLog(payload);
            alert("Daily Census Logged Successfully.");
            loadData();
        } catch (error) {
            alert("Failed to save entry.");
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => calculateInfectionRates(logs, infections), [logs, infections]);
    
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

    const handleEditLog = (log: any) => {
        setEditingLog({ ...log });
    };

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
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">HAP Rate</span><span className="text-xl font-black text-slate-800">{rates.hap}</span></div>
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">VAP Rate</span><span className="text-xl font-black text-blue-600">{rates.vap}</span></div>
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">CAUTI Rate</span><span className="text-xl font-black text-amber-600">{rates.cauti}</span></div>
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">CLABSI Rate</span><span className="text-xl font-black text-red-600">{rates.clabsi}</span></div>
            </div>
            <div className="mt-2 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase text-slate-500">Overall Rate</span>
                <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black">{rates.overall}</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex bg-gray-100 p-1 rounded-lg h-10">
                    <button onClick={() => setView('log')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><LayoutList size={14}/> Log</button>
                    <button onClick={() => setView('list')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><List size={14}/> List</button>
                    <button onClick={() => setView('analysis')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><TrendingUp size={14}/> Analysis</button>
                </div>
            </div>

            {view === 'log' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        <form onSubmit={handleLogSubmit} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8 animate-in fade-in duration-500">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><ClipboardList size={24}/></div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 uppercase leading-none">Daily Surveillance Census</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Data Submission</p>
                                    </div>
                                </div>
                                <div className="w-full md:w-48">
                                    <Input label="Registry Date" type="date" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} required />
                                </div>
                            </div>

                            {/* Section A: Hospital-Wide Census */}
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center gap-2">
                                    <BedDouble size={18} className="text-emerald-600"/>
                                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">A. Patient Census (Daily Aggregate)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <Input label="Total Hospital" type="number" value={formData.overallCensus} onChange={e => setFormData({...formData, overallCensus: e.target.value})} required />
                                    <Input label="ICU" type="number" value={formData.icuCensus} onChange={e => setFormData({...formData, icuCensus: e.target.value})} required />
                                    <Input label="PICU" type="number" value={formData.picuCensus} onChange={e => setFormData({...formData, picuCensus: e.target.value})} required />
                                    <Input label="NICU" type="number" value={formData.nicuCensus} onChange={e => setFormData({...formData, nicuCensus: e.target.value})} required />
                                    <Input label="Medicine Ward" type="number" value={formData.medicineCensus} onChange={e => setFormData({...formData, medicineCensus: e.target.value})} required />
                                </div>
                            </div>

                            {/* Section B: Ward Specific Device Days */}
                            <div className="flex flex-col gap-5 pt-4 border-t border-slate-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <Activity size={18} className="text-blue-600"/>
                                        <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">B. Device Surveillance (Unit Specific)</h3>
                                    </div>
                                    <div className="w-full md:w-64">
                                        <Select label="Select Target Ward" options={areaOptions} value={formData.areaName} onChange={e => setFormData(prev => ({ ...prev, areaName: e.target.value }))} required />
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 text-blue-600 mb-1.5 ml-1">
                                            <Wind size={14}/>
                                            <span className="text-[9px] font-black uppercase tracking-widest">Ventilator Days</span>
                                        </div>
                                        <Input label="Quantity" type="number" value={formData.ventCount} onChange={e => setFormData({...formData, ventCount: e.target.value})} required placeholder="0" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 text-amber-600 mb-1.5 ml-1">
                                            <Droplets size={14}/>
                                            <span className="text-[9px] font-black uppercase tracking-widest">IFC Days</span>
                                        </div>
                                        <Input label="Quantity" type="number" value={formData.ifcCount} onChange={e => setFormData({...formData, ifcCount: e.target.value})} required placeholder="0" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 text-rose-600 mb-1.5 ml-1">
                                            <Syringe size={14}/>
                                            <span className="text-[9px] font-black uppercase tracking-widest">Central Line Days</span>
                                        </div>
                                        <Input label="Quantity" type="number" value={formData.centralCount} onChange={e => setFormData({...formData, centralCount: e.target.value})} required placeholder="0" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button disabled={loading} className="w-full md:w-fit h-14 bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                                    {loading ? <Clock size={24} className="animate-spin" /> : <Save size={24} />} 
                                    Update Registry Entry
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl"><Hash size={24}/></div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase leading-none">Day Summary</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(formData.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                            
                            {!currentDayLog ? (
                                <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Clock size={32} className="mx-auto text-slate-200 mb-2" />
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No data logged for this date</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-900/10">
                                        <div className="flex items-center gap-3"><Users size={18} className="text-emerald-400"/><span className="font-black text-xs uppercase tracking-wider">Overall Census</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overall || '0'}</span>
                                    </div>
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-900/10">
                                        <div className="flex items-center gap-3"><Wind size={18} className="text-blue-400"/><span className="font-black text-xs uppercase tracking-wider">Overall Ventilators</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overallVent || '0'}</span>
                                    </div>
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-900/10">
                                        <div className="flex items-center gap-3"><Droplets size={18} className="text-amber-400"/><span className="font-black text-xs uppercase tracking-wider">Overall IFC</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overallIfc || '0'}</span>
                                    </div>
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-900/10">
                                        <div className="flex items-center gap-3"><Syringe size={18} className="text-rose-400"/><span className="font-black text-xs uppercase tracking-wider">Overall Central Lines</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overallCentral || '0'}</span>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-2">
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Unit Detail</h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {ANALYTICAL_WARDS.filter(a => a.prefix !== 'overall').map(area => (
                                                <button key={area.prefix} onClick={() => setFormData(prev => ({...prev, areaName: area.label}))} className={`group p-3 rounded-xl border transition-all flex items-center justify-between ${formData.areaName === area.label ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                                    <span className={`text-[10px] font-black uppercase ${formData.areaName === area.label ? 'text-indigo-600' : 'text-slate-600'}`}>{area.label}</span>
                                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                                        <div className="flex items-center gap-1"><span>C:</span><span className="font-black text-slate-900">{currentDayLog[area.prefix === 'med' ? 'medicine' : area.prefix] || '0'}</span></div>
                                                        <div className="flex items-center gap-1"><span>V:</span><span className="font-black text-slate-900">{currentDayLog[`${area.prefix}Vent`] || '0'}</span></div>
                                                        <div className="flex items-center gap-1"><span>I:</span><span className="font-black text-slate-900">{currentDayLog[`${area.prefix}Ifc`] || '0'}</span></div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-6 border-t border-slate-100 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CalendarX size={18} className="text-rose-500" />
                                        <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight">Pending Dates</h3>
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{missingDates.length} days</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {missingDates.slice(0, 8).map(d => (
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
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col animate-in fade-in duration-500">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><List size={20}/></div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 uppercase leading-none">Census History</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage recorded daily data</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b text-[10px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Total Census</th>
                                    <th className="px-6 py-4">ICU/PICU/NICU</th>
                                    <th className="px-6 py-4">Med Ward</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map(log => (
                                    <tr key={log.date} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-6 py-3 font-black text-slate-900">{log.date}</td>
                                        <td className="px-6 py-3 font-bold text-emerald-600">{log.overall || 0}</td>
                                        <td className="px-6 py-3 font-bold text-slate-600">{log.icu || 0} / {log.picu || 0} / {log.nicu || 0}</td>
                                        <td className="px-6 py-3 font-bold text-slate-600">{log.medicine || 0}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEditLog(log)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={16}/></button>
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
                <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col gap-6 relative overflow-hidden shadow-lg">
                            <div className="z-10 flex flex-col gap-2">
                                <h2 className="text-3xl font-black tracking-tight uppercase">Institutional Rate</h2>
                                <p className="text-slate-400 font-medium text-base">Infection Rate per 1,000 Patient/Device Days</p>
                            </div>
                            <div className="z-10 grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">HAP Rate</span><span className="text-3xl font-black">{stats.overall.hap}</span></div>
                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-blue-400">VAP Rate</span><span className="text-3xl font-black">{stats.overall.vap}</span></div>
                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-amber-400">CAUTI Rate</span><span className="text-3xl font-black">{stats.overall.cauti}</span></div>
                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-rose-400">CLABSI Rate</span><span className="text-3xl font-black">{stats.overall.clabsi}</span></div>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Activity size={180} /></div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border-2 border-primary flex flex-col items-center justify-center text-center gap-2 shadow-xl shadow-primary/10">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Consolidated Metric</span>
                            <span className="text-5xl font-black text-slate-900">{stats.overall.overall}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hospital Wide Infection Rate</span>
                            <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase"><TrendingUp size={12}/> -4.2% from Last Month</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <RateCard title="ICU Profile" rates={stats.icu} />
                        <RateCard title="PICU Profile" rates={stats.picu} />
                        <RateCard title="NICU Profile" rates={stats.nicu} />
                        <RateCard title="Medicine Ward" rates={stats.medicine} />
                        <RateCard title="Cohort Profile" rates={stats.cohort} />
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><BarChart2 size={20}/></div>
                            <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Ward-Wise Comparison</h3>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'ICU', ...stats.icu },
                                    { name: 'PICU', ...stats.picu },
                                    { name: 'NICU', ...stats.nicu },
                                    { name: 'Medicine', ...stats.medicine },
                                    { name: 'Cohort', ...stats.cohort }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                    <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                    <Bar dataKey="hap" fill="#10b981" radius={[3, 3, 0, 0]} barSize={20} />
                                    <Bar dataKey="vap" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={20} />
                                    <Bar dataKey="cauti" fill="#f59e0b" radius={[3, 3, 0, 0]} barSize={20} />
                                    <Bar dataKey="clabsi" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingLog && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Edit Surveillance Census</h3>
                                <p className="text-xs opacity-80 font-bold uppercase tracking-widest">{editingLog.date}</p>
                            </div>
                            <button onClick={() => setEditingLog(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
                            <div className="flex flex-col gap-4">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Patient Census</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Input label="Overall Census" type="number" value={editingLog.overall} onChange={e => setEditingLog({...editingLog, overall: e.target.value})} />
                                    <Input label="ICU Census" type="number" value={editingLog.icu} onChange={e => setEditingLog({...editingLog, icu: e.target.value})} />
                                    <Input label="PICU Census" type="number" value={editingLog.picu} onChange={e => setEditingLog({...editingLog, picu: e.target.value})} />
                                    <Input label="NICU Census" type="number" value={editingLog.nicu} onChange={e => setEditingLog({...editingLog, nicu: e.target.value})} />
                                    <Input label="Medicine Census" type="number" value={editingLog.medicine} onChange={e => setEditingLog({...editingLog, medicine: e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-4 mt-2">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Overall Device Totals</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="Overall Vent" type="number" value={editingLog.overallVent} onChange={e => setEditingLog({...editingLog, overallVent: e.target.value})} />
                                    <Input label="Overall IFC" type="number" value={editingLog.overallIfc} onChange={e => setEditingLog({...editingLog, overallIfc: e.target.value})} />
                                    <Input label="Overall Central" type="number" value={editingLog.overallCentral} onChange={e => setEditingLog({...editingLog, overallCentral: e.target.value})} />
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