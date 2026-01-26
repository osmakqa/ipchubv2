import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { useAuth } from '../../AuthContext';
import { AREAS } from '../../constants';
import { submitAreaAudit, submitActionPlan, getAreaAudits, deleteRecord, updateAreaAudit } from '../../services/ipcService';
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
    X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const AUDIT_CATEGORIES = ["Hand Hygiene Infrastructure", "Environment", "Healthcare Waste Management"];

const HH_INFRA_QUESTIONS = [
    "1. Hand washing supplies are available and complete in wash areas (e.g. liquid soap, paper towels, running water).",
    "2. Hand wash sinks are clean and free from used equipment/inappropriate items (e.g. bar soap, reusable towels).",
    "3. Cognitive aids promoting hand decontamination are available on all hand washing facilities.",
    "4. Hand sanitizers in dispensers are available, clean and stain free.",
    "5. The taps are not leaking.",
    "6. The drainage pipes are not leaking.",
    "7. Access to hand washing basin is clear (e.g. no equipment soaking in sink).",
    "8. Staff nails are short, clean and free from nail varnish.",
    "9a. Staff use the correct procedure for hand washing (Physician).",
    "9b. Staff use the correct procedure for hand washing (Nurse).",
    "10a. Staff can enumerate the 5 moments of hand hygiene (Physician).",
    "10b. Staff can enumerate the 5 moments of hand hygiene (Nurse).",
    "11a. Staff can indicate when it is appropriate to use alcohol hand rub (Physician).",
    "11b. Staff can indicate when it is appropriate to use alcohol hand rub (Nurse).",
    "12a. Staff can indicate how liquid soap or hand sanitizer dispensers are refilled."
];

const ENVIRONMENT_QUESTIONS = [
    "1. The external entrance to the facility is clean and tidy.",
    "3. Floors including corners, edges are free of dust and cobwebs.",
    "4. All doors and walls are clean.",
    "6. Window surfaces, frames, tracks and ledges are clean and free of dust/marks.",
    "8. All high and low surfaces are free from dust and cobwebs.",
    "9. Air vents are clean and free from excessive dust.",
    "10. Work station equipment in clinical areas is visibly clean (phones, keyboards, etc.).",
    "11. There is an identified area for the storage of clean and sterile equipment.",
    "12. The area is clean and there are no inappropriate items of equipment.",
    "13. All products are stored above floor level.",
    "14. Sterile equipment items are in date (check random items).",
    "15. All equipment including fridge is clean and free from dust, spills, and stains.",
    "16. Temperature records of medicine fridge (vaccines/insulin) are available.",
    "17. The drug trolley is clean and free from dust, spills, etc.",
    "18. Bathrooms/washrooms are clean.",
    "19. Appropriate storage of communal items (e.g. single use creams, shampoos).",
    "20. Bathrooms are not used for equipment storage.",
    "25. Separate hand washing facilities are available including soap and paper towels.",
    "26. The room is clean and free from inappropriate items (no medical equipment).",
    "27. Floors including edges and corners are free of dust and grit.",
    "29. Mops and buckets are stored inverted.",
    "30. Mop heads are laundered daily.",
    "32. HCW staff / janitorial staff are aware of terminal cleaning.",
    "35. Schedule of area cleaning and disinfection is regularly done.",
    "36. Awareness of blood spill management: Small spills (<10ml) 1:100 dilution.",
    "37. Awareness of blood spill management: Large spills (100ml+) 1:10 dilution."
];

