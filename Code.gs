/**
 * OsMak IPC Hub - NTP Template Mapper
 * Maps incoming form data to specific cells for the referral slip template.
 */

const SPREADSHEET_ID = '1Gi1WlLElBZjEkg4LvuqAF2DcMKOA-HmkNySSw3iJd_s'; 

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const p = data.record; // The form submission data
    
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Sheet1') || ss.insertSheet('Sheet1');
    
    // Exact mapping requested by user for the template
    const mapping = {
      // New requested locations
      'A8': p.clinicalDept,
      'C8': p.consultationType,
      'C16': p.contactNumber,
      'D16': p.tbType,

      // Existing required locations
      'A12': p.lastName,
      'B12': p.firstName,
      'C12': p.middleName,
      'D12': p.date,
      
      'A14': p.age,
      'B14': p.sex,
      'C14': p.weight,
      'D14': p.hospitalNumber,
      
      'A15': p.referralReason,
      'A16': p.address,
      
      'C18': p.treatmentRegimen,
      'D18': p.tbDiagnosis,
      
      // History Row 1
      'A22': p.treatmentHistory[0]?.dateStarted || '',
      'B22': p.treatmentHistory[0]?.treatmentUnit || '',
      'C22': p.treatmentHistory[0]?.drugsTaken || '',
      'D22': p.treatmentHistory[0]?.outcome || '',
      
      // History Row 2
      'A23': p.treatmentHistory[1]?.dateStarted || '',
      'B23': p.treatmentHistory[1]?.treatmentUnit || '',
      'C23': p.treatmentHistory[1]?.drugsTaken || '',
      'D23': p.treatmentHistory[1]?.outcome || '',
      
      // History Row 3
      'A24': p.treatmentHistory[2]?.dateStarted || '',
      'B24': p.treatmentHistory[2]?.treatmentUnit || '',
      'C24': p.treatmentHistory[2]?.drugsTaken || '',
      'D24': p.treatmentHistory[2]?.outcome || '',
      
      'A28': p.residentInCharge
    };

    // Apply values to specific cells in Sheet1
    for (let cell in mapping) {
      sheet.getRange(cell).setValue(mapping[cell]);
    }
    
    // Also append to a separate log sheet for historical tracking
    let logSheet = ss.getSheetByName('Registry_Logs') || ss.insertSheet('Registry_Logs');
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow(['Timestamp', 'Hosp #', 'Patient Name', 'Diagnosis', 'Resident']);
    }
    logSheet.appendRow([new Date(), p.hospitalNumber, `${p.lastName}, ${p.firstName}`, p.tbDiagnosis, p.residentInCharge]);

    return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}