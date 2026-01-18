// Fix: Ensure modular import for initializeApp and other firestore methods
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
  onSnapshot
} from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";

/**
 * OsMak IPC Hub Firebase Configuration
 */
const firebaseConfig = {
  apiKey: "AIzaSyCz7tbHcUFqnx91hwxvSTXDC2upAUrq_fo",
  authDomain: "ipchub.firebaseapp.com",
  projectId: "ipchub",
  storageBucket: "ipchub.firebasestorage.app",
  messagingSenderId: "253750170956",
  appId: "1:253750170956:web:b36ffecf38942bc3b0ebe9",
  measurementId: "G-XSXRBK1P2B"
};

// Fix: Initialize Firebase app using the named export from the modular SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- GOOGLE APPS SCRIPT CONFIG ---
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzsMbAKmXiIcn1vbVM8E5M20xNXU2bIH7zOMVvwmOCoPIqr3QNyMjaHWwLbzc70-riQ/exec"; 

// --- COLLECTION MAPPING ---
// normalized keys to ensure consistent routing between forms and dashboards
export const TYPE_TO_COLLECTION: Record<string, string> = {
  'hai': 'reports_hai',
  'notifiable': 'reports_notifiable',
  'needlestick': 'reports_needlestick',
  'isolation': 'reports_isolation',
  'tb': 'reports_tb',
  'culture': 'reports_culture'
};

// --- UTILS ---

