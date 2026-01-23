import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getIsolationReports, updateIsolationReport, deleteRecord } from '../../services/ipcService';
import { AREAS, ISOLATION_AREAS, PATIENT_OUTCOMES } from '../../constants';
import { 
  ChevronLeft, 
  Save, 
  X, 
  List, 
  BarChart2, 
  MapPin, 
  Clock, 
  Users, 
  Filter, 
  RotateCcw, 
  PlusCircle, 
  Edit3, 
  FileText, 
  Trash2,
  Download,
  Hash,
  Bed
} from 'lucide-react';

interface Props {
  isNested?: boolean;
  viewMode?: 'list' | 'analysis';
}

const IsolationDashboard: React.FC<Props> = ({ isNested, viewMode: initialViewMode }) => {
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

  const [filterArea, setFilterArea] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('Active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (initialViewMode) setViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const reports = await getIsolationReports();
      reports.sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());
      setData(reports);
    } catch (e) {
      console.error("Load failed", e);
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
      const itemDate = new Date(item.dateReported);
      const matchesYear = selectedYear ? itemDate.getFullYear().toString() === selectedYear : true;
      const matchesArea = filterArea ? item.area === filterArea : true;
      
      let matchesOutcome = true;
      if (filterOutcome === 'Active') {
        matchesOutcome = !item.outcome || item.outcome === 'Admitted';
      } else if (filterOutcome !== 'All') {
        matchesOutcome = item.outcome === filterOutcome;
      }
      
      const matchesDateRange = (startDate ? itemDate >= new Date(startDate) : true) && 
                         (endDate ? itemDate <= new Date(endDate) : true);
      return matchesYear && matchesArea && matchesOutcome && matchesDateRange;
    });
  }, [data, filterArea, filterOutcome, startDate, endDate, selectedYear]);

  const summaryStats = useMemo(() => {
    const active = data.filter(item => !item.outcome || item.outcome === 'Admitted');
    const counts: Record<string, number> = {};
    active.forEach(item => { if(item.area) counts[item.area] = (counts[item.area] || 0) + 1; });
    return {
      totalActive: active.length,
      wardCensus: Object.entries(counts).sort((a, b) => b[1] - a[1])
    };
  }, [data]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const exportItems = filteredData.map(item => ({
      Report_ID: item.id || '',
      Report_Date: item.dateReported,
      Patient_Name: formatName(item.lastName, item.firstName),
      Hospital_Number: item.hospitalNumber,
      Diagnosis: item.diagnosis,
      Isolation_Room: item.area,
      Transferred_From: item.transferredFrom,
      Entry_Date: item.transferDate,
      Status: item.outcome || 'Admitted',
      Reporter: item.reporterName
    }));

    const headers = Object.keys(exportItems[0]).join(',');
    const rows = exportItems.map(item => 
      Object.values(item).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Isolation_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleRowClick = (item: any) => { 
    setFormModal({ show: true, item: { ...item }, isEditable: false }); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormModal(prev => ({ ...prev, item: { ...prev.item, [name]: value } }));
  };

  const saveChanges = async () => {
    await updateIsolationReport(formModal.item);
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
      alert("Incorrect password. Deletion failed.");
      setPasswordConfirmLoading(false);
      return;
    }
    try {
      await deleteRecord('reports_isolation', itemToDelete.id);
      setFormModal({ show: false, item: null, isEditable: false });
      setShowPasswordConfirm(false);
      setItemToDelete(null);
      loadData();
    } catch (e) { 
      alert("Failed to delete record."); 
    } finally {
      setPasswordConfirmLoading(false);
    }
  };

  const content = (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex gap-4 items-center">
                {!isNested && <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-indigo-600 font-bold transition-colors"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg shadow-inner">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportCSV}
                  disabled={filteredData.length === 0}
                  className="bg-white text-slate-600 px-4 py-2 rounded-lg font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95 text-xs"
                >
                  <Download size={18} /> Export Full CSV
                </button>
                <button onClick={() => navigate('/report-isolation')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow hover:bg-indigo-700 flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <PlusCircle size={18} /> Register Admission
                </button>
            </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:hidden">
            <div className="flex items-center gap-3 min-w-max">
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                    <Filter size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                </div>
                <div className="flex items-center gap-2">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-medium bg-slate-50/50" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                        <option value="">All Isolation Rooms</option>
                        {ISOLATION_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="h-6 w-px bg-slate-100 mx-1"></div>
                <div className="flex items-center gap-2">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </select>
                </div>
                <button onClick={() => { setFilterArea(''); setFilterOutcome('Active'); setStartDate(''); setEndDate(''); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><RotateCcw size={14} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 order-2 lg:order-1 min-w-0">
                {viewMode === 'list' ? (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                                  <tr>
                                    <th className="px-6 py-4">Report ID</th>
                                    <th className="px-6 py-4">Report Date</th>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Isolation Room</th>
                                    <th className="px-6 py-4">Diagnosis</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (<tr><td colSpan={6} className="p-8 text-center text-gray-500 font-black uppercase text-xs tracking-widest">Loading isolation records...</td></tr>) : filteredData.length === 0 ? (<tr><td colSpan={6} className="p-8 text-center text-gray-400 font-bold uppercase text-xs">No records found matching criteria</td></tr>) : filteredData.map((report) => (
                                        <tr key={report.id} onClick={() => handleRowClick(report)} className="hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                                          <td className="px-6 py-3 font-mono text-[10px] text-slate-400">#{report.id.substring(0, 8)}</td>
                                          <td className="px-6 py-3 font-medium text-slate-600">{report.dateReported}</td>
                                          <td className="px-6 py-3 font-bold text-indigo-600">{formatName(report.lastName, report.firstName)}</td>
                                          <td className="px-6 py-3 font-medium text-slate-800">{report.area}</td>
                                          <td className="px-6 py-3 text-slate-600 text-xs">{report.diagnosis}</td>
                                          <td className="px-6 py-3 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase ${!report.outcome || report.outcome === 'Admitted' ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                                              {report.outcome || "Admitted"}
                                            </span>
                                          </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
                        <BarChart2 size={48} className="text-slate-200" />
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Isolation Analytics Coming Soon</p>
                    </div>
                )}
            </div>
            
            {viewMode === 'list' && (
              <div className="w-full lg:w-56 flex flex-col gap-3 print:hidden order-1 lg:order-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-50 bg-slate-50/30">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Isolation Census</span>
                      </div>
                      <div className="flex flex-col divide-y divide-slate-50">
                        <button onClick={() => { setFilterOutcome('Active'); setFilterArea(''); }} className="p-4 flex flex-col gap-0.5 text-left hover:bg-slate-50 group transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-indigo-600">Total Admitted</span>
                                <Bed size={12} className="text-indigo-400 opacity-50" />
                            </div>
                            <span className="text-3xl font-black text-slate-900 leading-none">{summaryStats.totalActive}</span>
                        </button>
                        {summaryStats.wardCensus.length === 0 ? (
                           <div className="p-4 text-center text-[9px] font-bold text-slate-300 italic uppercase">No active patients</div>
                        ) : summaryStats.wardCensus.map(([name, count]) => (
                            <button 
                                key={name} 
                                onClick={() => { setFilterOutcome('Active'); setFilterArea(name); }} 
                                className={`p-4 flex flex-col gap-0.5 text-left hover:bg-slate-50 group transition-all ${filterArea === name ? 'bg-indigo-50/50' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-indigo-600 truncate mr-2">{name}</span>
                                    <MapPin size={10} className="text-indigo-300" />
                                </div>
                                <span className={`text-xl font-black leading-none ${filterArea === name ? 'text-indigo-600' : 'text-slate-800 group-hover:text-indigo-600'}`}>{count}</span>
                            </button>
                        ))}
                      </div>
                  </div>
              </div>
            )}
        </div>

        {formModal.show && formModal.item && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
                    <div className="bg-indigo-600 text-white p-6 sticky top-0 z-10 flex justify-between items-center shadow-lg">
                        <div className="flex flex-col">
                          <h2 className="font-black text-xl leading-tight">
                            {formModal.isEditable ? 'Edit Isolation Record' : 'Isolation Admission Details'}
                          </h2>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-1 mt-1"><Hash size={10}/> Report ID: {formModal.item.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAuthenticated && !formModal.isEditable && (
                            <>
                              <button onClick={() => setFormModal(prev => ({ ...prev, isEditable: true }))} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold">
                                <Edit3 size={16}/> Edit
                              </button>
                              <button onClick={() => promptDeleteConfirmation(formModal.item)} className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold text-white shadow-sm">
                                <Trash2 size={16}/> Delete
                              </button>
                            </>
                          )}
                          <button onClick={() => setFormModal({ show: false, item: null, isEditable: false })} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                    </div>
                    
                    <div className="p-6 md:p-8 flex flex-col gap-8">
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <Users size={18} className="text-indigo-600"/> Patient Identification
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <Input label="Hospital Number" name="hospitalNumber" value={formModal.item.hospitalNumber} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Last Name" name="lastName" value={formModal.isEditable ? formModal.item.lastName : getPrivacyValue(formModal.item.lastName)} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="First Name" name="firstName" value={formModal.isEditable ? formModal.item.firstName : getPrivacyValue(formModal.item.firstName)} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Age" name="age" value={formModal.item.age} readOnly className="bg-slate-50 font-bold" />
                                <Select label="Sex" name="sex" options={['Male', 'Female']} value={formModal.item.sex} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Barangay" name="barangay" value={formModal.item.barangay} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="City" name="city" value={formModal.item.city} onChange={handleInputChange} disabled={!formModal.isEditable} />
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <MapPin size={18} className="text-indigo-600"/> Isolation Context
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <Select label="Isolation Room" name="area" options={ISOLATION_AREAS} value={formModal.item.area} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Entry Date" name="transferDate" type="date" value={formModal.item.transferDate} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Select label="Transferred From" name="transferredFrom" options={AREAS} value={formModal.item.transferredFrom} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Admission Date" name="dateOfAdmission" type="date" value={formModal.item.dateOfAdmission} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <div className="lg:col-span-2"><Input label="Diagnosis" name="diagnosis" value={formModal.item.diagnosis} onChange={handleInputChange} disabled={!formModal.isEditable} /></div>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <FileText size={18} className="text-indigo-600"/> Finalization & Reporter
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Select label="Outcome" name="outcome" options={PATIENT_OUTCOMES} value={formModal.item.outcome} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Reporter" name="reporterName" value={formModal.item.reporterName} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Designation" name="designation" value={formModal.item.designation} onChange={handleInputChange} disabled={!formModal.isEditable} />
                            </div>
                        </section>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end items-center gap-3 sticky bottom-0">
                        <button onClick={() => setFormModal({ show: false, item: null, isEditable: false })} className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">Close</button>
                        {formModal.isEditable && (
                          <button onClick={saveChanges} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all">
                            <Save size={20}/> Save Changes
                          </button>
                        )}
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
          description={`Permanently delete the record for ${itemToDelete?.lastName || ''}, ${itemToDelete?.firstName || ''}.`}
        />
    </div>
  );

  return isNested ? content : <Layout title="Isolation Registry">{content}</Layout>;
};

export default IsolationDashboard;
