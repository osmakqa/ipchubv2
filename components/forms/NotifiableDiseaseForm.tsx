import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ThankYouModal from '../ui/ThankYouModal';
import { 
  AREAS, NOTIFIABLE_DISEASES, BARANGAYS, EMBO_BARANGAYS, PATIENT_OUTCOMES,
  DENGUE_VACCINE_OPTIONS, DENGUE_CLINICAL_CLASSES,
  ILI_TRAVEL_OPTIONS, ILI_VACCINE_OPTIONS,
  LEPTO_EXPOSURE_OPTIONS,
  AFP_POLIO_VACCINE_OPTIONS,
  HFMD_SYMPTOMS, HFMD_COMMUNITY_CASES_OPTIONS, HFMD_EXPOSURE_TYPE_OPTIONS,
  MEASLES_SYMPTOMS, MEASLES_VACCINE_OPTIONS,
  ROTA_VACCINE_OPTIONS,
  RABIES_RIG_OPTIONS, RABIES_VACCINE_PRIOR_OPTIONS,
  CHIKUNGUNYA_SYMPTOMS, CHIKUNGUNYA_TRAVEL_OPTIONS,
  PERTUSSIS_VACCINE_OPTIONS, PERTUSSIS_SYMPTOMS,
  AMES_SYMPTOMS, AMES_VACCINES_LIST, AMES_TRAVEL_OPTIONS,
  SARI_MEDICATIONS, SARI_HOUSEHOLD_ILI_OPTIONS, SARI_SCHOOL_ILI_OPTIONS, 
  SARI_FLU_VACCINE_OPTIONS, SARI_ANIMAL_EXPOSURE_OPTIONS, SARI_TRAVEL_OPTIONS
} from '../../constants';
import { submitReport, calculateAge } from '../../services/ipcService';
import { ChevronLeft, Send, Loader2, Plus, Trash2, Users, FileText, Activity, Syringe, ShieldCheck, Droplets, Wind, MapPin, AlertTriangle, Thermometer, Dog, ClipboardList, Sparkles } from 'lucide-react';

interface PatientData {
  id: string; 
  lastName: string;
  firstName: string;
  middleName: string;
  hospitalNumber: string;
  dob: string;
  age: string;
  sex: string;
  barangay: string;
  city: string;
}

const NotifiableDiseaseForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isOutsideMakati, setIsOutsideMakati] = useState(false);
  
  const initialCommonData = {
    dateOfAdmission: '',
    disease: '',
    diseaseOther: '',
    area: '',
    areaOther: '',
    outcome: 'Admitted',
    outcomeDate: '',
    reporterName: '',
    designation: '',
    designationOther: '',
    dengueVaccine: '', dengueDose1: '', dengueDoseLast: '', dengueClinicalClass: '',
    iliTravel: '', iliTravelLoc: '', iliVaccine: '', iliVaccineDate: '',
    leptoExposure: '', leptoPlace: '',
    afpPolioVaccine: '',
    hfmdSymptoms: [] as string[], hfmdCommunityCases: '', hfmdExposureType: '',
    measlesSymptoms: [] as string[], measlesVaccine: '', measlesVaccineDate: '', measlesVaccineUnrecalled: false,
    rotaVaccine: '', rotaVaccineDate: '', rotaVaccineUnrecalled: false,
    rabiesRIG: '', rabiesVaccinePrior: '', rabiesVaccineDate: '',
    chikSymptoms: [] as string[], chikTravel: '', chikTravelLoc: '',
    pertVaccine: '', pertVaccineDate: '', pertVaccineUnrecalled: false, pertSymptoms: [] as string[],
    amesSymptoms: [] as string[], amesTravel: '', amesTravelLoc: '',
    amesVaccines: {} as Record<string, { doses: string, lastDate: string }>,
    sariMeds: [] as string[], sariMedsOther: '', sariHouseholdILI: '', sariSchoolILI: '', sariFluVaccine: '', sariAnimalExposure: [] as string[], sariTravel: '', sariTravelLoc: ''
  };

  const [commonData, setCommonData] = useState<any>(initialCommonData);

  const [currentPatient, setCurrentPatient] = useState<PatientData>({
    id: '', lastName: '', firstName: '', middleName: '', hospitalNumber: '',
    dob: '', age: '', sex: '', barangay: '', city: 'Makati'
  });

  const [patientList, setPatientList] = useState<PatientData[]>([]);

  useEffect(() => {
    if (currentPatient.dob) {
      setCurrentPatient(prev => ({ ...prev, age: calculateAge(prev.dob) }));
    }
  }, [currentPatient.dob]);

  const handleMagicFill = () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

    setCurrentPatient({
      id: '', 
      lastName: 'Mercado', 
      firstName: 'Elena', 
      middleName: 'Santos', 
      hospitalNumber: '25-' + Math.floor(Math.random() * 90000 + 10000),
      dob: '2015-03-12', 
      age: '9', 
      sex: 'Female', 
      barangay: 'Guadalupe Nuevo', 
      city: 'Makati'
    });

    setCommonData({
      ...initialCommonData,
      disease: 'Dengue',
      area: 'Pedia Ward',
      dateOfAdmission: fiveDaysAgoStr,
      dengueVaccine: 'No',
      dengueClinicalClass: 'dengue with warning signs',
      reporterName: 'Dr. S. Lim',
      designation: 'Doctor'
    });
    setIsOutsideMakati(false);
  };

  const handleCommonChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setCommonData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxList = (field: string, value: string) => {
    setCommonData((prev: any) => {
      const list = prev[field] || [];
      return {
        ...prev,
        [field]: list.includes(value) ? list.filter((i: string) => i !== value) : [...list, value]
      };
    });
  };

  const handleAmesVaccine = (vaccine: string, field: 'doses' | 'lastDate', value: string) => {
    setCommonData((prev: any) => ({
      ...prev,
      amesVaccines: {
        ...prev.amesVaccines,
        [vaccine]: {
          ...(prev.amesVaccines[vaccine] || { doses: '', lastDate: '' }),
          [field]: value
        }
      }
    }));
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleOutsideMakatiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsOutsideMakati(checked);
    setCurrentPatient((prev) => ({ ...prev, barangay: '', city: checked ? '' : 'Makati' }));
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBrgy = e.target.value;
    let newCity = 'Makati';
    if (EMBO_BARANGAYS.includes(selectedBrgy)) newCity = 'Embo';
    setCurrentPatient((prev) => ({ ...prev, barangay: selectedBrgy, city: newCity }));
  };

  const validatePatientForm = (patient: PatientData) => {
    return patient.lastName && patient.firstName && patient.hospitalNumber && patient.dob;
  };

  const handleAddPatient = () => {
    if (!validatePatientForm(currentPatient)) {
      alert("Please fill in required patient fields.");
      return;
    }
    setPatientList([...patientList, { ...currentPatient, id: Date.now().toString() }]);
    setCurrentPatient({
      id: '', lastName: '', firstName: '', middleName: '', hospitalNumber: '',
      dob: '', age: '', sex: '', barangay: '', city: 'Makati'
    });
    setIsOutsideMakati(false);
  };

  const resetForm = () => {
    setPatientList([]);
    setCurrentPatient({
      id: '', lastName: '', firstName: '', middleName: '', hospitalNumber: '',
      dob: '', age: '', sex: '', barangay: '', city: 'Makati'
    });
    setCommonData(initialCommonData);
    setShowThankYou(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientsToReport = [...patientList];
    if (currentPatient.lastName || currentPatient.firstName || currentPatient.hospitalNumber) {
        if (validatePatientForm(currentPatient)) {
            patientsToReport.push({ ...currentPatient, id: 'temp-form' });
        } else {
            alert("Please complete the current patient fields or click 'Add to Batch' before publishing.");
            return;
        }
    }
    if (patientsToReport.length === 0) { alert("Please add at least one patient."); return; }

    setLoading(true);
    const submissionCommon = { ...commonData };
    if (submissionCommon.disease === 'Other (specify)') submissionCommon.disease = submissionCommon.diseaseOther || 'Other Disease';
    if (submissionCommon.area === 'Other (specify)') submissionCommon.area = submissionCommon.areaOther || 'Other Area';
    
    delete submissionCommon.diseaseOther;
    delete submissionCommon.areaOther;
    delete submissionCommon.designationOther;

    try {
      for (const patient of patientsToReport) {
          const { id: _, ...patientPayload } = patient;
          // Normalizing key to 'notifiable'
          await submitReport("notifiable", { ...submissionCommon, ...patientPayload });
      }
      setShowThankYou(true);
    } catch (err) { 
      const msg = err instanceof Error ? err.message : "Failed to submit.";
      alert(`Submission Failed: ${msg}`); 
    } finally { setLoading(false); }
  };

  return (
    <Layout title="Report Notifiable Disease">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 max-w-5xl mx-auto px-4">
        <button onClick={() => navigate('/')} className="flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors">
          <ChevronLeft size={14} /> Back to Hub
        </button>
        {user === 'Max' && (
          <button 
            type="button" 
            onClick={handleMagicFill}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm"
          >
            <Sparkles size={14} className="text-amber-500" /> Magic Fill (Sample Case)
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-5xl mx-auto px-4 pb-20">
        {patientList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 animate-in fade-in">
                {patientList.map((p) => (
                    <div key={p.id} className="bg-white border-2 border-primary p-3 rounded-xl flex justify-between items-center shadow-md">
                        <div className="truncate">
                            <div className="font-black text-xs text-primary truncate uppercase">{p.lastName}, {p.firstName}</div>
                            <div className="text-[10px] text-gray-400 font-bold">{p.hospitalNumber}</div>
                        </div>
                        <button type="button" onClick={() => setPatientList(patientList.filter(pl => pl.id !== p.id))} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        )}

        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide"><Users size={20} className="text-primary"/> Patient Identification</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Input label="Hospital #" name="hospitalNumber" value={currentPatient.hospitalNumber} onChange={handlePatientChange} required={patientList.length === 0} />
                <Input label="Last Name" name="lastName" value={currentPatient.lastName} onChange={handlePatientChange} required={patientList.length === 0} />
                <Input label="First Name" name="firstName" value={currentPatient.firstName} onChange={handlePatientChange} required={patientList.length === 0} />
                <Input label="Middle Name" name="middleName" value={currentPatient.middleName} onChange={handlePatientChange} />
                <Input label="DOB" name="dob" type="date" value={currentPatient.dob} onChange={handlePatientChange} required={currentPatient.hospitalNumber !== ''} />
                <Input label="Age" name="age" value={currentPatient.age} readOnly className="bg-slate-50 font-bold" />
                <Select label="Sex" name="sex" options={['Male', 'Female']} value={currentPatient.sex} onChange={handlePatientChange} required={currentPatient.hospitalNumber !== ''} />
                <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase cursor-pointer mb-2">
                        <input type="checkbox" checked={isOutsideMakati} onChange={handleOutsideMakatiChange} className="rounded text-primary h-4 w-4"/> Outside Makati?
                    </label>
                </div>
                <div className="md:col-span-2">
                    {!isOutsideMakati ? (
                        <Select label="Barangay" name="barangay" options={BARANGAYS} value={currentPatient.barangay} onChange={handleBarangayChange} required={!isOutsideMakati && currentPatient.hospitalNumber !== ''} />
                    ) : (
                        <Input label="Address (Non-Makati)" name="barangay" value={currentPatient.barangay} onChange={handlePatientChange} />
                    )}
                </div>
                <Input label="City/Province" name="city" value={currentPatient.city} onChange={handlePatientChange} readOnly={!isOutsideMakati} className={!isOutsideMakati ? "bg-slate-50 font-bold" : "bg-white"} required={currentPatient.hospitalNumber !== ''} />
                <div className="flex items-end">
                    <button type="button" onClick={handleAddPatient} className="w-full h-11 border-2 border-primary text-primary rounded-xl font-black uppercase text-[10px] hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                        <Plus size={16} /> Add to Batch
                    </button>
                </div>
            </div>
        </section>
        
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide"><FileText size={20} className="text-primary"/> Epidemiological Data</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                    <Select label="Reporting Disease" name="disease" options={NOTIFIABLE_DISEASES} value={commonData.disease} onChange={handleCommonChange} required />
                    {commonData.disease === "Other (specify)" && <Input label="Specify Disease" name="diseaseOther" value={commonData.diseaseOther} onChange={handleCommonChange} className="mt-2" />}
                </div>
                <div className="lg:col-span-1">
                    <Select label="Assigned Ward" name="area" options={AREAS} value={commonData.area} onChange={handleCommonChange} required />
                    {commonData.area === "Other (specify)" && <Input label="Specify Ward" name="areaOther" value={commonData.areaOther} onChange={handleCommonChange} className="mt-2" />}
                </div>
                <Input label="Admission Date" name="dateOfAdmission" type="date" value={commonData.dateOfAdmission} onChange={handleCommonChange} required />
            </div>

            {commonData.disease === "Dengue" && (
                <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-red-800 uppercase flex items-center gap-2"><Syringe size={16}/> Dengue Specifics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select label="Received dengue vaccine?" name="dengueVaccine" options={DENGUE_VACCINE_OPTIONS} value={commonData.dengueVaccine} onChange={handleCommonChange} />
                        {commonData.dengueVaccine === 'Yes' && (
                            <>
                                <Input label="Date of 1st dose" name="dengueDose1" type="date" value={commonData.dengueDose1} onChange={handleCommonChange} />
                                <Input label="Date of last dose" name="dengueDoseLast" type="date" value={commonData.dengueDoseLast} onChange={handleCommonChange} />
                            </>
                        )}
                        <div className="md:col-span-3">
                            <Select label="Clinical Classification" name="dengueClinicalClass" options={DENGUE_CLINICAL_CLASSES} value={commonData.dengueClinicalClass} onChange={handleCommonChange} />
                        </div>
                    </div>
                </div>
            )}

            {commonData.disease === "Influenza-like Illness" && (
                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-blue-800 uppercase flex items-center gap-2"><Wind size={16}/> ILI Specifics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select label="History of travel within 21 days?" name="iliTravel" options={ILI_TRAVEL_OPTIONS} value={commonData.iliTravel} onChange={handleCommonChange} />
                        {commonData.iliTravel === 'Yes' && <Input label="Where?" name="iliTravelLoc" value={commonData.iliTravelLoc} onChange={handleCommonChange} />}
                        <Select label="Received influenza vaccine?" name="iliVaccine" options={ILI_VACCINE_OPTIONS} value={commonData.iliVaccine} onChange={handleCommonChange} />
                        {commonData.iliVaccine === 'Yes' && <Input label="Date of last dose (MM/YYYY)" name="iliVaccineDate" value={commonData.iliVaccineDate} onChange={handleCommonChange} placeholder="e.g. 10/2024" />}
                    </div>
                </div>
            )}

            {commonData.disease === "Leptospirosis" && (
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2"><Droplets size={16}/> Leptospirosis Specifics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="History of exposure to animal urine" name="leptoExposure" options={LEPTO_EXPOSURE_OPTIONS} value={commonData.leptoExposure} onChange={handleCommonChange} />
                        <Input label="Place of exposure?" name="leptoPlace" value={commonData.leptoPlace} onChange={handleCommonChange} />
                    </div>
                </div>
            )}

            {commonData.disease === "Acute Flaccid Paralysis (Poliomyelitis)" && (
                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-indigo-800 uppercase flex items-center gap-2"><ShieldCheck size={16}/> AFP Specifics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Polio vaccine given?" name="afpPolioVaccine" options={AFP_POLIO_VACCINE_OPTIONS} value={commonData.afpPolioVaccine} onChange={handleCommonChange} />
                    </div>
                </div>
            )}

            {commonData.disease === "Hand, Foot and Mouth Disease" && (
                <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-amber-800 uppercase flex items-center gap-2"><Activity size={16}/> HFMD Specifics</h4>
                    <div>
                        <label className="text-[10px] font-black text-amber-700 uppercase block mb-2">Symptoms (Select all applicable)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {HFMD_SYMPTOMS.map(s => (
                                <button key={s} type="button" onClick={() => handleCheckboxList('hfmdSymptoms', s)} className={`p-2 rounded-lg text-[10px] font-bold text-left border transition-all ${commonData.hfmdSymptoms?.includes(s) ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-amber-100 text-amber-400'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Known cases in community?" name="hfmdCommunityCases" options={HFMD_COMMUNITY_CASES_OPTIONS} value={commonData.hfmdCommunityCases} onChange={handleCommonChange} />
                        <Select label="Exposure?" name="hfmdExposureType" options={HFMD_EXPOSURE_TYPE_OPTIONS} value={commonData.hfmdExposureType} onChange={handleCommonChange} />
                    </div>
                </div>
            )}

            {commonData.disease === "Measles" && (
                <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-orange-800 uppercase flex items-center gap-2"><Thermometer size={16}/> Measles Specifics</h4>
                    <div>
                        <label className="text-[10px] font-black text-orange-700 uppercase block mb-2">Symptoms</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {MEASLES_SYMPTOMS.map(s => (
                                <button key={s} type="button" onClick={() => handleCheckboxList('measlesSymptoms', s)} className={`p-2 rounded-lg text-[10px] font-bold text-left border transition-all ${commonData.measlesSymptoms?.includes(s) ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white border-orange-100 text-orange-400'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Received measles vaccine?" name="measlesVaccine" options={MEASLES_VACCINE_OPTIONS} value={commonData.measlesVaccine} onChange={handleCommonChange} />
                        <div className="flex flex-col gap-2">
                            <Input label="Date of last dose" name="measlesVaccineDate" type="date" value={commonData.measlesVaccineDate} onChange={handleCommonChange} disabled={commonData.measlesVaccineUnrecalled} />
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase cursor-pointer">
                                <input type="checkbox" checked={commonData.measlesVaccineUnrecalled} onChange={(e) => setCommonData({...commonData, measlesVaccineUnrecalled: e.target.checked, measlesVaccineDate: e.target.checked ? '' : commonData.measlesVaccineDate})} /> Unrecalled
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {commonData.disease === "Rotavirus" && (
                <div className="p-6 bg-teal-50/50 rounded-3xl border border-teal-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-teal-800 uppercase flex items-center gap-2"><Droplets size={16}/> Rotavirus Specifics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Received rotavirus vaccine?" name="rotaVaccine" options={ROTA_VACCINE_OPTIONS} value={commonData.rotaVaccine} onChange={handleCommonChange} />
                        <div className="flex flex-col gap-2">
                            <Input label="Date of last dose" name="rotaVaccineDate" type="date" value={commonData.rotaVaccineDate} onChange={handleCommonChange} disabled={commonData.rotaVaccineUnrecalled} />
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase cursor-pointer">
                                <input type="checkbox" checked={commonData.rotaVaccineUnrecalled} onChange={(e) => setCommonData({...commonData, rotaVaccineUnrecalled: e.target.checked, rotaVaccineDate: e.target.checked ? '' : commonData.rotaVaccineDate})} /> Unrecalled
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {commonData.disease === "Rabies" && (
                <div className="p-6 bg-slate-900 rounded-3xl border border-slate-700 text-white flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-emerald-400 uppercase flex items-center gap-2"><Dog size={16}/> Rabies Exposure History</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select label="Received rabies immunoglobulin?" name="rabiesRIG" options={RABIES_RIG_OPTIONS} value={commonData.rabiesRIG} onChange={handleCommonChange} />
                        <Select label="Completed rabies vaccine prior?" name="rabiesVaccinePrior" options={RABIES_VACCINE_PRIOR_OPTIONS} value={commonData.rabiesVaccinePrior} onChange={handleCommonChange} />
                        {commonData.rabiesVaccinePrior === 'Yes' && <Input label="Date (MM/YYYY) of 1st dose" name="rabiesVaccineDate" value={commonData.rabiesVaccineDate} onChange={handleCommonChange} placeholder="e.g. 05/2023" />}
                    </div>
                </div>
            )}

            {commonData.disease === "Chikungunya Viral Disease" && (
                <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-rose-800 uppercase flex items-center gap-2"><Activity size={16}/> Chikungunya Specifics</h4>
                    <div>
                        <label className="text-[10px] font-black text-rose-700 uppercase block mb-2">Symptoms (Select all applicable)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {CHIKUNGUNYA_SYMPTOMS.map(s => (
                                <button key={s} type="button" onClick={() => handleCheckboxList('chikSymptoms', s)} className={`p-2 rounded-lg text-[10px] font-bold text-left border transition-all ${commonData.chikSymptoms?.includes(s) ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-white border-rose-100 text-amber-400'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Travel within 30 days?" name="chikTravel" options={CHIKUNGUNYA_TRAVEL_OPTIONS} value={commonData.chikTravel} onChange={handleCommonChange} />
                        {commonData.chikTravel === 'Yes' && <Input label="Specify travel location" name="chikTravelLoc" value={commonData.chikTravelLoc} onChange={handleCommonChange} />}
                    </div>
                </div>
            )}

            {commonData.disease === "Pertussis" && (
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2"><Wind size={16}/> Pertussis Specifics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Received Pertussis containing vaccine?" name="pertVaccine" options={PERTUSSIS_VACCINE_OPTIONS} value={commonData.pertVaccine} onChange={handleCommonChange} />
                        <div className="flex flex-col gap-2">
                            <Input label="Date of last dose" name="pertVaccineDate" type="date" value={commonData.pertVaccineDate} onChange={handleCommonChange} disabled={commonData.pertVaccineUnrecalled} />
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase cursor-pointer">
                                <input type="checkbox" checked={commonData.pertVaccineUnrecalled} onChange={(e) => setCommonData({...commonData, pertVaccineUnrecalled: e.target.checked, pertVaccineDate: e.target.checked ? '' : commonData.pertVaccineDate})} /> Unrecalled
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-700 uppercase block mb-2">Symptoms (Select all applicable)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {PERTUSSIS_SYMPTOMS.map(s => (
                                <button key={s} type="button" onClick={() => handleCheckboxList('pertSymptoms', s)} className={`p-2 rounded-lg text-[10px] font-bold text-left border transition-all ${commonData.pertSymptoms?.includes(s) ? 'bg-slate-600 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {commonData.disease === "Bacterial Meningitis" && (
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col gap-6 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-indigo-800 uppercase flex items-center gap-2"><ShieldCheck size={16}/> AMES / Meningitis Data</h4>
                    <div>
                        <label className="text-[10px] font-black text-indigo-700 uppercase block mb-2">Clinical Presentation</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {AMES_SYMPTOMS.map(s => (
                                <button key={s} type="button" onClick={() => handleCheckboxList('amesSymptoms', s)} className={`p-2 rounded-lg text-[10px] font-bold text-left border transition-all ${commonData.amesSymptoms?.includes(s) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-indigo-100 text-indigo-400'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Travel?" name="amesTravel" options={AMES_TRAVEL_OPTIONS} value={commonData.amesTravel} onChange={handleCommonChange} />
                        {commonData.amesTravel === 'Yes' && <Input label="Where?" name="amesTravelLoc" value={commonData.amesTravelLoc} onChange={handleCommonChange} />}
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-indigo-50">
                        <label className="text-[10px] font-black text-indigo-700 uppercase block mb-3 flex items-center gap-2"><ClipboardList size={14}/> Vaccination History Grid</label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {AMES_VACCINES_LIST.map(v => (
                                <div key={v} className="flex flex-col gap-2 p-3 bg-indigo-50/30 rounded-xl">
                                    <span className="text-[10px] font-black text-slate-600">{v}</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input label="# Doses" value={commonData.amesVaccines[v]?.doses || ''} onChange={e => handleAmesVaccine(v, 'doses', e.target.value)} />
                                        <Input label="Last Dose Date" type="date" value={commonData.amesVaccines[v]?.lastDate || ''} onChange={e => handleAmesVaccine(v, 'lastDate', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {commonData.disease === "Severe Acute Respiratory Syndrome" && (
                <div className="p-6 bg-cyan-50 rounded-3xl border border-cyan-100 flex flex-col gap-6 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-cyan-800 uppercase flex items-center gap-2"><Wind size={16}/> SARI Clinical Context</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-cyan-700 uppercase">Prior Medications</label>
                            <div className="grid grid-cols-2 gap-2">
                                {SARI_MEDICATIONS.map(m => (
                                    <button key={m} type="button" onClick={() => handleCheckboxList('sariMeds', m)} className={`p-2 rounded-lg text-[10px] font-bold border transition-all text-left ${commonData.sariMeds?.includes(m) ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-cyan-100 text-cyan-500'}`}>{m}</button>
                                ))}
                            </div>
                            <Input label="Others (specify)" name="sariMedsOther" value={commonData.sariMedsOther} onChange={handleCommonChange} />
                        </div>
                        <div className="flex flex-col gap-4">
                            <Select label="ILI during the week in Household?" name="sariHouseholdILI" options={SARI_HOUSEHOLD_ILI_OPTIONS} value={commonData.sariHouseholdILI} onChange={handleCommonChange} />
                            <Select label="ILI during the week in School/Daycare?" name="sariSchoolILI" options={SARI_SCHOOL_ILI_OPTIONS} value={commonData.sariSchoolILI} onChange={handleCommonChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select label="Received Anti-influenza Vaccination?" name="sariFluVaccine" options={SARI_FLU_VACCINE_OPTIONS} value={commonData.sariFluVaccine} onChange={handleCommonChange} />
                        <Select label="History of travel?" name="sariTravel" options={SARI_TRAVEL_OPTIONS} value={commonData.sariTravel} onChange={handleCommonChange} />
                        {commonData.sariTravel === 'Yes' && <Input label="Destination" name="sariTravelLoc" value={commonData.sariTravelLoc} onChange={handleCommonChange} />}
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-cyan-700 uppercase block mb-2">History of exposure to any of the following:</label>
                        <div className="flex flex-wrap gap-2">
                            {SARI_ANIMAL_EXPOSURE_OPTIONS.map(a => (
                                <button key={a} type="button" onClick={() => handleCheckboxList('sariAnimalExposure', a)} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${commonData.sariAnimalExposure?.includes(a) ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-cyan-100 text-cyan-500'}`}>{a}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <Select label="Patient Disposition" name="outcome" options={PATIENT_OUTCOMES} value={commonData.outcome} onChange={handleCommonChange} />
                {commonData.outcome !== "Admitted" && commonData.outcome !== "ER-level" && (
                    <Input label="Disposition Date" name="outcomeDate" type="date" value={commonData.outcomeDate} onChange={handleCommonChange} required />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-100 pt-6">
                <Input label="Name of Reporter" name="reporterName" value={commonData.reporterName} onChange={handleCommonChange} required />
                <Select label="Reporter Designation" name="designation" options={['Doctor', 'Nurse', 'IPC Staff', 'Lab Staff', 'Other']} value={commonData.designation} onChange={handleCommonChange} required />
                <div className="flex items-end">
                    <button type="submit" disabled={loading} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-osmak-green-dark transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                        {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />} Publish Report(s)
                    </button>
                </div>
            </div>
        </section>
      </form>

      <ThankYouModal 
        show={showThankYou} 
        reporterName={commonData.reporterName} 
        moduleName="Notifiable Diseases Registry" 
        onClose={resetForm} 
      />
    </Layout>
  );
};

export default NotifiableDiseaseForm;