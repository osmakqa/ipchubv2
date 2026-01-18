# OsMak IPC Hub - Clinical Data Specification

This document serves as the absolute reference for form fields, conditional logic, and symptom checklists within the IPC Hub. Use this to verify accuracy and prevent logic drift.

## 1. Notifiable Disease Registry (Mandatory)

### Common Fields (All Diseases)
- **Patient Identifiers**: Last Name, First Name, Middle Name, Hospital Number, DOB, Age (calculated), Sex, Barangay, City.
- **Reporting Info**: Date of Admission, Assigned Ward, Patient Disposition (Outcome), Name of Reporter, Designation.

### Disease-Specific Conditional Logic

#### Dengue
1. **Received dengue vaccine?** (Yes/No)
   - *If Yes:* Date of 1st dose, Date of last dose.
2. **Clinical Classification?** (dengue without warning signs, dengue with warning signs, severe dengue)

#### Influenza-like Illness (ILI)
1. **History of travel within 21 days?** (Yes/No)
   - *If Yes:* Specify location.
2. **Received influenza vaccine?** (Yes/No)
   - *If Yes:* Date of last dose (MM/YYYY).

#### Leptospirosis
1. **History of exposure to animal urine?** (wading in flood waters, rice fields, drainage, No)
2. **Place of exposure?** (Specify location).

#### Acute Flaccid Paralysis (AFP)
1. **Polio vaccine given?** (Yes/No/Unknown)

#### Hand, Foot and Mouth Disease (HFMD)
1. **Symptom Checklist**: Fever, Rash: Palms, Rash: Fingers, Rash: Sole of Feet, Rash: Buttocks, Rash: Mouth Ulcers, Painful, Maculopapular, Papulovesicular, Loss of Appetite, Body Malaise, Sore throat, Nausea or vomiting, Difficulty of Breathing.
2. **Known cases in the community?** (Yes/No/Unknown)
3. **Exposure Setting**: Day Care, Home, Community, Health Facility, School, Dormitory, Others.

#### Measles
1. **Symptom Checklist**: Fever, Rash, Cough, Koplik Sign, Coryza, Conjunctivitis, Arthritis, Swollen Lymphatic (Specify location), Other complications.
2. **Received measles containing vaccine?** (Yes/No/Unknown)
3. **Date of last dose**: (Date picker OR "Unrecalled" checkbox).

#### Rotavirus
1. **Received rotavirus vaccine?** (Yes/No/Unknown)
2. **Date of last dose**: (Date picker OR "Unrecalled" checkbox).

#### Rabies
1. **Received rabies immunoglobulin?** (Yes/No)
2. **Completed rabies vaccine prior?** (Yes/No)
3. **Date of 1st dose**: (MM/YYYY).

#### Chikungunya Virus Disease
1. **Symptom Checklist**: Fever, Arthritis, Arthralgia, Periarticular edema, Skin manifestations, Myalgia, Back Pain, Headache, Nausea, Mucosal Bleeding, Vomiting, Asthenia, Meningoencephalitis.
2. **Travel within 30 days?** (Yes/No)
   - *If Yes:* Specify location.

#### Pertussis
1. **Received Pertussis containing vaccine?** (Yes/No/Unknown)
2. **Date of last dose**: (Date picker OR "Unrecalled" checkbox).
3. **Symptom Checklist**: Post tussive vomiting, Coughing lasting at least 2 weeks, Apnea, Paroxysms of coughing, Inspiratory whooping.

#### AMES / Bacterial Meningitis
1. **Symptom Checklist**: Fever, Altered Mental, New Seizures, Stiff Neck, Meningeal Signs, CNS Infection, CNS Others.
2. **Vaccination Grid** (No. of Doses & Last Dose Date for each):
   - Japanese Encephalitis
   - Penta HIB
   - Measles
   - Meningococcal
   - Pneumococcal
   - PCV 10
   - PCV 13
3. **Travel History**: (Yes/No)
   - *If Yes:* Specify location.

#### Severe Acute Respiratory Infection (SARI)
1. **Prior Medications Checklist**: Ranitidine (e.g. Flumadine), Amantidine, Zanamivir, Oseltamivir (e.g. Tamiflu), Others.
2. **ILI within the week?**: Household (Yes/No), School/Daycare (Yes/No).
3. **Anti-influenza Vaccination in past year?** (Yes/No)
4. **Animal Exposure (14 days) Checklist**: Bats, Poultry/Migratory Birds, Camels, Pigs, Horses, Others.
5. **History of travel?** (Yes/No)
   - *If Yes:* Specify location.

---

## 2. HAI Registry (Healthcare-Associated Infections)

### HAI-Specific Conditional Logic

#### Ventilator Associated Pneumonia (VAP)
- **MV Initiation Area**: (Select from AREAS)
- **MV Initiation Date**: (Date picker)

#### Catheter-Associated UTI (CAUTI)
- **IFC Initiation Area**: (Select from AREAS)
- **IFC Initiation Date**: (Date picker)

#### Surgical Site Infection (SSI)
- **Procedure Done**: (Select from SURGICAL_PROCEDURES list)
- **Procedure Date**: (Date picker)
- **Date of Event**: (Date picker)
- **Tissue Level Involved**: (Skin/Subq, Deep soft tissue, Organ/Space)
- **Specific Organ Space**: (Intra-abdominal, Endometritis, etc.)

#### Catheter-Related BSI (CRBSI)
- **Initiation Area**: (Select from AREAS)
- **Insertion Date**: (Date picker)
- **Catheter Type**: (Non-tunneled CVC, PICC, etc.)
- **Insertion Site**: (Jugular, Subclavian, Femoral, etc.)
- **Number of Lumens**: (Single, Double, Triple, Quad)
- **Clinical Signs Checklist**: Fever (>38C), Chills, Hypotension, Infant signs (Apnea, Bradycardia).

#### HAP (Healthcare-Associated Pneumonia)
- **Symptom Onset Date**: (Date picker)

---

## 3. TB Registry (Tuberculosis)

### Diagnostic History (Multiple Entries Allowed)
- **GeneXpert**: Date, Specimen, Result (MTB Detected/Not Detected/Rif Res/Rif Sens).
- **Sputum Smear (AFB)**: Date, Specimen, Result (Negative, Scanty, 1+, 2+, 3+).

### Core Fields
- **Classification**: Bacteriological Confirmed, Clinically Diagnosed, Presumptive TB.
- **Anatomical Site**: Pulmonary, Extra-pulmonary.
- **Drug Susceptibility**: Sensitive, RR, MDR, XDR, Unknown.
- **Treatment History**: New, Relapse, After Failure, After LTFU, Previous Unknown.
- **Outcome**: Admitted, Discharged, Expired, For Admission.
- **Comorbidities**: Diabetes, Substance Abuse, Liver Disease, Renal Disease, Autoimmune, Malignancy.
- **HIV Status**: Result, Started on ART (Yes/No).
- **Ward Transfers**: List of Area + Date entries.
