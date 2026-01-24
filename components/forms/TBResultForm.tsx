import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import { extractTBResultData, getTBReports, updateTBPatientWithResult } from '../../services/ipcService';
// Added Sparkles to imports
import { ChevronLeft, Upload, Loader2, Search, CheckCircle2, FileText, Beaker, AlertCircle, Save, Activity, Microscope, Sparkles } from 'lucide-react';

const TBResultForm: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/');
  }, [isAuthenticated]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
      setExtractedData(null);
      setMatchResults([]);
      setSelectedPatient(null);
    }
  };

  const processImage = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const base64 = preview.split(',')[1];
      const data = await extractTBResultData(base64);
      setExtractedData(data);
      
      // Automatic Search for registry matches
      const allTB = await getTBReports();
      const nameToMatch = (data.patientName || '').toLowerCase();
      const hospToMatch = (data.hospitalNumber || '').toLowerCase();

      const matches = allTB.filter(p => {
        const fullName = `${p.lastName} ${p.firstName}`.toLowerCase();
        const hosp = (p.hospitalNumber || '').toLowerCase();
        return (nameToMatch && fullName.includes(nameToMatch)) || (hospToMatch && hosp.includes(hospToMatch));
      });

      setMatchResults(matches);
      if (matches.length === 1) setSelectedPatient(matches[0]);
    } catch (err) {
      alert("Error processing image with Gemini AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPatient || !extractedData) return;
    setLoading(true);
    try {
      // Transmit new data to Firebase reports_tb collection
      const ok = await updateTBPatientWithResult(selectedPatient.id, extractedData);
      if (ok) setSuccess(true);
      else alert("Failed to link result to patient record.");
    } catch (err) {
      alert("An error occurred during synchronization.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout title="Result Linked Successfully">
        <div className="max-w-xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl text-center flex flex-col items-center gap-6 animate-in zoom-in-95">
          <div className="size-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle2 size={56} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Transmission Complete</h2>
          <p className="text-slate-500 font-medium leading-relaxed">The laboratory findings have been successfully appended to the clinical history of <span className="text-slate-900 font-black uppercase">{selectedPatient.lastName}, {selectedPatient.firstName}</span>.</p>
          <button onClick={() => navigate('/surveillance?module=tb')} className="mt-4 px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl">Return to TB Registry</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="TB Laboratory OCR Registry">
      <div className="max-w-6xl mx-auto px-4 pb-20 flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <button onClick={() => navigate('/surveillance?module=tb')} className="flex items-center text-xs font-black uppercase tracking-widest text-gray-500 hover:text-amber-700 transition-colors">
            <ChevronLeft size={16} /> Hub Registry
            </button>
            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                <Microscope size={16} className="text-amber-600" />
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-widest">Laboratory Vision Module</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Upload Section */}
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Upload size={24} className="text-amber-600"/> Result Digitization
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase">Upload result slip for automated extraction</p>
            </div>
            
            <div className={`relative aspect-video border-4 border-dashed rounded-[2.5rem] overflow-hidden transition-all flex flex-col items-center justify-center gap-4 group ${preview ? 'border-amber-500/30' : 'border-slate-100 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-200'}`}>
              {preview ? (
                <img src={preview} className="absolute inset-0 w-full h-full object-contain p-4" alt="TB Result" />
              ) : (
                <>
                  <div className="p-6 bg-white rounded-3xl shadow-sm group-hover:scale-110 transition-transform">
                    <FileText size={48} className="text-slate-200" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Laboratory Document</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>

            <button 
              onClick={processImage} 
              disabled={!file || loading}
              className="h-16 bg-amber-700 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-amber-900/20 hover:bg-amber-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Beaker size={24} />} 
              Extract Findings (AI)
            </button>
          </div>

          {/* AI Extraction & Matching */}
          <div className="flex flex-col gap-6">
            {extractedData ? (
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col gap-8 animate-in slide-in-from-right-8 duration-500">
                <div className="flex flex-col gap-2">
                    <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <Activity size={24} className="text-emerald-600"/> Extracted Profile
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase">Verifying patient identifiers</p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                  <div className="flex flex-col gap-1"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Extracted Name</span><span className="text-lg font-black text-slate-800 uppercase tracking-tight">{extractedData.patientName}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hospital #</span><span className="text-lg font-black text-slate-800">{extractedData.hospitalNumber || '---'}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Test Date</span><span className="text-lg font-black text-slate-800">{extractedData.testDate}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modality</span><span className="text-lg font-black text-indigo-600 uppercase">{extractedData.testType}</span></div>
                  <div className="col-span-2 mt-4 pt-6 border-t border-slate-200/50 flex flex-col gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confirmed Result</span>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <span className={`text-xl font-black uppercase ${extractedData.resultValue.toLowerCase().includes('detected') ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {extractedData.resultValue}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Search size={14} className="text-amber-600" /> Suggested Patient Matching
                      </h4>
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[9px] font-black uppercase rounded-full">{matchResults.length} matches found</span>
                  </div>
                  
                  <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    {matchResults.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => setSelectedPatient(p)}
                        className={`p-6 rounded-[2rem] border-2 text-left transition-all flex items-center justify-between group ${selectedPatient?.id === p.id ? 'bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-900/20' : 'bg-white border-slate-100 hover:border-amber-400/50 hover:bg-amber-50/30'}`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className={`text-sm font-black uppercase ${selectedPatient?.id === p.id ? 'text-white' : 'text-slate-900'}`}>{p.lastName}, {p.firstName}</span>
                          <span className={`text-[10px] font-bold ${selectedPatient?.id === p.id ? 'text-amber-100' : 'text-slate-400'} uppercase tracking-widest`}>{p.hospitalNumber} • Area: {p.area}</span>
                        </div>
                        {selectedPatient?.id === p.id && <CheckCircle2 size={24} className="text-white animate-in zoom-in" />}
                      </button>
                    ))}
                    {matchResults.length === 0 && (
                      <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 flex flex-col items-center gap-3 text-center">
                        <AlertCircle size={32} className="text-rose-400" />
                        <p className="text-xs font-bold text-rose-800 leading-relaxed uppercase tracking-tight">No match found in current TB Registry.<br/>Please register the patient profile before linking results.</p>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleUpdate}
                    disabled={!selectedPatient || loading}
                    className="mt-4 h-16 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    Finalize & Transmit Data
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="bg-white p-20 rounded-[3.5rem] border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center gap-6 h-full">
                {/* Corrected Sparkles icon usage */}
                <div className="size-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center shadow-lg animate-bounce">
                  <Sparkles size={40} />
                </div>
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-black uppercase text-slate-900 tracking-widest">Gemini AI Processing...</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Extracting vision data and verifying registry</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/50 p-20 rounded-[3.5rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-6 opacity-50 h-full">
                <Beaker size={56} className="text-slate-300" />
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Awaiting Vision Context</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase">OCR and Registry cross-matching will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TBResultForm;