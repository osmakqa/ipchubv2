import React, { useState, useEffect, useMemo } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { getCensusLogs, submitCensusLog, getHAIReports, calculateInfectionRates } from '../../services/ipcService';
import { 
    Activity, 
    BarChart2, 
    ClipboardList, 
    Save, 
    Clock, 
    Bed, 
    Wind, 
    Droplets, 
    Syringe, 
    LayoutList,
    TrendingUp,
    CheckCircle2,
    Users,
    FileText,
    Info,
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Calendar as CalendarIcon,
    Sparkles,
    Hash,
    CalendarX
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    CartesianGrid, LineChart, Line, Legend, Cell 
} from 'recharts';

const CENSUS_LOG_AREAS = [
    { label: 'Overall Hospital', prefix: 'overall' },
    { label: 'ICU', prefix: 'icu' },
    { label: 'NICU', prefix: 'nicu' },
    { label: 'PICU', prefix: 'picu' },
    { label: 'Medicine Ward', prefix: 'medicine' }, 
    { label: 'Cohort Ward', prefix: 'cohort' }
];

const HAIDataDashboard: React.FC = () => {
    const [view, setView] = useState<'log' | 'analysis'>('log');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [infections, setInfections] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        areaPrefix: CENSUS_LOG_AREAS[0].prefix, 
        ventCount: '',
        ifcCount: '',
        centralCount: ''
    });

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        const existingLog = logs.find(l => l.date === formData.date);
        if (existingLog) {
            setFormData(prev => ({
                ...prev,
                ventCount: existingLog[`${prev.areaPrefix}Vent`] || '',
                ifcCount: existingLog[`${prev.areaPrefix}Ifc`] || '',
                centralCount: existingLog[`${prev.areaPrefix}Central`] || ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                ventCount: '',
                ifcCount: '',
                centralCount: '',
            }));
        }
    }, [formData.date, formData.areaPrefix, logs]);

    const loadData = async () => {
        setLoading(true);
        const [cLogs, hReports] = await Promise.all([getCensusLogs(), getHAIReports()]);
        setLogs(cLogs);
        setInfections(hReports);
        setLoading(false);
    };

    const handleMagicFill = () => {
        const randomVent = Math.floor(Math.random() * 50) + 10;
        const randomIfc = Math.floor(Math.random() * 100) + 30;
        const randomCentral = Math.floor(Math.random() * 60) + 20;

        setFormData(prev => ({
            ...prev,
            ventCount: randomVent.toString(),
            ifcCount: randomIfc.toString(),
            centralCount: randomCentral.toString()
        }));
    };

    const handleLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: any = {
            date: formData.date,
        };
        payload[`${formData.areaPrefix}Vent`] = parseInt(formData.ventCount || '0', 10);
        payload[`${formData.areaPrefix}Ifc`] = parseInt(formData.ifcCount || '0', 10);
        payload[`${formData.areaPrefix}Central`] = parseInt(formData.centralCount || '0', 10);

        try {
            await submitCensusLog(payload);
            alert("Daily Census Logged Successfully.");
            loadData();
        } catch (error) {
            console.error("Error submitting census log:", error);
            alert("Failed to save census log.");
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => calculateInfectionRates(logs, infections), [logs, infections]);
    
    const currentDayLog = useMemo(() => {
        return logs.find(l => l.date === formData.date);
    }, [logs, formData.date]);

    // Calculation for previous missing dates in current month
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
        return missing.reverse(); // Newest missing dates first
    }, [logs]);

    const RateCard = ({ title, rates }: { title: string, rates: any }) => (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">{title}</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-400">HAP Rate</span><span className="text-xl font-black text-slate-800">{rates.hap}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-400">VAP Rate</span><span className="text-xl font-black text-blue-600">{rates.vap}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-400">CAUTI Rate</span><span className="text-xl font-black text-amber-600">{rates.cauti}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-400">CLABSI Rate</span><span className="text-xl font-black text-red-600">{rates.clabsi}</span></div>
            </div>
            <div className="mt-2 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-slate-500">Overall Rate</span>
                <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-xs font-black">{rates.overall}</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
            <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit">
                <button onClick={() => setView('log')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><LayoutList size={16}/> Log</button>
                <button onClick={() => setView('analysis')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><TrendingUp size={16}/> Analysis</button>
            </div>

            {view === 'log' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7 flex flex-col gap-8">
                        <form onSubmit={handleLogSubmit} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><ClipboardList size={24}/></div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 uppercase leading-none">HAI Data Entry</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Census & Device Days</p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleMagicFill}
                                    className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 flex items-center gap-2 hover:bg-amber-100 transition-all shadow-sm"
                                >
                                    <Sparkles size={14}/> Magic Fill
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input 
                                        label="Entry Date" 
                                        type="date" 
                                        value={formData.date} 
                                        onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} 
                                        required 
                                    />
                                    <Select 
                                        label="Clinical Area / Ward" 
                                        options={CENSUS_LOG_AREAS.map(a => a.label)} 
                                        value={CENSUS_LOG_AREAS.find(a => a.prefix === formData.areaPrefix)?.label || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, areaPrefix: CENSUS_LOG_AREAS.find(a => a.label === e.target.value)?.prefix || 'overall' }))} 
                                        required 
                                    />
                                </div>

                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity size={14} className="text-indigo-600"/>
                                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Device Counts: {CENSUS_LOG_AREAS.find(a => a.prefix === formData.areaPrefix)?.label}</span>
                                    </div>
                                    {/* Aligned textboxes for device counts */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input label="Ventilator Count" type="number" value={formData.ventCount} onChange={e => setFormData({...formData, ventCount: e.target.value})} required />
                                        <Input label="IFC Count" type="number" value={formData.ifcCount} onChange={e => setFormData({...formData, ifcCount: e.target.value})} required />
                                        <Input label="Central Line Count" type="number" value={formData.centralCount} onChange={e => setFormData({...formData, centralCount: e.target.value})} required />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button disabled={loading} className="w-full md:w-fit h-14 bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                                    {loading ? <Clock size={24} className="animate-spin" /> : <Save size={24} />} 
                                    {currentDayLog && currentDayLog[`${formData.areaPrefix}Vent`] !== undefined ? 'Update Registry' : 'Save Daily Entry'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl"><Hash size={24}/></div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase leading-none">Daily Summary</h2>
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
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02]">
                                        <div className="flex items-center gap-3"><Wind size={18} className="text-blue-400"/><span className="font-black text-xs uppercase tracking-wider">Overall Ventilators</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overallVent || '0'}</span>
                                    </div>
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02]">
                                        <div className="flex items-center gap-3"><Droplets size={18} className="text-amber-400"/><span className="font-black text-xs uppercase tracking-wider">Overall IFC</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overallIfc || '0'}</span>
                                    </div>
                                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02]">
                                        <div className="flex items-center gap-3"><Syringe size={18} className="text-rose-400"/><span className="font-black text-xs uppercase tracking-wider">Overall Central Lines</span></div>
                                        <span className="text-2xl font-black">{currentDayLog.overallCentral || '0'}</span>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-2">
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Breakdown per Ward</h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {CENSUS_LOG_AREAS.filter(a => a.prefix !== 'overall').map(area => (
                                                <button key={area.prefix} onClick={() => setFormData(prev => ({...prev, areaPrefix: area.prefix}))} className={`group p-3 rounded-xl border transition-all flex items-center justify-between ${formData.areaPrefix === area.prefix ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                                    <span className={`text-[10px] font-black uppercase ${formData.areaPrefix === area.prefix ? 'text-indigo-600' : 'text-slate-600'}`}>{area.label}</span>
                                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
                                                        <div className="flex items-center gap-1"><span>V:</span><span className="font-black text-slate-900">{currentDayLog[`${area.prefix}Vent`] || '0'}</span></div>
                                                        <div className="flex items-center gap-1"><span>I:</span><span className="font-black text-slate-900">{currentDayLog[`${area.prefix}Ifc`] || '0'}</span></div>
                                                        <div className="flex items-center gap-1"><span>C:</span><span className="font-black text-slate-900">{currentDayLog[`${area.prefix}Central`] || '0'}</span></div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Missing dates in current month section */}
                            <div className="mt-4 pt-6 border-t border-slate-100 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CalendarX size={18} className="text-rose-500" />
                                        <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight">Missing Log Dates</h3>
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{missingDates.length} pending</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {missingDates.length === 0 ? (
                                        <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 w-full text-center">🎉 All dates in current month are logged!</p>
                                    ) : (
                                        missingDates.map(d => (
                                            <button 
                                                key={d} 
                                                onClick={() => setFormData(prev => ({...prev, date: d}))}
                                                className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase hover:bg-rose-100 transition-all active:scale-95"
                                            >
                                                {new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </button>
                                        ))
                                    )}
                                </div>
                                {missingDates.length > 0 && <p className="text-[9px] text-slate-400 font-bold italic">* Click a date above to quickly jump and log data.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col gap-6 relative overflow-hidden">
                            <div className="z-10 flex flex-col gap-2">
                                <h2 className="text-4xl font-black tracking-tight uppercase">Institutional Rate</h2>
                                <p className="text-slate-400 font-medium text-lg">Infection Rate per 1,000 Patient/Device Days</p>
                            </div>
                            <div className="z-10 grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                                <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">HAP Rate</span><span className="text-4xl font-black">{stats.overall.hap}</span></div>
                                <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-widest text-blue-400">VAP Rate</span><span className="text-4xl font-black">{stats.overall.vap}</span></div>
                                <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-widest text-amber-400">CAUTI Rate</span><span className="text-4xl font-black">{stats.overall.cauti}</span></div>
                                <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-widest text-rose-400">CLABSI Rate</span><span className="text-4xl font-black">{stats.overall.clabsi}</span></div>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Activity size={200} /></div>
                        </div>
                        <div className="bg-white p-8 rounded-[3rem] border-2 border-primary flex flex-col items-center justify-center text-center gap-2 shadow-xl shadow-primary/10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Consolidated Metric</span>
                            <span className="text-6xl font-black text-slate-900">{stats.overall.overall}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Hospital Wide Infection Rate</span>
                            <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase"><TrendingUp size={12}/> -4.2% from Last Month</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <RateCard title="ICU Profile" rates={stats.icu} />
                        <RateCard title="PICU Profile" rates={stats.picu} />
                        <RateCard title="NICU Profile" rates={stats.nicu} />
                        <RateCard title="Medicine Ward" rates={stats.medicine} />
                        <RateCard title="Cohort Profile" rates={stats.cohort} />
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><BarChart2 className="text-primary"/> Ward-Wise Comparison</div>
                            <div className="flex items-center gap-4 hidden sm:flex">
                                <div className="flex items-center gap-2"><div className="size-3 rounded bg-emerald-500"></div><span className="text-[10px] font-black uppercase text-slate-400">HAP</span></div>
                                <div className="flex items-center gap-2"><div className="size-3 rounded bg-blue-500"></div><span className="text-[10px] font-black uppercase text-slate-400">VAP</span></div>
                                <div className="flex items-center gap-2"><div className="size-3 rounded bg-amber-500"></div><span className="text-[10px] font-black uppercase text-slate-400">CAUTI</span></div>
                                <div className="flex items-center gap-2"><div className="size-3 rounded bg-red-500"></div><span className="text-[10px] font-black uppercase text-slate-400">CLABSI</span></div>
                            </div>
                        </div>
                        <div className="h-96">
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
                                    <Bar dataKey="hap" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="vap" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="cauti" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="clabsi" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HAIDataDashboard;