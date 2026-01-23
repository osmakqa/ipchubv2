
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ThankYouModal from '../ui/ThankYouModal';
import { 
  CLINICAL_DEPARTMENTS, 
  NTP_PATIENT_TYPES, 
  NTP_REASONS_FOR_REFERRAL, 
  NTP_TB_DIAGNOSES,
  BARANGAYS
} from '../../constants';
import { submitReport } from '../../services/ipcService';
import { 
  ChevronLeft, 
  Send, 
  Loader2, 
  Plus, 
  Trash2, 
  Users, 
  Stethoscope, 
  ClipboardList, 
  MapPin, 
  Phone, 
  Activity, 
  Pill, 
  Sparkles,
  Weight,
  UserPlus,
  Briefcase
} from 'lucide-react';

interface TreatmentHistory {
  dateStarted: string;
  treatmentUnit: string;
  drugsDuration: string;
  outcome: string;
}

const NTPForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const initialForm = {
    patientType: '', // 1. Patient Type
    clinicalDept: '', // 2. Clinical Dept
    clinicalDeptOther: '',
    lastName: '', // 3. Surname
    firstName: '', // 3. First Name
    middleName: '', // 3. Middle Name
    hospitalNumber: '', // 4. Hospital No.
    age: '', // 5. Age
    sex: '', // 6. Sex
    date: new Date().toISOString().split('T')[0], // 7. Date
    weight: '', // 8. Weight
    completeAddress: '', // 9. Complete Address
    barangay: '', // 9. Brgy
    contactNumber: '', // 10. Contact Number
    referralReason: '', // 11. Reason for referral
    tbDiagnosis: '', // 12. TB Diagnosis
    tbDiagnosisOther: '',
    extrapulmonarySite: '', // 12. Specify Site
    treatmentHistory: [] as TreatmentHistory[], // 13. History of Treatment
    referredBy: '', // 14. Referred by
    designation: '', // 15. Designation
    designationOther: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const handleMagicFill = () => {
    setFormData({
      ...initialForm,
      patientType: 'Outpatient',
      clinicalDept: 'Internal Medicine',
      lastName: 'Santillan',
      firstName: 'Oscar',
      middleName: 'Reyes',
      hospitalNumber: '25-' + Math.floor(Math.random() * 90000 + 10000),
      age: '52',
      sex: 'Male',
      weight: '62',
      completeAddress: '123 Rizal St. Unit 4B',
      barangay: 'Poblacion',
      contactNumber: '0917-555-0123',
      referralReason: 'For start of TB treatment',
      tbDiagnosis: 'Bacteriologically Confirmed Tuberculosis',
      treatmentHistory: [
        { dateStarted: '2022-03-10', treatmentUnit: 'OsMak DOTS', drugsDuration: 'HRZE 2 months', outcome: 'Completed' }
      ],
      referredBy: 'Dr. A. Gomez',
      designation: 'Medical Officer'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTreatmentRow = () => {
    setFormData(prev => ({
      ...prev,
      treatmentHistory: [...prev.treatmentHistory, { dateStarted: '', treatmentUnit: '', drugsDuration: '', outcome: '' }]
    }));
  };

  const removeTreatmentRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      treatmentHistory: prev.treatmentHistory.filter((_, i) => i !== index)
    }));
  };

  const updateTreatmentRow = (index: number, field: keyof TreatmentHistory, value: string) => {
    const updated = [...formData.treatmentHistory];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, treatmentHistory: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submission = { ...formData };
    if (submission.clinicalDept === 'Others (Specify)') submission.clinicalDept = submission.clinicalDeptOther || 'Other';
    if (submission.tbDiagnosis === 'Others (Specify)') submission.tbDiagnosis = submission.tbDiagnosisOther || 'Other';
    if (submission.designation === 'others (specify)') submission.designation = submission.designationOther || 'Other';

    try {
      await submitReport("ntp", submission);
      setShowThankYou(true);
    } catch (err) {
      alert("Error submitting NTP report.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setShowThankYou(false);
  };

  return (
    <Layout title="NTP Registry Portal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 max-w-5xl mx-auto px-4">
        <button onClick={() => navigate('/')} className="flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors">
          <ChevronLeft size={14} /> Hub Dashboard
        </button>
        {user === 'Max' && (
          <button 
            type="button" 
            onClick={handleMagicFill}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm"
          >
            <Sparkles size={14} className="text-amber-500" /> Magic Fill (NTP Spec)
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-5xl mx-auto px-4 pb-20">
        
        {/* Section 1: Referral Context */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={120} /></div>
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-3">
              <ClipboardList size={20} className="text-amber-600"/> 1. Clinical Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Select label="Patient Type" name="patientType" options={NTP_PATIENT_TYPES} value={formData.patientType} onChange={handleChange} required />
                <div className="flex flex-col gap-2">
                    <Select label="Clinical Department" name="clinicalDept" options={CLINICAL_DEPARTMENTS} value={formData.clinicalDept} onChange={handleChange} required />
                    {formData.clinicalDept === 'Others (Specify)' && <Input label="Specify Department" name="clinicalDeptOther" value={formData.clinicalDeptOther} onChange={handleChange} required />}
                </div>
                <Input label="Registry Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
            </div>
        </section>

        {/* Section 2: Patient Info */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-5">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-3">
              <Users size={20} className="text-amber-600"/> 2. Patient Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Hospital Number" name="hospitalNumber" value={formData.hospitalNumber} onChange={handleChange} required placeholder="25-XXXXX" />
                <Input label="Surname" name="lastName" value={formData.lastName} onChange={handleChange} required />
                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} required />
                  <Select label="Sex" name="sex" options={['Male', 'Female']} value={formData.sex} onChange={handleChange} required />
                </div>
                <div className="relative">
                  <Input label="Weight (kg)" name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} required />
                  <Weight size={14} className="absolute right-3 top-10 text-slate-400" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-50 pt-4">
                <div className="lg:col-span-2">
                   <Input label="Complete Address" name="completeAddress" value={formData.completeAddress} onChange={handleChange} required placeholder="Lot/Blk, Street, Unit/Bldg" />
                </div>
                <Select label="Barangay" name="barangay" options={BARANGAYS} value={formData.barangay} onChange={handleChange} required />
                <Input label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required placeholder="09XX-XXX-XXXX" />
            </div>
        </section>

        {/* Section 3: Diagnostic Info */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-5">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-3">
              <Stethoscope size={20} className="text-amber-600"/> 3. Diagnostic Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select label="Reason for Referral" name="referralReason" options={NTP_REASONS_FOR_REFERRAL} value={formData.referralReason} onChange={handleChange} required />
                <div className="flex flex-col gap-2">
                    <Select label="TB Diagnosis" name="tbDiagnosis" options={NTP_TB_DIAGNOSES} value={formData.tbDiagnosis} onChange={handleChange} required />
                    {formData.tbDiagnosis === 'Others (Specify)' && <Input label="Specify Diagnosis" name="tbDiagnosisOther" value={formData.tbDiagnosisOther} onChange={handleChange} required />}
                    {formData.tbDiagnosis === 'Extrapulmonary Tuberculosis' && <Input label="Specify Site" name="extrapulmonarySite" value={formData.extrapulmonarySite} onChange={handleChange} placeholder="e.g. Pleural, Lymph Node, Bone" required />}
                </div>
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                        <Pill size={14} className="text-amber-600"/> 13. History of Previous TB Treatment
                    </h4>
                    <button type="button" onClick={addTreatmentRow} className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 flex items-center gap-1 hover:bg-amber-100 transition-all">
                        <Plus size={12}/> Add Regimen
                    </button>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-slate-50/30">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-400 font-black text-[9px] uppercase border-b border-slate-100">
                            <tr>
                                <th className="p-4 text-left">Date Started</th>
                                <th className="p-4 text-left">Treatment Unit</th>
                                <th className="p-4 text-left">Anti-TB Drugs & Duration</th>
                                <th className="p-4 text-left">Outcome</th>
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {formData.treatmentHistory.map((row, idx) => (
                                <tr key={idx} className="animate-in fade-in bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2"><input type="date" className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold" value={row.dateStarted} onChange={e => updateTreatmentRow(idx, 'dateStarted', e.target.value)} /></td>
                                    <td className="p-2"><input type="text" className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold" value={row.treatmentUnit} onChange={e => updateTreatmentRow(idx, 'treatmentUnit', e.target.value)} placeholder="e.g. OsMak DOTS" /></td>
                                    <td className="p-2"><input type="text" className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold" value={row.drugsDuration} onChange={e => updateTreatmentRow(idx, 'drugsDuration', e.target.value)} placeholder="e.g. HRZE 2 months" /></td>
                                    <td className="p-2"><input type="text" className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold" value={row.outcome} onChange={e => updateTreatmentRow(idx, 'outcome', e.target.value)} placeholder="Completed/Failed/etc" /></td>
                                    <td className="p-2"><button type="button" onClick={() => removeTreatmentRow(idx)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></td>
                                </tr>
                            ))}
                            {formData.treatmentHistory.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-300 font-bold italic text-xs">No previous treatment history recorded.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        {/* Section 4: Referral Info */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-5">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-3">
              <Briefcase size={20} className="text-amber-600"/> 4. Referral Finalization
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Referred By" name="referredBy" value={formData.referredBy} onChange={handleChange} required placeholder="Clinician's Name" />
                <div className="flex flex-col gap-2">
                    <Select label="Designation" name="designation" options={['Medical Officer', 'Nurse', 'others (specify)']} value={formData.designation} onChange={handleChange} required />
                    {formData.designation === 'others (specify)' && <Input label="Specify Designation" name="designationOther" value={formData.designationOther} onChange={handleChange} required />}
                </div>
                <div className="flex items-end">
                    <button type="submit" disabled={loading} className="w-full h-14 bg-amber-700 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-amber-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                        {loading ? <Loader2 size={24} className="animate-spin" /> : <UserPlus size={24} />} Register for NTP
                    </button>
                </div>
            </div>
        </section>
      </form>

      <ThankYouModal 
        show={showThankYou} 
        reporterName={formData.referredBy} 
        moduleName="NTP Registry" 
        onClose={resetForm} 
      />
    </Layout>
  );
};

export default NTPForm;
