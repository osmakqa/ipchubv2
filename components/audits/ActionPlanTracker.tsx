import React, { useState, useEffect, useMemo } from 'react';
import { getActionPlans, updateActionPlanStatus, submitActionPlan } from '../../services/ipcService';
import { AREAS } from '../../constants';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { 
    ClipboardList, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    ArrowRight, 
    Filter, 
    User, 
    Calendar,
    MoreHorizontal,
    AlertCircle,
    RotateCcw,
    LayoutList,
    TrendingUp,
    BarChart2,
    CheckCircle,
    MapPin,
    List,
    Save,
    PlusCircle,
    X
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    Cell, PieChart, Pie, Legend, CartesianGrid 
} from 'recharts';

interface Props {
  viewMode?: 'log' | 'list' | 'analysis';
}

const CATEGORIES = ["Hand Hygiene", "Clinical Bundles", "Area Audit", "Infrastructure", "Linen Management", "Waste Management", "General"];

const ActionPlanTracker: React.FC<Props> = ({ viewMode: initialViewMode }) => {
    const [view, setView] = useState<'log' | 'list' | 'analysis'>(initialViewMode || 'list');
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    
    // Form state for standalone Log view
    const [formData, setFormData] = useState({
        action: '',
        targetDate: '',
        personResponsible: '',
        category: 'General',
        area: ''
    });

    useEffect(() => { loadPlans(); }, []);

    const loadPlans = async () => {
        setLoading(true);
        const data = await getActionPlans();
        setPlans(data);
        setLoading(false);
    };

    const handleStatusChange = async (id: string, status: string) => {
        await updateActionPlanStatus(id, status);
        loadPlans();
    };

    const handleLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await submitActionPlan(formData);
            alert("Action Plan Added Successfully.");
            setFormData({ action: '', targetDate: '', personResponsible: '', category: 'General', area: '' });
            setView('list');
            loadPlans();
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed-closed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'failed-extended': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'failed-changed': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    const filteredPlans = useMemo(() => {
        return plans.filter(p => {
            const matchesStatus = filterStatus ? p.status === filterStatus : true;
            return matchesStatus;
        });
    }, [plans, filterStatus]);

    const analysisData = useMemo(() => {
        if (plans.length === 0) return null;
        const statusMap: Record<string, number> = {
            'completed-closed': 0,
            'failed-extended': 0,
            'failed-changed': 0,
            'pending': 0
        };
        plans.forEach(p => {
            const s = p.status || 'pending';
            statusMap[s] = (statusMap[s] || 0) + 1;
        });

        const pieData = Object.entries(statusMap).map(([name, value]) => ({ 
            name: name.replace('-', ' '), 
            value 
        })).filter(d => d.value > 0);

        const categoryMap: Record<string, number> = {};
        plans.forEach(p => {
            const cat = p.category || 'General';
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        const barData = Object.entries(categoryMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

        return { pieData, barData };
    }, [plans]);

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex bg-gray-100 p-1 rounded-lg h-10">
                    <button onClick={() => setView('log')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}><LayoutList size={14}/> Log</button>
                    <button onClick={() => setView('list')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'list' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}><List size={14}/> List</button>
                    <button onClick={() => setView('analysis')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}><TrendingUp size={14}/> Analysis</button>
                </div>
            </div>

            {view === 'log' ? (
                <form onSubmit={handleLogSubmit} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><PlusCircle size={24} /></div>
                        <div><h2 className="text-xl font-black text-slate-900 uppercase">New Action Plan</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institutional Correction Strategy</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Correction Action" value={formData.action} onChange={e => setFormData({...formData, action: e.target.value})} placeholder="Describe required correction..." required />
                        <Input label="Target Completion Date" type="date" value={formData.targetDate} onChange={e => setFormData({...formData, targetDate: e.target.value})} required />
                        <Input label="Person Responsible" value={formData.personResponsible} onChange={e => setFormData({...formData, personResponsible: e.target.value})} placeholder="Name or Position" required />
                        <Select label="Category" options={CATEGORIES} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
                        <div className="md:col-span-2"><Select label="Ward" options={AREAS} value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required /></div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button disabled={loading} className="w-full md:w-fit h-14 bg-rose-600 text-white px-12 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                            {loading ? <Clock size={24} className="animate-spin" /> : <Save size={24} />} Create Action Entry
                        </button>
                    </div>
                </form>
            ) : view === 'list' ? (
                <>
                    <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:hidden">
                        <div className="flex items-center gap-3 min-w-max">
                            <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                                <Filter size={14} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setFilterStatus('')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!filterStatus ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>All</button>
                                {['completed-closed', 'failed-extended', 'failed-changed', 'pending'].map(s => (
                                    <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                        {s.split('-')[0]}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => { setFilterStatus(''); loadPlans(); }} className="p-1.5 text-slate-400 hover:text-slate-900 transition-all"><RotateCcw size={14}/></button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <div className="bg-white p-20 rounded-3xl flex flex-col items-center gap-4 text-slate-300">
                                <Clock size={48} className="animate-spin" />
                                <span className="font-black uppercase text-[10px] tracking-widest">Loading Plans...</span>
                            </div>
                        ) : filteredPlans.length === 0 ? (
                            <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
                                <CheckCircle size={40} className="text-slate-200" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active plans in this category</p>
                            </div>
                        ) : (
                            filteredPlans.map(plan => (
                                <div key={plan.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-400 transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className={`p-3 rounded-xl border ${getStatusStyle(plan.status)} shadow-sm`}>
                                            {plan.status === 'completed-closed' ? <CheckCircle2 size={20}/> : plan.status === 'pending' ? <Clock size={20}/> : <AlertCircle size={20}/>}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest leading-none mb-1">{plan.category} | {plan.area}</span>
                                            <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-rose-600 transition-colors">{plan.action}</h3>
                                            <div className="flex items-center gap-4 mt-1.5">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><User size={10}/> {plan.personResponsible}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar size={10}/> Due: {plan.targetDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                        <select 
                                            className="bg-transparent border-none text-[9px] font-black uppercase text-slate-600 focus:ring-0 cursor-pointer"
                                            value={plan.status}
                                            onChange={(e) => handleStatusChange(plan.id, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="completed-closed">Completed</option>
                                            <option value="failed-extended">Extended</option>
                                            <option value="failed-changed">Modified</option>
                                        </select>
                                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                        <button className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors"><MoreHorizontal size={16}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                    <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:hidden">
                        <div className="flex items-center gap-3 min-w-max">
                            <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                                <Filter size={14} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                            </div>
                            <button onClick={() => { setFilterStatus(''); loadPlans(); }} className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"><RotateCcw size={14} /></button>
                        </div>
                    </div>

                    {!analysisData ? (
                        <div className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No data to analyze.</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Resolution Status</h3>
                                    </div>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={analysisData.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                                                    {analysisData.pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{borderRadius: '16px'}} />
                                                <Legend wrapperStyle={{fontSize: 10, fontWeight: 'bold'}} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest"><BarChart2 className="text-primary" size={16}/> Actions by Category</h3>
                                    </div>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analysisData.barData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                                                <RechartsTooltip contentStyle={{borderRadius: '16px'}} />
                                                <Bar dataKey="count" fill="#0f172a" radius={[0, 6, 6, 0]} barSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ActionPlanTracker;