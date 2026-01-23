import React, { useState, useEffect, useMemo } from 'react';
import { getActionPlans, updateActionPlanStatus, submitActionPlan, updateActionPlan, deleteRecord } from '../../services/ipcService';
import { AREAS } from '../../constants';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { useAuth } from '../../AuthContext';
import { 
    ClipboardList, 
    CheckCircle2, 
    XCircle, 
    Clock, 
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
    Search,
    Edit3,
    Trash2,
    ChevronLeft
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
    const { user, isAuthenticated, validatePassword } = useAuth();
    const [view, setView] = useState<'log' | 'list' | 'analysis'>(initialViewMode || 'list');
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Management states
    const [editingPlan, setEditingPlan] = useState<any | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<any | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

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
            alert("Action Plan Added.");
            setFormData({ action: '', targetDate: '', personResponsible: '', category: 'General', area: '' });
            setView('list');
            loadPlans();
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (plan: any) => {
        setEditingPlan({ ...plan });
    };

    const handleUpdatePlan = async () => {
        if (!editingPlan) return;
        setLoading(true);
        try {
            await updateActionPlan(editingPlan);
            setEditingPlan(null);
            loadPlans();
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (plan: any) => {
        setPlanToDelete(plan);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async (password: string) => {
        if (!planToDelete || !user) return;
        setPasswordConfirmLoading(true);
        if (!validatePassword(user, password)) {
            alert("Incorrect password.");
            setPasswordConfirmLoading(false);
            return;
        }
        try {
            await deleteRecord('action_plans', planToDelete.id);
            setShowDeleteConfirm(false);
            setPlanToDelete(null);
            loadPlans();
        } finally {
            setPasswordConfirmLoading(false);
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
            const matchesSearch = searchQuery ? (
                (p.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.area || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.personResponsible || '').toLowerCase().includes(searchQuery.toLowerCase())
            ) : true;
            return matchesStatus && matchesSearch;
        });
    }, [plans, filterStatus, searchQuery]);

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
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
            <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit print:hidden">
                <button onClick={() => setView('log')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><LayoutList size={16}/> Log</button>
                <button onClick={() => setView('list')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'list' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><List size={16}/> List</button>
                <button onClick={() => setView('analysis')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><TrendingUp size={16}/> Analysis</button>
            </div>

            {view === 'log' ? (
                <form onSubmit={handleLogSubmit} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8 animate-in fade-in duration-500">
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
                        <button disabled={loading} className="w-full md:w-fit h-14 bg-slate-900 text-white px-12 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                            {loading ? <Clock size={24} className="animate-spin" /> : <Save size={24} />} Create Action Entry
                        </button>
                    </div>
                </form>
            ) : view === 'list' ? (
                <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search actions, wards, or staff..." 
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-slate-200 outline-none font-medium transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <button onClick={() => setFilterStatus('')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${!filterStatus ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>All</button>
                            {['completed-closed', 'failed-extended', 'failed-changed', 'pending'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap ${filterStatus === s ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                    {s.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { setFilterStatus(''); setSearchQuery(''); loadPlans(); }} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><RotateCcw size={20}/></button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <div className="bg-white p-20 rounded-[3rem] flex flex-col items-center gap-4 text-slate-300">
                                <Clock size={48} className="animate-spin" />
                                <span className="font-black uppercase text-xs tracking-widest">Loading Tracker...</span>
                            </div>
                        ) : filteredPlans.length === 0 ? (
                            <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
                                <CheckCircle size={48} className="text-slate-200" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No entries match your search</p>
                            </div>
                        ) : (
                            filteredPlans.map(plan => (
                                <div key={plan.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-400 transition-all group">
                                    <div className="flex items-center gap-5 flex-1">
                                        <div className={`p-4 rounded-2xl border ${getStatusStyle(plan.status)}`}>
                                            {plan.status === 'completed-closed' ? <CheckCircle2 size={24}/> : plan.status === 'pending' ? <Clock size={24}/> : <AlertCircle size={24}/>}
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{plan.category}</span>
                                                <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{plan.area}</span>
                                            </div>
                                            <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{plan.action}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><User size={12} className="text-slate-300"/> {plan.personResponsible}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar size={12} className="text-slate-300"/> Target: {plan.targetDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[8px] font-black uppercase text-slate-400 ml-1">Status Control</span>
                                            <select 
                                                className="bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600 focus:ring-2 focus:ring-slate-200 outline-none px-2 py-1.5 cursor-pointer shadow-sm"
                                                value={plan.status || 'pending'}
                                                onChange={(e) => handleStatusChange(plan.id, e.target.value)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="completed-closed">Completed</option>
                                                <option value="failed-extended">Extended</option>
                                                <option value="failed-changed">Modified</option>
                                            </select>
                                        </div>
                                        <div className="h-8 w-px bg-slate-200 mx-1"></div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEditClick(plan)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"><Edit3 size={18}/></button>
                                            <button onClick={() => handleDeleteClick(plan)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                    <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:hidden">
                        <div className="flex items-center gap-3 min-w-max">
                            <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                                <Filter size={14} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                            </div>
                            <button onClick={() => { setFilterStatus(''); loadPlans(); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><RotateCcw size={14} /></button>
                        </div>
                    </div>

                    {!analysisData ? (
                        <div className="p-20 text-center text-slate-400 font-bold">No data to analyze.</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                                    <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">Resolution Status</h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={analysisData.pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                                                    {analysisData.pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{borderRadius: '16px'}} />
                                                <Legend wrapperStyle={{fontSize: 12, fontWeight: 'bold'}} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                                    <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3"><BarChart2 className="text-primary"/> Actions by Category</h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analysisData.barData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                                <RechartsTooltip contentStyle={{borderRadius: '16px'}} />
                                                <Bar dataKey="count" fill="#0f172a" radius={[0, 10, 10, 0]} barSize={30} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {editingPlan && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">Edit Action Plan</h3>
                                <p className="text-xs opacity-80 font-bold uppercase tracking-widest">Entry ID: {editingPlan.id.substring(0, 8)}</p>
                            </div>
                            <button onClick={() => setEditingPlan(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><ChevronLeft className="rotate-180" size={24}/></button>
                        </div>
                        <div className="p-10 flex flex-col gap-6">
                            <Input label="Action Description" value={editingPlan.action} onChange={e => setEditingPlan({...editingPlan, action: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Ward" options={AREAS} value={editingPlan.area} onChange={e => setEditingPlan({...editingPlan, area: e.target.value})} />
                                <Select label="Category" options={CATEGORIES} value={editingPlan.category} onChange={e => setEditingPlan({...editingPlan, category: e.target.value})} />
                                <Input label="Person Responsible" value={editingPlan.personResponsible} onChange={e => setEditingPlan({...editingPlan, personResponsible: e.target.value})} />
                                <Input label="Target Date" type="date" value={editingPlan.targetDate} onChange={e => setEditingPlan({...editingPlan, targetDate: e.target.value})} />
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button onClick={() => setEditingPlan(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                                <button onClick={handleUpdatePlan} className="flex-1 py-4 bg-slate-900 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:bg-black transition-all">Save Changes</button>
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
                title="Confirm Plan Deletion"
                description={`Permanently delete this action plan for ${planToDelete?.area}?`}
            />
        </div>
    );
};

export default ActionPlanTracker;
