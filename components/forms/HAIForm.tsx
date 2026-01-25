import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ThankYouModal from '../ui/ThankYouModal';
import { 
  AREAS, 
  HAI_TYPES, 
  CATHETER_TYPES, 
  LUMEN_COUNTS, 
  CLINICAL_SIGNS,
  SURGICAL_PROCEDURES,
  SSI_TISSUE_LEVELS,
  SSI_ORGAN_SPACES,
  BARANGAYS,
  EMBO_BARANGAYS,
  PATIENT_OUTCOMES,
  INSERTION_SITES
} from '../../constants';
import { submitReport, calculateAge } from '../../services/ipcService';
import { 
  ChevronLeft, 
  Send, 
  Loader2, 
  FileText, 
  Users, 
  Activity, 
  Sparkles,
  Wind,
  Droplets,
  Syringe,
  Scissors,
  Microscope,
  Pill,
  Plus,
  Trash2
} from 'lucide-react';

interface SensitivityEntry {
  antibiotic: string;
  result: string;
  resultOther?: string;
}

const HAIForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isOutsideMakati, setIsOutsideMakati] = useState(false);

  const initialFormData = {
    lastName: '', firstName: '', middleName: '', hospitalNumber: '', dob: '', age: '', sex: '',
    barangay: '', city: 'Makati',
    area: '', areaOther: '',
    dateOfAdmission: '',
    movementHistory: [] as { area: string, date: string }[],
    haiType: '', haiTypeOther: '', 
    // Common Laboratory & Treatment Fields
    empiricAntibiotics: '',
    cultureOrganism: '',
    sensitivities: [] as SensitivityEntry[],
    // VAP
    mvInitiationArea: '', mvInitiationDate: '', 
    // CAUTI
    ifcInitiationArea: '', ifcInitiationDate: '',
    // CRBSI
    crbsiInitiationArea: '', crbsiInsertionDate: '', catheterType: '', insertionSite: '', numLumens: '', clinicalSigns: [] as string[],
    // SSI
    ssiProcedureType: '', ssiProcedureDate: '', ssiEventDate: '', ssiTissueLevel: '', ssiOrganSpace: '',
    // HAP
    pneumoniaSymptomOnset: '',
    outcome: 'Admitted', outcomeDate: '',
    reporterName: '', designation: ''
  };

  const [formData, setFormData] = useState<any>(initialFormData);

  useEffect(() => { 
    if (formData.dob) {
      setFormData((prev: any) => ({ ...prev, age: calculateAge(prev.dob) }));
    }
  }, [formData.dob]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSensitivityChange = (index: number, field: keyof SensitivityEntry, value: string) => {
    const updated = [...formData.sensitivities];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, sensitivities: updated }));
  };

  const addSensitivityRow = () => {
    setFormData((prev: any) => ({
      ...prev,
      sensitivities: [...prev.sensitivities, { antibiotic: '', result: '' }]
    }));
  };

  const removeSensitivityRow = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      sensitivities: prev.sensitivities.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleMagicFill = () => {
    const demoDate = new Date();
    const admDate = new Date();
    admDate.setDate(demoDate.getDate() - 10);

    setFormData({
      ...initialFormData,
      lastName: 'Dela Cruz',
      firstName: 'Juan',
      middleName: 'Mendoza',
      hospitalNumber: '25-' + Math.floor(10000 + Math.random() * 90000),
      dob: '1985-05-15',
      age: '39',
      sex: 'Male',
      barangay: 'Poblacion',
      city: 'Makati',
      area: 'ICU',
      dateOfAdmission: admDate.toISOString().split('T')[0],
      haiType: 'Ventilator Associated Pneumonia',
      mvInitiationArea: 'ICU',
      mvInitiationDate: admDate.toISOString().split('T')[0],
      empiricAntibiotics: 'Ceftriaxone + Azithromycin',
      cultureOrganism: 'Acinetobacter baumannii',
      sensitivities: [
        { antibiotic: 'Meropenem', result: 'R' },
        { antibiotic: 'Colistin', result: 'S' }
      ],
      clinicalSigns: ['Fever (>38C)', 'Chills'],
      outcome: 'Admitted',
      reporterName: 'Dr. Maria Santos',
      designation: 'Doctor'
    });
    setIsOutsideMakati(false);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setShowThankYou(false);
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

  const handleArrayToggle = (field: string, val: string) => {
    setFormData((prev: any) => {
      const list = prev[field] || [];
      const newList = list.includes(val) ? list.filter((i: string) => i !== val) : [...list, val];
      return { ...prev, [field]: newList };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submissionData = { ...formData };
    
    if (submissionData.area === 'Other (specify)') {
      submissionData.area = submissionData.areaOther || 'Other Ward';
    }
    if (submissionData.haiType === 'Other (specify)') {
      submissionData.haiType = submissionData.haiTypeOther || 'Other Infection Type';
    }

    delete submissionData.areaOther;
    delete submissionData.haiTypeOther;

    try {
      await submitReport("HAI", submissionData);
      setShowThankYou(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to submit.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Report HAI Case">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 max-w-5xl mx-auto px-4">
        <button onClick={() => navigate('/')} className="flex items-center text-xs font-bold text-slate-500 hover:text-primary transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        {user === 'Max' && (
          <button 
            type="button" 
            onClick={handleMagicFill}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm"
          >
            <Sparkles size={14} className="text-amber-500" /> Magic Fill (Demo)
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-5xl mx-auto px-4 pb-20">
        {/* Section 1: Identity */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase text-sm tracking-tight"><Users size={20} className="text-primary"/> Patient Identification</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Input label="Hospital Number" name="hospitalNumber" value={formData.hospitalNumber} onChange={handleChange} required placeholder="24-XXXXX" />
              <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
              <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
              <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
              <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
              <Input label="Calculated Age" name="age" value={formData.age} readOnly className="bg-slate-50 text-slate-500 font-bold" />
              <Select label="Sex" name="sex" options={['Male', 'Female']} value={formData.sex} onChange={handleChange} required />
              
              <div className="md:col-span-1 flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase cursor-pointer mb-2 hover:text-primary transition-colors">
                    <input type="checkbox" checked={isOutsideMakati} onChange={handleOutsideMakatiChange} className="rounded text-primary h-4 w-4 border-slate-300 focus:ring-primary/20"/> Outside Makati?
                </label>
              </div>
              <div className="md:col-span-2">
                {!isOutsideMakati ? (
                    <Select label="Barangay" name="barangay" options={BARANGAYS} value={formData.barangay} onChange={handleBarangayChange} required={!isOutsideMakati} />
                ) : (
                    <Input label="Barangay / Location" name="barangay" value={formData.barangay} onChange={handleChange} />
                )}
              </div>
              <Input label="City" name="city" value={formData.city} onChange={handleChange} readOnly={!isOutsideMakati} className={!isOutsideMakati ? "bg-slate-50 font-bold" : "bg-white"} required />
            </div>
        </section>

        {/* Section 2: Core Infection Data */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-4 uppercase text-sm tracking-tight"><Activity size={20} className="text-primary"/> Infection Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <Select label="Infection Type" name="haiType" options={HAI_TYPES} value={formData.haiType} onChange={handleChange} required />
                {formData.haiType === 'Other (specify)' && <Input label="Specify Type" name="haiTypeOther" value={formData.haiTypeOther} onChange={handleChange} required />}
              </div>
              <div className="flex flex-col gap-2">
                <Select label="Current Patient Area" name="area" options={AREAS} value={formData.area} onChange={handleChange} required />
                {formData.area === 'Other (specify)' && <Input label="Specify Ward" name="areaOther" value={formData.areaOther} onChange={handleChange} required />}
              </div>
              <Input label="Hospital Admission Date" name="dateOfAdmission" type="date" value={formData.dateOfAdmission} onChange={handleChange} required />
            </div>

            {/* --- CONDITIONAL SECTIONS --- */}

            {/* Ventilator Associated Pneumonia (VAP) */}
            {formData.haiType === 'Ventilator Associated Pneumonia' && (
              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col gap-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-blue-800"><Wind size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">Ventilator Specific Data</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="MV Initiation Area" name="mvInitiationArea" options={AREAS} value={formData.mvInitiationArea} onChange={handleChange} required />
                  <Input label="MV Initiation Date" name="mvInitiationDate" type="date" value={formData.mvInitiationDate} onChange={handleChange} required />
                </div>
              </div>
            )}

            {/* Healthcare Associated Pneumonia (HAP) */}
            {formData.haiType === 'Healthcare-Associated Pneumonia' && (
              <div className="p-6 bg-cyan-50 rounded-3xl border border-cyan-100 flex flex-col gap-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-cyan-800"><FileText size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">Pneumonia Clinical Onset</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Symptom Onset Date" name="pneumoniaSymptomOnset" type="date" value={formData.pneumoniaSymptomOnset} onChange={handleChange} required />
                </div>
              </div>
            )}

            {/* Catheter-Associated UTI (CAUTI) */}
            {formData.haiType === 'Catheter-Associated UTI' && (
              <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col gap-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-indigo-800"><Droplets size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">Catheter Specific Data</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="IFC Initiation Area" name="ifcInitiationArea" options={AREAS} value={formData.ifcInitiationArea} onChange={handleChange} required />
                  <Input label="IFC Initiation Date" name="ifcInitiationDate" type="date" value={formData.ifcInitiationDate} onChange={handleChange} required />
                </div>
              </div>
            )}

            {/* Surgical Site Infection (SSI) */}
            {formData.haiType === 'Surgical Site Infection' && (
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-amber-800"><Scissors size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">Surgical/Operative Data</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><Select label="Procedure Done" name="ssiProcedureType" options={SURGICAL_PROCEDURES} value={formData.ssiProcedureType} onChange={handleChange} required /></div>
                  <Input label="Procedure Date" name="ssiProcedureDate" type="date" value={formData.ssiProcedureDate} onChange={handleChange} required />
                  <Input label="Date of Event" name="ssiEventDate" type="date" value={formData.ssiEventDate} onChange={handleChange} required />
                  <Select label="Tissue Level Involved" name="ssiTissueLevel" options={SSI_TISSUE_LEVELS} value={formData.ssiTissueLevel} onChange={handleChange} required />
                  <Select label="Specific Organ Space" name="ssiOrganSpace" options={SSI_ORGAN_SPACES} value={formData.ssiOrganSpace} onChange={handleChange} required />
                </div>
              </div>
            )}

            {/* Catheter-Related BSI (CRBSI) */}
            {formData.haiType === 'Catheter-Related Blood Stream Infections' && (
              <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex flex-col gap-6 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-rose-800"><Syringe size={18}/> <h4 className="text-xs font-black uppercase tracking-widest">Line-Related Surveillance Data</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select label="Initiation Area" name="crbsiInitiationArea" options={AREAS} value={formData.crbsiInitiationArea} onChange={handleChange} required />
                  <Input label="Insertion Date" name="crbsiInsertionDate" type="date" value={formData.crbsiInsertionDate} onChange={handleChange} required />
                  <Select label="Catheter Type" name="catheterType" options={CATHETER_TYPES} value={formData.catheterType} onChange={handleChange} required />
                  <Select label="Insertion Site" name="insertionSite" options={INSERTION_SITES} value={formData.insertionSite} onChange={handleChange} required />
                  <Select label="Number of Lumens" name="numLumens" options={LUMEN_COUNTS} value={formData.numLumens} onChange={handleChange} required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-3 block">Clinical Presentation (Select all that apply)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CLINICAL_SIGNS.map(sign => (
                      <button 
                        key={sign} type="button" onClick={() => handleArrayToggle('clinicalSigns', sign)}
                        className={`px-4 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase transition-all text-left ${formData.clinicalSigns?.includes(sign) ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white border-rose-100 text-rose-400 hover:border-rose-200'}`}
                      >
                        {sign}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
        </section>

        {/* Section 3: Laboratory & Treatment (Standardized for all) */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-4 uppercase text-sm tracking-tight"><Microscope size={20} className="text-primary"/> Laboratory & Treatment</h3>
            
            <div className="flex flex-col gap-6">
              <Input 
                label="Empiric Antibiotics Given" 
                name="empiricAntibiotics" 
                value={formData.empiricAntibiotics} 
                onChange={handleChange} 
                placeholder="List antibiotics initiated..." 
              />

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-primary"><Pill size={18}/></div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Culture Results & Sensitivity</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Isolated Organism" 
                    name="cultureOrganism" 
                    value={formData.cultureOrganism} 
                    onChange={handleChange} 
                    placeholder="e.g. Acinetobacter baumannii" 
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Antibiotic Sensitivity List</span>
                    <button 
                      type="button" 
                      onClick={addSensitivityRow}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase hover:bg-osmak-green-dark transition-all shadow-sm"
                    >
                      <Plus size={14}/> Add Row
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.sensitivities.map((entry: SensitivityEntry, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end group animate-in slide-in-from-right-1">
                        <div className="md:col-span-5">
                          <Input 
                            label="Antibiotic" 
                            value={entry.antibiotic} 
                            onChange={(e) => handleSensitivityChange(idx, 'antibiotic', e.target.value)} 
                            placeholder="Drug Name" 
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Select 
                            label="Result" 
                            options={['S (Susceptible)', 'I (Intermediate)', 'R (Resistant)', 'Others (Specify)']} 
                            value={entry.result} 
                            onChange={(e) => handleSensitivityChange(idx, 'result', e.target.value)} 
                          />
                        </div>
                        <div className="md:col-span-3">
                          {entry.result === 'Others (Specify)' && (
                            <Input 
                              label="Specify Result" 
                              value={entry.resultOther || ''} 
                              onChange={(e) => handleSensitivityChange(idx, 'resultOther', e.target.value)} 
                              placeholder="..." 
                            />
                          )}
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <button 
                            type="button" 
                            onClick={() => removeSensitivityRow(idx)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18}/>
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.sensitivities.length === 0 && (
                      <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-bold text-slate-300 uppercase italic">No sensitivities recorded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </section>

        {/* Section 4: Finalization */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-slate-900 flex items-center gap-3 border-b border-slate-100 pb-4 uppercase text-sm tracking-tight"><FileText size={20} className="text-primary"/> Finalization & Reporter</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select label="Clinical Outcome" name="outcome" options={PATIENT_OUTCOMES} value={formData.outcome} onChange={handleChange} required />
                {formData.outcome !== "Admitted" && formData.outcome !== "ER-level" && (
                  <Input label="Date of Outcome" name="outcomeDate" type="date" value={formData.outcomeDate} onChange={handleChange} required />
                )}
                <Input label="Name of Reporter" name="reporterName" value={formData.reporterName} onChange={handleChange} required />
                <Select label="Reporter Designation" name="designation" options={['Doctor', 'Nurse', 'IPC Staff', 'Lab Staff', 'Other']} value={formData.designation} onChange={handleChange} required />
                <div className="md:col-span-1 lg:col-span-1 flex items-end">
                    <button type="submit" disabled={loading} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-osmak-green-dark transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                        {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />} Submit Registry Entry
                    </button>
                </div>
            </div>
        </section>
      </form>
      <ThankYouModal 
        show={showThankYou} 
        reporterName={formData.reporterName} 
        moduleName="HAI Registry" 
        onClose={resetForm} 
      />
    </Layout>
  );
};

export default HAIForm;