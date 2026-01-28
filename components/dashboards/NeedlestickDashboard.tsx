import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getNeedlestickReports, getCensusLogs, deleteRecord } from '../../services/ipcService';
import { AREAS } from '../../constants';
import { 
  ChevronLeft, List, BarChart2, Filter, RotateCcw, PlusCircle, Download, ShieldAlert, Droplets, Search, ChevronRight, TrendingUp, Users, Briefcase, Activity, Trash2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';

interface Props {
  isNested?: boolean;
}

const NeedlestickDashboard: React.FC<Props> = ({ isNested }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, validatePassword } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [census, setCensus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');

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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [reports, censusLogs] = await Promise.all([getNeedlestickReports(), getCensusLogs()]);
    reports.sort((a, b) => new Date(b.dateOfInjury).getTime() - new Date(a.dateOfInjury).getTime());
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
      const success = await deleteRecord('reports_needlestick', itemToDelete.id);
      if (success) {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
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
      const date = new Date(item.dateOfInjury);
      const q = Math.floor(date.getMonth() / 3) + 1;
      const matchesType = filterType ? item.exposureType === filterType : true;
      const matchesArea = filterArea ? item.workLocation === filterArea : true;
      const matchesYear = selectedYear ? date.getFullYear().toString() === selectedYear : true;
      const matchesMonth = selectedMonth ? (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
      const matchesQuarter = selectedQuarter ? `Q${q}` === selectedQuarter : true;
      const matchesSearch = searchQuery ? 
        (item.hcwName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hospitalNumber?.includes(searchQuery) : true;
      return matchesType && matchesArea && matchesYear && matchesMonth && matchesQuarter && matchesSearch;
    });
  }, [data, filterType, filterArea, selectedYear, selectedMonth, selectedQuarter, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const percutaneous = filteredData.filter(d => d.exposureType === 'Percutaneous').length;
    const splash = filteredData.filter(d => d.exposureType === 'Mucous membrane splash').length;
    
    const jobMap: Record<string, number> = {};
    filteredData.forEach(d => { if(d.jobTitle) jobMap[d.jobTitle] = (jobMap[d.jobTitle] || 0) + 1; });
    const jobPie = Object.entries(jobMap).map(([name, value]) => ({ name, value }));

    const censusTrend = census.slice(0, 10).reverse().map(l => ({
      date: l.date.split('-')[2],
      days: l.overall || 0
    }));

    return { total, percutaneous, splash, jobPie, censusTrend };
  }, [filteredData, census]);

  const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6'];

  const content = (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex gap-4 items-center">
                {!isNested && <button onClick={() => navigate('/')} className="h-10 flex items-center text-sm text-gray-600 hover:text-red-500 font-bold"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg h-10">
                    <button onClick={() => setViewMode('list')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="h-10 w-44 bg-white text-slate-600 rounded-lg font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2 transition-all text-[10px]"><Download size={14} /> Export CSV</button>
                <button onClick={() => navigate('/report-needlestick')} className="h-10 w-44 bg-red-600 text-white rounded-lg font-black uppercase tracking-widest shadow hover:bg-red-700 flex items-center justify-center gap-2 transition-all text-[10px]"><PlusCircle size={14} /> New Log</button>
            </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 print:hidden overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100"><Filter size={14} className="text-slate-400" /><span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span></div>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-red-500 outline-none font-black uppercase bg-slate-50/50" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">Exposure Type</option>
                    <option value="Percutaneous">Percutaneous</option>
                    <option value="Mucous membrane splash">Splash</option>
                </select>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-red-500 outline-none font-black uppercase bg-slate-50/50" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                    <option value="">Hospital Area</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select className="w-20 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-red-500 outline-none font-black uppercase bg-slate-50/50" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                </select>
                <select className="w-20 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-red-500 outline-none font-black uppercase bg-slate-50/50" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    <option value="">All Months</option>
                    {Array.from({length: 12}, (_, i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{new Date(0, i).toLocaleString('en', {month:'short'})}</option>)}
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-red-500 outline-none font-black uppercase bg-slate-50/50" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                    <option value="">All Quarters</option>
                    <option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3">Q3</option><option value="Q4">Q4</option>
                </select>
                <div className="relative w-64"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full text-[10px] border border-slate-200 rounded-lg pl-10 pr-2 py-2 focus:ring-1 focus:ring-red-500 outline-none font-black uppercase bg-slate-50/50" placeholder="Search HCW/ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <button onClick={() => { setFilterType(''); setFilterArea(''); setSelectedMonth(currentMonth); setSelectedQuarter(currentQuarter); setSelectedYear(currentYear); setSearchQuery(''); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-all"><RotateCcw size={14} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
                {viewMode === 'analysis' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><Briefcase size={14}/> Risk Profile by Role</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.jobPie} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({name, value}) => `${name}: ${value}`}>{stats.jobPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><Activity size={14}/> Institutional Activity Trend</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.censusTrend}><defs><linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} /><XAxis dataKey="date" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><RechartsTooltip /><Area type="monotone" dataKey="days" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDays)" /></AreaChart></ResponsiveContainer></div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6 md:col-span-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><TrendingUp size={14}/> High-Exposure Units</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={AREAS.map(a => ({ name: a, count: filteredData.filter(d => d.workLocation === a).length })).filter(d => d.count > 0)}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} /><XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} /><YAxis tick={{fontSize: 9}} /><RechartsTooltip /><Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b text-[10px] uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-4 w-12 text-center">#</th>
                                <th className="px-4 py-4">Injury Date</th>
                                <th className="px-6 py-4">Staff Name</th>
                                <th className="px-4 py-4">Employee #</th>
                                <th className="px-4 py-4">Exposure</th>
                                <th className="px-4 py-4 text-center">Location</th>
                                <th className="px-4 py-4 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? <tr><td colSpan={7} className="p-10 text-center uppercase text-[10px] font-black text-slate-400 animate-pulse">Loading Log...</td></tr> : filteredData.length === 0 ? <tr><td colSpan={7} className="p-10 text-center uppercase text-[10px] font-black text-slate-400">No matching reports</td></tr> : filteredData.map((report, idx) => (
                                    <tr key={report.id} className="hover:bg-red-50/50 transition-colors group">
                                      <td className="px-4 py-3 text-center text-slate-300 font-black">{idx + 1}</td>
                                      <td className="px-4 py-3 font-medium text-slate-600">{report.dateOfInjury}</td>
                                      <td className="px-6 py-3 font-black text-red-600 uppercase">{isAuthenticated ? report.hcwName : `${report.hcwName?.split(', ')[0][0]}. ${report.hcwName?.split(', ')[1]?.[0]}.`}</td>
                                      <td className="px-4 py-3 text-slate-500 font-bold">{report.hospitalNumber}</td>
                                      <td className="px-4 py-3 font-black text-amber-600 text-[10px] uppercase">{report.exposureType}</td>
                                      <td className="px-4 py-3 text-slate-500 font-bold text-xs uppercase text-center">{report.workLocation}</td>
                                      <td className="px-4 py-3">
                                          <div className="flex items-center justify-center">
                                              {isAuthenticated && (
                                                  <button onClick={() => handleDeleteClick(report)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Remove Log">
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
                  <div className="px-4 py-2.5 border-b border-slate-50 bg-slate-50/30"><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Occupational Snapshot</span></div>
                  <div className="flex flex-col divide-y divide-slate-50">
                    <div className="p-4 flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase text-slate-400">Total Injuries</span><ShieldAlert size={12} className="text-red-500 opacity-50" /></div>
                        <span className="text-2xl font-black text-red-700 leading-none">{stats.total}</span>
                    </div>
                    <div className="p-4 flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase text-red-600">Percutaneous</span><Droplets size={12} className="text-red-400 opacity-50" /></div>
                        <span className="text-xl font-black text-red-600 leading-none">{stats.percutaneous}</span>
                    </div>
                  </div>
              </div>
            </div>
        </div>

        <PasswordConfirmModal
            show={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleConfirmDelete}
            loading={passwordConfirmLoading}
            title="Remove Sharps Log Entry"
            description={`Proceed with permanent removal of the record for ${itemToDelete?.hcwName || 'this employee'}?`}
        />
    </div>
  );

  return isNested ? content : <Layout title="Sharps Exposure">{content}</Layout>;
};

export default NeedlestickDashboard;