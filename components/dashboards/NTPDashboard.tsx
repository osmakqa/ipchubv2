
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getNTPReports, updateNTPReport, deleteRecord } from '../../services/ipcService';
import { 
  CLINICAL_DEPARTMENTS, 
  NTP_PATIENT_TYPES, 
  NTP_TB_DIAGNOSES 
} from '../../constants';
import { 
  ChevronLeft, 
  Save, 
  X, 
  List, 
  BarChart2, 
  Activity,
  Filter,
  RotateCcw,
  PlusCircle,
  Edit3,
  Trash2,
  Download,
  Users,
  Stethoscope,
  TrendingUp,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';

interface Props {
  isNested?: boolean;
  viewMode?: 'list' | 'analysis';
}

const NTPDashboard: React.FC<Props> = ({ isNested, viewMode: initialViewMode }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, validatePassword } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>(initialViewMode || 'list');
  const [formModal, setFormModal] = useState<{ show: boolean, item: any | null, isEditable: boolean }>({
    show: false, item: null, isEditable: false
  });
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

  const [filterType, setFilterType] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (initialViewMode) setViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const reports = await getNTPReports();
      reports.sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());
      setData(reports);
    } catch (e) {
      console.error("Failed to load NTP reports:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatName = (last: string, first: string) => {
    if (isAuthenticated) return `${last}, ${first}`;
    return `${last?.[0] || ''}.${first?.[0] || ''}.`;
  };

  const getPrivacyValue = (val: string) => {
    if (isAuthenticated || (formModal.show && formModal.isEditable)) return val;
    return val ? `${val[0]}.` : '';
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const date = new Date(item.dateReported);
      const matchesYear = selectedYear ? date.getFullYear().toString() === selectedYear : true;
      const matchesType = filterType ? item.patientType === filterType : true;
      const matchesDept = filterDept ? item.clinicalDept === filterDept : true;
      return matchesYear && matchesType && matchesDept;
    });
  }, [data, filterType, filterDept, selectedYear]);

  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) return null;
    const typeMap: Record<string, number> = {};
    const deptMap: Record<string, number> = {};
    const diagMap: Record<string, number> = {};

    filteredData.forEach(d => {
      typeMap[d.patientType] = (typeMap[d.patientType] || 0) + 1;
      deptMap[d.clinicalDept] = (deptMap[d.clinicalDept] || 0) + 1;
      diagMap[d.tbDiagnosis] = (diagMap[d.tbDiagnosis] || 0) + 1;
    });

    const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
    const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    const diagData = Object.entries(diagMap).map(([name, value]) => ({ name, value }));

    return { typeData, deptData, diagData };
  }, [filteredData]);

  const handleRowClick = (item: any) => { setFormModal({ show: true, item: { ...item }, isEditable: false }); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormModal(prev => ({ ...prev, item: { ...prev.item, [name]: value } }));
  };

  const saveChanges = async () => {
    await updateNTPReport(formModal.item);
    setFormModal({ show: false, item: null, isEditable: false });
    loadData();
  };

  const promptDeleteConfirmation = (item: any) => {
    setItemToDelete(item);
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
      await deleteRecord('reports_ntp', itemToDelete.id);
      setFormModal({ show: false, item: null, isEditable: false });
      setShowPasswordConfirm(false);
      loadData();
    } finally {
      setPasswordConfirmLoading(false);
    }
  };

  const COLORS = ['#b45309', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#111827'];

  const content = (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex gap-4 items-center">
                {!isNested && <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-amber-700 font-bold transition-colors"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
                </div>
            </div>
            <button onClick={() => navigate('/report-ntp')} className="bg-amber-700 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow hover:bg-amber-800 flex items-center gap-2 transition-all text-xs">
                <PlusCircle size={18} /> Register for NTP
            </button>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:hidden">
            <div className="flex items-center gap-3 min-w-max">
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                    <Filter size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                </div>
                <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none bg-slate-50/50" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">All Patient Types</option>
                    {NTP_PATIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none bg-slate-50/50" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                    <option value="">All Departments</option>
                    {CLINICAL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button onClick={() => { setFilterType(''); setFilterDept(''); }} className="p-1.5 text-slate-400 hover:text-amber-700 rounded-lg"><RotateCcw size={14} /></button>
            </div>
        </div>

        {viewMode === 'analysis' ? (
             <div className="flex flex-col gap-8 animate-in fade-in">
                {!summaryStats ? <div className="p-20 text-center text-slate-400 font-bold uppercase text-xs">No records found</div> : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><TrendingUp size={14}/> Referrals by Department</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={summaryStats.deptData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={140} tick={{fontSize: 9, fontWeight: 'bold'}} /><RechartsTooltip contentStyle={{borderRadius: '12px'}} /><Bar dataKey="value" fill="#b45309" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><Users size={14}/> Diagnostic Distribution</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={summaryStats.diagData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" label={({name, value}) => `${name}: ${value}`}>{summaryStats.diagData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip /></PieChart></ResponsiveContainer></div>
                        </div>
                    </div>
                )}
             </div>
        ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                        <tr>
                            <th className="px-6 py-4">Registry Date</th>
                            <th className="px-6 py-4">Patient</th>
                            <th className="px-6 py-4">Hosp #</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Diagnosis</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? <tr><td colSpan={5} className="p-8 text-center uppercase text-xs font-black text-slate-400">Loading NTP Data...</td></tr> : filteredData.length === 0 ? <tr><td colSpan={5} className="p-8 text-center uppercase text-xs font-black text-slate-400">No Registry Records Found</td></tr> : filteredData.map((report) => (
                            <tr key={report.id} onClick={() => handleRowClick(report)} className="hover:bg-amber-50/50 transition-colors cursor-pointer group">
                                <td className="px-6 py-3 font-medium text-slate-600">{report.dateReported}</td>
                                <td className="px-6 py-3 font-bold text-amber-800">{formatName(report.lastName, report.firstName)}</td>
                                <td className="px-6 py-3 text-slate-500 font-medium">{report.hospitalNumber}</td>
                                <td className="px-6 py-3 text-slate-600 uppercase text-[10px] font-bold">{report.clinicalDept}</td>
                                <td className="px-6 py-3 font-medium text-amber-700">{report.tbDiagnosis}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {formModal.show && formModal.item && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
                    <div className="bg-amber-800 text-white p-6 sticky top-0 z-10 flex justify-between items-center shadow-lg">
                        <h2 className="font-black text-xl leading-tight">NTP Registry Details</h2>
                        <div className="flex items-center gap-2">
                          {isAuthenticated && !formModal.isEditable && (
                            <>
                              <button onClick={() => setFormModal(prev => ({ ...prev, isEditable: true }))} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"><Edit3 size={16}/> Edit</button>
                              <button onClick={() => promptDeleteConfirmation(formModal.item)} className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold text-white shadow-sm"><Trash2 size={16}/> Delete</button>
                            </>
                          )}
                          <button onClick={() => setFormModal({ show: false, item: null, isEditable: false })} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                    </div>
                    
                    <div className="p-6 md:p-8 flex flex-col gap-8">
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-4">
                                <h3 className="font-black text-xs text-amber-800 flex items-center gap-2 uppercase tracking-widest"><Users size={16}/> Patient Info</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <p className="text-sm font-bold">Name: <span className="font-black text-amber-900 uppercase">{formatName(formModal.item.lastName, formModal.item.firstName)}</span></p>
                                    <p className="text-sm font-bold">Hosp #: <span className="font-black">{formModal.item.hospitalNumber}</span></p>
                                    <p className="text-sm font-bold">Age/Sex: <span className="font-black">{formModal.item.age} / {formModal.item.sex}</span></p>
                                    <p className="text-sm font-bold">Contact: <span className="font-black">{formModal.item.contactNumber}</span></p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                                <h3 className="font-black text-xs text-amber-800 flex items-center gap-2 uppercase tracking-widest"><Stethoscope size={16}/> Diagnosis</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <p className="text-sm font-bold">Patient Type: <span className="font-black">{formModal.item.patientType}</span></p>
                                    <p className="text-sm font-bold">Referral Reason: <span className="font-black text-amber-700">{formModal.item.referralReason}</span></p>
                                    <p className="text-sm font-bold">TB Diagnosis: <span className="font-black text-red-600">{formModal.item.tbDiagnosis}</span></p>
                                    {formModal.item.extrapulmonarySite && <p className="text-sm font-bold">Site: <span className="font-black">{formModal.item.extrapulmonarySite}</span></p>}
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                            <h3 className="font-black text-xs text-amber-800 flex items-center gap-2 uppercase tracking-widest border-b pb-2"><ClipboardList size={16}/> Previous Treatment History</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 text-slate-400 font-black uppercase">
                                        <tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Unit</th><th className="p-2 text-left">Drugs/Dur</th><th className="p-2 text-left">Outcome</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {formModal.item.treatmentHistory?.map((row: any, i: number) => (
                                            <tr key={i}>
                                                <td className="p-2 font-bold">{row.dateStarted}</td>
                                                <td className="p-2 font-bold">{row.treatmentUnit}</td>
                                                <td className="p-2 font-bold">{row.drugsDuration}</td>
                                                <td className="p-2 font-black text-amber-700">{row.outcome}</td>
                                            </tr>
                                        ))}
                                        {(!formModal.item.treatmentHistory || formModal.item.treatmentHistory.length === 0) && (
                                            <tr><td colSpan={4} className="p-4 text-center text-slate-300 font-bold">No history recorded</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end items-center gap-3 sticky bottom-0">
                        <button onClick={() => setFormModal({ show: false, item: null, isEditable: false })} className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}

        <PasswordConfirmModal
          show={showPasswordConfirm}
          onClose={() => setShowPasswordConfirm(false)}
          onConfirm={handlePasswordConfirmed}
          loading={passwordConfirmLoading}
          title="Confirm Deletion"
          description={`Permanently delete the record for ${itemToDelete?.lastName || ''}.`}
        />
    </div>
  );

  return isNested ? content : <Layout title="NTP Registry">{content}</Layout>;
};

export default NTPDashboard;
