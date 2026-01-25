import React, { useState, useEffect, useMemo } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { useAuth } from '../../AuthContext';
import { AREAS } from '../../constants';
import { submitBundleAudit, submitActionPlan, getBundleAudits, deleteRecord, updateBundleAudit } from '../../services/ipcService';
import { 
    CheckCircle2, 
    XCircle, 
    ClipboardCheck, 
    Save, 
    Clock, 
    User, 
    Stethoscope, 
    Wind, 
    Droplets, 
    Syringe,
    AlertCircle,
    Info,
    Zap,
    LayoutList,
    TrendingUp,
    ShieldCheck,
    BarChart3,
    Filter,
    RotateCcw,
    Loader2,
    Sparkles,
    List,
    Edit3,
    Trash2,
    Search,
    ChevronLeft,
    X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

const BUNDLE_TYPES = ["CAUTI", "VAP", "CLABSI"];

interface Props {
  viewMode?: 'log' | 'list' | 'analysis';
}

const HAIBundlesAudit: React.FC<Props> = ({ viewMode: initialViewMode }) => {
    const { user, isAuthenticated, validatePassword } = useAuth();
    const [view, setView] = useState<'log' | 'list' | 'analysis'>(initialViewMode || 'log');
    const [loading, setLoading] = useState(false);
    const [bundleHistory, setBundleHistory] = useState<any[]>([]);
    const [bundleType, setBundleType] = useState<string>('');
    const [showActionPlanModal, setShowActionPlanModal] = useState(false);
    
    // Management states
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const [formData, setFormData] = useState<any>({
        date: new Date().toISOString().split('T')[0],
        area: '',
        areaOther: '',
        patientName: '',
        nurseInCharge: '',
        cauti_drainageIntact: '',
        cauti_catheterSecured: '',
        cauti_bagBelowBladder: '',
        cauti_glovesUsed: '',
        cauti_hygienePerformed: '',
        cauti_unobstructedFlow: '',
        vap_headElevated: '',
        vap_oralCare: '',
        vap_pepticProphylaxis: '',
        vap_dvtProphylaxis: '',
        vap_suctionTechnique: '',
        vap_suctionBottleClean: '',
        vap_suctionCatheterDisposed: '',
        vap_handHygiene: '',
        clabsi_handHygiene: '',
        clabsi_scrubConnector: '',
        clabsi_dressingClean: ''
    });

    const [apForm, setApForm] = useState({ 
        action: '', 
        targetDate: '', 
        personResponsible: '', 
        category: 'Clinical Bundles',
        area: '',
        areaOther: ''
    });

    useEffect(() => {
        if (view === 'analysis' || view === 'list') loadHistory();
    }, [view]);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getBundleAudits();
        setBundleHistory(data);
        setLoading(false);
    };

    const handleInputChange = (name: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bundleType || !formData.area || !formData.patientName) {
            alert("Please fill in required fields.");
            return;
        }
        setLoading(true);
        await submitBundleAudit({ ...formData, bundleType });
        alert("Bundle Audit Logged.");
        setFormData({
            date: new Date().toISOString().split('T')[0],
            area: '', areaOther: '', patientName: '', nurseInCharge: '',
            cauti_drainageIntact: '', cauti_catheterSecured: '', 
            cauti_bagBelowBladder: '', cauti_glovesUsed: '', cauti_hygienePerformed: '', cauti_unobstructedFlow: '',
            vap_headElevated: '', vap_oralCare: '', vap_pepticProphylaxis: '', vap_dvtProphylaxis: '',
            vap_suctionTechnique: '', vap_suctionBottleClean: '', vap_suctionCatheterDisposed: '', vap_handHygiene: '',
            clabsi_handHygiene: '', clabsi_scrubConnector: '', clabsi_dressingClean: ''
        });
        setBundleType('');
        setLoading(false);
        if (view !== 'log') loadHistory();
    };

    const handleSaveActionPlan = async () => {
        await submitActionPlan({ ...apForm, category: bundleType ? `${bundleType} Bundle` : 'Clinical Bundles' });
        setShowActionPlanModal(false);
        setApForm({ action: '', targetDate: '', personResponsible: '', category: 'Clinical Bundles', area: '', areaOther: '' });
        alert("Action Plan Added.");
    };

    const handleEditItem = (item: any) => {
        setEditingItem({ ...item });
    };

    const handleUpdateItem = async () => {
        if (!editingItem) return;
        setLoading(true);
        try {
            await updateBundleAudit(editingItem);
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
            await deleteRecord('audit_bundles', itemToDelete.id);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            loadHistory();
        } finally {
            setPasswordConfirmLoading(false);
        }
    };

    const stats = useMemo(() => {
        if (bundleHistory.length === 0) return null;

        const resultsByArea: Record<string, { vap: number, cauti: number, clabsi: number, countVap: number, countCauti: number, countClabsi: number }> = {};
        let totalC = 0;
        let totalN = 0;

        bundleHistory.forEach(audit => {
            const area = audit.area || 'Other';
            if (!resultsByArea[area]) resultsByArea[area] = { vap: 0, cauti: 0, clabsi: 0, countVap: 0, countCauti: 0, countClabsi: 0 };
            
            const type = audit.bundleType;
            let compliant = true;

            if (type === 'VAP') {
                const isC = audit.vap_headElevated === 'Yes' && audit.vap_oralCare === 'Yes' && audit.vap_pepticProphylaxis === 'Yes' && audit.vap_dvtProphylaxis === 'Yes' &&
                            audit.vap_suctionTechnique === 'Yes' && audit.vap_suctionBottleClean === 'Yes' && audit.vap_suctionCatheterDisposed === 'Yes' && audit.vap_handHygiene === 'Yes';
                if (isC) resultsByArea[area].vap++;
                resultsByArea[area].countVap++;
                compliant = isC;
            } else if (type === 'CAUTI') {
                const isC = audit.cauti_drainageIntact === 'Yes' && 
                            audit.cauti_catheterSecured === 'Yes' && 
                            audit.cauti_bagBelowBladder === 'Yes' && 
                            audit.cauti_glovesUsed === 'Yes' && 
                            audit.cauti_hygienePerformed === 'Yes' && 
                            audit.cauti_unobstructedFlow === 'Yes';
                if (isC) resultsByArea[area].cauti++;
                resultsByArea[area].countCauti++;
                compliant = isC;
            } else if (type === 'CLABSI') {
                const isC = audit.clabsi_handHygiene === 'Yes' && audit.clabsi_scrubConnector === 'Yes' && audit.clabsi_dressingClean === 'Yes';
                if (isC) resultsByArea[area].clabsi++;
                resultsByArea[area].countClabsi++;
                compliant = isC;
            }

            if (compliant) totalC++; else totalN++;
        });

        const areaBundleData = Object.entries(resultsByArea).map(([name, data]) => ({
            name,
            vap: data.countVap > 0 ? Math.round((data.vap / data.countVap) * 100) : 0,
            cauti: data.countCauti > 0 ? Math.round((data.cauti / data.countCauti) * 100) : 0,
            clabsi: data.countClabsi > 0 ? Math.round((data.clabsi / data.countClabsi) * 100) : 0
        }));

        const analysisData = [
            { name: 'Compliant', value: totalC, color: '#3b82f6' },
            { name: 'Non-Compliant', value: totalN, color: '#ef4444' }
        ];

        return { areaBundleData, analysisData, overall: totalC + totalN > 0 ? Math.round((totalC / (totalC + totalN)) * 100) : 0 };
    }, [bundleHistory]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex bg-gray-100 p-1 rounded-lg h-10">
                    <button onClick={() => setView('log')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}><LayoutList size={14}/> Log</button>
                    <button onClick={() => setView('list')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}><List size={14}/> List</button>
                    <button onClick={() => setView('analysis')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}><TrendingUp size={14}/> Analysis</button>
                </div>
            </div>

            {view === 'log' ? (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ClipboardCheck size={24} /></div>
                            <div><h2 className="text-xl font-black text-slate-900 uppercase leading-none">HAI Bundle Audit</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Clinical Care Pathway Adherence</p></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Input label="Audit Date" type="date" value={formData.date} onChange={e => handleInputChange('date', e.target.value)} required />
                        <Select label="Ward" options={AREAS} value={formData.area} onChange={e => handleInputChange('area', e.target.value)} required />
                        <Select label="Bundle Type" options={BUNDLE_TYPES} value={bundleType} onChange={(e) => setBundleType(e.target.value)} required />
                        <Input label="Patient Name" value={formData.patientName} onChange={e => handleInputChange('patientName', e.target.value)} required placeholder="Last, First" />
                        <div className="lg:col-span-4">
                            <Input label="Nurse in Charge" value={formData.nurseInCharge} onChange={e => handleInputChange('nurseInCharge', e.target.value)} placeholder="Full Name" />
                        </div>
                    </div>

                    {bundleType === 'CAUTI' && (
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-2 mb-2"><Droplets className="text-blue-500" size={18}/><h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">CAUTI Prevention Bundle</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'cauti_drainageIntact', label: "Closed Drainage System Intact?" },
                                    { id: 'cauti_catheterSecured', label: "Catheter Secured (no traction)?" },
                                    { id: 'cauti_bagBelowBladder', label: "Bag below bladder at all times; not on the floor." },
                                    { id: 'cauti_glovesUsed', label: "Gloves used during any manipulation." },
                                    { id: 'cauti_hygienePerformed', label: "Meatal/perineal hygiene performed per routine care." },
                                    { id: 'cauti_unobstructedFlow', label: "Unobstructed urine flow." }
                                ].map(q => (
                                    <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                                        <label className="text-[11px] font-black text-slate-600 uppercase leading-tight">{q.label}</label>
                                        <div className="flex gap-2 shrink-0">
                                            <button type="button" onClick={() => handleInputChange(q.id, 'Yes')} className={`w-16 py-2 rounded-lg border font-black uppercase text-[10px] transition-all ${formData[q.id] === 'Yes' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>Yes</button>
                                            <button type="button" onClick={() => handleInputChange(q.id, 'No')} className={`w-16 py-2 rounded-lg border font-black uppercase text-[10px] transition-all ${formData[q.id] === 'No' ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>No</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {bundleType === 'VAP' && (
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-2 mb-2"><Wind className="text-blue-500" size={18}/><h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">VAP Prevention Bundle</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'vap_headElevated', label: "Head elevated 30-45deg?" },
                                    { id: 'vap_oralCare', label: "Oral care received?" },
                                    { id: 'vap_pepticProphylaxis', label: "Peptic ulcer prophylaxis?" },
                                    { id: 'vap_dvtProphylaxis', label: "DVT prophylaxis?" },
                                    { id: 'vap_suctionTechnique', label: "Appropriate suctioning technique?" },
                                    { id: 'vap_suctionBottleClean', label: "Suction bottle cleaned per shift?" },
                                    { id: 'vap_suctionCatheterDisposed', label: "Suction catheter disposed after use?" },
                                    { id: 'vap_handHygiene', label: "Correct hand hygiene?" }
                                ].map(q => (
                                    <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                                        <label className="text-[11px] font-black text-slate-600 uppercase leading-tight">{q.label}</label>
                                        <div className="flex gap-2 shrink-0">
                                            <button type="button" onClick={() => handleInputChange(q.id, 'Yes')} className={`w-16 py-2 rounded-lg border font-black uppercase text-[10px] transition-all ${formData[q.id] === 'Yes' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>Yes</button>
                                            <button type="button" onClick={() => handleInputChange(q.id, 'No')} className={`w-16 py-2 rounded-lg border font-black uppercase text-[10px] transition-all ${formData[q.id] === 'No' ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>No</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {bundleType === 'CLABSI' && (
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-2 mb-2"><Syringe className="text-blue-500" size={18}/><h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">CLABSI Prevention Bundle</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'clabsi_handHygiene', label: "Hand hygiene prior to handling?" },
                                    { id: 'clabsi_scrubConnector', label: "Scrub connector with alcohol?" },
                                    { id: 'clabsi_dressingClean', label: "Dressing clean and intact?" }
                                ].map(q => (
                                    <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                                        <label className="text-[11px] font-black text-slate-600 uppercase leading-tight">{q.label}</label>
                                        <div className="flex gap-2 shrink-0">
                                            <button type="button" onClick={() => handleInputChange(q.id, 'Yes')} className={`w-16 py-2 rounded-lg border font-black uppercase text-[10px] transition-all ${formData[q.id] === 'Yes' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>Yes</button>
                                            <button type="button" onClick={() => handleInputChange(q.id, 'No')} className={`w-16 py-2 rounded-lg border font-black uppercase text-[10px] transition-all ${formData[q.id] === 'No' ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>No</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!bundleType && (
                        <div className="bg-slate-50 p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
                            <Info size={40} className="text-slate-200" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Select a bundle type to begin the audit checklist</p>
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-6 flex flex-col items-center gap-4">
                        <button type="submit" disabled={loading || !bundleType} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                            {loading ? <Clock size={24} className="animate-spin" /> : <Save size={24} />} Publish Bundle Audit
                        </button>
                        
                        <button type="button" onClick={() => setShowActionPlanModal(true)} className="w-full h-12 bg-white border-2 border-blue-100 text-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-50 hover:border-blue-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                            <Zap size={18} className="fill-blue-600 text-blue-600" /> Create Correction Action Plan
                        </button>
                    </div>
                </form>
            ) : view === 'list' ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><List size={18}/></div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 uppercase">Bundle History</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage clinical audits</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b text-[10px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Bundle</th>
                                    <th className="px-6 py-4">Ward</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bundleHistory.map(audit => (
                                    <tr key={audit.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-6 py-3 font-medium text-slate-600">{audit.date}</td>
                                        <td className="px-6 py-3 font-black text-blue-600 uppercase">{audit.patientName}</td>
                                        <td className="px-6 py-3 font-bold text-slate-800 text-[10px]">{audit.bundleType}</td>
                                        <td className="px-6 py-3 text-slate-500 font-bold uppercase text-[9px]">{audit.area}</td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEditItem(audit)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16}/></button>
                                                <button onClick={() => handleDeleteClick(audit)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
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
                    {loading ? <Loader2 className="animate-spin mx-auto" size={48}/> : !stats ? (
                        <div className="p-20 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Awaiting first bundle audit entry</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-blue-900 p-8 rounded-[2rem] text-white flex flex-col gap-6 overflow-hidden relative shadow-lg">
                                    <div className="z-10 flex flex-col gap-2">
                                        <h2 className="text-3xl font-black tracking-tight uppercase">Bundle Compliance</h2>
                                        <p className="text-blue-300 font-medium text-base">Hospital-wide adherence to clinical care bundles</p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-8 opacity-10 text-white"><ShieldCheck size={180} /></div>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] border-2 border-blue-500 flex flex-col items-center justify-center text-center gap-2 shadow-xl shadow-blue-500/10">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600">Overall Success</span>
                                    <span className="text-6xl font-black text-slate-900">{stats.overall}%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Adherence</span>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><BarChart3 size={20}/></div>
                                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Area Performance</h3>
                                </div>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.areaBundleData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} />
                                            <YAxis domain={[0, 100]} tick={{fontSize: 9}} />
                                            <RechartsTooltip contentStyle={{borderRadius: '16px'}} />
                                            <Legend wrapperStyle={{fontSize: 9, fontWeight: 'bold', paddingTop: 20}} />
                                            <Bar dataKey="vap" name="VAP" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                                            <Bar dataKey="cauti" name="CAUTI" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                            <Bar dataKey="clabsi" name="CLABSI" fill="#ec4899" radius={[3, 3, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
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
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Edit Bundle Log</h3>
                                <p className="text-xs opacity-80 font-bold uppercase tracking-widest">{editingItem.patientName}</p>
                            </div>
                            <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 flex flex-col gap-6">
                            <Input label="Patient Name" value={editingItem.patientName} onChange={e => setEditingItem({...editingItem, patientName: e.target.value})} />
                            <Select label="Ward" options={AREAS} value={editingItem.area} onChange={e => setEditingItem({...editingItem, area: e.target.value})} />
                            <Input label="Nurse in Charge" value={editingItem.nurseInCharge} onChange={e => setEditingItem({...editingItem, nurseInCharge: e.target.value})} />
                            <div className="flex gap-4 mt-4">
                                <button onClick={() => setEditingItem(null)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                                <button onClick={handleUpdateItem} className="flex-1 py-3 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-blue-700 transition-all">Save Changes</button>
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
                title="Confirm Bundle Record Deletion"
                description={`Permanently delete the audit record for ${itemToDelete?.patientName}?`}
            />

            {showActionPlanModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-blue-600 p-6 text-white text-center">
                            <Zap size={32} className="mx-auto mb-2" fill="currentColor" />
                            <h3 className="text-lg font-black uppercase">Create Action Plan</h3>
                            <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Bundle Correction Strategy</p>
                        </div>
                        <div className="p-8 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Select label="Target Ward" options={AREAS} value={apForm.area} onChange={e => setApForm({...apForm, area: e.target.value})} />
                            </div>
                            <Input label="Correction Action" value={apForm.action} onChange={e => setApForm({...apForm, action: e.target.value})} placeholder="e.g. Schedule VAP oral care re-training" />
                            <Input label="Target Date" type="date" value={apForm.targetDate} onChange={e => setApForm({...apForm, targetDate: e.target.value})} />
                            <Input label="Person Responsible" value={apForm.personResponsible} onChange={e => setApForm({...apForm, personResponsible: e.target.value})} />
                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setShowActionPlanModal(false)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl">Cancel</button>
                                <button type="button" onClick={handleSaveActionPlan} className="flex-1 py-3 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-emerald-700 transition-all">Save Action</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HAIBundlesAudit;