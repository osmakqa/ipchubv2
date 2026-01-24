import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  setDoc, 
  serverTimestamp, 
  limit, 
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";

const firebaseConfig = {
  apiKey: "AIzaSyCz7tbHcUFqnx91hwxvSTXDC2upAUrq_fo",
  authDomain: "ipchub.firebaseapp.com",
  projectId: "ipchub",
  storageBucket: "ipchub.firebasestorage.app",
  messagingSenderId: "253750170956",
  appId: "1:253750170956:web:b36ffecf38942bc3b0ebe9",
  measurementId: "G-XSXRBK1P2B"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzsMbAKmXiIcn1vbVM8E5M20xNXU2bIH7zOMVvwmOCoPIqr3QNyMjaHWwLbzc70-riQ/exec"; 

export const TYPE_TO_COLLECTION: Record<string, string> = {
  'hai': 'reports_hai',
  'notifiable': 'reports_notifiable',
  'needlestick': 'reports_needlestick',
  'isolation': 'reports_isolation',
  'tb': 'reports_tb',
  'ntp': 'reports_ntp',
  'culture': 'reports_culture'
};

const toTitleCase = (str: string) => {
  if (!str) return str;
  return str.trim().split(/\s+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const sanitizeData = (data: any) => {
  const sanitized = { ...data };
  const nameFields = ['lastName', 'firstName', 'middleName', 'reporterName', 'hcwName', 'organism', 'patientName', 'referredBy'];
  
  if (sanitized.id) delete sanitized.id;

  for (const key in sanitized) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === "") {
        sanitized[key] = null;
      } else if (nameFields.includes(key)) {
        sanitized[key] = toTitleCase(trimmed);
      } else {
        sanitized[key] = trimmed;
      }
    }
  }
  return sanitized;
};

const snapshotToArray = (snapshot: any) => {
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Helper to safely stringify objects that might contain circular references (like Firestore refs)
const safeStringify = (obj: any) => {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return;
      cache.add(value);
    }
    // Convert Timestamps to ISO strings for the AI
    if (value && typeof value.toDate === 'function') {
      return value.toDate().toISOString();
    }
    return value;
  });
};

