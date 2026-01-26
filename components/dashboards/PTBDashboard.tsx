import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getTBReports, getCensusLogs, deleteRecord, formatDisplayDate } from '../../services/ipcService';
import { AREAS, PTB_FINAL_DISPOSITIONS } from '../../constants';
import { 
  ChevronLeft, List, BarChart2, Filter, RotateCcw, PlusCircle, Download, Activity, Stethoscope, ChevronRight, Search, AlertCircle, TrendingUp, PieChart as PieIcon, Beaker, FileText, UserPlus, Users, X, ArrowRight, CheckCircle2, Edit3, Trash2, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';

interface Props {
  isNested?: boolean;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc' | null;
};

const PTBDashboard: React.FC<Props> = ({ isNested }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, validatePassword } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [census, setCensus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'labs' | 'analysis'>('list');
  const [selectedLab, setSelectedLab] = useState<any | null>(null);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dateReported', direction: 'desc' });
  const [labSortConfig, setLabSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

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
  const [filterFinalDisposition, setFilterFinalDisposition] = useState('Currently Admitted');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [reports, censusLogs] = await Promise.all([getTBReports(), getCensusLogs()]);
    setData(reports);
    setCensus(censusLogs);
    setLoading(false);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleLabSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (labSortConfig.key === key && labSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setLabSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const filtered = data.filter(item => {
      const date = new Date(item.dateReported);
      const q = Math.floor(date.getMonth() / 3) + 1;
      const matchesType = filterType ? item.classification === filterType : true;
      const matchesArea = filterArea ? item.area === filterArea : true;
      const matchesYear = selectedYear ? date.getFullYear().toString() === selectedYear : true;
      const matchesMonth = selectedMonth ? (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
      const matchesQuarter = selectedQuarter ? `Q${q}` === selectedQuarter : true;
      const matchesFinalDisposition = filterFinalDisposition ? (item.finalDisposition === filterFinalDisposition) : true;
      const matchesSearch = searchQuery ? 
        (`${item.lastName} ${item.firstName}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hospitalNumber?.includes(searchQuery) : true;
      return matchesType && matchesArea && matchesYear && matchesMonth && matchesQuarter && matchesSearch && matchesFinalDisposition;
    });

    if (sortConfig.key && sortConfig.direction) {
      filtered.sort((a, b) => {
        const aVal = sortConfig.key === 'name' ? `${a.lastName}, ${a.firstName}` : a[sortConfig.key];
        const bVal = sortConfig.key === 'name' ? `${b.lastName}, ${b.firstName}` : b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, filterType, filterArea, filterFinalDisposition, selectedYear, selectedMonth, selectedQuarter, searchQuery, sortConfig]);

  const sortedLabData = useMemo(() => {
    const results: any[] = [];
    data.forEach(p => {
      if (p.xpertResults && Array.isArray(p.xpertResults)) {
        p.xpertResults.forEach((r: any) => results.push({ ...r, type: 'GeneXpert', patientName: `${p.lastName}, ${p.firstName}`, hosp: p.hospitalNumber, patientObj: p }));
      }
      if (p.smearResults && Array.isArray(p.smearResults)) {
        p.smearResults.forEach((r: any) => results.push({ ...r, type: 'AFB', patientName: `${p.lastName}, ${p.firstName}`, hosp: p.hospitalNumber, patientObj: p }));
      }
    });

    const filteredLabs = results.filter(lab => {
      const p = lab.patientObj;
      const matchesFinalDisposition = filterFinalDisposition ? (p.finalDisposition === filterFinalDisposition) : true;
      const matchesSearch = searchQuery ? 
        lab.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.hosp?.includes(searchQuery) : true;
      return matchesFinalDisposition && matchesSearch;
    });

    if (labSortConfig.key && labSortConfig.direction) {
      filteredLabs.sort((a, b) => {
        const aVal = a[labSortConfig.key];
        const bVal = b[labSortConfig.key];
        if (aVal < bVal) return labSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return labSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filteredLabs;
  }, [data, labSortConfig, filterFinalDisposition, searchQuery]);

  const stats = useMemo(() => {
    const active = sortedData;
    const missingDx = active.filter(d => (!d.xpertResults || d.xpertResults.length === 0) && (!d.smearResults || d.smearResults.length === 0)).length;
    const classMap: Record<string, number> = {};
    active.forEach(d => { classMap[d.classification] = (classMap[d.classification] || 0) + 1; });
    const classData = Object.entries(classMap).map(([name, value]) => ({ name, value }));
    
    const censusTrend = census.slice(0, 10).reverse().map(l => ({
      date: l.date.split('-')[2],
      days: l.overall || 0
    }));

    return { total: active.length, missingDx, classData, censusTrend };
  }, [sortedData, census]);

  const SortIcon = ({ colKey, currentConfig }: { colKey: string, currentConfig: SortConfig }) => {
    if (currentConfig.key !== colKey) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    return currentConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />;
  };

  const COLORS = ['#b45309', '#3b82f6', '#10b981', '#ef4444'];

  const handleRegisterPatient = (lab: any) => {
    navigate('/report-ptb', { 
      state: { 
        prefill: {
          lastName: lab.patientObj.lastName,
          firstName: lab.patientObj.firstName,
          hospitalNumber: lab.patientObj.hospitalNumber,
          initialLab: {
            type: lab.type,
            date: lab.date,
            specimen: lab.specimen,
            result: lab.result
          }
        }
      } 
    });
  };

  const handleEditRecord = (patient: any) => {
    navigate('/report-ptb', { state: { editPatient: patient } });
  };

  const handleDeleteClick = (patient: any) => {
    setItemToDelete(patient);
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
      await deleteRecord('reports_tb', itemToDelete.id);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      loadData();
    } finally {
      setPasswordConfirmLoading(false);
    }
  };

  const content = (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex gap-4 items-center w-full md:w-auto">
                {!isNested && <button onClick={() => navigate('/')} className="h-10 flex items-center text-sm text-gray-600 hover:text-amber-700 font-bold"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg h-10 w-full md:w-auto overflow-x-auto no-scrollbar">
                    <button 
                      onClick={() => setViewMode('list')} 
                      className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'list' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500'}`}
                    >
                      <List size={14} /> Patients
                    </button>
                    <button 
                      onClick={() => { setViewMode('labs'); setFilterFinalDisposition(''); }} 
                      className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'labs' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500'}`}
                    >
                      <Beaker size={14} /> Lab Registry
                    </button>
                    <button 
                      onClick={() => setViewMode('analysis')} 
                      className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'analysis' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500'}`}
                    >
                      <BarChart2 size={14} /> Analysis
                    </button>
                </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                {isAuthenticated && <button onClick={() => navigate('/report-tb-result')} className="flex-1 md:flex-none h-10 px-4 bg-slate-900 text-white rounded-lg font-black uppercase tracking-widest shadow hover:bg-black flex items-center justify-center gap-2 transition-all text-[9px] md:text-[10px]"><Beaker size={14} /> Result</button>}
                <button onClick={() => navigate('/report-ptb')} className="flex-1 md:flex-none h-10 px-4 bg-amber-700 text-white rounded-lg font-black uppercase tracking-widest shadow hover:brightness-110 flex items-center justify-center gap-2 transition-all text-[9px] md:text-[10px]"><PlusCircle size={14} /> Register</button>
            </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 print:hidden overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100"><Filter size={14} className="text-slate-400" /><span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span></div>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-amber-700 outline-none font-black uppercase bg-slate-50/50" value={filterFinalDisposition} onChange={(e) => setFilterFinalDisposition(e.target.value)}>
                    <option value="">All Dispositions</option>
                    {PTB_FINAL_DISPOSITIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-amber-700 outline-none font-black uppercase bg-slate-50/50" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">Classification</option>
                    <option value="Please Update">Please Update</option>
                    <option value="Bacteriological Confirmed">Bacteriological Confirmed</option>
                    <option value="Clinically Diagnosed">Clinically Diagnosed</option>
                    <option value="Presumptive TB">Presumptive TB</option>
                    <option value="Cleared">Cleared</option>
                </select>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-amber-700 outline-none font-black uppercase bg-slate-50/50" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                    <option value="">Hospital Area</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <div className="relative w-64"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full text-[10px] border border-slate-200 rounded-lg pl-10 pr-2 py-2 focus:ring-1 focus:ring-amber-700 outline-none font-black uppercase bg-slate-50/50" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <button onClick={() => { setFilterType(''); setFilterArea(''); setFilterFinalDisposition(viewMode === 'labs' ? '' : 'Currently Admitted'); setSearchQuery(''); }} className="p-1.5 text-slate-400 hover:text-amber-700 transition-all"><RotateCcw size={14} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
                {viewMode === 'analysis' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><PieIcon size={14}/> Classification Census</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.classData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({name, value}) => `${name}: ${value}`}>{stats.classData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><Activity size={14}/> Ward Census Trend</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.censusTrend}><defs><linearGradient id="colorTb" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#b45309" stopOpacity={0.2}/><stop offset="95%" stopColor="#b45309" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} /><XAxis dataKey="date" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><RechartsTooltip /><Area type="monotone" dataKey="days" stroke="#b45309" strokeWidth={3} fillOpacity={1} fill="url(#colorTb)" /></AreaChart></ResponsiveContainer></div>
                        </div>
                    </div>
                ) : viewMode === 'labs' ? (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-4 w-12 text-center">#</th>
                            <th className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleLabSort('date')}>
                              <div className="flex items-center">Lab Date <SortIcon colKey="date" currentConfig={labSortConfig} /></div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleLabSort('patientName')}>
                              <div className="flex items-center">Patient Name <SortIcon colKey="patientName" currentConfig={labSortConfig} /></div>
                            </th>
                            <th className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleLabSort('type')}>
                              <div className="flex items-center">Type <SortIcon colKey="type" currentConfig={labSortConfig} /></div>
                            </th>
                            <th className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleLabSort('result')}>
                              <div className="flex items-center">Result <SortIcon colKey="result" currentConfig={labSortConfig} /></div>
                            </th>
                            <th className="px-4 py-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedLabData.length === 0 ? <tr><td colSpan={6} className="p-10 text-center uppercase text-[10px] font-black text-slate-400">No laboratory records found</td></tr> : sortedLabData.map((res, idx) => (
                                <tr 
                                  key={idx} 
                                  onClick={() => setSelectedLab(res)}
                                  className="hover:bg-amber-50/50 transition-colors cursor-pointer group"
                                >
                                  <td className="px-4 py-3 text-center text-slate-300 font-black">{idx + 1}</td>
                                  <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">{formatDisplayDate(res.date)}</td>
                                  <td className="px-6 py-3 font-black text-amber-800 uppercase whitespace-nowrap">{res.patientName}</td>
                                  <td className="px-4 py-3 font-bold text-indigo-600 text-xs whitespace-nowrap">{res.type}</td>
                                  <td className="px-4 py-3 font-black text-[10px] uppercase">
                                    <span className={`px-2 py-0.5 rounded-full border whitespace-nowrap ${res.mtbResult === 'MTB Detected' || res.result?.includes('+') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                      {res.mtbResult || res.result} {res.mtbLevel ? `(${res.mtbLevel})` : ''} {res.rifResistance ? `[${res.rifResistance}]` : ''}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        {isAuthenticated && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEditRecord(res.patientObj); }}
                                                className="p-2 text-slate-300 hover:text-amber-600 hover:bg-white rounded-lg transition-all"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        )}
                                        <ArrowRight size={16} className="text-slate-200 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                  </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b text-[10px] uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-4 w-12 text-center">#</th>
                                <th className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('dateOfAdmission')}>
                                  <div className="flex items-center">Admit Date <SortIcon colKey="dateOfAdmission" currentConfig={sortConfig} /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                                  <div className="flex items-center">Patient Name <SortIcon colKey="name" currentConfig={sortConfig} /></div>
                                </th>
                                <th className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('hospitalNumber')}>
                                  <div className="flex items-center">Hosp # <SortIcon colKey="hospitalNumber" currentConfig={sortConfig} /></div>
                                </th>
                                <th className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('classification')}>
                                  <div className="flex items-center">Classification <SortIcon colKey="classification" currentConfig={sortConfig} /></div>
                                </th>
                                <th className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('finalDisposition')}>
                                  <div className="flex items-center justify-center">Disp. <SortIcon colKey="finalDisposition" currentConfig={sortConfig} /></div>
                                </th>
                                <th className="px-4 py-4 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? <tr><td colSpan={7} className="p-10 text-center uppercase text-[10px] font-black text-slate-400 animate-pulse">Loading...</td></tr> : sortedData.length === 0 ? <tr><td colSpan={7} className="p-10 text-center uppercase text-[10px] font-black text-slate-400">No records</td></tr> : sortedData.map((report, idx) => (
                                    <tr key={report.id} className="hover:bg-amber-50/50 transition-colors cursor-pointer group">
                                      <td className="px-4 py-3 text-center text-slate-300 font-black">{idx + 1}</td>
                                      <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">{formatDisplayDate(report.dateOfAdmission)}</td>
                                      <td className="px-6 py-3 font-black text-amber-800 uppercase whitespace-nowrap">{isAuthenticated ? `${report.lastName}, ${report.firstName}` : `${report.lastName[0]}.${report.firstName[0]}.`}</td>
                                      <td className="px-4 py-3 text-slate-500 font-bold whitespace-nowrap">{report.hospitalNumber}</td>
                                      <td className="px-4 py-3 font-bold text-slate-700 text-xs whitespace-nowrap">{report.classification}</td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black border uppercase whitespace-nowrap ${report.finalDisposition === 'Currently Admitted' ? "bg-green-100 text-green-700 border-green-200" : report.finalDisposition === 'Cleared' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                                            {report.finalDisposition || "Currently Admitted"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {isAuthenticated && (
                                                <>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleEditRecord(report); }}
                                                        className="p-2 text-slate-300 hover:text-amber-600 hover:bg-white rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(report); }}
                                                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {!isAuthenticated && <ArrowRight size={16} className="text-slate-200" />}
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
                  <div className="px-4 py-2.5 border-b border-slate-50 bg-slate-50/30"><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Snapshot</span></div>
                  <div className="flex flex-col divide-y divide-slate-50">
                    {[
                      { label: 'Total', value: stats.total, icon: Activity, color: 'text-amber-700' },
                      { label: 'Unlinked', value: stats.missingDx, icon: AlertCircle, color: 'text-red-600' },
                      { label: 'GeneXpert+', value: sortedLabData.filter(l => l.type === 'GeneXpert' && (l.mtbResult === 'MTB Detected')).length, icon: Beaker, color: 'text-indigo-600' }
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

        {/* Result Action Modal */}
        {selectedLab && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-amber-700 p-8 text-white relative">
                <button onClick={() => setSelectedLab(null)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"><X size={20}/></button>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Laboratory Profile</span>
                <h3 className="text-2xl font-black uppercase leading-tight mt-1">{selectedLab.patientName}</h3>
                <p className="text-xs font-bold opacity-80 mt-1">{selectedLab.hosp}</p>
              </div>
              
              <div className="p-8 flex flex-col gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Summary</span>
                    <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">{selectedLab.type}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xl font-black ${selectedLab.mtbResult === 'MTB Detected' || selectedLab.result?.includes('+') ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedLab.mtbResult || selectedLab.result}
                    </span>
                    {selectedLab.mtbLevel && <span className="text-xs font-bold text-slate-600">Level: {selectedLab.mtbLevel}</span>}
                    {selectedLab.rifResistance && <span className="text-xs font-bold text-red-600">Resistance: {selectedLab.rifResistance}</span>}
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Released: {formatDisplayDate(selectedLab.date)} • {selectedLab.specimen}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {selectedLab.patientObj.isLabOnly ? (
                    <button 
                      onClick={() => handleRegisterPatient(selectedLab)}
                      className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg"
                    >
                      <UserPlus size={18}/> Convert to Treatment Registry
                    </button>
                  ) : (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3 items-start">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-emerald-900 leading-snug">Linked to treatment registry.</p>
                    </div>
                  )}
                  <button 
                    onClick={() => handleEditRecord(selectedLab.patientObj)}
                    className="w-full h-14 bg-white border-2 border-slate-200 text-amber-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 size={18} /> Edit Patient File
                  </button>
                  <button 
                    onClick={() => setSelectedLab(null)}
                    className="w-full h-14 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-slate-300 transition-all"
                  >
                    Cancel
                  </button>
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
            title="Confirm Registry Deletion"
            description={`Permanently delete the record for ${itemToDelete?.lastName || ''}?`}
        />
    </div>
  );

  return isNested ? content : <Layout title="TB Surveillance">{content}</Layout>;
};

export default PTBDashboard;