import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { 
  CLINICAL_DEPARTMENTS, 
  NTP_PATIENT_TYPES, 
  NTP_REASONS_FOR_REFERRAL, 
  NTP_TB_DIAGNOSES,
  NTP_TB_TYPES,
  NTP_REGIMENS
} from '../../constants';
import { submitReport } from '../../services/ipcService';
import { 
  ChevronLeft, 
  Send, 
  Loader2, 
  Plus, 
  Users, 
  Stethoscope, 
  ClipboardList, 
  Activity, 
  Pill, 
  Sparkles,
  Briefcase,
  FileText,
  Eye,
  Printer,
  X,
  MapPin,
  ClipboardCheck,
  ExternalLink,
  FileSpreadsheet,
  RefreshCcw,
  // Added missing Info icon import
  Info
} from 'lucide-react';

interface TreatmentHistory {
  dateStarted: string;
  treatmentUnit: string;
  drugsTaken: string;
  outcome: string;
}

const NTPForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'log' | 'preview'>('log');
  const [loading, setLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0); // Used to force iframe refresh

  const initialForm = {
    clinicalDept: '',
    clinicalDeptOther: '',
    consultationType: '',
    lastName: '',
    firstName: '',
    middleName: '',
    date: new Date().toISOString().split('T')[0],
    age: '',
    sex: '',
    weight: '',
    hospitalNumber: '',
    address: '',
    contactNumber: '',
    referralReason: '',
    tbDiagnosis: '',
    tbDiagnosisOther: '',
    extrapulmonarySite: '',
    tbType: '',
    treatmentRegimen: '',
    treatmentRegimenOther: '',
    treatmentHistory: [
      { dateStarted: '', treatmentUnit: '', drugsTaken: '', outcome: '' },
      { dateStarted: '', treatmentUnit: '', drugsTaken: '', outcome: '' },
      { dateStarted: '', treatmentUnit: '', drugsTaken: '', outcome: '' }
    ] as TreatmentHistory[],
    residentInCharge: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const handleMagicFill = () => {
    setFormData({
      ...initialForm,
      clinicalDept: 'Internal Medicine',
      consultationType: 'Outpatient',
      lastName: 'Delos Reyes',
      firstName: 'Roberto',
      middleName: 'Gomez',
      date: new Date().toISOString().split('T')[0],
      age: '46',
      sex: 'Male',
      weight: '68',
      hospitalNumber: '25-' + Math.floor(Math.random() * 90000 + 10000),
      address: '123 Rizal St, Brgy. Poblacion, Makati City',
      contactNumber: '0917-555-0123',
      referralReason: 'For Registration and Treatment',
      tbDiagnosis: 'Bacteriologically-Confirmed Tuberculosis',
      tbType: 'New',
      treatmentRegimen: 'Regimen 1 - 2HRZE/4HR',
      treatmentHistory: [
        { dateStarted: '2023-01-15', treatmentUnit: 'OsMak DOTS', drugsTaken: 'HRZE', outcome: 'Completed' },
        { dateStarted: '', treatmentUnit: '', drugsTaken: '', outcome: '' },
        { dateStarted: '', treatmentUnit: '', drugsTaken: '', outcome: '' }
      ],
      residentInCharge: 'Dr. Michael Jordan'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateHistoryRow = (index: number, field: keyof TreatmentHistory, value: string) => {
    const updated = [...formData.treatmentHistory];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, treatmentHistory: updated }));
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submission = { ...formData };
    if (submission.clinicalDept === 'Others (specify)') submission.clinicalDept = submission.clinicalDeptOther || 'Other';
    if (submission.tbDiagnosis === 'Others (specify)') submission.tbDiagnosis = submission.tbDiagnosisOther || 'Other';
    if (submission.treatmentRegimen === 'Others (specify)') submission.treatmentRegimen = submission.treatmentRegimenOther || 'Other';

    try {
      await submitReport("ntp", submission);
      setActiveTab('preview');
      setPreviewKey(prev => prev + 1); // Auto-refresh preview after submission
    } catch (err) {
      alert("Error submitting NTP report.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1);
  };

  const handlePrintRegistry = () => {
    // PDF export link for the specifically requested NTP Sheet
    const printUrl = "https://docs.google.com/spreadsheets/d/1Gi1WlLElBZjEkg4LvuqAF2DcMKOA-HmkNySSw3iJd_s/export?format=pdf&size=A4&portrait=true&fitw=true&gridlines=false";
    window.open(printUrl, '_blank');
  };

  return (
    <Layout title="NTP Registration Portal">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto px-4 pb-20">
        
        {/* Header Actions & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors">
              <ChevronLeft size={14} /> Back
            </button>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('log')}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'log' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ClipboardList size={14}/> Log
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Eye size={14}/> Preview
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeTab === 'log' ? (
                <button 
                type="button" 
                onClick={handleMagicFill}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm"
                >
                <Sparkles size={14} className="text-amber-500" /> Magic Fill
                </button>
            ) : (
                <div className="flex gap-2">
                    <button 
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <RefreshCcw size={14} /> Refresh Feed
                    </button>
                    <button 
                        onClick={handlePrintRegistry}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                    >
                        <Printer size={16}/> Print Slip (PDF)
                    </button>
                </div>
            )}
          </div>
        </div>

        {activeTab === 'log' ? (
          <form onSubmit={handlePost} className="flex flex-col gap-8 animate-in fade-in duration-500">
            
            {/* Dept & Consultation */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={120} /></div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-3">
                  <Briefcase size={20} className="text-amber-800"/> Administrative Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <Select label="1. Clinical Department" name="clinicalDept" options={CLINICAL_DEPARTMENTS} value={formData.clinicalDept} onChange={handleChange} required />
                        {formData.clinicalDept === 'Others (specify)' && <Input label="Specify Dept" name="clinicalDeptOther" value={formData.clinicalDeptOther} onChange={handleChange} required />}
                    </div>
                    <Select label="2. Consultation Type" name="consultationType" options={NTP_PATIENT_TYPES} value={formData.consultationType} onChange={handleChange} required />
                </div>
            </section>

            {/* Patient Info */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-6">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-3">
                  <Users size={20} className="text-amber-800"/> Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="3. Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                    <Input label="4. First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                    <Input label="5. Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                    <Input label="6. Registry Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                    <Input label="7. Age" name="age" type="number" value={formData.age} onChange={handleChange} required />
                    <Select label="8. Sex" name="sex" options={['Male', 'Female']} value={formData.sex} onChange={handleChange} required />
                    <Input label="9. Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} required />
                    <Input label="10. Hospital Number" name="hospitalNumber" value={formData.hospitalNumber} onChange={handleChange} required />
                    <Input label="11. Address" name="address" value={formData.address} onChange={handleChange} required />
                    <Input label="12. Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
                </div>
            </section>

            {/* Diagnostic & Referral */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-6">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-3">
                  <Stethoscope size={20} className="text-amber-800"/> Clinical Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select label="13. Reason for Referral" name="referralReason" options={NTP_REASONS_FOR_REFERRAL} value={formData.referralReason} onChange={handleChange} required />
                    <div className="flex flex-col gap-2">
                        <Select label="14. TB Diagnosis" name="tbDiagnosis" options={NTP_TB_DIAGNOSES} value={formData.tbDiagnosis} onChange={handleChange} required />
                        {formData.tbDiagnosis === 'Others (specify)' && <Input label="Specify Diagnosis" name="tbDiagnosisOther" value={formData.tbDiagnosisOther} onChange={handleChange} required />}
                        {formData.tbDiagnosis === 'Extrapulmonary Tuberculosis' && <Input label="Specify Site" name="extrapulmonarySite" value={formData.extrapulmonarySite} onChange={handleChange} placeholder="e.g. Pleural, Lymph Node" required />}
                    </div>
                    <Select label="15. TB Type" name="tbType" options={NTP_TB_TYPES} value={formData.tbType} onChange={handleChange} required />
                    <div className="flex flex-col gap-2">
                        <Select label="16. Treatment Regimen" name="treatmentRegimen" options={NTP_REGIMENS} value={formData.treatmentRegimen} onChange={handleChange} required />
                        {formData.treatmentRegimen === 'Others (specify)' && <Input label="Specify Regimen" name="treatmentRegimenOther" value={formData.treatmentRegimenOther} onChange={handleChange} required />}
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                        <Pill size={14} className="text-amber-800"/> 17-20. Previous TB Treatment History
                    </h4>
                    <div className="overflow-x-auto border border-slate-100 rounded-3xl bg-slate-50/30">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-slate-500 font-black text-[9px] uppercase border-b border-slate-200">
                                <tr>
                                    <th className="p-4 text-left">Date Started</th>
                                    <th className="p-4 text-left">Treatment Unit</th>
                                    <th className="p-4 text-left">TB Drugs Taken</th>
                                    <th className="p-4 text-left">Outcome</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {formData.treatmentHistory.map((row, idx) => (
                                    <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="p-2"><input type="date" className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold" value={row.dateStarted} onChange={e => updateHistoryRow(idx, 'dateStarted', e.target.value)} /></td>
                                        <td className="p-2"><input type="text" className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold" value={row.treatmentUnit} onChange={e => updateHistoryRow(idx, 'treatmentUnit', e.target.value)} placeholder="Facility Name" /></td>
                                        <td className="p-2"><input type="text" className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold" value={row.drugsTaken} onChange={e => updateHistoryRow(idx, 'drugsTaken', e.target.value)} placeholder="Regimen details" /></td>
                                        <td className="p-2"><input type="text" className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold" value={row.outcome} onChange={e => updateHistoryRow(idx, 'outcome', e.target.value)} placeholder="Outcome" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="21. Name of Resident-in-Charge" name="residentInCharge" value={formData.residentInCharge} onChange={handleChange} required placeholder="Dr. Last, First" />
                    <div className="flex items-end">
                        <button type="submit" disabled={loading} className="w-full h-14 bg-amber-800 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-amber-900 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                            {loading ? <Loader2 size={24} className="animate-spin" /> : <ClipboardCheck size={24} />} Post to Registry
                        </button>
                    </div>
                </div>
            </section>
          </form>
        ) : (
          <div className="flex flex-col gap-6 animate-in zoom-in-95 duration-500 w-full h-[900px]">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase leading-none">Referral Slip Preview</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Feed from Central Spreadsheet Template</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <RefreshCcw size={14} /> Refresh Feed
                  </button>
                  <button 
                    onClick={() => setActiveTab('log')}
                    className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-amber-700 transition-all ml-4"
                  >
                    <X size={18}/> Close
                  </button>
                </div>
            </div>
            
            {/* Embedded Google Spreadsheet Preview */}
            <div className="flex-1 bg-white rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden relative group">
                <iframe 
                    key={previewKey}
                    src="https://docs.google.com/spreadsheets/d/1Gi1WlLElBZjEkg4LvuqAF2DcMKOA-HmkNySSw3iJd_s/preview?rm=minimal&gid=0" 
                    className="w-full h-full border-none"
                    title="NTP Sheet Preview"
                />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button 
                      onClick={handlePrintRegistry}
                      className="flex items-center gap-2 bg-slate-900/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white shadow-lg"
                    >
                      <Printer size={14}/> Print Slip (PDF)
                    </button>
                    <a 
                      href="https://docs.google.com/spreadsheets/d/1Gi1WlLElBZjEkg4LvuqAF2DcMKOA-HmkNySSw3iJd_s/edit?usp=sharing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-black uppercase text-amber-700 shadow-lg border border-amber-100"
                    >
                      <ExternalLink size={14}/> Open Full Editor
                    </a>
                </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 font-bold uppercase leading-relaxed">
                    Note: The preview updates instantly after clicking "Post to Registry". Ensure you are logged into your Google account for the best interactive experience.
                </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NTPForm;