import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import { extractTBResultData, getTBReports, updateTBPatientWithResult } from '../../services/ipcService';
import { ChevronLeft, Upload, Loader2, Search, CheckCircle2, FileText, Beaker, AlertCircle, Save, Activity } from 'lucide-react';

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
  }, [isAuthenticated, navigate]);

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
      
      // Search for matches in TB registry
      const allTB = await getTBReports();
      const nameToMatch = data.patientName.toLowerCase();
      const hospToMatch = data.hospitalNumber?.toLowerCase();

      const matches = allTB.filter(p => {
        const fullName = `${p.lastName} ${p.firstName}`.toLowerCase();
        const hosp = p.hospitalNumber?.toLowerCase();
        return fullName.includes(nameToMatch) || (hospToMatch && hosp?.includes(hospToMatch));
      });

      setMatchResults(matches);
      if (matches.length === 1) setSelectedPatient(matches[0]);
    } catch (err) {
      alert("Error processing image with AI. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPatient || !extractedData) return;
    setLoading(true);
    try {
      const ok = await updateTBPatientWithResult(selectedPatient.id, extractedData);
      if (ok) setSuccess(true);
      else alert("Failed to update patient record.");
    } catch (err) {
      alert("An error occurred during update.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout title="Result Registered">
        <div className="max-w-xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl text-center flex flex-col items-center gap-6">
          <div className="size-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase">Registry Updated</h2>
          <p className="text-slate-500 font-medium">The TB lab result has been attached to the patient record and the classification has been adjusted based on findings.</p>
          <button onClick={() => navigate('/surveillance?module=tb')} className="mt-4 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all">Back to TB Registry</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Register TB Result">
      <div className="max-w-5xl mx-auto px-4 pb-20 flex flex-col gap-8">
        <button onClick={() => navigate('/surveillance?module=tb')} className="flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors">
          <ChevronLeft size={14} /> Back to Hub
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6">
            <h3 className="font-black text-sm text-slate-900 uppercase flex items-center gap-2 border-b pb-3">
              <Upload size={18} className="text-primary"/> Lab Result Photo
            </h3>
            
            <div className={`relative aspect-[3/4] border-4 border-dashed rounded-3xl overflow-hidden transition-all flex flex-col items-center justify-center gap-4 ${preview ? 'border-primary/50' : 'border-slate-100 bg-slate-50/50'}`}>
              {preview ? (
                <img src={preview} className="absolute inset-0 w-full h-full object-contain" alt="TB Result" />
              ) : (
                <>
                  <FileText size={48} className="text-slate-200" />
                  <p className="text-[10px] font-black uppercase text-slate-400">Select TB Result Image</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>

            <button 
              onClick={processImage} 
              disabled={!file || loading}
              className="h-14 bg-primary text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Beaker size={24} />} 
              Analyze & Extract Data
            </button>
          </div>

          {/* AI Extraction Results */}
          <div className="flex flex-col gap-6">
            {extractedData && (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6 animate-in slide-in-from-right-4">
                <h3 className="font-black text-sm text-slate-900 uppercase flex items-center gap-2 border-b pb-3">
                  <Activity size={18} className="text-primary"/> Extracted Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">Extracted Name</span><span className="text-sm font-bold text-slate-800">{extractedData.patientName}</span></div>
                  <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">Hosp #</span><span className="text-sm font-bold text-slate-800">{extractedData.hospitalNumber || 'N/A'}</span></div>
                  <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">Test Date</span><span className="text-sm font-bold text-slate-800">{extractedData.testDate}</span></div>
                  <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">Test Type</span><span className="text-sm font-bold text-indigo-600">{extractedData.testType}</span></div>
                  <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Findings</span>
                    <span className="text-lg font-black text-slate-900">{extractedData.resultValue}</span>
                  </div>
                </div>

                <div className="mt-4 border-t pt-6 flex flex-col gap-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Search size={14} className="text-primary" /> Potential Patient Matches
                  </h4>
                  
                  <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {matchResults.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => setSelectedPatient(p)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${selectedPatient?.id === p.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase text-slate-900">{p.lastName}, {p.firstName}</span>
                          <span className="text-[9px] font-bold text-slate-400">{p.hospitalNumber} | Adm: {p.dateOfAdmission}</span>
                        </div>
                        {selectedPatient?.id === p.id && <CheckCircle2 size={16} className="text-primary" />}
                      </button>
                    ))}
                    {matchResults.length === 0 && (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 text-amber-800">
                        <AlertCircle size={18} />
                        <p className="text-[10px] font-bold leading-tight">No matching patient found in the TB registry. Please verify the name or register the patient first.</p>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleUpdate}
                    disabled={!selectedPatient || loading}
                    className="mt-2 h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    Sync Result to Record
                  </button>
                </div>
              </div>
            )}
            
            {!extractedData && !loading && (
              <div className="bg-slate-50 p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-4 opacity-50 h-full">
                <Beaker size={48} className="text-slate-300" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Awaiting Analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TBResultForm;