const WASTE_QUESTIONS = [
    "1. HCWs are aware that a Healthcare Waste Management Policy exists.",
    "3. Color-coded waste bins are available (black, green and yellow).",
    "4. Appropriate color-coded bins are located in strategic areas accessible to staff/patients.",
    "5. Waste bins contain appropriate kind of waste (Black-Dry, Green-Wet, Yellow-Infectious).",
    "6. Waste bins are covered.",
    "7. Waste bins are ¾ full only.",
    "8. Waste bins are free from dirt, dust, blood and body fluid stain.",
    "9. Waste bins are free from insects and rodents.",
    "10. Waste bins are in a good state of repair.",
    "11. No transfer of clinical waste from one bag to another.",
    "12. Cognitive aids on waste segregation are displayed on the area.",
    "13b. Staff are aware of waste segregation procedures (Nurse).",
    "14. Staff are aware of frequency of waste collection.",
    "15. Staff are aware of how contaminated liquid waste are disposed.",
    "16. Staff have attended training on correct/safe disposal of clinical waste."
];

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
    
    // Management states
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

    // Dynamic Current Dates
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);

    const [formData, setFormData] = useState<any>({
        date: new Date().toISOString().split('T')[0],
        area: '',
        areaOther: '',
        answers: {} as Record<string, string>
    });

    const loadHistory = async () => {
        setLoading(true);
        const data = await getAreaAudits();
        setAuditHistory(data);
        setLoading(false);
    };

    useEffect(() => {
        if (view === 'analysis' || view === 'list') loadHistory();
    }, [view]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !formData.area) {
            alert("Please select category and ward.");
            return;
        }
        setLoading(true);
        await submitAreaAudit({ ...formData, category });
        alert("Audit Logged.");
        setFormData({
            date: new Date().toISOString().split('T')[0],
            area: '', areaOther: '', answers: {}
        });
        setCategory('');
        setLoading(false);
        if (view !== 'log') loadHistory();
    };

    const handleSaveActionPlan = async () => {
        await submitActionPlan({ ...apForm, category: category ? `Walkround: ${category}` : 'Walkrounds' });
        setShowActionPlanModal(false);
        setApForm({ action: '', targetDate: '', personResponsible: '', category: 'Walkrounds', area: '', areaOther: '' });
        alert("Action Plan Added.");
    };

    const handleEditItem = (item: any) => {
        setEditingItem({ ...item });
    };

    const handleUpdateItem = async () => {
        if (!editingItem) return;
        setLoading(true);
        try {
            await updateAreaAudit(editingItem);
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
            await deleteRecord('audit_area', itemToDelete.id);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            loadHistory();
        } finally {
            setPasswordConfirmLoading(false);
        }
    };

    const getQuestions = () => {
        if (category === "Hand Hygiene Infrastructure") return HH_INFRA_QUESTIONS;
        if (category === "Environment") return ENVIRONMENT_QUESTIONS;
        if (category === "Healthcare Waste Management") return WASTE_QUESTIONS;
        return [];
    };

    const categoryData = [
        { name: 'Infra', score: 85 },
        { name: 'Envi', score: 72 },
        { name: 'Waste', score: 94 }
    ];

    const mockWardSafetyData = [
        { name: 'ICU', score: 96 },
        { name: 'NICU', score: 92 },
        { name: 'Surgery', score: 84 },
        { name: 'Medicine', score: 72 },
        { name: 'Pedia', score: 61 },
        { name: 'ER', score: 54 }
    ];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex bg-gray-100 p-1 rounded-lg h-10">
                    <button onClick={() => setView('log')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}><LayoutList size={14}/> Log</button>
                    <button onClick={() => setView('list')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'list' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}><List size={14}/> List</button>
                    <button onClick={() => setView('analysis')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}><TrendingUp size={14}/> Analysis</button>
                </div>
            </div>

            {view === 'log' ? (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><SearchCode size={24} /></div>
                            <div><h2 className="text-xl font-black text-slate-900 uppercase">Audit Walkround</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compliance & Safety Checklist</p></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1">
                            <Input label="Audit Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                        </div>
                        <div className="lg:col-span-1 flex flex-col gap-2">
                            <Select label="Ward" options={AREAS} value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required />
                        </div>
                        <div className="lg:col-span-2">
                            <Select label="Audit Category" options={AUDIT_CATEGORIES} value={category} onChange={e => setCategory(e.target.value)} required placeholder="Select focus area..." />
                        </div>
                    </div>

                    {category ? (
                        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                    {category === "Hand Hygiene Infrastructure" && <Hand size={14}/>}
                                    {category === "Environment" && <Layers size={14}/>}
                                    {category === "Healthcare Waste Management" && <Trash2 size={14}/>}
                                    Audit Checklist Items
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-emerald-500 shadow-sm"></div><span className="text-[9px] font-black text-slate-400 uppercase">Yes</span></div>
                                    <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-rose-500 shadow-sm"></div><span className="text-[9px] font-black text-slate-400 uppercase">No</span></div>
                                    <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-slate-300 shadow-sm"></div><span className="text-[9px] font-black text-slate-400 uppercase">NA</span></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {getQuestions().map((q, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-200 transition-all group">
                                        <span className="text-sm font-bold text-slate-700 leading-snug">{q}</span>
                                        <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl min-w-max">
                                            {['Yes', 'No', 'NA'].map(opt => (
                                                <button key={opt} type="button" onClick={() => handleAnswerChange(q, opt)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${formData.answers[q] === opt ? opt === 'Yes' ? 'bg-emerald-500 text-white shadow-md' : opt === 'No' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-400 text-white shadow-md' : 'text-slate-400 hover:bg-white'}`}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-20 rounded-[3rem] border border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
                            <Info size={40} className="text-slate-200" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Select a category above to begin the audit checklist</p>
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-6 flex flex-col items-center gap-4">
                        <button type="submit" disabled={loading || !category} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                            {loading ? <Clock size={24} className="animate-spin" /> : <Save size={24} />} Publish Walkround Audit
                        </button>
                        
                        <button type="button" onClick={() => setShowActionPlanModal(true)} className="w-full h-12 bg-white border-2 border-amber-100 text-amber-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-50 hover:border-amber-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                            <Zap size={18} className="fill-amber-600 text-amber-600" /> Create Walkround Action Plan
                        </button>
                    </div>
                </form>
            ) : view === 'list' ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><List size={18}/></div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 uppercase">Historical Logs</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage walkround safety audits</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b text-[10px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Ward</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-center">Score</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {auditHistory.map(audit => {
                                    const answers = Object.values(audit.answers || {});
                                    const yesCount = answers.filter(v => v === 'Yes').length;
                                    const total = answers.filter(v => v !== 'NA').length || 1;
                                    const score = Math.round((yesCount / total) * 100);
                                    return (
                                        <tr key={audit.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-3 font-medium text-slate-600">{audit.date}</td>
                                            <td className="px-6 py-3 font-black text-amber-600 uppercase">{audit.area}</td>
                                            <td className="px-6 py-3 text-slate-500 text-[10px] font-bold">{audit.category}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full font-black text-[9px] border uppercase ${score >= 85 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : score >= 70 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {score}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEditItem(audit)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"><Edit3 size={16}/></button>
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
                    <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:hidden">
                        <div className="flex items-center gap-3 min-w-max">
                            <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                                <Filter size={14} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <select className="text-[10px] border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-rose-500 outline-none font-black uppercase bg-slate-50/50 text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                    <option value="2023">2023</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                </select>
                                <select className="text-[10px] border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-rose-500 outline-none font-black uppercase bg-slate-50/50 text-slate-600" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                                    <option value="">Full Year</option>
                                    <option value="Q1">Q1</option>
                                    <option value="Q2">Q2</option>
                                    <option value="Q3">Q3</option>
                                    <option value="Q4">Q4</option>
                                </select>
                            </div>
                            <button onClick={() => { setSelectedYear(currentYear); setSelectedQuarter(currentQuarter); loadHistory(); }} className="p-1.5 text-slate-400 hover:text-amber-600 transition-all"><RotateCcw size={14} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col gap-6 overflow-hidden relative shadow-lg">
                             <div className="z-10 flex flex-col gap-2">
                                <h2 className="text-3xl font-black tracking-tight uppercase">Institutional Safety</h2>
                                <p className="text-slate-400 font-medium text-base">Facility safety and cleanliness performance scores</p>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{selectedQuarter || 'Annual'} {selectedYear} Report</p>
                            </div>
                            <div className="z-10 h-64 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData} layout="vertical">
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#fff', fontSize: 10, fontWeight: 'bold'}} width={90} />
                                        <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                                            {categoryData.map((entry, index) => (
                                                <Cell key={index} fill={entry.score > 80 ? '#10b981' : entry.score > 60 ? '#f59e0b' : '#ef4444'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10 text-white"><Layers size={180} /></div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 flex flex-col items-center justify-center text-center gap-2 shadow-xl shadow-slate-900/5">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Aggregate Safety Score</span>
                            <span className="text-6xl font-black text-slate-900">84</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional Average</span>
                            <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase">Standard Met</div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><BarChart3 size={20}/></div>
                            <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Area Performance Ranking</h3>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mockWardSafetyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} domain={[0, 100]} />
                                    <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                    <Bar dataKey="score" name="Safety Score" barSize={32}>
                                        {mockWardSafetyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.score > 90 ? '#059669' : entry.score > 80 ? '#10b981' : entry.score > 60 ? '#f59e0b' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-amber-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Edit Walkround Log</h3>
                                <p className="text-xs opacity-80 font-bold uppercase tracking-widest">{editingItem.area}</p>
                            </div>
                            <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 flex flex-col gap-6">
                            <Select label="Ward" options={AREAS} value={editingItem.area} onChange={e => setEditingItem({...editingItem, area: e.target.value})} />
                            <Select label="Category" options={AUDIT_CATEGORIES} value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} />
                            <div className="flex gap-4 mt-4">
                                <button onClick={() => setEditingItem(null)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                                <button onClick={handleUpdateItem} className="flex-1 py-3 bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-amber-700 transition-all">Save Changes</button>
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
                title="Confirm Audit Deletion"
                description={`Permanently delete the walkround audit record for ${itemToDelete?.area}?`}
            />

            {showActionPlanModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-amber-600 p-6 text-white text-center">
                            <Zap size={32} className="mx-auto mb-2" fill="currentColor" />
                            <h3 className="text-lg font-black uppercase">Create Action Plan</h3>
                            <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Walkround Finding Correction</p>
                        </div>
                        <div className="p-8 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Select label="Target Ward" options={AREAS} value={apForm.area} onChange={e => setApForm({...apForm, area: e.target.value})} />
                            </div>
                            <Input label="Correction Action" value={apForm.action} onChange={e => setApForm({...apForm, action: e.target.value})} placeholder="e.g. Replenish soap in Triage wash area" />
                            <Input label="Target Date" type="date" value={apForm.targetDate} onChange={e => setApForm({...apForm, targetDate: e.target.value})} />
                            <Input label="Person Responsible" value={apForm.personResponsible} onChange={e => setApForm({...apForm, personResponsible: e.target.value})} />
                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setShowActionPlanModal(false)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl">Cancel</button>
                                <button type="button" onClick={handleSaveActionPlan} className="flex-1 py-3 bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-amber-700 transition-all">Save Action</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AreaAudit;