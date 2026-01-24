import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import { getHAIReports, getCensusLogs } from '../../services/ipcService';
import { AREAS, HAI_TYPES } from '../../constants';
// Fix: Added TrendingUp to the imported icons from lucide-react
import { 
  ChevronLeft, List, BarChart2, Filter, RotateCcw, 
  PlusCircle, Download, Activity, Wind, Droplets, Syringe, Search, TrendingUp, Users
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
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [census, setCensus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>(initialViewMode || 'list');

  // Standardized Unified Filters
  const [filterType, setFilterType] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
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
            <div className="flex items-center gap-3 min-w-max">
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100"><Filter size={14} className="text-slate-400" /><span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span></div>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">Infection Type</option>
                    {HAI_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                    <option value="">Hospital Area</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    <option value="">Month</option>
                    {Array.from({length: 12}, (_, i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{new Date(0, i).toLocaleString('en', {month:'short'})}</option>)}
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                    <option value="">Quarter</option>
                    <option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3">Q3</option><option value="Q4">Q4</option>
                </select>
                <div className="relative w-64"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full text-[10px] border border-slate-200 rounded-lg pl-10 pr-2 py-2 focus:ring-1 focus:ring-primary outline-none font-black uppercase bg-slate-50/50" placeholder="Search Patients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <button onClick={() => { setFilterType(''); setFilterArea(''); setSelectedMonth(''); setSelectedQuarter(''); setSearchQuery(''); }} className="p-1.5 text-slate-400 hover:text-primary transition-all"><RotateCcw size={14} /></button>
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
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? <tr><td colSpan={6} className="p-10 text-center uppercase text-[10px] font-black text-slate-400 animate-pulse">Loading Registry...</td></tr> : filteredData.length === 0 ? <tr><td colSpan={6} className="p-10 text-center uppercase text-[10px] font-black text-slate-400">No matching records</td></tr> : filteredData.map((report, idx) => (
                                    <tr key={report.id} className="hover:bg-primary/5 transition-colors cursor-pointer group">
                                      <td className="px-4 py-3 text-center text-slate-300 font-black">{idx + 1}</td>
                                      <td className="px-4 py-3 font-medium text-slate-600">{report.dateOfAdmission}</td>
                                      <td className="px-6 py-3 font-black text-primary uppercase">{isAuthenticated ? `${report.lastName}, ${report.firstName}` : `${report.lastName[0]}.${report.firstName[0]}.`}</td>
                                      <td className="px-4 py-3 text-slate-500 font-bold">{report.hospitalNumber}</td>
                                      <td className="px-4 py-3 font-bold text-slate-700 text-xs">{report.haiType}</td>
                                      <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-[9px] font-black border uppercase ${!report.outcome || report.outcome === 'Admitted' ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>{report.outcome || "Admitted"}</span></td>
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
    </div>
  );

  return isNested ? content : <Layout title="HAI Registry Hub">{content}</Layout>;
};

export default HAIDashboard;