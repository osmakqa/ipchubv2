
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getPendingReports, validateReport, deletePendingReport } from '../../services/ipcService';
import { 
    AREAS, 
    HAI_TYPES, 
    NOTIFIABLE_DISEASES,
    PTB_OUTCOMES,
    BARANGAYS,
    NTP_PATIENT_TYPES,
    CLINICAL_DEPARTMENTS,
    NTP_REASONS_FOR_REFERRAL,
    NTP_TB_DIAGNOSES
} from '../../constants';
import { 
    ChevronLeft, 
    CheckCircle, 
    Activity, 
    ShieldAlert, 
    Stethoscope, 
    FlaskConical, 
    Trash2, 
    Loader2,
    AlertCircle,
    X,
    Save,
    User,
    MapPin,
    ArrowRight,
    Bell,
    ShieldCheck,
    FileText
} from 'lucide-react';

const PendingTasksDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, validatePassword } = useAuth();
    const [pending, setPending] = useState<any>({ hai: [], isolation: [], tb: [], ntp: [], culture: [], notifiable: [], needlestick: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'hai' | 'isolation' | 'tb' | 'ntp' | 'culture' | 'notifiable' | 'needlestick'>('hai');
    const [validatingId, setValidatingId] = useState<string | null>(null);
    const [reviewModal, setReviewModal] = useState<{ show: boolean, item: any | null }>({ show: false, item: null });

    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);


    useEffect(() => {
        if (!isAuthenticated) { navigate('/'); return; }
        loadPending();
    }, [isAuthenticated]);

    const loadPending = async () => {
        setLoading(true);
        const data = await getPendingReports();
        setPending(data);
        setLoading(false);
    };

    const handleValidate = async (type: any, id: string, updatedData?: any) => {
        if (!user) return;
        setValidatingId(id);
        try {
            const success = await validateReport(type, id, user, updatedData);
            if (success) {
                setReviewModal({ show: false, item: null });
                loadPending();
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Error validating report.");
        } finally {
            setValidatingId(null);
        }
    };

    const promptDeleteConfirmation = (type: any, item: any) => {
        setItemToDelete({ type, ...item });
        setShowPasswordConfirm(true);
    };

    const handlePasswordConfirmed = async (password: string) => {
        if (!itemToDelete || !user) return;
        setPasswordConfirmLoading(true);
        if (!validatePassword(user, password)) {
            alert("Incorrect password.");
            setPasswordConfirmLoading(false);
            return;
        }
        try {
            await deletePendingReport(itemToDelete.type, itemToDelete.id);
            setReviewModal({ show: false, item: null });
            setShowPasswordConfirm(false);
            setItemToDelete(null);
            loadPending();
        } finally {
            setPasswordConfirmLoading(false);
        }
    };

    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setReviewModal(prev => ({ ...prev, item: { ...prev.item, [name]: value } }));
    };

    const tabs = [
        { id: 'hai', label: 'HAI', icon: <Activity size={16} />, count: pending.hai.length, color: 'text-teal-600' },
        { id: 'notifiable', label: 'Notifiable', icon: <Bell size={16} />, count: pending.notifiable.length, color: 'text-red-600' },
        { id: 'needlestick', label: 'Sharps', icon: <ShieldAlert size={16} />, count: pending.needlestick.length, color: 'text-amber-600' },
        { id: 'ntp', label: 'NTP', icon: <FileText size={16} />, count: pending.ntp.length, color: 'text-amber-600' },
        { id: 'tb', label: 'TB', icon: <Stethoscope size={16} />, count: pending.tb.length, color: 'text-amber-700' },
        { id: 'isolation', label: 'Isolation', icon: <ShieldCheck size={16} />, count: pending.isolation.length, color: 'text-indigo-600' },
        { id: 'culture', label: 'Culture', icon: <FlaskConical size={16} />, count: pending.culture.length, color: 'text-rose-600' },
    ];

    const currentList = pending[activeTab] || [];

    return (
        <Layout title="Coordinator Inbox">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-primary transition-colors font-bold">
                        <ChevronLeft size={16} /> Hub Hub
                    </button>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex overflow-x-auto gap-2">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all border-2 ${
                                activeTab === tab.id ? `bg-gray-50 border-gray-800 text-gray-900` : `bg-white border-transparent text-gray-400 hover:bg-gray-50`
                            }`}
                        >
                            {tab.icon} {tab.label}
                            {tab.count > 0 && <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-600 font-black`}>{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="bg-white p-20 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-4"><Loader2 size={48} className="animate-spin text-gray-300" /><p className="font-bold text-gray-400">Loading pending items...</p></div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {currentList.length === 0 ? (
                            <div className="bg-white p-16 rounded-2xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 text-center"><CheckCircle size={32} className="text-green-500" /><h3 className="font-bold text-gray-800 text-lg">Inbox Zero!</h3><p className="text-gray-500 text-sm">No pending {activeTab} reports.</p></div>
                        ) : (
                            currentList.map((item: any) => (
                                <div key={item.id} onClick={() => setReviewModal({ show: true, item: { ...item } })} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-400 transition-all cursor-pointer group">
                                    <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl bg-gray-50 group-hover:bg-white transition-colors ${tabs.find(t => t.id === activeTab)?.color}`}>{tabs.find(t => t.id === activeTab)?.icon}</div>
                                            <div>
                                                <h4 className="font-black text-gray-800 group-hover:text-primary transition-colors">{item.hcwName || `${item.lastName}, ${item.firstName}`}</h4>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Hosp #: {item.hospitalNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 text-sm font-bold text-gray-700">
                                            {activeTab === 'ntp' ? `Referral: ${item.referralReason}` : (item.haiType || item.disease || item.diagnosis || item.organism)}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="hidden md:flex flex-col items-end text-[10px] text-gray-400 font-black uppercase tracking-widest mr-2"><span>Reported On</span><span className="text-gray-600">{item.dateReported || item.date}</span></div>
                                            <button onClick={(e) => { e.stopPropagation(); promptDeleteConfirmation(activeTab, item); }} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                            <div className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all"><ArrowRight size={20} /></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {reviewModal.show && reviewModal.item && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
                        <div className="bg-gray-900 text-white p-6 sticky top-0 z-10 flex justify-between items-center">
                            <h2 className="font-black text-xl leading-tight">Review Submission: {activeTab.toUpperCase()}</h2>
                            <button onClick={() => setReviewModal({ show: false, item: null })} className="p-2 hover:bg-white/20 rounded-full"><X size={24}/></button>
                        </div>
                        
                        <div className="p-8 flex flex-col gap-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><User size={14}/> Basic Information</h3>
                                    <div className="flex flex-col gap-3">
                                        <Input label="Surname" name="lastName" value={reviewModal.item.lastName} onChange={handleModalInputChange} />
                                        <Input label="First Name" name="firstName" value={reviewModal.item.firstName} onChange={handleModalInputChange} />
                                        <Input label="Hospital Number" name="hospitalNumber" value={reviewModal.item.hospitalNumber} onChange={handleModalInputChange} />
                                        <div className="grid grid-cols-2 gap-2"><Input label="Age" name="age" value={reviewModal.item.age} onChange={handleModalInputChange} /><Select label="Sex" name="sex" options={['Male', 'Female']} value={reviewModal.item.sex} onChange={handleModalInputChange} /></div>
                                    </div>
                                </section>

                                <section className="p-5 bg-white rounded-xl border border-gray-200 flex flex-col gap-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><AlertCircle size={14}/> Registry Parameters</h3>
                                    <div className="flex flex-col gap-3">
                                        {activeTab === 'ntp' && (
                                            <>
                                                <Select label="Patient Type" name="patientType" options={NTP_PATIENT_TYPES} value={reviewModal.item.patientType} onChange={handleModalInputChange} />
                                                <Select label="Clinical Department" name="clinicalDept" options={CLINICAL_DEPARTMENTS} value={reviewModal.item.clinicalDept} onChange={handleModalInputChange} />
                                                <Select label="TB Diagnosis" name="tbDiagnosis" options={NTP_TB_DIAGNOSES} value={reviewModal.item.tbDiagnosis} onChange={handleModalInputChange} />
                                                <Select label="Reason for Referral" name="referralReason" options={NTP_REASONS_FOR_REFERRAL} value={reviewModal.item.referralReason} onChange={handleModalInputChange} />
                                            </>
                                        )}
                                        {activeTab !== 'ntp' && <Select label="Area / Ward" name="area" options={AREAS} value={reviewModal.item.area} onChange={handleModalInputChange} />}
                                        <Input label="Date" name="dateReported" type="date" value={reviewModal.item.dateReported || reviewModal.item.date} onChange={handleModalInputChange} />
                                    </div>
                                </section>
                            </div>

                            <section className="p-5 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-bold text-blue-900">Submitted by: <span className="font-normal">{reviewModal.item.referredBy || reviewModal.item.reporterName}</span></p>
                                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Entry Date: {reviewModal.item.dateReported || reviewModal.item.date}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setReviewModal({ show: false, item: null })} className="px-6 py-3 bg-white text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button onClick={() => handleValidate(activeTab, reviewModal.item.id, reviewModal.item)} disabled={validatingId === reviewModal.item.id} className="px-10 py-3 bg-primary text-white font-black rounded-xl shadow-lg hover:bg-osmak-green-dark transition-all flex items-center gap-2">
                                        {validatingId === reviewModal.item.id ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Publish to Hub
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
            <PasswordConfirmModal show={showPasswordConfirm} onClose={() => setShowPasswordConfirm(false)} onConfirm={handlePasswordConfirmed} loading={passwordConfirmLoading} title="Confirm Discard" description={`Discard submission for ${itemToDelete?.lastName || ''}?`} />
        </Layout>
    );
};

export default PendingTasksDashboard;
