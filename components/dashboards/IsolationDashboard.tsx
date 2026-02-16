import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getIsolationReports, getCensusLogs, deleteRecord } from '../../services/ipcService';
import { ISOLATION_AREAS } from '../../constants';
import { 
  ChevronLeft, List, BarChart2, Filter, RotateCcw, PlusCircle, Download, Bed, Search, ShieldCheck, ChevronRight, TrendingUp, Users, Activity, Trash2, X, MapPin, Stethoscope, Clock, User, FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';

interface Props {
  isNested?: boolean;
}

const IsolationDashboard: React.FC<Props> = ({ isNested }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, validatePassword } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [census, setCensus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

  // Dynamic Current Dates
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;

  // Standardized Unified Filters
  const [filterArea, setFilterArea] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [reports, censusLogs] = await Promise.all([getIsolationReports(), getCensusLogs()]);
    reports.sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());
    setData(reports);
    setCensus(censusLogs);
    setLoading(false);
  };

  const handleDeleteClick = (report: any) => {
    setItemToDelete(report);
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
      const success = await deleteRecord('reports_isolation', itemToDelete.id);
      if (success) {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setSelectedItem(null);
        loadData();
      } else {
        alert("Failed to delete record.");
      }
    } finally {
      setPasswordConfirmLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const date = new Date(item.dateReported);
      const q = Math.floor(date.getMonth() / 3) + 1;
      const matchesArea = filterArea ? item.area === filterArea : true;
      const matchesYear = selectedYear ? date.getFullYear().toString() === selectedYear : true;
      const matchesMonth = selectedMonth ? (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
      const matchesQuarter = selectedQuarter ? `Q${q}` === selectedQuarter : true;
      const matchesSearch = searchQuery ? 
        (`${item.lastName} ${item.firstName}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hospitalNumber?.includes(searchQuery) || item.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      return matchesArea && matchesYear && matchesMonth && matchesQuarter && matchesSearch;
    });
  }, [data, filterArea, selectedYear, selectedMonth, selectedQuarter, searchQuery]);

  const stats = useMemo(() => {
    const active = filteredData.filter(item => !item.outcome || item.outcome === 'Admitted');
    const counts: Record<string, number> = {};
    active.forEach(item => { if(item.area) counts[item.area] = (counts[item.area] || 0) + 1; });
    const wardCensus = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const diagMap: Record<string, number> = {};
    active.forEach(item => { if(item.diagnosis) diagMap[item.diagnosis] = (diagMap[item.diagnosis] || 0) + 1; });
    
    // Census trend (last 10 entries)
    const censusTrend = census.slice(0, 10).reverse().map(l => ({
      date: l.date.split('-')[2],
      days: l.overall || 0
    }));

    return {
      total: active.length,
      wardCensus,
      censusTrend,
      diagPie: Object.entries(diagMap).map(([name, value]) => ({ name, value })).slice(0, 5)
    };
  }, [filteredData, census]);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6'];

  const DataField = ({ label, value }: { label: string, value: string | number | undefined }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
      <span className="text-sm font-bold text-slate-700 uppercase leading-snug">{value || '---'}</span>
    </div>
  );

  const content = (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex gap-4 items-center">
                {!isNested && <button onClick={() => navigate('/')} className="h-10 flex items-center text-sm text-gray-600 hover:text-indigo-600 font-bold"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg h-10">
                    <button onClick={() => setViewMode('list')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="h-10 w-44 bg-white text-slate-600 rounded-lg font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2 transition-all text-[10px]"><Download size={14} /> Export CSV</button>
                <button onClick={() => navigate('/report-isolation')} className="h-10 w-44 bg-indigo-600 text-white rounded-lg font-black uppercase tracking-widest shadow hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all text-[10px]"><PlusCircle size={14} /> ISOLATION ADMISSIONS</button>
            </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 print:hidden overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100"><Filter size={14} className="text-slate-400" /><span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span></div>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-indigo-600 outline-none font-black uppercase bg-slate-50/50" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                    <option value="">Hospital Unit</option>
                    {ISOLATION_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-indigo-600 outline-none font-black uppercase bg-slate-50/50" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-indigo-600 outline-none font-black uppercase bg-slate-50/50" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    <option value="">All Months</option>
                    {Array.from({length: 12}, (_, i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{new Date(0, i).toLocaleString('en', {month:'short'})}</option>)}
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-indigo-600 outline-none font-black uppercase bg-slate-50/50" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                    <option value="">All Quarters</option>
                    <option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3">Q3</option><option value="Q4">Q4</option>
                </select>
                <div className="relative w-64"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full text-[10px] border border-slate-200 rounded-lg pl-10 pr-2 py-2 focus:ring-1 focus:ring-indigo-600 outline-none font-black uppercase bg-slate-50/50" placeholder="Search Patients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <button onClick={() => { setFilterArea(''); setSelectedMonth(currentMonth); setSelectedQuarter(currentQuarter); setSelectedYear(currentYear); setSearchQuery(''); }} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all"><RotateCcw size={14} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
                {viewMode === 'analysis' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><TrendingUp size={14}/> Occupancy by Unit</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.wardCensus.map(([name, value]) => ({name, value}))}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} /><XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} /><YAxis tick={{fontSize: 9}} /><RechartsTooltip /><Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><Activity size={14}/> Isolation Day Trends</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.censusTrend}><defs><linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} /><XAxis dataKey="date" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><RechartsTooltip /><Area type="monotone" dataKey="days" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDays)" /></AreaChart></ResponsiveContainer></div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6 md:col-span-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><Users size={14}/> Diagnosis Profile</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.diagPie} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({name, value}) => `${name}: ${value}`}>{stats.diagPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b text-[10px] uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-4 w-12 text-center">#</th>
                                <th className="px-4 py-4">Entry Date</th>
                                <th className="px-6 py-4">Patient Name</th>
                                <th className="px-4 py-4">Hospital #</th>
                                <th className="px-4 py-4">Diagnosis</th>
                                <th className="px-4 py-4 text-center">Status</th>
                                <th className="px-4 py-4 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? <tr><td colSpan={7} className="p-10 text-center uppercase text-[10px] font-black text-slate-400 animate-pulse">Loading Isolation...</td></tr> : filteredData.length === 0 ? <tr><td colSpan={7} className="p-10 text-center uppercase text-[10px] font-black text-slate-400">No matching admissions</td></tr> : filteredData.map((report, idx) => (
                                    <tr 
                                      key={report.id} 
                                      className="hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                                      onClick={() => setSelectedItem(report)}
                                    >
                                      <td className="px-4 py-3 text-center text-slate-300 font-black">{idx + 1}</td>
                                      <td className="px-4 py-3 font-medium text-slate-600">{report.dateReported}</td>
                                      <td className="px-6 py-3 font-black text-indigo-600 uppercase">{isAuthenticated ? `${report.lastName}, ${report.firstName}` : `${report.lastName[0]}.${report.firstName[0]}.`}</td>
                                      <td className="px-4 py-3 text-slate-500 font-bold">{report.hospitalNumber}</td>
                                      <td className="px-4 py-3 font-bold text-slate-700 text-xs">{report.diagnosis}</td>
                                      <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-[9px] font-black border uppercase ${!report.outcome || report.outcome === 'Admitted' ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>{report.outcome || "Admitted"}</span></td>
                                      <td className="px-4 py-3">
                                          <div className="flex items-center justify-center">
                                              {isAuthenticated && (
                                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(report); }} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Remove Entry">
                                                      <Trash2 size={16} />
                                                  </button>
                                              )}
                                          </div>
                                      </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <div className="w-full lg:w-64 flex flex-col gap-3 print:hidden">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-50 bg-slate-50/30"><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bed Occupancy</span></div>
                  <div className="flex flex-col divide-y divide-slate-50">
                    <div className="p-4 flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase text-slate-400">Total Isolated</span><Bed size={12} className="text-indigo-600 opacity-50" /></div>
                        <span className="text-2xl font-black text-indigo-700 leading-none">{stats.total}</span>
                    </div>
                    {stats.wardCensus.slice(0, 5).map(([name, count]) => (
                        <div key={name} className="p-4 flex flex-col gap-1 text-left">
                            <div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase text-slate-400 truncate mr-2">{name}</span><ChevronRight size={10} className="text-indigo-200" /></div>
                            <span className="text-xl font-black text-slate-800 leading-none">{count}</span>
                        </div>
                    ))}
                  </div>
              </div>
            </div>
        </div>

        {/* Record Detail Modal - MIRROR of Isolation Form */}
        {selectedItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="bg-indigo-600 p-8 text-white relative shrink-0">
                <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"><X size={24}/></button>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Isolation Registry Profile</span>
                  <h3 className="text-3xl font-black uppercase leading-tight">{selectedItem.lastName}, {selectedItem.firstName}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">{selectedItem.hospitalNumber}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">{selectedItem.sex} • {selectedItem.age}y/o</span>
                  </div>
                </div>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8 bg-slate-50/50">
                
                {/* SECTION 1: IDENTITY */}
                <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
                    <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-sm tracking-tight border-b border-slate-100 pb-4">
                        <Users size={20} className="text-indigo-600"/> Patient Identification
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <DataField label="Hospital #" value={selectedItem.hospitalNumber} />
                      <DataField label="Last Name" value={selectedItem.lastName} />
                      <DataField label="First Name" value={selectedItem.firstName} />
                      <DataField label="Middle Name" value={selectedItem.middleName} />
                      <DataField label="Date of Birth" value={selectedItem.dob} />
                      <DataField label="Age" value={selectedItem.age} />
                      <DataField label="Sex" value={selectedItem.sex} />
                      <DataField label="Barangay" value={selectedItem.barangay} />
                      <DataField label="City" value={selectedItem.city} />
                    </div>
                </section>

                {/* SECTION 2: ISOLATION CONTEXT */}
                <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
                    <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-sm tracking-tight border-b border-slate-100 pb-4">
                        <MapPin size={20} className="text-indigo-600"/> Isolation Context
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <DataField label="Isolation Ward" value={selectedItem.area} />
                      <DataField label="Isolation Entry Date" value={selectedItem.transferDate} />
                      <DataField label="Transferred From" value={selectedItem.transferredFrom} />
                      <DataField label="Hosp. Admission Date" value={selectedItem.dateOfAdmission} />
                      <div className="lg:col-span-2"><DataField label="Initial Diagnosis" value={selectedItem.diagnosis} /></div>
                    </div>
                </section>

                {/* SECTION 3: REPORTER */}
                <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
                    <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-sm tracking-tight border-b border-slate-100 pb-4">
                        <FileText size={20} className="text-indigo-600"/> Reporter Data
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <DataField label="Reporter Name" value={selectedItem.reporterName} />
                        <DataField label="Designation" value={selectedItem.designation} />
                    </div>
                </section>

                <div className="pt-4 flex justify-between items-center px-4">
                   <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={16}/>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Registry Entry: {selectedItem.dateReported || 'N/A'}</span>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => setSelectedItem(null)} className="px-8 py-3 bg-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-300 transition-all">Dismiss</button>
                      {isAuthenticated && <button onClick={() => { setItemToDelete(selectedItem); setShowDeleteConfirm(true); }} className="px-8 py-3 bg-rose-50 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:bg-rose-600 transition-all flex items-center gap-2"><Trash2 size={14}/> Remove</button>}
                   </div>
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
            title="Remove Isolation Entry"
            description={`Proceed with permanent removal of the admission record for ${itemToDelete?.lastName || 'this patient'}?`}
        />
    </div>
  );

  return isNested ? content : <Layout title="Isolation Registry">{content}</Layout>;
};

export default IsolationDashboard;