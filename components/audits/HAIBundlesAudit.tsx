import React, { useState, useMemo, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { useAuth } from '../../AuthContext';
import { AREAS } from '../../constants';
import { 
    submitBundleAudit, 
    getBundleAudits, 
    deleteRecord 
} from '../../services/ipcService';
import { 
    CheckCircle2, 
    XCircle, 
    Save, 
    List, 
    Trash2, 
    Bed, 
    Droplets, 
    Syringe, 
    Wind, 
    Stethoscope, 
    ChevronLeft, 
    Calendar, 
    User, 
    MapPin, 
    Activity, 
    Check, 
    Plus,
    X,
    ClipboardCheck,
    Briefcase,
    HeartPulse,
    ShieldCheck,
    Dna,
    HandMetal,
    // Fix: Added missing Loader2 import
    Loader2
} from 'lucide-react';

interface BundleItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

const BUNDLES: Record<string, { title: string, items: BundleItem[] }> = {
    "VAP": {
        title: "Ventilator-Associated Pneumonia (VAP)",
        items: [
            { id: 'vap_head', title: "Head Elevation >30°", description: "Maintain semi-recumbent position unless contraindicated.", icon: <Bed size={20} /> },
            { id: 'vap_oral', title: "Oral Care Performed", description: "Chlorhexidine gluconate oral rinse every 12 hours.", icon: <Activity size={20} /> },
            { id: 'vap_suction', title: "Suction Technique", description: "Closed-suction system used with sterile technique.", icon: <Dna size={20} /> },
            { id: 'vap_pud', title: "PUD Prophylaxis", description: "Peptic ulcer disease prophylaxis as per orders.", icon: <Activity size={20} /> },
            { id: 'vap_dvt', title: "DVT Prophylaxis", description: "Deep vein thrombosis prevention protocol initiated.", icon: <HeartPulse size={20} /> },
            { id: 'vap_hand', title: "Hand Hygiene", description: "Performed before and after manipulation of circuit.", icon: <HandMetal size={20} /> }
        ]
    },
    "CAUTI": {
        title: "Catheter-Associated UTI (CAUTI)",
        items: [
            { id: 'cauti_drainage', title: "Drainage System Intact", description: "Closed drainage system remains closed and sterile.", icon: <Droplets size={20} /> },
            { id: 'cauti_bag', title: "Bag Below Bladder", description: "Drainage bag is below level of bladder and off floor.", icon: <MapPin size={20} /> },
            { id: 'cauti_flow', title: "Unobstructed Flow", description: "No kinks or obstructions in the drainage tubing.", icon: <Activity size={20} /> },
            { id: 'cauti_meatal', title: "Meatal Care", description: "Daily meatal hygiene performed with soap and water.", icon: <ShieldCheck size={20} /> },
            { id: 'cauti_necessity', title: "Necessity Review", description: "Daily review for catheter removal eligibility.", icon: <ClipboardCheck size={20} /> }
        ]
    },
    "CLABSI": {
        title: "Central Line-Associated BSI (CLABSI)",
        items: [
            { id: 'clabsi_scrub', title: "Scrub the Hub", description: "Disinfect injection ports/connectors for 15 seconds.", icon: <Activity size={20} /> },
            { id: 'clabsi_dressing', title: "Dressing Integrity", description: "Dressing is dry, clean, and occlusive.", icon: <ShieldCheck size={20} /> },
            { id: 'clabsi_hand', title: "Hand Hygiene", description: "Performed prior to accessing the central line.", icon: <HandMetal size={20} /> },
            { id: 'clabsi_review', title: "Daily Necessity", description: "Ongoing clinical need for central line confirmed.", icon: <Stethoscope size={20} /> }
        ]
    }
};

// Fix: Defined BUNDLE_TYPES constant
const BUNDLE_TYPES = Object.keys(BUNDLES);

interface Props {
  viewMode?: 'log' | 'list' | 'analysis';
}

const HAIBundlesAudit: React.FC<Props> = ({ viewMode: initialViewMode }) => {
    const { user, isAuthenticated, validatePassword } = useAuth();
    const [view, setView] = useState<'log' | 'list' | 'analysis'>(initialViewMode || 'log');
    const [bundleType, setBundleType] = useState<string>('VAP');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const [form, setForm] = useState<any>({
        date: new Date().toISOString().split('T')[0],
        area: '',
        patientName: '',
        nurseInCharge: '',
        results: {} as Record<string, 'PASS' | 'FAIL' | null>
    });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

    useEffect(() => { loadHistory(); }, []);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getBundleAudits();
        setHistory(data);
        setLoading(false);
    };

    const handleResult = (id: string, val: 'PASS' | 'FAIL') => {
        setForm({ ...form, results: { ...form.results, [id]: val } });
    };

    const stats = useMemo(() => {
        const currentBundleItems = BUNDLES[bundleType]?.items || [];
        const results = Object.values(form.results);
        const complete = results.filter(v => v !== null).length;
        const passed = results.filter(v => v === 'PASS').length;
        const failed = results.filter(v => v === 'FAIL').length;
        const totalItems = currentBundleItems.length;
        const compliance = totalItems > 0 ? Math.round((passed / totalItems) * 1000) / 10 : 0;
        return { complete, passed, failed, totalItems, compliance };
    }, [form.results, bundleType]);

    const handleSubmit = async () => {
        if (!form.area || !form.patientName) {
            alert("Please provide ward and patient details.");
            return;
        }
        setLoading(true);
        await submitBundleAudit({ ...form, bundleType, complianceScore: stats.compliance });
        alert("Bundle Audit Logged.");
        setForm({
            date: new Date().toISOString().split('T')[0],
            area: '',
            patientName: '',
            nurseInCharge: '',
            results: {}
        });
        loadHistory();
        setLoading(false);
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
        await deleteRecord('audit_bundles', itemToDelete.id);
        setShowDeleteConfirm(false);
        loadHistory();
        setPasswordConfirmLoading(false);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Perspective View Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit print:hidden">
                <button onClick={() => setView('log')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-[#0d968b] shadow-sm' : 'text-gray-500 hover:text-slate-700'}`}><ClipboardCheck size={14}/> Form</button>
                <button onClick={() => setView('list')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'list' ? 'bg-white text-[#0d968b] shadow-sm' : 'text-gray-500 hover:text-slate-700'}`}><List size={14}/> Registry</button>
            </div>

            {view === 'log' ? (
                <div className="flex flex-col gap-8 pb-32">
                    {/* Header Section */}
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[#111817] text-4xl font-black leading-tight tracking-tight uppercase">Clinical Care Bundles</h1>
                        <p className="text-slate-500 font-medium">Evidence-based checklists for device-related infection prevention.</p>
                    </div>

                    {/* Metadata & Selection */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                <Input label="Audit Date" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                                <Select label="Target Ward" options={AREAS} value={form.area} onChange={e => setForm({...form, area: e.target.value})} />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1">Select Bundle Protocol</label>
                                <div className="flex h-14 w-full items-center justify-center rounded-[1.5rem] bg-white p-1.5 shadow-sm border border-slate-200 overflow-hidden">
                                    {BUNDLE_TYPES.map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => { setBundleType(type); setForm({...form, results: {}}); }}
                                            className={`flex-1 h-full rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${bundleType === type ? 'bg-[#0d968b] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {type} Bundle
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-4">
                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                                <Input label="Patient Name" placeholder="Search or type name..." value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} />
                                <Input label="Nurse in Charge" placeholder="Accountable HCP" value={form.nurseInCharge} onChange={e => setForm({...form, nurseInCharge: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Checklist Card */}
                    <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                        <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{BUNDLES[bundleType].title} Checklist</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Care Standard 4.2</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#0d968b]/10 text-[#0d968b] text-[10px] font-black rounded-full border border-[#0d968b]/20">
                                <div className="size-1.5 rounded-full bg-[#0d968b] animate-pulse"></div>
                                Active Session
                            </div>
                        </div>

                        <div className="flex flex-col divide-y divide-slate-50">
                            {BUNDLES[bundleType].items.map((item) => (
                                <div key={item.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex gap-6 items-start">
                                        <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${form.results[item.id] === 'PASS' ? 'bg-emerald-500 text-white' : form.results[item.id] === 'FAIL' ? 'bg-rose-500 text-white' : 'bg-[#0d968b]/10 text-[#0d968b] group-hover:scale-110'}`}>
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-slate-900 font-black text-lg uppercase tracking-tight leading-none">{item.title}</p>
                                            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-lg">{item.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 shrink-0">
                                        <button 
                                            onClick={() => handleResult(item.id, 'PASS')}
                                            className={`flex items-center gap-2 px-8 py-3 rounded-2xl border-2 font-black text-xs transition-all ${form.results[item.id] === 'PASS' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-500'}`}
                                        >
                                            <Check size={18}/> PASS
                                        </button>
                                        <button 
                                            onClick={() => handleResult(item.id, 'FAIL')}
                                            className={`flex items-center gap-2 px-8 py-3 rounded-2xl border-2 font-black text-xs transition-all ${form.results[item.id] === 'FAIL' ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-500'}`}
                                        >
                                            <X size={18}/> FAIL
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sticky Footer Summary */}
                    <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-slate-200 px-8 py-5 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] flex flex-col md:flex-row items-center justify-between z-[100] animate-in slide-in-from-bottom-full duration-500">
                        <div className="flex items-center gap-12 mb-4 md:mb-0">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Bundle Compliance</p>
                                <div className="flex items-center gap-4">
                                    <span className={`text-4xl font-black ${stats.compliance >= 90 ? 'text-[#0d968b]' : stats.compliance >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>{stats.compliance}%</span>
                                    <div className="w-40 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner hidden md:block">
                                        <div className={`h-full transition-all duration-1000 ${stats.compliance >= 90 ? 'bg-[#0d968b]' : stats.compliance >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${stats.compliance}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="h-12 w-px bg-slate-100 hidden md:block"></div>
                            <div className="flex gap-8">
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Items Complete</p>
                                    <p className="text-xl font-black text-slate-900 leading-none mt-1">{stats.complete} <span className="text-slate-300 font-bold text-sm">of {stats.totalItems}</span></p>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Non-Compliant</p>
                                    <p className={`text-xl font-black leading-none mt-1 ${stats.failed > 0 ? 'text-rose-500' : 'text-slate-300'}`}>{stats.failed}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full md:w-auto">
                            <button onClick={() => setForm({...form, results: {}})} className="flex-1 md:flex-none px-10 py-4 rounded-2xl border-2 border-[#0d968b] text-[#0d968b] font-black uppercase text-xs tracking-widest hover:bg-[#0d968b]/5 transition-all">Clear All</button>
                            <button 
                                onClick={handleSubmit}
                                disabled={loading || stats.complete === 0}
                                className="flex-1 md:flex-none px-12 py-4 bg-[#0d968b] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-[#0d968b]/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                            >
                                {/* Fix: Added Loader2 for loading state */}
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Submit Bundle Audit
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-200 animate-in fade-in duration-500">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#0d968b]/10 text-[#0d968b] rounded-2xl shadow-sm"><List size={24}/></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase leading-none">Audit History</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Archived Clinical Care Logs</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-separate border-spacing-0">
                            <thead className="bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                <tr>
                                    <th className="px-10 py-5 border-b border-slate-50">Audit Date</th>
                                    <th className="px-10 py-5 border-b border-slate-50">Patient & Area</th>
                                    <th className="px-10 py-5 border-b border-slate-50">Protocol Type</th>
                                    <th className="px-10 py-5 border-b border-slate-50 text-center">Adherence</th>
                                    <th className="px-10 py-5 border-b border-slate-50 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {history.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-10 py-5 font-bold text-slate-500">{item.date}</td>
                                        <td className="px-10 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 uppercase text-sm">{item.patientName}</span>
                                                <span className="text-[10px] font-black text-[#0d968b] uppercase tracking-widest">{item.area}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-5">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">{item.bundleType}</span>
                                        </td>
                                        <td className="px-10 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-full font-black text-[10px] border uppercase shadow-sm ${item.complianceScore >= 85 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : item.complianceScore >= 70 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                {item.complianceScore}%
                                            </span>
                                        </td>
                                        <td className="px-10 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleDeleteClick(item)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest animate-pulse">No Historical Audit Logs Located</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <PasswordConfirmModal
                show={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                // Fix: Corrected function reference to handleConfirmDelete
                onConfirm={handleConfirmDelete}
                loading={passwordConfirmLoading}
                title="Discard Bundle Record"
                description={`Permanently remove the adherence log for ${itemToDelete?.patientName}?`}
            />
        </div>
    );
};

export default HAIBundlesAudit;