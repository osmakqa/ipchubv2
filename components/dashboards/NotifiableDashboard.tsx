import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import { getNotifiableReports, getCensusLogs } from '../../services/ipcService';
import { AREAS, NOTIFIABLE_DISEASES } from '../../constants';
import { 
  ChevronLeft, ChevronRight, List, BarChart2, Filter, RotateCcw, PlusCircle, Download, Bell, Search, TrendingUp, Users, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';

interface Props {
  isNested?: boolean;
}

const NotifiableDashboard: React.FC<Props> = ({ isNested }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [census, setCensus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');

  // Standardized Unified Filters
  const [filterType, setFilterType] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [reports, censusLogs] = await Promise.all([getNotifiableReports(), getCensusLogs()]);
    reports.sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());
    setData(reports);
    setCensus(censusLogs);
    setLoading(false);
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const date = new Date(item.dateReported);
      const q = Math.floor(date.getMonth() / 3) + 1;
      const matchesType = filterType ? item.disease === filterType : true;
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
    const diseaseMap: Record<string, number> = {};
    active.forEach(d => { diseaseMap[d.disease] = (diseaseMap[d.disease] || 0) + 1; });
    const topDiseases = Object.entries(diseaseMap).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 4);
    
    // Census trend (last 10 entries)
    const censusTrend = census.slice(0, 10).reverse().map(l => ({
      date: l.date.split('-')[2],
      days: l.overall || 0
    }));

    return { total: active.length, topDiseases, diseaseMap, censusTrend };
  }, [filteredData, census]);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  const content = (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex gap-4 items-center">
                {!isNested && <button onClick={() => navigate('/')} className="h-10 flex items-center text-sm text-gray-600 hover:text-red-600 font-bold"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg h-10">
                    <button onClick={() => setViewMode('list')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-4 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="h-10 w-44 bg-white text-slate-600 rounded-lg font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2 transition-all text-[10px]"><Download size={14} /> Export CSV</button>
                <button onClick={() => navigate('/report-disease')} className="h-10 w-44 bg-red-600 text-white rounded-lg font-black uppercase tracking-widest shadow hover:bg-red-700 flex items-center justify-center gap-2 transition-all text-[10px]"><PlusCircle size={14} /> New Case</button>
            </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 print:hidden overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100"><Filter size={14} className="text-slate-400" /><span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span></div>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-red-600 outline-none font-black uppercase bg-slate-50/50" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">Disease Type</option>
                    {NOTIFIABLE_DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="w-44 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-red-600 outline-none font-black uppercase bg-slate-50/50" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                    <option value="">Hospital Area</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-red-600 outline-none font-black uppercase bg-slate-50/50" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-red-600 outline-none font-black uppercase bg-slate-50/50" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    <option value="">Month</option>
                    {Array.from({length: 12}, (_, i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{new Date(0, i).toLocaleString('en', {month:'short'})}</option>)}
                </select>
                <select className="w-24 text-[10px] border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-red-600 outline-none font-black uppercase bg-slate-50/50" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                    <option value="">Quarter</option>
                    <option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3">Q3</option><option value="Q4">Q4</option>
                </select>
                <div className="relative w-64"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full text-[10px] border border-slate-200 rounded-lg pl-10 pr-2 py-2 focus:ring-1 focus:ring-red-600 outline-none font-black uppercase bg-slate-50/50" placeholder="Search Patient/ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <button onClick={() => { setFilterType(''); setFilterArea(''); setSelectedMonth(''); setSelectedQuarter(''); setSearchQuery(''); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-all"><RotateCcw size={14} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
                {viewMode === 'analysis' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><TrendingUp size={14}/> Epidemiological Spread</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={Object.entries(stats.diseaseMap).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([name, value]) => ({name, value})).slice(0, 5)} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9, fontWeight: 'bold'}} /><RechartsTooltip /><Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><Activity size={14}/> Ward Census Activity</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.censusTrend}><defs><linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/><stop offset="95%" stopColor="#dc2626" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} /><XAxis dataKey="date" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><RechartsTooltip /><Area type="monotone" dataKey="days" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorDays)" /></AreaChart></ResponsiveContainer></div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-6 md:col-span-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-2"><Users size={14}/> Top Ward Contributions</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={AREAS.map(a => ({ name: a, value: filteredData.filter(d => d.area === a).length })).filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({name, value}) => `${name}: ${value}`}>{AREAS.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip /></PieChart></ResponsiveContainer></div>
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
                                <th className="px-4 py-4">Disease Type</th>
                                <th className="px-4 py-4 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? <tr><td colSpan={6} className="p-10 text-center uppercase text-[10px] font-black text-slate-400 animate-pulse">Loading Notifiable...</td></tr> : filteredData.length === 0 ? <tr><td colSpan={6} className="p-10 text-center uppercase text-[10px] font-black text-slate-400">No matching records</td></tr> : filteredData.map((report, idx) => (
                                    <tr key={report.id} className="hover:bg-red-50/50 transition-colors cursor-pointer group">
                                      <td className="px-4 py-3 text-center text-slate-300 font-black">{idx + 1}</td>
                                      <td className="px-4 py-3 font-medium text-slate-600">{report.dateOfAdmission}</td>
                                      <td className="px-6 py-3 font-black text-red-600 uppercase">{isAuthenticated ? `${report.lastName}, ${report.firstName}` : `${report.lastName[0]}.${report.firstName[0]}.`}</td>
                                      <td className="px-4 py-3 text-slate-500 font-bold">{report.hospitalNumber}</td>
                                      <td className="px-4 py-3 font-bold text-slate-700 text-xs">{report.disease}</td>
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
                    <div className="p-4 flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase text-slate-400">Total Active</span><Bell size={12} className="text-red-400 opacity-50" /></div>
                        <span className="text-2xl font-black text-red-700 leading-none">{stats.total}</span>
                    </div>
                    {stats.topDiseases.map(([name, count]) => (
                        <div key={name} className="p-4 flex flex-col gap-1 text-left">
                            <div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase text-slate-400 truncate mr-2">{name}</span><ChevronRight size={10} className="text-red-200" /></div>
                            <span className="text-xl font-black text-slate-800 leading-none">{count}</span>
                        </div>
                    ))}
                  </div>
              </div>
            </div>
        </div>
    </div>
  );

  return isNested ? content : <Layout title="Notifiable Registry">{content}</Layout>;
};

export default NotifiableDashboard;