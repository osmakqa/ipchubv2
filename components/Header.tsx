import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth, AppMode } from '../AuthContext';
import { LogOut, Key, Loader2, Bell, Zap, Activity, ShieldCheck, MonitorPlay, ChevronDown, Radio } from 'lucide-react';
import Input from './ui/Input';
import Select from './ui/Select';
import { getPendingReports } from '../services/ipcService';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const { user, login, logout, isAuthenticated, appMode, setAppMode } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
        const fetchCount = async () => {
            const pending = await getPendingReports();
            const total = Object.values(pending).reduce((acc: number, list: any[]) => acc + list.length, 0);
            setPendingCount(total);
        };
        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }
  }, [isAuthenticated, location.pathname]);

  const handleModeSwitch = (mode: AppMode) => {
    setAppMode(mode);
    setSearchParams({ module: 'overview' });
    if (!location.pathname.includes('/surveillance')) {
      navigate('/surveillance?module=overview');
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        if (login(loginData.name, loginData.password)) {
            setShowLogin(false);
            setLoginData({ name: '', password: '' });
        } else {
            alert("Incorrect credentials.");
        }
        setLoading(false);
    }, 800);
  };

  const themeColor = appMode === 'report' ? 'bg-[#009a3e]' : appMode === 'audit' ? 'bg-[#0d9488]' : 'bg-[#1e293b]';

  return (
    <>
      <header className={`sticky top-0 z-[100] flex items-center justify-between gap-4 ${themeColor} text-white px-6 py-4 shadow-xl transition-colors duration-500`}>
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="transition-transform group-hover:scale-105">
            <img src="https://maxterrenal-hash.github.io/justculture/osmak-logo.png" alt="OsMak" className="h-11 w-auto" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tighter uppercase leading-none">Ospital ng Makati</h1>
                <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                    Hub Online
                </div>
            </div>
            <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">IPC Unified Hub</span>
          </div>
        </div>

        {/* PERSPECTIVE SWITCHER */}
        {isAuthenticated && (
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center bg-black/20 rounded-2xl p-1 backdrop-blur-md border border-white/10">
            <button 
              onClick={() => handleModeSwitch('report')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${appMode === 'report' ? 'bg-white text-[#009a3e] shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              <Activity size={14} /> Surveillance
            </button>
            <button 
              onClick={() => handleModeSwitch('audit')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${appMode === 'audit' ? 'bg-white text-[#0d9488] shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              <ShieldCheck size={14} /> Auditing
            </button>
            <button 
              onClick={() => handleModeSwitch('present')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${appMode === 'present' ? 'bg-white text-[#1e293b] shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              <MonitorPlay size={14} /> Analysis
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <button 
                onClick={() => navigate('/pending')}
                className="relative p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <Bell size={18} />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#009a3e]">
                    {pendingCount}
                  </span>
                )}
              </button>
              <div className="h-8 w-px bg-white/20 mx-1 hidden sm:block"></div>
              <div className="flex items-center gap-3 bg-white/10 pl-3 pr-1 py-1 rounded-xl border border-white/5">
                <span className="text-xs font-black hidden sm:inline">{user}</span>
                <button onClick={logout} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"><LogOut size={16} /></button>
              </div>
            </>
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className="bg-white text-[#009a3e] px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg"
            >
              Coordinator Login
            </button>
          )}
        </div>
      </header>

      {showLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                <div className="bg-slate-900 p-10 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Key size={120} /></div>
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Security Access</h3>
                    <p className="text-[10px] opacity-60 uppercase tracking-[0.2em] font-bold mt-1">IPC Coordinator Portal</p>
                </div>
                
                <form onSubmit={handleLogin} className="p-10 flex flex-col gap-5">
                    <Select 
                        label="Select User"
                        options={['Max', 'Miko', 'Micha', 'Michael', 'Bel']}
                        value={loginData.name}
                        onChange={(e) => setLoginData({...loginData, name: e.target.value})}
                        required
                    />
                    <Input 
                        label="Secret Key" 
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                    />
                    
                    <div className="flex gap-3 mt-4">
                        <button type="button" onClick={() => setShowLogin(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:bg-slate-50 rounded-2xl">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 py-4 bg-slate-900 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : "Authorize"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </>
  );
};

export default Header;