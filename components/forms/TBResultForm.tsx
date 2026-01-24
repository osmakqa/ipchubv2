import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import { getTBReports, updateTBReport, submitReport } from '../../services/ipcService';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { 
  ChevronLeft, 
  Search, 
  UserPlus, 
  Beaker, 
  Plus, 
  Trash2, 
  Save, 
  Activity, 
  User, 
  Database,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';

const TBResultForm: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [registry, setRegistry] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [patientData, setPatientData] = useState({ lastName: '', firstName: '', hospitalNumber: '' });
  const [xpertResults, setXpertResults] = useState<any[]>([]);
  const [smearResults, setSmearResults] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/');
    loadRegistry();
  }, [isAuthenticated]);

  const loadRegistry = async () => {
    setFetching(true);
    const data = await getTBReports();
    setRegistry(data);
    setFetching(false);
  };

  const filteredRegistry = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return registry.filter(p => 
      `${p.lastName} ${p.firstName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hospitalNumber.includes(searchTerm)
    );
  }, [registry, searchTerm]);

  const handleSelectPatient = (p: any) => {
    setSelectedPatient(p);
    setPatientData({ lastName: p.lastName, firstName: p.firstName, hospitalNumber: p.hospitalNumber });
    setSearchTerm('');
    setIsManual(false);
  };

  const switchToManual = () => {
    setIsManual(true);
    setSelectedPatient(null);
    setPatientData({ lastName: '', firstName: '', hospitalNumber: '' });
  };

  const addResultRow = (type: 'xpert' | 'smear') => {
    const newRow = { date: new Date().toISOString().split('T')[0], specimen: 'Sputum', result: '' };
    if (type === 'xpert') setXpertResults([...xpertResults, newRow]);
    else setSmearResults([...smearResults, newRow]);
  };

  const removeResultRow = (type: 'xpert' | 'smear', index: number) => {
    if (type === 'xpert') setXpertResults(xpertResults.filter((_, i) => i !== index));
    else setSmearResults(smearResults.filter((_, i) => i !== index));
  };

  const updateResultRow = (type: 'xpert' | 'smear', index: number, key: string, value: string) => {
    if (type === 'xpert') {
      const updated = [...xpertResults];
      updated[index] = { ...updated[index], [key]: value };
      setXpertResults(updated);
    } else {
      const updated = [...smearResults];
      updated[index] = { ...updated[index], [key]: value };
      setSmearResults(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientData.lastName || !patientData.hospitalNumber) {
      alert("Please provide patient identifiers.");
      return;
    }
    if (xpertResults.length === 0 && smearResults.length === 0) {
        alert("Please add at least one lab result.");
        return;
    }

    setLoading(true);
    try {
      if (selectedPatient) {
        // Appending to existing patient
        const updatedPatient = {
          ...selectedPatient,
          xpertResults: [...(selectedPatient.xpertResults || []), ...xpertResults],
          smearResults: [...(selectedPatient.smearResults || []), ...smearResults]
        };
        
        // Auto-update classification if positive
        const hasPositive = [...xpertResults, ...smearResults].some(r => 
            r.result.includes('+') || r.result.toLowerCase().includes('detected')
        );
        if (hasPositive) updatedPatient.classification = 'Bacteriological Confirmed';

        await updateTBReport(updatedPatient);
      } else {
        // Creating a new pending report for manual entry
        const payload = {
          ...patientData,
          xpertResults,
          smearResults,
          dateReported: new Date().toISOString().split('T')[0],
          reporterName: user || 'Unknown',
          classification: [...xpertResults, ...smearResults].some(r => r.result.includes('+') || r.result.toLowerCase().includes('detected')) 
            ? 'Bacteriological Confirmed' 
            : 'Presumptive TB',
          validationStatus: 'pending',
          isLabOnly: true // Mark that this came from lab entry only
        };
        await submitReport("tb", payload);
      }
      setSuccess(true);
    } catch (err) {
      alert("Submission failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout title="Lab Transmission Successful">
        <div className="max-w-xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl text-center flex flex-col items-center gap-6 animate-in zoom-in-95">
          <div className="size-24 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={56} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Results Recorded</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Laboratory findings have been linked to <span className="text-amber-700 font-black uppercase">{patientData.lastName}, {patientData.firstName}</span>.
          </p>
          <button onClick={() => navigate('/surveillance?module=tb')} className="mt-4 px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl">Return to Hub</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="TB Laboratory Registry">
      <div className="max-w-6xl mx-auto px-4 pb-20 flex flex-col gap-8">
        <button onClick={() => navigate('/surveillance?module=tb')} className="flex items-center text-xs font-black uppercase tracking-widest text-gray-500 hover:text-amber-700 transition-colors">
          <ChevronLeft size={16} /> Back to Registry
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Patient Selection Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight flex items-center gap-2">
                  <User size={18} className="text-amber-600" /> Patient Target
                </h3>
                {isManual && (
                   <button 
                   onClick={() => setIsManual(false)}
                   className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                 >
                   <X size={16} />
                 </button>
                )}
              </div>

              {!isManual ? (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      className="w-full h-12 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-sm" 
                      placeholder="Search name or Hosp #..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {fetching ? (
                    <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-amber-200" size={32} /></div>
                  ) : filteredRegistry.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredRegistry.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className={`p-4 rounded-2xl border text-left transition-all ${selectedPatient?.id === p.id ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-100 hover:border-amber-200'}`}
                        >
                          <div className="font-black text-xs text-slate-900 uppercase">{p.lastName}, {p.firstName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{p.hospitalNumber} • {p.area}</div>
                        </button>
                      ))}
                    </div>
                  ) : searchTerm && (
                    <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col gap-4">
                      <div className="flex flex-col gap-1 items-center">
                        <AlertCircle size={24} className="text-slate-300" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Patient not found in registry</p>
                      </div>
                      <button 
                        onClick={switchToManual}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center justify-center gap-2"
                      >
                        <UserPlus size={14}/> Add New Patient
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4 animate-in fade-in">
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-2">
                    <p className="text-[10px] font-black text-amber-800 uppercase leading-relaxed">Enter basic identification for patients not yet in the treatment registry.</p>
                  </div>
                  <Input label="Last Name" value={patientData.lastName} onChange={e => setPatientData({...patientData, lastName: e.target.value})} required placeholder="Surname" />
                  <Input label="First Name" value={patientData.firstName} onChange={e => setPatientData({...patientData, firstName: e.target.value})} required placeholder="Given Name" />
                  <Input label="Hospital #" value={patientData.hospitalNumber} onChange={e => setPatientData({...patientData, hospitalNumber: e.target.value})} required placeholder="25-XXXXX" />
                </div>
              )}

              {selectedPatient && (
                <div className="p-5 bg-slate-900 rounded-3xl text-white flex flex-col gap-1 animate-in zoom-in-95 shadow-xl">
                  <span className="text-[8px] font-black uppercase text-emerald-400 tracking-widest">Selected Registry Entry</span>
                  <div className="font-black uppercase text-sm leading-tight">{selectedPatient.lastName}, {selectedPatient.firstName}</div>
                  <div className="text-[10px] opacity-60 font-bold">{selectedPatient.hospitalNumber}</div>
                </div>
              )}
            </div>
          </div>

          {/* Diagnostic Entry Column */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col gap-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Beaker size={28} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Diagnostic Findings</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Xpert MTB/RIF & Sputum Microscopy</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* GeneXpert Section */}
                <div className="flex flex-col gap-5 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-2"><Activity size={16}/> GeneXpert Result</h4>
                        <button type="button" onClick={() => addResultRow('xpert')} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"><Plus size={16}/></button>
                    </div>
                    <div className="space-y-4">
                        {xpertResults.map((x, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm relative animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <Input label="Date" type="date" value={x.date} onChange={e => updateResultRow('xpert', i, 'date', e.target.value)} />
                                    <Input label="Specimen" value={x.specimen} onChange={e => updateResultRow('xpert', i, 'specimen', e.target.value)} />
                                  </div>
                                  <Select label="Result" options={['MTB Detected; Rif Sens', 'MTB Detected; Rif Res', 'MTB Detected; Rif Indet', 'MTB Not Detected', 'Invalid/No Result']} value={x.result} onChange={e => updateResultRow('xpert', i, 'result', e.target.value)} />
                                </div>
                                <button type="button" onClick={() => removeResultRow('xpert', i)} className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-50"><Trash2 size={12}/></button>
                            </div>
                        ))}
                        {xpertResults.length === 0 && <p className="text-center py-6 text-[10px] font-bold text-blue-300 uppercase italic">Awaiting entry...</p>}
                    </div>
                </div>

                {/* DSSM Section */}
                <div className="flex flex-col gap-5 p-6 bg-amber-50/50 rounded-3xl border border-amber-100">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-2"><Activity size={16}/> Sputum Smear</h4>
                        <button type="button" onClick={() => addResultRow('smear')} className="p-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"><Plus size={16}/></button>
                    </div>
                    <div className="space-y-4">
                        {smearResults.map((s, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-amber-50 shadow-sm relative animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <Input label="Date" type="date" value={s.date} onChange={e => updateResultRow('smear', i, 'date', e.target.value)} />
                                    <Input label="Specimen" value={s.specimen} onChange={e => updateResultRow('smear', i, 'specimen', e.target.value)} />
                                  </div>
                                  <Select label="AFB Result" options={['Negative', 'Scanty', '1+', '2+', '3+']} value={s.result} onChange={e => updateResultRow('smear', i, 'result', e.target.value)} />
                                </div>
                                <button type="button" onClick={() => removeResultRow('smear', i)} className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-50"><Trash2 size={12}/></button>
                            </div>
                        ))}
                        {smearResults.length === 0 && <p className="text-center py-6 text-[10px] font-bold text-amber-300 uppercase italic">Awaiting entry...</p>}
                    </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between pt-8 border-t border-slate-100 gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                    <Database size={16} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase text-slate-500">Target Type: {selectedPatient ? 'Registry Update' : 'Ad-hoc Lab Record'}</span>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="h-16 bg-slate-900 text-white px-12 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />} 
                  Transmit & Finalize
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TBResultForm;