const toTitleCase = (str: string) => {
  if (!str) return str;
  return str.trim().split(/\s+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const sanitizeData = (data: any) => {
  const sanitized = { ...data };
  const nameFields = ['lastName', 'firstName', 'middleName', 'reporterName', 'hcwName', 'organism', 'patientName'];
  
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

// --- REAL-TIME SUBSCRIPTIONS ---

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

// --- CORE DATA ACCESSORS ---

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
export const getCultureReports = () => getReportsByStatus('reports_culture');

export const getCensusLogs = async () => {
  const q = query(collection(db, 'census_logs'), orderBy('date', 'desc'), limit(31));
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

// --- SUBMISSIONS ---

export const submitReport = async (formType: string, data: any): Promise<boolean> => {
  // Normalizing formType to lowercase and checking for common variations (e.g., "HAI Case" -> "hai")
  const typeKey = formType.toLowerCase().split(' ')[0];
  const collectionName = TYPE_TO_COLLECTION[typeKey] || TYPE_TO_COLLECTION[formType.toLowerCase()];
  
  if (!collectionName) throw new Error(`Invalid form type: ${formType}`);
  
  const sanitizedData = sanitizeData(data);
  const entry = { 
    ...sanitizedData, 
    dateReported: new Date().toISOString().split('T')[0], 
    validationStatus: 'pending',
    created_at: serverTimestamp()
  };
  
  try {
    await addDoc(collection(db, collectionName), entry);
    console.debug(`Successfully saved entry to ${collectionName}`);
    return true;
  } catch (error) {
    console.error("Submission error:", error);
    throw new Error("Submission Failed. Check your database connection.");
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

// --- VALIDATION WORKFLOW ---

export const getPendingReports = async () => {
  try {
    const results = await Promise.all([
      getReportsByStatus('reports_hai', 'pending'),
      getReportsByStatus('reports_notifiable', 'pending'),
      getReportsByStatus('reports_needlestick', 'pending'),
      getReportsByStatus('reports_isolation', 'pending'),
      getReportsByStatus('reports_tb', 'pending'),
      getReportsByStatus('reports_culture', 'pending')
    ]);

    return {
      hai: results[0],
      notifiable: results[1],
      needlestick: results[2],
      isolation: results[3],
      tb: results[4],
      culture: results[5]
    };
  } catch (error) {
    console.error("Error fetching pending reports:", error);
    return { hai: [], notifiable: [], needlestick: [], isolation: [], tb: [], culture: [] };
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

// --- UPDATE HANDLERS ---

const updateGenericReport = async (collectionName: string, data: any) => {
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

export const updateHAIReport = (data: any) => updateGenericReport('reports_hai', data);
export const updateNotifiableReport = (data: any) => updateGenericReport('reports_notifiable', data);
export const updateNeedlestickReport = (data: any) => updateGenericReport('reports_needlestick', data);
export const updateIsolationReport = (data: any) => updateGenericReport('reports_isolation', data);
export const updateTBReport = (data: any) => updateGenericReport('reports_tb', data);
export const updateCultureReport = (data: any) => updateGenericReport('reports_culture', data);

// --- DELETION ---

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

// --- SHEET SYNC ---

export const syncToGoogleSheets = async (data: any) => {
  if (!APPS_SCRIPT_WEB_APP_URL) {
    console.warn("Sheet Sync skipped: No Web App URL configured in ipcService.ts");
    return true; 
  }

  try {
    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record: data,
        sheetName: data.module ? `Push_${data.module}` : 'App_Push_Log'
      })
    });
    return true;
  } catch (error) {
    console.error("Sync to Sheets failed:", error);
    return false;
  }
};

// --- CALCULATION LOGIC ---

export const calculateInfectionRates = (censusLogs: any[], infections: any[]) => {
  const sum = (arr: any[], key: string) => arr.reduce((a, b) => a + (Number(b[key]) || 0), 0);
  const count = (type: string, area?: string) => 
    infections.filter(inf => inf.haiType === type && (area ? inf.area === area : true)).length;

  const getRatesForArea = (areaLabel: string, areaKeyPrefix: string) => {
    const patientDays = areaLabel === "Overall" ? sum(censusLogs, 'overall') : sum(censusLogs, areaKeyPrefix);
    const ventDays = (areaLabel === "Overall" ? sum(censusLogs, 'overallVent') : sum(censusLogs, `${areaKeyPrefix}Vent`)) || 1;
    const ifcDays = (areaLabel === "Overall" ? sum(censusLogs, 'overallIfc') : sum(censusLogs, `${areaKeyPrefix}Ifc`)) || 1;
    const centralDays = (areaLabel === "Overall" ? sum(censusLogs, 'overallCentral') : sum(censusLogs, `${areaKeyPrefix}Central`)) || 1;
    const pDays = patientDays || 1;

    const vap = count("Ventilator Associated Pneumonia", areaLabel === "Overall" ? undefined : areaLabel);
    const hap = count("Healthcare-Associated Pneumonia", areaLabel === "Overall" ? undefined : areaLabel);
    const cauti = count("Catheter-Associated UTI", areaLabel === "Overall" ? undefined : areaLabel);
    const clabsi = count("Catheter-Related Blood Stream Infections", areaLabel === "Overall" ? undefined : areaLabel);

    return {
      overall: parseFloat(((vap + hap + cauti + clabsi) / pDays * 1000).toFixed(2)),
      vap: parseFloat((vap / ventDays * 1000).toFixed(2)),
      hap: parseFloat((hap / pDays * 1000).toFixed(2)),
      cauti: parseFloat((cauti / ifcDays * 1000).toFixed(2)),
      clabsi: parseFloat((clabsi / centralDays * 1000).toFixed(2))
    };
  };

  return {
    overall: getRatesForArea("Overall", "overall"),
    icu: getRatesForArea("ICU", "icu"),
    picu: getRatesForArea("PICU", "picu"),
    nicu: getRatesForArea("NICU", "nicu"),
    medicine: getRatesForArea("Medicine Ward", "medicine"),
    cohort: getRatesForArea("Cohort", "cohort")
  };
};

export const calculateAge = (dobString: string): string => {
  if (!dobString) return "";
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
  return age.toString();
};

// --- AI SERVICES ---

// Robust API error handling helper
const handleAIRequest = async (request: () => Promise<any>) => {
  try {
    return await request();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.message?.includes("Requested entity was not found.")) {
      // Prompt user to select paid API key if entity not found
      if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
        (window as any).aistudio.openSelectKey();
      }
    }
    throw error;
  }
};

export const generateExecutiveBriefing = async (dataSnapshot: any): Promise<any> => {
  return handleAIRequest(async () => {
    // Fix: Instantiate GoogleGenAI exactly as per guidelines inside call right before API request (no extra spaces in config object)
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform an expert epidemiological analysis on this hospital data: ${JSON.stringify(dataSnapshot)}. 
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
          required: ["status", "summary", "riskLevel", "recommendations"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }).catch(() => ({ 
    status: "VIGILANT", 
    summary: "Data analysis incomplete. Maintain standard precautions.", 
    riskLevel: 5, 
    recommendations: ["Review recent HAI entries manually", "Check hand hygiene supply chain"] 
  }));
};

export const extractPatientInfoFromImage = async (base64Image: string): Promise<any> => {
  return handleAIRequest(async () => {
    // Fix: Instantiate GoogleGenAI exactly as per guidelines inside call (no extra spaces in config object)
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const cleanBase64 = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { 
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }, 
          { text: "Extract clinical patient identification info from this image. Focus on hospital number, name, DOB, and sex." }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lastName: { type: Type.STRING },
            firstName: { type: Type.STRING },
            middleName: { type: Type.STRING },
            hospitalNumber: { type: Type.STRING },
            dob: { type: Type.STRING, description: "YYYY-MM-DD" },
            sex: { type: Type.STRING, description: "Male or Female" }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }).catch(() => null);
};

export const extractCombinedCultureReport = async (base64Image: string): Promise<any> => {
  return handleAIRequest(async () => {
    // Fix: Instantiate GoogleGenAI exactly as per guidelines inside call (no extra spaces in config object)
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const cleanBase64 = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { 
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }, 
          { text: "Extract all culture and sensitivity results from this lab report image." }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lastName: { type: Type.STRING },
            firstName: { type: Type.STRING },
            hospitalNumber: { type: Type.STRING },
            organism: { type: Type.STRING },
            specimen: { type: Type.STRING },
            antibiotics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  mic: { type: Type.STRING },
                  interpretation: { type: Type.STRING, description: "One of: S, I, R" }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }).catch(() => null);
};

export const queryIPCAssistant = async (queryStr: string, history: any[]): Promise<string> => {
  return handleAIRequest(async () => {
    // Fix: Instantiate GoogleGenAI exactly as per guidelines inside call (no extra spaces in config object)
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are an expert Infection Prevention and Control Assistant for Ospital ng Makati (OsMak). Provide clinical guidance based on WHO, DOH, and OsMak protocols. Keep answers professional and evidence-based."
      },
      history: history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }]
      }))
    });
    
    const response = await chat.sendMessage({ message: queryStr });
    return response.text || "Advisor is processing...";
  }).catch((error) => {
    console.error("AI Advisor Error:", error);
    return "Advisor currently unavailable.";
  });
};