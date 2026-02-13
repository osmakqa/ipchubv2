import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getHAIReports, getCensusLogs, deleteRecord } from '../../services/ipcService';
import { AREAS, HAI_TYPES } from '../../constants';
import { 
  ChevronLeft, List, BarChart2, Filter, RotateCcw, 
  PlusCircle, Download, Activity, Wind, Droplets, Syringe, Search, TrendingUp, Users, Trash2, X, Microscope, Pill, FileText, User, Scissors, Bug, MapPin, ClipboardList, Info,
  // Add missing Clock import
  Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area, Legend 
} from 'recharts';

interface Props {
  isNested?: boolean;
  viewMode?: 'list' | 'analysis';
}

const HAIDashboard: React.FC<Props> = ({ isNested, viewMode: initialViewMode }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, validatePassword } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [census, setCensus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>(initialViewMode || 'list');
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
  const [filterType, setFilterType] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { if (initialViewMode) setViewMode(initialViewMode); }, [initialViewMode]);
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [reports, censusLogs] = await Promise.all([getHAIReports(), getCensusLogs()]);
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
      const success = await deleteRecord('reports_hai', itemToDelete.id);
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
      const matchesType = filterType ? item.haiType === filterType : true;
      const matchesArea = filterArea ? item.area === filterArea : true;
      const matchesYear = selectedYear ? date.getFullYear().toString() === selectedYear : true;
      const matchesMonth = selectedMonth ? (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
      const matchesQuarter = selectedQuarter ? `Q${q}` === selectedQuarter : true;
      const matchesSearch = searchQuery ? 
        (`${item.lastName} ${item.firstName}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hospitalNumber?.includes(searchQuery) : true;
      return matchesType && matchesArea && matchesYear && matchesMonth && matchesQuarter && matchesSearch;
    });
  }, [data, filterType, filterArea, selectedYear, selectedMonth, selectedQuarter, searchQuery]);

  const stats = useMemo(() => {
    const active = filteredData;
    const typeMap: Record<string, number> = {};
    active.forEach(d => { typeMap[d.haiType] = (typeMap[d.haiType] || 0) + 1; });
    const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
    
    // Census trend (last 10 entries)
    const censusTrend = census.slice(0, 10).reverse().map(l => ({
      date: l.date.split('-')[2],
      days: l.overall || 0
    }));

    return {
      total: active.length,
      pieData,
      censusTrend,
      vap: active.filter(d => d.haiType === 'Ventilator Associated Pneumonia').length,
      cauti: active.filter(d => d.haiType === 'Catheter-Associated UTI').length,
      crbsi: active.filter(d => d.haiType === 'Catheter-Related Blood Stream Infections').length
    };
  }, [filteredData, census]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const DataField = ({ label, value }: { label: string, value: string | number | undefined }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-slate-700 uppercase leading-snug">{value || '---'}</span>
    </div>
  );

  const content = (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex gap-4 items-center">
                {!isNested && <button onClick={() => navigate('/')} className="h-10 flex items-center text-sm text-gray-600 hover:text-primary font-bold"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg h-10">
                    <button onClick={() => setViewMode('list')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="h-10 w-44 bg-white text-slate-600 rounded-lg font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2 transition-all text-[10px]"><Download size={14} /> Export CSV</button>
                <button onClick={() => navigate('/report-hai')} className="h-10 w-44 bg-primary text-white rounded-lg font-black uppercase tracking-widest shadow hover:brightness-110 flex items-center justify-center gap-2 transition-all text-[10px]"><PlusCircle size={14} /> New Case</button>
            </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 print:hidden overflow-x-auto">
            <div className="flex items-center gap-3 min-max-content">
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100"><Filter size={14} className="text-slate-400" /><span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span></div>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">Infection Type</option>
                    {HAI_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                    <option value="">Hospital Area</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select className="w-20 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                </select>
                <select className="w-20 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    <option value="">All Months</option>
                    {Array.from({length: 12}, (_, i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{new Date(0, i).toLocaleString('en', {month:'short'})}</option>)}
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                    <option value="">All Quarters</option>
                    <option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3">Q3</option><option value="Q4">Q4</option>
                </select>
                <div className="relative w-64"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full text-[10px] border border-slate-200 rounded-lg pl-10 pr-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" placeholder="Search Patients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <button onClick={() => { setFilterType(''); setFilterArea(''); setSelectedMonth(currentMonth); setSelectedQuarter(currentQuarter); setSelectedYear(currentYear); setSearchQuery(''); }} className="p-1.5 text-slate-400 hover:text-primary transition-all"><RotateCcw size={14} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
                {viewMode === 'analysis' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><TrendingUp size={14}/> Infection Distribution</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>{stats.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><Activity size={14}/> Census Trend (Patient Days)</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.censusTrend}><defs><linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#009a3e" stopOpacity={0.2}/><stop offset="95%" stopColor="#009a3e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} /><XAxis dataKey="date" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><RechartsTooltip /><Area type="monotone" dataKey="days" stroke="#009a3e" strokeWidth={3} fillOpacity={1} fill="url(#colorDays)" /></AreaChart></ResponsiveContainer></div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6 md:col-span-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><Users size={14}/> Ward Volume Comparison</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={AREAS.map(a => ({ name: a, count: filteredData.filter(d => d.area === a).length })).filter(d => d.count > 0)}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} /><XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} /><YAxis tick={{fontSize: 9}} /><RechartsTooltip /><Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b text-[10px] uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-4 w-12 text-center">#</th>
                                <th className="px-4 py-4">Admission Date</th>
                                <th className="px-6 py-4">Patient Name</th>
                                <th className="px-4 py-4">Hospital #</th>
                                <th className="px-4 py-4">Infection Type</th>
                                <th className="px-4 py-4 text-center">Status</th>
                                <th className="px-4 py-4 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? <tr><td colSpan={7} className="p-10 text-center uppercase text-[10px] font-black text-slate-400 animate-pulse">Loading Registry...</td></tr> : filteredData.length === 0 ? <tr><td colSpan={7} className="p-10 text-center uppercase text-[10px] font-black text-slate-400">No matching records</td></tr> : filteredData.map((report, idx) => (
                                    <tr 
                                      key={report.id} 
                                      className="hover:bg-primary/5 transition-colors group cursor-pointer"
                                      onClick={() => setSelectedItem(report)}
                                    >
                                      <td className="px-4 py-3 text-center text-slate-300 font-black">{idx + 1}</td>
                                      <td className="px-4 py-3 font-medium text-slate-600">{report.dateOfAdmission}</td>
                                      <td className="px-6 py-3 font-black text-primary uppercase">{isAuthenticated ? `${report.lastName}, ${report.firstName}` : `${report.lastName[0]}.${report.firstName[0]}.`}</td>
                                      <td className="px-4 py-3 text-slate-500 font-bold">{report.hospitalNumber}</td>
                                      <td className="px-4 py-3 font-bold text-slate-700 text-xs">{report.haiType}</td>
                                      <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-[9px] font-black border uppercase ${!report.outcome || report.outcome === 'Admitted' ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>{report.outcome || "Admitted"}</span></td>
                                      <td className="px-4 py-3">
                                          <div className="flex items-center justify-center">
                                              {isAuthenticated && (
                                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(report); }} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete Case">
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
                  <div className="px-4 py-2.5 border-b border-slate-50 bg-slate-50/30"><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Registry Snapshot</span></div>
                  <div className="flex flex-col divide-y divide-slate-50">
                    {[
                      { label: 'Total Active', value: stats.total, icon: Activity, color: 'text-primary' },
                      { label: 'Active VAPs', value: stats.vap, icon: Wind, color: 'text-blue-600' },
                      { label: 'Active CAUTIs', value: stats.cauti, icon: Droplets, color: 'text-amber-600' },
                      { label: 'Active CRBSIs', value: stats.crbsi, icon: Syringe, color: 'text-red-600' }
                    ].map(card => (
                      <div key={card.label} className="p-4 flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase text-slate-400">{card.label}</span><card.icon size={12} className="opacity-30" /></div>
                        <span className={`text-2xl font-black ${card.color}`}>{card.value}</span>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
        </div>

        {/* Record Detail Modal - MIRROR of Form */}
        {selectedItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="bg-primary p-8 text-white relative shrink-0">
                <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"><X size={24}/></button>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Registry Case Record</span>
                  <h3 className="text-3xl font-black uppercase leading-tight">{selectedItem.lastName}, {selectedItem.firstName}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">{selectedItem.hospitalNumber}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">{selectedItem.sex} • {selectedItem.age}y/o</span>
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">{selectedItem.area}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8 bg-slate-50/50">
                {/* SECTION 1: IDENTITY */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
                  <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase text-sm tracking-tight border-b border-slate-100 pb-4">
                    <Users size={20} className="text-primary"/> Patient Identification
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <DataField label="Hospital Number" value={selectedItem.hospitalNumber} />
                    <DataField label="Last Name" value={selectedItem.lastName} />
                    <DataField label="First Name" value={selectedItem.firstName} />
                    <DataField label="Middle Name" value={selectedItem.middleName} />
                    <DataField label="Date of Birth" value={selectedItem.dob} />
                    <DataField label="Age" value={selectedItem.age} />
                    <DataField label="Sex" value={selectedItem.sex} />
                    <DataField label="Barangay" value={selectedItem.barangay} />
                    <DataField label="City" value={selectedItem.city} />
                  </div>
                </div>

                {/* SECTION 2: PARAMETERS */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
                  <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase text-sm tracking-tight border-b border-slate-100 pb-4">
                    <Activity size={20} className="text-primary"/> Infection Parameters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DataField label="Infection Type" value={selectedItem.haiType} />
                    <DataField label="Patient Area" value={selectedItem.area} />
                    <DataField label="Admission Date" value={selectedItem.dateOfAdmission} />
                  </div>

                  {/* Conditional MIRROR logic */}
                  {selectedItem.haiType === 'Multidrug-resistant organisms (MDROs)' && (
                    <div className="p-6 bg-teal-50 rounded-3xl border border-teal-100 flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-teal-800"><Bug size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">MDRO Details</h4></div>
                      <DataField label="Specimen Type" value={selectedItem.mdroSpecimenType} />
                    </div>
                  )}

                  {selectedItem.haiType === 'Ventilator Associated Pneumonia' && (
                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-blue-800"><Wind size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">Ventilator Data</h4></div>
                      <div className="grid grid-cols-2 gap-4">
                        <DataField label="MV Initiation Area" value={selectedItem.mvInitiationArea} />
                        <DataField label="MV Initiation Date" value={selectedItem.mvInitiationDate} />
                      </div>
                    </div>
                  )}

                  {selectedItem.haiType === 'Healthcare-Associated Pneumonia' && (
                    <div className="p-6 bg-cyan-50 rounded-3xl border border-cyan-100 flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-cyan-800"><FileText size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">HAP Data</h4></div>
                      <DataField label="Symptom Onset Date" value={selectedItem.pneumoniaSymptomOnset} />
                    </div>
                  )}

                  {selectedItem.haiType === 'Catheter-Associated UTI' && (
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-indigo-800"><Droplets size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">Catheter Data</h4></div>
                      <div className="grid grid-cols-2 gap-4">
                        <DataField label="IFC Initiation Area" value={selectedItem.ifcInitiationArea} />
                        <DataField label="IFC Initiation Date" value={selectedItem.ifcInitiationDate} />
                      </div>
                    </div>
                  )}

                  {selectedItem.haiType === 'Surgical Site Infection' && (
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-amber-800"><Scissors size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">Surgical/Operative Data</h4></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DataField label="Procedure Done" value={selectedItem.ssiProcedureType} />
                        <DataField label="Procedure Date" value={selectedItem.ssiProcedureDate} />
                        <DataField label="Event Date" value={selectedItem.ssiEventDate} />
                        <DataField label="Tissue Level" value={selectedItem.ssiTissueLevel} />
                        <DataField label="Organ Space" value={selectedItem.ssiOrganSpace} />
                      </div>
                    </div>
                  )}

                  {selectedItem.haiType === 'Catheter-Related Blood Stream Infections' && (
                    <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex flex-col gap-6">
                      <div className="flex items-center gap-2 text-rose-800"><Syringe size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">Line-Related Data</h4></div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DataField label="Initiation Area" value={selectedItem.crbsiInitiationArea} />
                        <DataField label="Insertion Date" value={selectedItem.crbsiInsertionDate} />
                        <DataField label="Catheter Type" value={selectedItem.catheterType} />
                        <DataField label="Insertion Site" value={selectedItem.insertionSite} />
                        <DataField label="Lumens" value={selectedItem.numLumens} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-2 block">Clinical Signs</span>
                        <div className="flex flex-wrap gap-2">
                          {(selectedItem.clinicalSigns || []).map((s: string) => (
                            <span key={s} className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 3: LAB & TREATMENT */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
                  <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase text-sm tracking-tight border-b border-slate-100 pb-4">
                    <Microscope size={20} className="text-primary"/> Laboratory & Treatment
                  </h3>
                  <DataField label="Empiric Antibiotics" value={selectedItem.empiricAntibiotics} />
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-slate-600"><Pill size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">Isolated Organism</h4></div>
                    <p className="text-xl font-black text-slate-800 uppercase italic">{selectedItem.cultureOrganism || 'No Isolate'}</p>
                    
                    {selectedItem.sensitivities && selectedItem.sensitivities.length > 0 && (
                      <div className="mt-4 flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Antibiotic Sensitivity List</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {selectedItem.sensitivities.map((s: any, i: number) => (
                            <div key={i} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-600 uppercase">{s.antibiotic}</span>
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${s.result?.includes('R') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {s.result?.split(' ')[0]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 4: FINALIZATION */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
                  <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase text-sm tracking-tight border-b border-slate-100 pb-4">
                    <FileText size={20} className="text-primary"/> Finalization
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <DataField label="Outcome" value={selectedItem.outcome} />
                    <DataField label="Outcome Date" value={selectedItem.outcomeDate} />
                    <DataField label="Reporter" value={selectedItem.reporterName} />
                    <DataField label="Designation" value={selectedItem.designation} />
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center px-4">
                   <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={16}/>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Entry Created: {selectedItem.created_at?.toDate ? selectedItem.created_at.toDate().toLocaleString() : 'N/A'}</span>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => setSelectedItem(null)} className="px-8 py-3 bg-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-300 transition-all">Close</button>
                      {isAuthenticated && <button onClick={() => { setItemToDelete(selectedItem); setShowDeleteConfirm(true); }} className="px-8 py-3 bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg hover:bg-rose-600 transition-all flex items-center gap-2"><Trash2 size={14}/> Delete</button>}
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
            title="Confirm Case Removal"
            description={`Are you sure you want to permanently remove the HAI registry record for ${itemToDelete?.lastName || 'this patient'}?`}
        />
    </div>
  );

  return isNested ? content : <Layout title="HAI Registry Hub">{content}</Layout>;
};

export default HAIDashboard;