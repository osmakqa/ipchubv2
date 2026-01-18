# Google Sheets Sync Integration Guide

This guide provides the necessary code to sync your OsMak IPC Hub Firestore data directly into a Google Sheet. It covers all surveillance registries and quality audit logs.

## Step 1: Manifest Configuration (`appsscript.json`)

In the Apps Script editor, go to **Project Settings** (gear icon) and check **"Show 'appsscript.json' manifest file in editor"**. Open the file and replace its contents with this:

```json
{
  "timeZone": "Asia/Manila",
  "dependencies": {
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/datastore"
  ]
}
```

## Step 2: The Sync Script (`Code.gs`)

Paste this into your `Code.gs` file. Replace `'ipchub'` with your actual Firebase Project ID if different.

```javascript
/**
 * OsMak IPC Hub - Full Data Sync Script
 * Organization: Ospital ng Makati
 */

const PROJECT_ID = 'ipchub'; 

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛡️ OsMak IPC Sync')
    .addItem('🔄 Sync ALL Data (Surveillance + Audits)', 'syncAllFirestoreData')
    .addSeparator()
    .addSubMenu(ui.createMenu('📋 Surveillance Registries')
      .addItem('📊 Sync HAI Registry', 'syncHAI')
      .addItem('🔔 Sync Notifiable Diseases', 'syncNotifiable')
      .addItem('🫁 Sync TB Registry', 'syncTB')
      .addItem('🛡️ Sync Isolation Room', 'syncIsolation')
      .addItem('🩸 Sync Sharps Injury Log', 'syncNeedlestick')
      .addItem('🧪 Sync Antibiogram', 'syncCulture'))
    .addSubMenu(ui.createMenu('✅ Quality & Audit Logs')
      .addItem('🧼 Sync Hand Hygiene Audits', 'syncHHAudits')
      .addItem('📦 Sync Bundle Audits', 'syncBundleAudits')
      .addItem('🏢 Sync Area Audits', 'syncAreaAudits')
      .addItem('📉 Sync Census & Device Days', 'syncCensus')
      .addItem('📝 Sync Action Plans', 'syncActionPlans')
      .addItem('📅 Sync Audit Schedule', 'syncSchedules'))
    .addToUi();
}

/**
 * Handle incoming "Push" requests from the Hub App
 * Requires Deployment as a Web App (Anyone with access)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheetName = data.sheetName || 'Incoming_Sync';
    const payload = data.record;
    
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    
    // Add headers if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(Object.keys(payload));
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).setBackground('#009a3e').setFontColor('white');
    }
    
    sheet.appendRow(Object.values(payload));
    return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncAllFirestoreData() {
  const ui = SpreadsheetApp.getUi();
  syncHAI(); syncNotifiable(); syncTB(); syncIsolation(); syncNeedlestick(); syncCulture();
  syncHHAudits(); syncBundleAudits(); syncAreaAudits(); syncCensus(); syncActionPlans(); syncSchedules();
  ui.alert('✅ All IPC Hub Registries and Audit Logs have been synced.');
}

// --- CALLERS ---
function syncHAI() { fetchCollection('reports_hai', 'Surv_HAI'); }
function syncNotifiable() { fetchCollection('reports_notifiable', 'Surv_Notifiable'); }
function syncTB() { fetchCollection('reports_tb', 'Surv_TB'); }
function syncIsolation() { fetchCollection('reports_isolation', 'Surv_Isolation'); }
function syncNeedlestick() { fetchCollection('reports_needlestick', 'Surv_SharpsLog'); }
function syncCulture() { fetchCollection('reports_culture', 'Surv_Antibiogram'); }
function syncHHAudits() { fetchCollection('audit_hand_hygiene', 'Audit_HandHygiene'); }
function syncBundleAudits() { fetchCollection('audit_bundles', 'Audit_ClinicalBundles'); }
function syncAreaAudits() { fetchCollection('audit_area', 'Audit_Environmental'); }
function syncCensus() { fetchCollection('census_logs', 'Audit_CensusLogs'); }
function syncActionPlans() { fetchCollection('action_plans', 'Audit_ActionPlans'); }
function syncSchedules() { fetchCollection('audit_schedules', 'Audit_Schedule'); }

function fetchCollection(collectionName, sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName); else sheet.clear();

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}`;
  const options = { method: 'get', headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };

  const response = UrlFetchApp.fetch(baseUrl, options);
  const json = JSON.parse(response.getContentText());

  if (!json.documents || json.documents.length === 0) {
    sheet.getRange(1, 1).setValue("No records found in " + collectionName);
    return;
  }

  const documents = json.documents;
  const allKeys = new Set();
  documents.forEach(doc => { if (doc.fields) Object.keys(doc.fields).forEach(key => allKeys.add(key)); });

  const headers = Array.from(allKeys).sort();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setBackground('#009a3e').setFontColor('white').setFontWeight('bold');

  const rows = documents.map(doc => headers.map(header => parseFirestoreValue(doc.fields[header] || {})));
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.autoResizeColumns(1, headers.length);
    sheet.setFrozenRows(1);
  }
}

function parseFirestoreValue(valObj) {
  if (valObj.stringValue !== undefined) return valObj.stringValue;
  if (valObj.integerValue !== undefined) return valObj.integerValue;
  if (valObj.doubleValue !== undefined) return valObj.doubleValue;
  if (valObj.booleanValue !== undefined) return valObj.booleanValue;
  if (valObj.timestampValue !== undefined) return valObj.timestampValue;
  if (valObj.arrayValue !== undefined) return valObj.arrayValue.values ? valObj.arrayValue.values.map(v => parseFirestoreValue(v)).join('; ') : "";
  if (valObj.mapValue !== undefined) {
    const fields = valObj.mapValue.fields;
    return fields ? Object.keys(fields).map(k => `${k}: ${parseFirestoreValue(fields[k])}`).join(' | ') : "{}";
  }
  return "";
}
```
