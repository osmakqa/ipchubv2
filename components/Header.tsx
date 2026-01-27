import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth, AppMode } from '../AuthContext';
import { LogOut, Key, Loader2, Bell, Activity, ShieldCheck, MonitorPlay, ChevronRight, Sparkles, X } from 'lucide-react';
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
    navigate(`/surveillance?module=overview`);
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

  const handleQuickLoginMax = () => {
    setLoading(true);
    setTimeout(() => {
      if (login('Max', 'max123')) {
        setShowLogin(false);
      } else {
        alert("Quick login failed.");
      }
      setLoading(false);
    }, 500);
  };

  const getThemeColors = () => {
    switch(appMode) {
        case 'report': return 'bg-osmak-green text-white';
        case 'audit': return 'bg-teal-600 text-white';
        case 'present': return 'bg-slate-800 text-white';
        default: return 'bg-osmak-green text-white';
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-[100] flex items-center justify-between gap-4 ${getThemeColors()} px-4 md:px-8 py-3 shadow-xl transition-all duration-500 h-20`}>
        <div className="flex items-center gap-2 md:gap-4 cursor-pointer group shrink-0" onClick={() => navigate('/')}>
          <div className="transition-transform group-hover:scale-110 shrink-0">
            <img src="https://maxterrenal-hash.github.io/justculture/osmak-logo.png" alt="OsMak" className="h-10 md:h-12 w-auto" />
          </div>
          <div className="hidden sm:flex flex-col">
            <h1 className="text-sm md:text-xl font-black tracking-tighter uppercase leading-none">Ospital ng Makati</h1>
            <span className="text-[8px] md:text-xs opacity-70 font-black uppercase tracking-widest mt-0.5">IPC Hub</span>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center bg-black/20 rounded-full p-1.5 backdrop-blur-xl border border-white/10 shadow-inner">
            <button 
              onClick={() => handleModeSwitch('report')}
              className={`flex items-center gap-2 px-4 md:px-10 py-2 md:py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 ${appMode === 'report' ? 'bg-white text-osmak-green shadow-xl scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Activity size={14} className="md:w-4 md:h-4" /> <span className="hidden xs:inline">Surveillance</span>
            </button>
            <button 
              onClick={() => handleModeSwitch('audit')}
              className={`flex items-center gap-2 px-4 md:px-10 py-2 md:py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 ${appMode === 'audit' ? 'bg-white text-teal-600 shadow-xl scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <ShieldCheck size={14} className="md:w-4 md:h-4" /> <span className="hidden xs:inline">Audit</span>
            </button>
            <button 
              onClick={() => handleModeSwitch('present')}
              className={`flex items-center gap-2 px-4 md:px-10 py-2 md:py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 ${appMode === 'present' ? 'bg-white text-slate-800 shadow-xl scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <MonitorPlay size={14} className="md:w-4 md:h-4" /> <span className="hidden xs:inline">Data</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {isAuthenticated ? (
            <>
              <button 
                onClick={() => navigate('/pending')}
                className="relative p-2.5 md:p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/5"
                title="Pending Validations"
              >
                <Bell size={20} className="md:w-6 md:h-6" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] md:text-[9px] font-black w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border-2 border-current shadow-lg animate-bounce">
                    {pendingCount}
                  </span>
                )}
              </button>
              <div className="hidden sm:flex items-center gap-3 bg-white/10 pl-4 pr-1.5 py-1.5 rounded-xl border border-white/5">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-black uppercase leading-none">{user}</span>
                    <span className="text-[9px] font-bold opacity-50 uppercase tracking-tighter">Coordinator</span>
                </div>
                <button onClick={logout} className="p-2.5 bg-white/20 hover:bg-rose-500 hover:text-white rounded-lg transition-all"><LogOut size={18} /></button>
              </div>
              <button onClick={logout} className="sm:hidden p-2.5 bg-white/10 rounded-xl border border-white/5"><LogOut size={18} /></button>
            </>
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className="bg-white text-osmak-green px-4 md:px-8 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-[0.1em] hover:bg-slate-50 transition-all shadow-xl active:scale-95"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {showLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="bg-slate-900 p-10 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)] animate-pulse"></div>
                    </div>
                    <button 
                        onClick={() => setShowLogin(false)}
                        className="absolute top-6 right-6 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-emerald-500/30 rotate-3">
                        <ShieldCheck size={32} className="-rotate-3" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Coordinator Portal</h3>
                    <p className="text-[9px] opacity-60 uppercase tracking-[0.3em] font-bold mt-1">Authorization Required</p>
                </div>
                
                <div className="p-10 pt-8 flex flex-col gap-6 relative">
                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <Select 
                            label="Identity"
                            options={['Max', 'Miko', 'Micha', 'Michael', 'Bel']}
                            value={loginData.name}
                            onChange={(e) => setLoginData({...loginData, name: e.target.value})}
                            required
                        />
                        <Input 
                            label="Security Key" 
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                            required
                        />
                        <div className="flex gap-4 mt-2">
                            <button type="button" onClick={() => setShowLogin(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-1 py-4 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 group">
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Authorize <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                            </button>
                        </div>
                    </form>

                    {/* Discreet Quick Login Button */}
                    <div className="flex justify-center mt-4">
                        <button 
                            type="button"
                            onClick={handleQuickLoginMax}
                            title="Beta Quick Login"
                            className="size-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border border-amber-100 hover:bg-amber-100 hover:text-amber-600 transition-all shadow-sm active:scale-90"
                        >
                            <Sparkles size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Header;