import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ThankYouModal from '../ui/ThankYouModal';
import { 
  AREAS, BARANGAYS, EMBO_BARANGAYS, PTB_INITIAL_DISPOSITIONS, PTB_FINAL_DISPOSITIONS, COMORBIDITIES 
} from '../../constants';
import { submitReport, updateTBReport, calculateAge } from '../../services/ipcService';
import { 
  ChevronLeft, Send, Loader2, Activity, MapPin, 
  Beaker, FileText, Plus, Trash2, Users, Pill, Clock, Heart, 
  Sparkles, AlertCircle, Save, Edit3
} from 'lucide-react';

const PTBForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isOutsideMakati, setIsOutsideMakati] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const initialFormData = {
    lastName: '', firstName: '', middleName: '', dob: '', age: '', sex: '', hospitalNumber: '', 
    barangay: '', city: 'Makati', 
    dateOfAdmission: '', area: '', areaOther: '', 
    movementHistory: [] as { area: string, date: string }[],
    xpertResults: [] as { date: string, specimen: string, mtbResult: string, mtbLevel?: string, rifResistance?: string }[],
    smearResults: [] as { date: string, specimen: string, result: string }[],
    cxrDate: '',
    classification: '', classificationOther: '', anatomicalSite: 'Pulmonary', drugSusceptibility: '', treatmentHistory: '', 
    emergencySurgicalProcedure: '',
    initialDisposition: 'Admitted',
    finalDisposition: 'Currently Admitted',
    outcomeDate: '',
    treatmentStarted: '', treatmentStartedDate: '', 
    comorbidities: [] as string[], 
    hivTestResult: '', startedOnArt: '', 
    reporterName: '', designation: ''
  };

  const [formData, setFormData] = useState<any>(initialFormData);

  // Pre-population logic for both New and Edit modes
  useEffect(() => {
    if (location.state?.editPatient) {
      const patient = location.state.editPatient;
      setFormData({ 
        ...initialFormData, 
        ...patient,
        xpertResults: (patient.xpertResults || []).map((x: any) => ({
            ...x,
            mtbResult: x.mtbResult || (x.result?.includes('Not Detected') ? 'MTB Not Detected' : x.result?.includes('Detected') ? 'MTB Detected' : ''),
            mtbLevel: x.mtbLevel || '',
            rifResistance: x.rifResistance || ''
        })),
        smearResults: patient.smearResults || [],
        movementHistory: patient.movementHistory || [],
        comorbidities: patient.comorbidities || [],
        initialDisposition: patient.initialDisposition || patient.outcome || 'Admitted',
        finalDisposition: patient.finalDisposition || 'Currently Admitted'
      });
      setEditMode(true);
      if (patient.city !== 'Makati' && patient.city !== 'Embo') {
        setIsOutsideMakati(true);
      }
    } else if (location.state?.prefill) {
      const { lastName, firstName, hospitalNumber, initialLab } = location.state.prefill;
      
      const isXpert = initialLab?.type === 'GeneXpert';
      const newXpert = isXpert ? [{ 
        date: initialLab.date, 
        specimen: initialLab.specimen, 
        mtbResult: initialLab.result.includes('Not Detected') ? 'MTB Not Detected' : initialLab.result.includes('Detected') ? 'MTB Detected' : '',
        mtbLevel: '',
        rifResistance: initialLab.result.includes('Res') ? 'Resistant' : initialLab.result.includes('Sens') ? 'Sensitive' : ''
      }] : [];
      const newSmear = (!isXpert && (initialLab?.type === 'AFB' || initialLab?.type === 'Smear')) ? [{ date: initialLab.date, specimen: initialLab.specimen, result: initialLab.result }] : [];
      
      setFormData(prev => ({
        ...prev,
        lastName: lastName || '',
        firstName: firstName || '',
        hospitalNumber: hospitalNumber || '',
        xpertResults: newXpert,
        smearResults: newSmear,
        classification: (initialLab?.result.includes('+') || initialLab?.result.toLowerCase().includes('detected')) 
          ? 'Bacteriological Confirmed' 
          : 'Presumptive TB'
      }));
    }
  }, [location.state]);

  useEffect(() => { 
    if (formData.dob) {
      setFormData((prev: any) => ({ ...prev, age: calculateAge(prev.dob) }));
    }
  }, [formData.dob]);

  const handleMagicFill = () => {
    const today = new Date().toISOString().split('T')[0];
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

    setFormData({
      ...initialFormData,
      lastName: 'Delos Reyes',
      firstName: 'Roberto',
      middleName: 'Gomez',
      hospitalNumber: '25-' + Math.floor(Math.random() * 90000 + 10000),
      dob: '1978-08-22',
      age: '46',
      sex: 'Male',
      barangay: 'Poblacion',
      city: 'Makati',
      dateOfAdmission: fiveDaysAgoStr,
      area: 'Medicine Ward',
      movementHistory: [
        { area: 'Emergency Room Complex', date: fiveDaysAgoStr },
        { area: 'Medicine Ward', date: today }
      ],
      classification: 'Bacteriological Confirmed',
      anatomicalSite: 'Pulmonary',
      drugSusceptibility: 'RR',
      treatmentHistory: 'Relapse',
      xpertResults: [{ 
        date: today, 
        specimen: 'Sputum', 
        mtbResult: 'MTB Detected',
        mtbLevel: 'High',
        rifResistance: 'Resistant'
      }],
      smearResults: [{ date: today, specimen: 'Sputum', result: '2+' }],
      treatmentStarted: 'Yes',
      treatmentStartedDate: today,
      comorbidities: ['Diabetes Mellitus', 'Liver Disease'],
      hivTestResult: 'Non-Reactive',
      reporterName: 'Nurse J. Reyes',
      designation: 'Nurse',
      initialDisposition: 'Admitted',
      finalDisposition: 'Currently Admitted'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setIsOutsideMakati(false);
    setShowThankYou(false);
    setEditMode(false);
  };

  const handleOutsideMakatiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsOutsideMakati(checked);
    setFormData((prev: any) => ({
      ...prev,
      barangay: '', 
      city: checked ? '' : 'Makati' 
    }));
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBrgy = e.target.value;
    let newCity = 'Makati';
    if (EMBO_BARANGAYS.includes(selectedBrgy)) newCity = 'Embo';
    setFormData((prev: any) => ({ ...prev, barangay: selectedBrgy, city: newCity }));
  };

  const addListItem = (field: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), field === 'movementHistory' ? { area: '', date: '' } : field === 'xpertResults' ? { date: '', specimen: '', mtbResult: '', mtbLevel: '', rifResistance: '' } : { date: '', specimen: '', result: '' }]
    }));
  };

  const removeListItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_: any, i: number) => i !== index)
    }));
  };

  const updateListItem = (field: string, index: number, key: string, value: string) => {
    const newList = [...(formData[field] || [])];
    newList[index] = { ...newList[index], [key]: value };
    setFormData((prev: any) => ({ ...prev, [field]: newList }));
  };

  const handleComorbidityToggle = (item: string) => {
    setFormData((prev: any) => {
      const current = prev.comorbidities || [];
      return {
        ...prev,
        comorbidities: current.includes(item) ? current.filter((i: string) => i !== item) : [...current, item]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submissionData = { ...formData };
    
    if (submissionData.area === 'Other (specify)') {
      submissionData.area = submissionData.areaOther || 'Other Area';
    }
    delete submissionData.areaOther;

    if (submissionData.classification === 'Others (Specify)') {
      submissionData.classification = submissionData.classificationOther || 'Other';
    }
    delete submissionData.classificationOther;

    if (submissionData.movementHistory) {
      submissionData.movementHistory = submissionData.movementHistory.map((m: any) => ({
        ...m,
        area: m.area === 'Other (specify)' ? 'Other Ward' : m.area
      }));
    }

    try {
      if (editMode) {
        await updateTBReport(submissionData);
        alert("Record updated successfully.");
        navigate('/surveillance?module=tb');
      } else {
        await submitReport("TB Report", submissionData);
        setShowThankYou(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      alert(`Submission Failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={editMode ? "Modify TB Record" : "TB Case Registration"}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 max-w-5xl mx-auto px-4">
        <button onClick={() => navigate('/surveillance?module=tb')} className="flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors">
          <ChevronLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-3">
          {editMode && (
             <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 animate-in slide-in-from-right-2">
               <Edit3 size={14} className="text-amber-600" />
               <span className="text-[10px] font-black text-amber-700 uppercase">Updating Existing Record</span>
             </div>
          )}
          {location.state?.prefill && (
             <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 animate-in slide-in-from-right-2">
               <AlertCircle size={14} className="text-indigo-600" />
               <span className="text-[10px] font-black text-indigo-700 uppercase">Pre-filled from Lab Registry</span>
             </div>
          )}
          {!editMode && user === 'Max' && (
            <button 
              type="button" 
              onClick={handleMagicFill}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm"
            >
              <Sparkles size={14} className="text-amber-500" /> Magic Fill
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-5xl mx-auto px-4 pb-20">
        {/* Patient Info */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <Users size={18} className="text-primary"/> Patient Identification
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Input label="Hosp #" name="hospitalNumber" value={formData.hospitalNumber} onChange={handleChange} required />
                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                <Input label="DOB" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                <Input label="Age" name="age" value={formData.age} readOnly className="bg-slate-50 font-bold" />
                <Select label="Sex" name="sex" options={['Male', 'Female']} value={formData.sex} onChange={handleChange} required />
                
                <div className="md:col-span-1 lg:col-span-1 flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase cursor-pointer mb-2">
                        <input type="checkbox" checked={isOutsideMakati} onChange={handleOutsideMakatiChange} className="rounded text-primary h-4 w-4 border-slate-300"/> Outside Makati?
                    </label>
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                    {!isOutsideMakati ? (
                        <Select label="Barangay" name="barangay" options={BARANGAYS} value={formData.barangay} onChange={handleBarangayChange} required={!isOutsideMakati} />
                    ) : (
                        <Input label="Barangay / Location" name="barangay" value={formData.barangay} onChange={handleChange} />
                    )}
                </div>
                <Input label="City" name="city" value={formData.city} onChange={handleChange} readOnly={!isOutsideMakati} className={!isOutsideMakati ? "bg-slate-50 font-bold" : "bg-white"} required />
            </div>
        </section>

        {/* Clinical Context */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-5">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide">
                <MapPin size={18} className="text-primary"/> Clinical Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Admission Date" name="dateOfAdmission" type="date" value={formData.dateOfAdmission} onChange={handleChange} required />
                <Select label="Initial Admission Area" name="area" options={AREAS} value={formData.area} onChange={handleChange} required />
                {formData.area === 'Other (specify)' && <Input label="Specify Ward" name="areaOther" value={formData.areaOther} onChange={handleChange} required />}
            </div>
            
            <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Ward Transfer History</label>
                    <button type="button" onClick={() => addListItem('movementHistory')} className="text-[10px] font-black uppercase text-primary flex items-center gap-1 hover:underline"><Plus size={12}/> Add Ward</button>
                </div>
                <div className="space-y-2">
                    {(formData.movementHistory || []).map((m: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 animate-in slide-in-from-right-1">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <Select label={`Area ${i+1}`} options={AREAS} value={m.area} onChange={e => updateListItem('movementHistory', i, 'area', e.target.value)} />
                                <Input label="Date" type="date" value={m.date} onChange={e => updateListItem('movementHistory', i, 'date', e.target.value)} />
                            </div>
                            <button type="button" onClick={() => removeListItem('movementHistory', i)} className="mt-6 p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    {(formData.movementHistory || []).length === 0 && <p className="text-[10px] text-slate-300 font-bold italic">No transfer records added.</p>}
                </div>
            </div>
        </section>

        {/* Diagnostics */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide">
                <Beaker size={18} className="text-primary"/> Diagnostic Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* GeneXpert Section */}
                <div className="flex flex-col gap-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-2"><Activity size={14}/> GeneXpert (Xpert MTB/RIF)</h4>
                        <button type="button" onClick={() => addListItem('xpertResults')} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><Plus size={14}/></button>
                    </div>
                    <div className="space-y-3">
                        {(formData.xpertResults || []).map((x: any, i: number) => (
                            <div key={i} className="grid grid-cols-1 gap-3 bg-white p-4 rounded-2xl border border-blue-50 shadow-sm relative animate-in zoom-in-95">
                                <div className="grid grid-cols-2 gap-2">
                                    <Input label="Date" type="date" value={x.date} onChange={e => updateListItem('xpertResults', i, 'date', e.target.value)} />
                                    <Input label="Specimen" value={x.specimen} onChange={e => updateListItem('xpertResults', i, 'specimen', e.target.value)} placeholder="Sputum..." />
                                </div>
                                <Select label="MTB Result" options={['MTB Detected', 'MTB Not Detected', 'Invalid/No Result']} value={x.mtbResult} onChange={e => updateListItem('xpertResults', i, 'mtbResult', e.target.value)} />
                                {x.mtbResult === 'MTB Detected' && (
                                    <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                                        <Select label="MTB Level" options={['Very low', 'Low', 'Medium', 'Intermediate', 'High', 'Very High']} value={x.mtbLevel || ''} onChange={e => updateListItem('xpertResults', i, 'mtbLevel', e.target.value)} />
                                        <Select label="Rif Resistance" options={['Rif Resistance not detected', 'Indeterminate', 'Sensitive', 'Resistant']} value={x.rifResistance || ''} onChange={e => updateListItem('xpertResults', i, 'rifResistance', e.target.value)} />
                                    </div>
                                )}
                                <button type="button" onClick={() => removeListItem('xpertResults', i)} className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-50"><Trash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AFB Section */}
                <div className="flex flex-col gap-4 p-5 bg-amber-50/50 rounded-3xl border border-amber-100">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-2"><Activity size={14}/> AFB</h4>
                        <button type="button" onClick={() => addListItem('smearResults')} className="p-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm"><Plus size={14}/></button>
                    </div>
                    <div className="space-y-3">
                        {(formData.smearResults || []).map((s: any, i: number) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-amber-50 shadow-sm relative animate-in zoom-in-95">
                                <Input label="Date" type="date" value={s.date} onChange={e => updateListItem('smearResults', i, 'date', e.target.value)} />
                                <Input label="Specimen" value={s.specimen} onChange={e => updateListItem('smearResults', i, 'specimen', e.target.value)} />
                                <Select label="Result" options={['Negative', 'Scanty', '1+', '2+', '3+', '4+', '5+', '6+']} value={s.result} onChange={e => updateListItem('smearResults', i, 'result', e.target.value)} />
                                <button type="button" onClick={() => removeListItem('smearResults', i)} className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-50"><Trash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <Input label="CXR Date (if any)" name="cxrDate" type="date" value={formData.cxrDate} onChange={handleChange} />
                <Select label="Anatomical Site" name="anatomicalSite" options={['Pulmonary', 'Extra-pulmonary']} value={formData.anatomicalSite} onChange={handleChange} />
                <div className="flex flex-col gap-2">
                    <Select label="Registration Class" name="classification" options={['Please Update', 'Bacteriological Confirmed', 'Clinically Diagnosed', 'Presumptive TB', 'Cleared', 'Others (Specify)']} value={formData.classification} onChange={handleChange} required />
                    {formData.classification === 'Others (Specify)' && <Input label="Specify Classification" name="classificationOther" value={formData.classificationOther} onChange={handleChange} required />}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Select label="Drug Susceptibility" name="drugSusceptibility" options={['Sensitive', 'RR', 'MDR', 'XDR', 'Unknown']} value={formData.drugSusceptibility} onChange={handleChange} />
                <Select label="Treatment History" name="treatmentHistory" options={['New', 'Relapse', 'Treatment After Failure', 'Treatment After Loss to Follow-up', 'Previous Treatment Unknown']} value={formData.treatmentHistory} onChange={handleChange} />
                <Select label="Emergency Surg Procedure?" name="emergencySurgicalProcedure" options={['Yes', 'No']} value={formData.emergencySurgicalProcedure} onChange={handleChange} />
            </div>
        </section>

        {/* Management */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide">
                <Pill size={18} className="text-primary"/> Management & Risk Factors
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select label="TB Treatment Started?" name="treatmentStarted" options={['Yes', 'No']} value={formData.treatmentStarted} onChange={handleChange} />
                {formData.treatmentStarted === 'Yes' && <Input label="Start Date" name="treatmentStartedDate" type="date" value={formData.treatmentStartedDate} onChange={handleChange} required />}
                <Select label="HIV Test Result" name="hivTestResult" options={['Non-Reactive', 'Reactive', 'Awaiting Result', 'Declined', 'Not Offered']} value={formData.hivTestResult} onChange={handleChange} />
                {formData.hivTestResult === 'Reactive' && <Select label="Started on ART?" name="startedOnArt" options={['Yes', 'No']} value={formData.startedOnArt} onChange={handleChange} />}
            </div>

            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block flex items-center gap-2"><Heart size={12}/> Comorbidities / Vulnerabilities</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {COMORBIDITIES.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => handleComorbidityToggle(c)}
                            className={`px-4 py-3 rounded-2xl border-2 font-bold text-xs text-left transition-all ${
                                (formData.comorbidities || []).includes(c) 
                                ? 'bg-primary border-primary text-white shadow-lg' 
                                : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>
        </section>

        {/* Outcome & Reporter */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide">
                <FileText size={18} className="text-primary" /> Registry Finalization
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select label="Initial Disposition" name="initialDisposition" options={PTB_INITIAL_DISPOSITIONS} value={formData.initialDisposition} onChange={handleChange} required />
                <Select label="Final Disposition" name="finalDisposition" options={PTB_FINAL_DISPOSITIONS} value={formData.finalDisposition} onChange={handleChange} required />
                {(formData.finalDisposition !== 'Currently Admitted') && <Input label="Date of Outcome" name="outcomeDate" type="date" value={formData.outcomeDate} onChange={handleChange} required />}
                <Input label="Name of Reporter" name="reporterName" value={formData.reporterName} onChange={handleChange} required />
                <Select label="Designation" name="designation" options={['Doctor', 'Nurse', 'IPC Staff', 'DOTS Coordinator', 'Other']} value={formData.designation} onChange={handleChange} required />
            </div>
        </section>

        <button type="submit" disabled={loading} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-osmak-green-dark transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mb-10">
          {loading ? <Loader2 size={24} className="animate-spin" /> : editMode ? <Save size={24} /> : <Send size={24} />} 
          {editMode ? 'Save Changes' : 'Register TB Patient(s)'}
        </button>
      </form>

      <ThankYouModal 
        show={showThankYou} 
        reporterName={formData.reporterName} 
        moduleName="TB Case Registry" 
        onClose={resetForm} 
      />
    </Layout>
  );
};

export default PTBForm;