export const subscribeToReports = (collectionName: string, status: string, callback: (data: any[]) => void) => {
  const q = query(
    collection(db, collectionName), 
    where('validationStatus', '==', status)
  );

  return onSnapshot(q, (snapshot) => {
    const results = snapshotToArray(snapshot);
    const sorted = results.sort((a, b) => {
      const dateA = a.created_at?.toDate?.() || new Date(0);
      const dateB = b.created_at?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    callback(sorted);
  });
};

export const getReportsByStatus = async (collectionName: string, status: string = 'validated') => {
  try {
    const q = query(
      collection(db, collectionName), 
      where('validationStatus', '==', status)
    );
    const snapshot = await getDocs(q);
    const results = snapshotToArray(snapshot);
    
    return results.sort((a, b) => {
      const dateA = a.created_at?.toDate?.() || new Date(0);
      const dateB = b.created_at?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
};

export const getHAIReports = () => getReportsByStatus('reports_hai');
export const getNotifiableReports = () => getReportsByStatus('reports_notifiable');
export const getNeedlestickReports = () => getReportsByStatus('reports_needlestick');
export const getIsolationReports = () => getReportsByStatus('reports_isolation');
export const getTBReports = () => getReportsByStatus('reports_tb');
export const getNTPReports = () => getReportsByStatus('reports_ntp');
export const getCultureReports = () => getReportsByStatus('reports_culture');

export const getCensusLogs = async () => {
  const q = query(collection(db, 'census_logs'), orderBy('date', 'desc'), limit(100));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
};

export const getActionPlans = async () => {
  const q = query(collection(db, 'action_plans'), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
};

export const getHandHygieneAudits = async () => {
  const q = query(collection(db, 'audit_hand_hygiene'), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
};

export const getBundleAudits = async () => {
  const q = query(collection(db, 'audit_bundles'), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
};

export const getAreaAudits = async () => {
  const q = query(collection(db, 'audit_area'), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
};

export const getAuditSchedules = async () => {
  const q = query(collection(db, 'audit_schedules'), orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
};

export const submitReport = async (formType: string, data: any): Promise<boolean> => {
  const typeKey = formType.toLowerCase().split(' ')[0];
  const collectionName = TYPE_TO_COLLECTION[typeKey] || TYPE_TO_COLLECTION[formType.toLowerCase()];
  
  if (!collectionName) throw new Error(`Invalid form type: ${formType}`);
  
  const sanitizedData = sanitizeData(data);
  const entry = { 
    ...sanitizedData, 
    dateReported: data.date || new Date().toISOString().split('T')[0], 
    validationStatus: 'pending',
    created_at: serverTimestamp()
  };
  
  try {
    await addDoc(collection(db, collectionName), entry);
    return true;
  } catch (error) {
    console.error("Submission error:", error);
    throw new Error("Submission Failed. Check database connection.");
  }
};

export const submitCensusLog = async (data: any) => {
  const sanitized = sanitizeData(data);
  const docRef = doc(db, 'census_logs', data.date);
  try {
    await setDoc(docRef, { ...sanitized, created_at: serverTimestamp() }, { merge: true });
    return true;
  } catch (e) { return false; }
};

export const submitHHAudit = async (data: any) => {
  const sanitized = sanitizeData(data);
  try {
    await addDoc(collection(db, 'audit_hand_hygiene'), { ...sanitized, created_at: serverTimestamp() });
    return true;
  } catch (e) { return false; }
};

export const submitBundleAudit = async (data: any) => {
  const sanitized = sanitizeData(data);
  try {
    await addDoc(collection(db, 'audit_bundles'), { ...sanitized, created_at: serverTimestamp() });
    return true;
  } catch (e) { return false; }
};

export const submitAreaAudit = async (data: any) => {
  const sanitized = sanitizeData(data);
  try {
    await addDoc(collection(db, 'audit_area'), { ...sanitized, created_at: serverTimestamp() });
    return true;
  } catch (e) { return false; }
};

export const submitActionPlan = async (data: any) => {
  const sanitized = sanitizeData(data);
  try {
    await addDoc(collection(db, 'action_plans'), { ...sanitized, status: 'pending', created_at: serverTimestamp() });
    return true;
  } catch (e) { return false; }
};

export const updateActionPlanStatus = async (id: string, status: string) => {
  const docRef = doc(db, 'action_plans', id);
  try {
    await updateDoc(docRef, { status });
    return true;
  } catch (e) { return false; }
};

export const submitAuditSchedule = async (data: any) => {
  const sanitized = sanitizeData(data);
  try {
    await addDoc(collection(db, 'audit_schedules'), { ...sanitized, created_at: serverTimestamp() });
    return true;
  } catch (e) { return false; }
};

export const getPendingReports = async () => {
  try {
    const results = await Promise.all([
      getReportsByStatus('reports_hai', 'pending'),
      getReportsByStatus('reports_notifiable', 'pending'),
      getReportsByStatus('reports_needlestick', 'pending'),
      getReportsByStatus('reports_isolation', 'pending'),
      getReportsByStatus('reports_tb', 'pending'),
      getReportsByStatus('reports_ntp', 'pending'),
      getReportsByStatus('reports_culture', 'pending')
    ]);

    return {
      hai: results[0],
      notifiable: results[1],
      needlestick: results[2],
      isolation: results[3],
      tb: results[4],
      ntp: results[5],
      culture: results[6]
    };
  } catch (error) {
    console.error("Error fetching pending reports:", error);
    return { hai: [], notifiable: [], needlestick: [], isolation: [], tb: [], ntp: [], culture: [] };
  }
};

export const validateReport = async (type: string, id: string, coordinator: string, updatedData?: any) => {
  const collectionName = TYPE_TO_COLLECTION[type] || type;
  const sanitized = sanitizeData(updatedData || {});
  const entry = { ...sanitized, validationStatus: 'validated', validatedBy: coordinator };

  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, entry);
    return true;
  } catch (error) {
    throw new Error(`Validation Failed: ${error}`);
  }
};

const updateGenericRecord = async (collectionName: string, data: any) => {
  const { id, ...rest } = data;
  if (!id) return false;
  const sanitized = sanitizeData(rest);
  const docRef = doc(db, collectionName, id);
  try {
    await updateDoc(docRef, sanitized);
    return true;
  } catch (e) { 
    console.error(`Update failed for ${collectionName}:`, e);
    return false; 
  }
};

export const updateHAIReport = (data: any) => updateGenericRecord('reports_hai', data);
export const updateNotifiableReport = (data: any) => updateGenericRecord('reports_notifiable', data);
export const updateNeedlestickReport = (data: any) => updateGenericRecord('reports_needlestick', data);
export const updateIsolationReport = (data: any) => updateGenericRecord('reports_isolation', data);
export const updateTBReport = (data: any) => updateGenericRecord('reports_tb', data);
export const updateNTPReport = (data: any) => updateGenericRecord('reports_ntp', data);
export const updateCultureReport = (data: any) => updateGenericRecord('reports_culture', data);

export const updateHHAudit = (data: any) => updateGenericRecord('audit_hand_hygiene', data);
export const updateAreaAudit = (data: any) => updateGenericRecord('audit_area', data);
export const updateBundleAudit = (data: any) => updateGenericRecord('audit_bundles', data);
export const updateCensusLog = async (data: any) => {
    const { date, ...rest } = data;
    if (!date) return false;
    const sanitized = sanitizeData(rest);
    const docRef = doc(db, 'census_logs', date);
    try {
        await updateDoc(docRef, sanitized);
        return true;
    } catch (e) { return false; }
};

export const deleteRecord = async (collectionName: string, id: string) => {
  if (!id) return false;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) { 
    console.error(`Delete failed for ${collectionName}:`, error);
    return false; 
  }
};

export const deletePendingReport = (type: string, id: string) => {
  const collectionName = TYPE_TO_COLLECTION[type] || type;
  return deleteRecord(collectionName, id);
};

export const deleteAuditSchedule = (id: string) => deleteRecord('audit_schedules', id);
export const deleteCensusLog = (date: string) => deleteRecord('census_logs', date);

export const calculateAge = (dobString: string): string => {
  if (!dobString) return "";
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
  return age.toString();
};

export const calculateInfectionRates = (logs: any[], infections: any[]) => {
  const initStats = () => ({
    hap: 0, vap: 0, cauti: 0, clabsi: 0, overall: 0,
    patientDays: 0, ventDays: 0, ifcDays: 0, centralDays: 0,
    counts: { hap: 0, vap: 0, cauti: 0, clabsi: 0 }
  });

  const stats: any = {
    overall: initStats(),
    icu: initStats(),
    picu: initStats(),
    nicu: initStats(),
    medicine: initStats(),
    cohort: initStats()
  };

  logs.forEach(log => {
    stats.overall.patientDays += Number(log.overall || 0);
    stats.overall.ventDays += Number(log.overallVent || 0);
    stats.overall.ifcDays += Number(log.overallIfc || 0);
    stats.overall.centralDays += Number(log.overallCentral || 0);

    const wardMap: Record<string, string> = { icu: 'icu', picu: 'picu', nicu: 'nicu', medicine: 'med', cohort: 'cohort' };
    Object.keys(wardMap).forEach(key => {
      const prefix = wardMap[key];
      stats[key].patientDays += Number(log[key] || 0);
      stats[key].ventDays += Number(log[prefix + 'Vent'] || 0);
      stats[key].ifcDays += Number(log[prefix + 'Ifc'] || 0);
      stats[key].centralDays += Number(log[prefix + 'Central'] || 0);
    });
  });

  infections.forEach(inf => {
    const type = inf.haiType;
    const area = (inf.area || '').toLowerCase();
    
    let typeKey: 'hap' | 'vap' | 'cauti' | 'clabsi' | null = null;
    if (type === 'Healthcare-Associated Pneumonia') typeKey = 'hap';
    else if (type === 'Ventilator Associated Pneumonia') typeKey = 'vap';
    else if (type === 'Catheter-Associated UTI') typeKey = 'cauti';
    else if (type === 'Catheter-Related Blood Stream Infections') typeKey = 'clabsi';

    if (typeKey) {
      stats.overall.counts[typeKey]++;
      
      let wardKey = '';
      if (area.includes('icu') && !area.includes('pedia') && !area.includes('nicu')) wardKey = 'icu';
      else if (area.includes('picu') || area.includes('pedia icu')) wardKey = 'picu';
      else if (area.includes('nicu')) wardKey = 'nicu';
      else if (area.includes('medicine')) wardKey = 'medicine';
      else if (area.includes('cohort')) wardKey = 'cohort';

      if (wardKey && stats[wardKey]) {
        stats[wardKey].counts[typeKey]++;
      }
    }
  });

  const finalize = (s: any) => {
    s.hap = s.patientDays > 0 ? Number(((s.counts.hap / s.patientDays) * 1000).toFixed(2)) : 0;
    s.vap = s.ventDays > 0 ? Number(((s.counts.vap / s.ventDays) * 1000).toFixed(2)) : 0;
    s.cauti = s.ifcDays > 0 ? Number(((s.counts.cauti / s.ifcDays) * 1000).toFixed(2)) : 0;
    s.clabsi = s.centralDays > 0 ? Number(((s.counts.clabsi / s.centralDays) * 1000).toFixed(2)) : 0;
    
    const totalInfs = s.counts.hap + s.counts.vap + s.counts.cauti + s.counts.clabsi;
    s.overall = s.patientDays > 0 ? Number(((totalInfs / s.patientDays) * 1000).toFixed(2)) : 0;
  };

  Object.values(stats).forEach(finalize);
  return stats;
};

const handleAIRequest = async (request: () => Promise<any>) => {
  try {
    return await request();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.message?.includes("Requested entity was not found.")) {
      if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
        (window as any).aistudio.openSelectKey();
      }
    }
    throw error;
  }
};

export const generateExecutiveBriefing = async (dataSnapshot: any): Promise<any> => {
  return handleAIRequest(async () => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      // Fix: Use safeStringify to prevent circular structure errors
      contents: `Perform an expert epidemiological analysis on this hospital data: ${safeStringify(dataSnapshot)}. 
      Return a strategic executive briefing with a status summary, risk assessment, and 3 specific actionable recommendations.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "One of: STABLE, VIGILANT, CRITICAL" },
            summary: { type: Type.STRING },
            riskLevel: { type: Type.NUMBER, description: "1 to 10 scale" },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          propertyOrdering: ["status", "summary", "riskLevel", "recommendations"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }).catch(() => ({ 
    status: "VIGILANT", 
    summary: "Data analysis incomplete. Maintain standard precautions.", 
    riskLevel: 5, 
    recommendations: ["Review recent entries manually", "Maintain vigilance"] 
  }));
};

export const queryIPCAssistant = async (queryStr: string, history: any[]): Promise<string> => {
  return handleAIRequest(async () => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are an expert Infection Prevention and Control Assistant for Ospital ng Makati (OsMak). Provide clinical guidance based on WHO, DOH, and OsMak protocols."
      },
      history: history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }]
      }))
    });
    
    const response = await chat.sendMessage({ message: queryStr });
    return response.text || "Processing...";
  }).catch((error) => {
    console.error("AI Advisor Error:", error);
    return "Advisor currently unavailable.";
  });
};

export const extractTBResultData = async (base64Image: string): Promise<any> => {
  return handleAIRequest(async () => {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Extract TB laboratory result details from this image. Return a JSON object with: patientName (Last, First), hospitalNumber (format 25-XXXXX), testType ('GeneXpert' or 'Smear'), resultValue (e.g. 'MTB Detected; Rif Res', 'Negative', '1+', etc.), and testDate (YYYY-MM-DD)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientName: { type: Type.STRING },
            hospitalNumber: { type: Type.STRING },
            testType: { type: Type.STRING },
            resultValue: { type: Type.STRING },
            testDate: { type: Type.STRING }
          },
          required: ["patientName", "testType", "resultValue", "testDate"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
};

export const updateTBPatientWithResult = async (patientId: string, resultData: any): Promise<boolean> => {
  const docRef = doc(db, 'reports_tb', patientId);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    
    const currentData = docSnap.data();
    const newEntry = {
      date: resultData.testDate,
      specimen: resultData.specimen || 'Sputum',
      result: resultData.resultValue
    };

    const update: any = {};
    if (resultData.testType === 'GeneXpert') {
      update.xpertResults = [...(currentData.xpertResults || []), newEntry];
    } else {
      update.smearResults = [...(currentData.smearResults || []), newEntry];
    }

    const isPositive = !resultData.resultValue.toLowerCase().includes('not detected') && 
                       !resultData.resultValue.toLowerCase().includes('negative');
    
    if (isPositive) {
      update.classification = 'Bacteriological Confirmed';
    }

    await updateDoc(docRef, update);
    return true;
  } catch (error) {
    console.error("Error updating TB result:", error);
    return false;
  }
};