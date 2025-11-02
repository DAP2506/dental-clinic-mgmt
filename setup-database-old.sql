-- Dental Clinic Management System Database Schema
-- Run this SQL in your Supabase SQL editor

-- Note: The following line is optional and only needed for custom JWT validation
-- You can skip this line for basic setup
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Drop existing types if they exist (for re-running the script)
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS case_status_type CASCADE;
DROP TYPE IF EXISTS priority_type CASCADE;
DROP TYPE IF EXISTS appointment_status_type CASCADE;
DROP TYPE IF EXISTS invoice_status_type CASCADE;
DROP TYPE IF EXISTS treatment_status_type CASCADE;

-- Create custom types
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE case_status_type AS ENUM ('Consultation', 'In Progress', 'Completed', 'Cancelled');
CREATE TYPE priority_type AS ENUM ('Low', 'Medium', 'High', 'Emergency');
CREATE TYPE appointment_status_type AS ENUM ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled');
CREATE TYPE invoice_status_type AS ENUM ('Pending', 'Paid', 'Overdue', 'Cancelled');
CREATE TYPE treatment_status_type AS ENUM ('Planned', 'In Progress', 'Completed', 'Cancelled');

-- Drop existing tables if they exist (for re-running the script)
DROP TABLE IF EXISTS case_treatments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS treatments CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

-- Create Doctors table
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    license_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Treatments table
CREATE TABLE treatments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER,
    category VARCHAR(50),
    procedure_code VARCHAR(20),
    anesthesia_required BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT false,
    materials_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Patients table (Updated for new schema)
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100), -- Made optional
    patient_phone VARCHAR(20) NOT NULL UNIQUE, -- Made unique and required
    date_of_birth DATE,
    gender gender_type,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Cases table (Updated - removed treatment_id, will use junction table)
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    case_status case_status_type NOT NULL DEFAULT 'Consultation',
    priority priority_type NOT NULL DEFAULT 'Medium',
    chief_complaint TEXT NOT NULL,
    history_of_present_illness TEXT,
    clinical_findings TEXT,
    intraoral_examination TEXT,
    extraoral_examination TEXT,
    oral_hygiene_status TEXT,
    periodontal_status TEXT,
    tooth_charting TEXT,
    radiographic_findings TEXT,
    occlusion_analysis TEXT,
    tmj_evaluation TEXT,
    soft_tissue_examination TEXT,
    hard_tissue_examination TEXT,
    pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
    pain_location TEXT,
    pain_characteristics TEXT,
    triggering_factors TEXT,
    relieving_factors TEXT,
    bleeding_on_probing TEXT,
    pocket_depths TEXT,
    gingival_recession TEXT,
    furcation_involvement TEXT,
    mobility_assessment TEXT,
    vitality_tests TEXT,
    percussion_tests TEXT,
    palpation_findings TEXT,
    thermal_tests TEXT,
    electric_pulp_test TEXT,
    differential_diagnosis TEXT,
    final_diagnosis TEXT,
    icd_10_code VARCHAR(10),
    cdt_code VARCHAR(10),
    treatment_plan TEXT,
    treatment_provided TEXT,
    treatment_outcome TEXT,
    medications_prescribed TEXT,
    post_treatment_instructions TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    notes TEXT,
    total_cost DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_pending DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Case Treatments junction table (Many-to-Many relationship)
CREATE TABLE case_treatments (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    treatment_id INTEGER NOT NULL REFERENCES treatments(id) ON DELETE RESTRICT,
    tooth_numbers TEXT, -- e.g., "#1, #2" or "Quadrant 1"
    treatment_status treatment_status_type DEFAULT 'Planned',
    treatment_date DATE,
    cost DECIMAL(10,2) NOT NULL,
    notes TEXT,
    anesthesia_used BOOLEAN DEFAULT false,
    anesthesia_type VARCHAR(50),
    next_appointment_needed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(case_id, treatment_id) -- Prevent duplicate treatment assignments
);

-- Create Appointments table (Updated to reference case_treatments)
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    case_treatment_id INTEGER REFERENCES case_treatments(id) ON DELETE SET NULL,
    appointment_time TIME NOT NULL,
    appointment_date DATE NOT NULL,
    status appointment_status_type NOT NULL DEFAULT 'Scheduled',
    purpose TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status invoice_status_type NOT NULL DEFAULT 'Pending',
    due_date DATE,
    payment_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_patients_phone ON patients(patient_phone);
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_cases_patient ON cases(patient_id);
CREATE INDEX idx_cases_doctor ON cases(doctor_id);
CREATE INDEX idx_cases_status ON cases(case_status);
CREATE INDEX idx_case_treatments_case ON case_treatments(case_id);
CREATE INDEX idx_case_treatments_treatment ON case_treatments(treatment_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_treatments_updated_at BEFORE UPDATE ON case_treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample doctors
INSERT INTO doctors (name, specialization, phone, email, license_number) VALUES
('Dr. Rajesh Kumar', 'General Dentistry', '+91-98765-43210', 'rajesh.kumar@dentalcare.com', 'DL-12345'),
('Dr. Priya Sharma', 'Orthodontics', '+91-98765-43211', 'priya.sharma@dentalcare.com', 'DL-12346'),
('Dr. Amit Patel', 'Oral Surgery', '+91-98765-43212', 'amit.patel@dentalcare.com', 'DL-12347'),
('Dr. Sunita Reddy', 'Pediatric Dentistry', '+91-98765-43213', 'sunita.reddy@dentalcare.com', 'DL-12348');

-- Insert comprehensive treatment list
INSERT INTO treatments (name, description, price, duration_minutes, category, procedure_code, anesthesia_required, follow_up_required, materials_used) VALUES
-- Consultation and Diagnostic
('General Consultation', 'Comprehensive oral examination and consultation', 500.00, 30, 'Consultation', 'D0150', false, true, 'Examination instruments'),
('Emergency Consultation', 'Urgent dental problem evaluation', 800.00, 20, 'Emergency', 'D0140', false, true, 'Examination instruments'),
('Full Mouth X-Ray (OPG)', 'Panoramic radiograph of entire mouth', 1200.00, 15, 'Diagnostic', 'D0330', false, false, 'Digital X-ray'),
('Intraoral X-Ray', 'Single tooth or area radiograph', 300.00, 5, 'Diagnostic', 'D0220', false, false, 'Digital X-ray'),

-- Preventive Care
('Teeth Cleaning (Scaling)', 'Professional dental cleaning and polishing', 1500.00, 45, 'Preventive', 'D1110', false, true, 'Ultrasonic scaler, polishing paste'),
('Composite Filling', 'Tooth-colored filling for cavities', 2500.00, 60, 'Restorative', 'D2391', true, true, 'Composite resin, bonding agent'),
('Deep Cleaning (SRP)', 'Scaling and root planing per quadrant', 2500.00, 90, 'Periodontics', 'D4341', true, true, 'Ultrasonic scaler, hand instruments'),
('Ceramic Crown', 'Full coverage ceramic crown', 12000.00, 120, 'Restorative', 'D2740', true, true, 'Ceramic, dental cement'),
('Fluoride Treatment', 'Professional fluoride application', 800.00, 15, 'Preventive', 'D1208', false, false, 'Fluoride varnish'),
('Dental Sealants', 'Protective coating for molars', 1200.00, 30, 'Preventive', 'D1351', false, true, 'Sealant material'),

-- Endodontics
('Root Canal Treatment (Molar)', 'RCT for molar teeth', 12000.00, 150, 'Endodontics', 'D3330', true, true, 'Gutta-percha, sealer, files'),
('Pulpotomy', 'Partial pulp removal', 4500.00, 60, 'Endodontics', 'D3220', true, true, 'MTA, cotton pellet'),

-- Oral Surgery
('Simple Extraction', 'Simple tooth removal', 3000.00, 30, 'Oral Surgery', 'D7140', true, true, 'Forceps, elevators'),
('Surgical Extraction', 'Complex tooth removal', 6000.00, 60, 'Oral Surgery', 'D7210', true, true, 'Surgical instruments, sutures'),
('Wisdom Tooth Extraction', 'Third molar removal', 8500.00, 90, 'Oral Surgery', 'D7240', true, true, 'Surgical instruments, sutures'),
('Dental Implant', 'Single tooth implant placement', 25000.00, 120, 'Oral Surgery', 'D6010', true, true, 'Titanium implant, healing cap'),
('Bone Grafting', 'Alveolar bone augmentation', 15000.00, 90, 'Oral Surgery', 'D7950', true, true, 'Bone graft material, membrane'),

-- Periodontics
('Gingivectomy', 'Gum tissue removal', 4500.00, 45, 'Periodontics', 'D4210', true, true, 'Surgical instruments'),
('Crown Lengthening', 'Gum and bone reshaping', 8000.00, 90, 'Periodontics', 'D4249', true, true, 'Surgical instruments'),

-- Orthodontics
('Orthodontic Consultation', 'Braces and alignment consultation', 1000.00, 45, 'Orthodontics', 'D8660', false, true, 'Examination instruments'),
('Metal Braces', 'Traditional metal braces (per arch)', 35000.00, 60, 'Orthodontics', 'D8080', false, true, 'Metal brackets, wires'),
('Ceramic Braces', 'Tooth-colored braces (per arch)', 45000.00, 60, 'Orthodontics', 'D8080', false, true, 'Ceramic brackets, wires'),
('Invisalign Treatment', 'Clear aligner therapy', 75000.00, 45, 'Orthodontics', 'D8080', false, true, 'Clear aligners'),
('Retainer Fabrication', 'Post-treatment retention', 8000.00, 30, 'Orthodontics', 'D8692', false, false, 'Retainer materials'),

-- Cosmetic Dentistry
('Teeth Whitening (In-office)', 'Professional teeth whitening', 8500.00, 90, 'Cosmetic', 'D9972', false, false, 'Bleaching gel, light activation'),
('Teeth Whitening (Take-home)', 'Custom whitening trays', 5500.00, 30, 'Cosmetic', 'D9975', false, true, 'Custom trays, bleaching gel'),
('Dental Veneers', 'Porcelain veneers per tooth', 18000.00, 120, 'Cosmetic', 'D2962', true, true, 'Porcelain, bonding agent'),
('Dental Bonding', 'Cosmetic tooth bonding', 4500.00, 45, 'Cosmetic', 'D2391', false, false, 'Composite resin'),

-- Prosthodontics
('Complete Denture (Upper)', 'Full upper denture', 25000.00, 180, 'Prosthodontics', 'D5110', false, true, 'Acrylic resin, teeth'),
('Complete Denture (Lower)', 'Full lower denture', 25000.00, 180, 'Prosthodontics', 'D5120', false, true, 'Acrylic resin, teeth'),
('Partial Denture', 'Removable partial denture', 18000.00, 150, 'Prosthodontics', 'D5213', false, true, 'Metal framework, acrylic'),

-- Pediatric Dentistry
('Pediatric Consultation', 'Child dental examination', 600.00, 30, 'Pediatric', 'D0145', false, true, 'Child-friendly instruments'),
('Pediatric Cleaning', 'Child teeth cleaning', 1200.00, 30, 'Pediatric', 'D1120', false, true, 'Gentle cleaning instruments'),
('Pulp Cap', 'Direct pulp capping', 3500.00, 45, 'Pediatric', 'D3110', true, true, 'Calcium hydroxide, MTA'),
('Stainless Steel Crown', 'Pediatric crown restoration', 4500.00, 45, 'Pediatric', 'D2930', true, false, 'SSC, cement'),

-- Emergency Treatments
('Emergency Pain Relief', 'Immediate pain management', 2000.00, 30, 'Emergency', 'D9110', true, false, 'Analgesics, temporary materials');

-- Insert sample patients
INSERT INTO patients (first_name, last_name, email, patient_phone, date_of_birth, gender, address, city, state, postal_code, emergency_contact_name, emergency_contact_phone, medical_history, allergies, current_medications) VALUES
('Arjun', 'Singh', 'arjun.singh@email.com', '+91-98765-11111', '1985-03-15', 'Male', '123 MG Road', 'Mumbai', 'Maharashtra', '400001', 'Sunita Singh', '+91-98765-11112', 'No significant medical history', 'None known', 'None'),
('Kavita', 'Gupta', 'kavita.gupta@email.com', '+91-98765-22222', '1990-07-22', 'Female', '456 Sector 15', 'Gurgaon', 'Haryana', '122001', 'Rohit Gupta', '+91-98765-22223', 'Hypertension', 'Penicillin', 'Amlodipine 5mg'),
('Ravi', 'Iyer', 'ravi.iyer@email.com', '+91-98765-33333', '1978-12-10', 'Male', '789 Brigade Road', 'Bangalore', 'Karnataka', '560001', 'Lakshmi Iyer', '+91-98765-33334', 'Diabetes Type 2', 'Sulfa drugs', 'Metformin 500mg'),
('Neha', 'Joshi', 'neha.joshi@email.com', '+91-98765-44444', '1992-05-18', 'Female', '321 CP Tank', 'Mumbai', 'Maharashtra', '400004', 'Vikram Joshi', '+91-98765-44445', 'No medical issues', 'Latex', 'None'),
('Suresh', 'Reddy', 'suresh.reddy@email.com', '+91-98765-55555', '1965-09-25', 'Male', '654 Jubilee Hills', 'Hyderabad', 'Telangana', '500033', 'Kamala Reddy', '+91-98765-55556', 'Heart disease, High cholesterol', 'Aspirin', 'Atorvastatin 20mg'),
('Anita', 'Sharma', 'anita.sharma@email.com', '+91-98765-66666', '1988-01-30', 'Female', '987 Civil Lines', 'Delhi', 'Delhi', '110054', 'Raj Sharma', '+91-98765-66667', 'Asthma', 'Dust mites', 'Inhaler - Salbutamol'),
('Kiran', 'Kumar', 'kiran.kumar@email.com', '+91-98765-77777', '1995-11-08', 'Male', '111 Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', 'Sita Kumar', '+91-98765-77778', 'No medical history', 'None', 'None'),
('Deepika', 'Patel', 'deepika.patel@email.com', '+91-98765-88888', '1983-04-12', 'Female', '222 Satellite', 'Ahmedabad', 'Gujarat', '380015', 'Himesh Patel', '+91-98765-88889', 'Migraine', 'NSAIDs', 'Sumatriptan as needed');

-- Insert sample cases
INSERT INTO cases (
    patient_id, doctor_id, case_status, priority, 
    chief_complaint, history_of_present_illness, clinical_findings, 
    intraoral_examination, extraoral_examination, oral_hygiene_status, 
    periodontal_status, tooth_charting, radiographic_findings,
    occlusion_analysis, tmj_evaluation, soft_tissue_examination,
    pain_scale, pain_location, pain_characteristics,
    bleeding_on_probing, pocket_depths, vitality_tests,
    differential_diagnosis, final_diagnosis, icd_10_code,
    treatment_plan, treatment_provided, medications_prescribed,
    post_treatment_instructions, follow_up_required, notes,
    total_cost, amount_paid, amount_pending
) VALUES 
-- Case 1: Comprehensive treatment case for Arjun (multiple treatments needed)
(1, 1, 'In Progress', 'High',
 'Severe toothache in upper right side and broken front tooth',
 'Patient reports severe pain for past 3 days, started after eating hard food. Also has broken front tooth from accident 2 weeks ago affecting smile and confidence.',
 'Multiple carious lesions, fractured central incisor, gingival inflammation',
 'Tooth #3 (upper right first molar): Deep carious lesion with pulpal involvement. Tooth #8 (upper right central incisor): Crown fracture involving enamel and dentin. Gingiva: Generalized mild erythema and edema.',
 'No facial asymmetry or swelling. Slight tenderness on palpation over apical region of #3.',
 'Fair', 'Generalized mild gingivitis with BOP in posterior regions',
 '#3: Deep carious lesion, pulpal involvement; #8: Crown fracture; #14,#15: Superficial caries',
 'Periapical radiolucency associated with #3. Crown fracture of #8 visible on radiograph.',
 'Class I occlusion. Normal overbite and overjet.',
 'No TMJ symptoms or dysfunction reported',
 'Oral mucosa appears normal. Mild gingival inflammation around multiple teeth.',
 8, 'Upper right molar (#3)', 'Severe, throbbing pain, worse with hot/cold',
 'Positive BOP around teeth #2,#3,#14,#15',
 'Generalized 2-3mm pockets. #3: 4mm mesial pocket',
 '#3: Negative response to cold test and EPT. #8: Positive response indicating vital pulp',
 'Acute pulpitis #3 vs irreversible pulpitis. Crown fracture #8.',
 'Irreversible pulpitis #3. Complicated crown fracture #8.',
 'K08.1',
 'Phase 1: RCT #3, temporary restoration #8. Phase 2: Crown #3, Composite veneer #8. Phase 3: Preventive care and oral hygiene instruction.',
 'Emergency pain relief provided. Treatment planned in phases.',
 'Ibuprofen 400mg TID, Amoxicillin 500mg TID if infection develops',
 'Avoid hard foods. Cold compress for swelling. Return if pain worsens.',
 true, 'Complex case requiring multiple treatment modalities. Patient motivated for comprehensive care.',
 45000.00, 8000.00, 37000.00),

-- Case 2: Orthodontic case for Neha (multiple orthodontic treatments)
(4, 2, 'In Progress', 'Medium',
 'Crooked teeth affecting smile and confidence',
 'Patient reports crooked front teeth since childhood. Wants to improve smile for upcoming wedding. No pain but difficulty in cleaning certain areas.',
 'Moderate anterior crowding, rotated laterals, Class I malocclusion',
 'Lower anterior crowding 6mm. Rotated lateral incisors. Mild plaque accumulation in crowded areas.',
 'Symmetric facial profile. Competent lips.',
 'Good', 'Healthy gingiva with minimal inflammation in crowded areas',
 'Lower anterior crowding. Rotated #7, #10. Otherwise normal tooth morphology.',
 'No significant pathology. Good bone levels.',
 'Class I molar relationship. Moderate crowding lower anterior.',
 'Normal TMJ function. No clicking or limitation.',
 'Normal oral mucosa. Healthy appearance.',
 0, 'No pain', 'No pain reported',
 'Minimal BOP in crowded areas only',
 'Normal 1-2mm pockets throughout',
 'All teeth vital and responsive',
 'Moderate crowding vs extraction vs non-extraction treatment',
 'Moderate dental crowding, Class I malocclusion',
 'M26.31',
 'Invisalign clear aligner therapy. 18-24 month treatment duration. Regular progress monitoring.',
 'Treatment initiated with impression and treatment planning.',
 'None required',
 'Excellent oral hygiene required during treatment. Regular check-ups every 6 weeks.',
 true, 'Motivated patient. Good oral hygiene. Excellent candidate for clear aligner therapy.',
 85000.00, 25000.00, 60000.00),

-- Case 3: Periodontal case for Suresh (multiple periodontal treatments needed)
(5, 1, 'In Progress', 'High',
 'Bleeding gums and loose teeth',
 'Patient reports bleeding gums for 6 months, getting worse. Two lower teeth feel loose. Bad taste in mouth in mornings.',
 'Generalized moderate to severe periodontitis, tooth mobility',
 'Generalized 4-7mm pockets. Bleeding on probing throughout. Teeth #24, #25 Grade II mobility. Heavy calculus deposits.',
 'No facial swelling. Halitosis present.',
 'Poor', 'Generalized moderate to severe periodontitis',
 'Generalized bone loss. #24, #25: Grade II mobility. Heavy calculus and plaque.',
 'Generalized horizontal and vertical bone loss. Furcation involvement #19.',
 'Normal occlusion but traumatic due to mobility',
 'Normal TMJ function',
 'Oral mucosa appears normal aside from gingival inflammation',
 6, 'Throughout mouth', 'Bleeding and soreness, especially during brushing',
 'Positive BOP throughout mouth',
 'Generalized 4-7mm pockets, deepest around #19, #24, #25',
 'All teeth vital but #24, #25 questionable due to mobility',
 'Generalized chronic periodontitis vs aggressive periodontitis',
 'Generalized chronic periodontitis with localized tooth mobility',
 'K05.3',
 'Phase I: Scaling and root planing all quadrants. Phase II: Surgical intervention if needed. Phase III: Maintenance therapy.',
 'Phase I therapy initiated. Patient education provided.',
 'Chlorhexidine 0.12% rinse BID',
 'Improved oral hygiene. Soft diet. Follow-up in 6 weeks for re-evaluation.',
 true, 'Requires long-term periodontal maintenance. Patient counseled on importance of home care.',
 28000.00, 10000.00, 18000.00),

-- Case 4: Pediatric case for Kiran (multiple pediatric treatments)
(7, 4, 'Completed', 'Medium',
 'Multiple cavities and toothache',
 'Patient reports cavities in back teeth causing food impaction and mild sensitivity. Parent reports child avoiding sweets due to discomfort.',
 'Multiple carious lesions in primary and permanent molars',
 'Primary molars: Multiple carious lesions. #19: MOD carious lesion. #30: DO carious lesion. Fair oral hygiene.',
 'No facial swelling. Normal appearance.',
 'Fair', 'Healthy gingiva around most teeth. Mild inflammation around carious teeth.',
 'Multiple carious lesions: #19 (MOD), #30 (DO), #K,#S (occlusal caries)',
 'Multiple radiolucent areas corresponding to clinical findings. No periapical pathology.',
 'Class I occlusion developing normally',
 'Normal TMJ development',
 'Normal oral mucosa and tongue',
 3, 'Back teeth', 'Mild sensitivity to sweets and cold',
 'Minimal BOP, localized to carious areas',
 'Normal sulcus depths for age',
 'All teeth vital and responsive',
 'Multiple carious lesions vs early childhood caries',
 'Multiple carious lesions in primary and permanent molars',
 'K02.9',
 'Restorative treatment for all carious lesions. Fluoride therapy. Oral hygiene education.',
 'All restorations completed successfully. Preventive care provided.',
 'Children''s fluoride toothpaste',
 'Excellent oral hygiene. Limit sugary snacks. Regular dental visits every 6 months.',
 true, 'Treatment completed successfully. Child cooperative throughout treatment.',
 12500.00, 12500.00, 0.00);

-- Case Treatments: Link treatments to cases (Many-to-Many relationship)
INSERT INTO case_treatments (case_id, treatment_id, tooth_numbers, treatment_status, treatment_date, cost, notes, anesthesia_used, anesthesia_type) VALUES

-- Case 1 (Arjun) - Multiple treatments for comprehensive care
(1, 11, '#3', 'Completed', CURRENT_DATE - INTERVAL '5 days', 12000.00, 'RCT completed in 2 sessions. Patient tolerated procedure well.', true, 'Lidocaine with epinephrine'),
(1, 8, '#3', 'In Progress', CURRENT_DATE + INTERVAL '7 days', 12000.00, 'Crown preparation completed. Impression taken. Temporary crown placed.', true, 'Lidocaine with epinephrine'),
(1, 6, '#8', 'Completed', CURRENT_DATE - INTERVAL '3 days', 2500.00, 'Composite restoration completed. Excellent esthetics achieved.', false, 'None'),
(1, 5, 'Full mouth', 'Planned', CURRENT_DATE + INTERVAL '14 days', 1500.00, 'Scheduled for preventive maintenance.', false, 'None'),

-- Case 2 (Neha) - Orthodontic treatment with multiple phases  
(2, 20, 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '14 days', 1000.00, 'Comprehensive orthodontic evaluation completed. Treatment plan developed.', false, 'None'),
(2, 23, 'Full mouth', 'In Progress', CURRENT_DATE - INTERVAL '7 days', 75000.00, 'Aligners 1-3 of 24 completed. Excellent patient compliance.', false, 'None'),
(2, 24, 'Full mouth', 'Planned', CURRENT_DATE + INTERVAL '365 days', 8000.00, 'To be fabricated upon completion of active treatment.', false, 'None'),

-- Case 3 (Suresh) - Comprehensive periodontal treatment
(3, 7, 'Quadrant 1', 'Completed', CURRENT_DATE - INTERVAL '21 days', 2500.00, 'SRP quadrant 1 completed. Good patient response.', true, 'Lidocaine'),
(3, 7, 'Quadrant 2', 'Completed', CURRENT_DATE - INTERVAL '14 days', 2500.00, 'SRP quadrant 2 completed. Reduced inflammation noted.', true, 'Lidocaine'),
(3, 7, 'Quadrant 3', 'In Progress', CURRENT_DATE + INTERVAL '7 days', 2500.00, 'Scheduled for next week.', false, 'Lidocaine planned'),
(3, 7, 'Quadrant 4', 'Planned', CURRENT_DATE + INTERVAL '14 days', 2500.00, 'Final quadrant scheduled.', false, 'Lidocaine planned'),
(3, 18, '#24, #25', 'Planned', CURRENT_DATE + INTERVAL '28 days', 4500.00, 'Planned if tissue response inadequate after SRP.', false, 'Local anesthesia planned'),

-- Case 4 (Kiran) - Multiple pediatric treatments
(4, 32, 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '30 days', 600.00, 'Comprehensive pediatric examination completed.', false, 'None'),
(4, 6, '#19', 'Completed', CURRENT_DATE - INTERVAL '14 days', 2500.00, 'MOD composite restoration completed successfully.', false, 'None'),
(4, 6, '#30', 'Completed', CURRENT_DATE - INTERVAL '7 days', 2200.00, 'DO composite restoration completed.', false, 'None'),
(4, 9, 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '7 days', 800.00, 'Fluoride varnish applied. Home care instructions given.', false, 'None'),
(4, 10, '#6, #11', 'Planned', CURRENT_DATE + INTERVAL '30 days', 2400.00, 'Sealants planned for newly erupted permanent molars.', false, 'None');

-- Additional cases for more patients to demonstrate multiple cases per patient

-- Kavita - Second case: Cosmetic treatment
INSERT INTO cases (
    patient_id, doctor_id, case_status, priority, 
    chief_complaint, history_of_present_illness, clinical_findings, 
    intraoral_examination, extraoral_examination, oral_hygiene_status, 
    periodontal_status, notes, total_cost, amount_paid, amount_pending
) VALUES 
(2, 2, 'Consultation', 'Low',
 'Wants whiter teeth for special occasion',
 'Patient satisfied with periodontal treatment outcome. Now interested in cosmetic whitening for upcoming family wedding.',
 'Healthy oral condition post-periodontal therapy. Slight tooth discoloration',
 'Excellent oral hygiene post-treatment. No active periodontal disease. Mild tooth staining.',
 'Normal facial appearance.',
 'Excellent', 'Healthy gingiva post-treatment. Stable periodontal condition.',
 'Second case for same patient - cosmetic focus after successful periodontal therapy.',
 8500.00, 0.00, 8500.00);

-- Add treatments for Kavita's second case
INSERT INTO case_treatments (case_id, treatment_id, tooth_numbers, treatment_status, treatment_date, cost, notes) VALUES
(5, 25, 'Full mouth', 'Planned', CURRENT_DATE + INTERVAL '10 days', 8500.00, 'In-office whitening scheduled after periodontal stability confirmed.');

-- Ravi - Multiple cases: Emergency and follow-up
INSERT INTO cases (
    patient_id, doctor_id, case_status, priority, 
    chief_complaint, history_of_present_illness, clinical_findings, 
    notes, total_cost, amount_paid, amount_pending
) VALUES 
(3, 3, 'Completed', 'Emergency',
 'Broken tooth from accident',
 'Patient had cycling accident yesterday. Front tooth chipped.',
 'Fractured upper central incisor, no pulp exposure',
 'Emergency case successfully treated with dental bonding.',
 4500.00, 4500.00, 0.00),

(3, 1, 'In Progress', 'Medium',
 'Routine dental checkup and cleaning',
 'Patient returning for 6-month maintenance visit. No specific complaints.',
 'Generally good oral health. Some plaque accumulation',
 'Routine maintenance case. Patient maintains good oral hygiene.',
 2300.00, 1500.00, 800.00);

-- Add treatments for Ravi's cases
INSERT INTO case_treatments (case_id, treatment_id, tooth_numbers, treatment_status, treatment_date, cost, notes) VALUES
-- Emergency case (Case 6)
(6, 29, '#8', 'Completed', CURRENT_DATE - INTERVAL '2 days', 4500.00, 'Emergency bonding completed. Excellent esthetic result.'),

-- Routine case (Case 7)
(7, 1, 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '1 day', 500.00, 'Routine examination completed.'),
(7, 5, 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '1 day', 1500.00, 'Scaling and cleaning completed.'),
(7, 9, 'Full mouth', 'Planned', CURRENT_DATE + INTERVAL '7 days', 800.00, 'Fluoride treatment scheduled for next visit.');

-- Generate some sample appointments (Updated for new schema)
INSERT INTO appointments (patient_id, doctor_id, case_id, case_treatment_id, appointment_time, appointment_date, status, purpose, notes)
SELECT 
    p.id as patient_id,
    d.id as doctor_id,
    c.id as case_id,
    ct.id as case_treatment_id,
    (ARRAY['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'])[floor(random() * 6 + 1)]::time,
    CURRENT_DATE + (random() * 30)::integer,
    CASE 
        WHEN random() < 0.2 THEN 'Completed'::appointment_status_type
        WHEN random() < 0.4 THEN 'Confirmed'::appointment_status_type
        WHEN random() < 0.6 THEN 'In Progress'::appointment_status_type
        ELSE 'Scheduled'::appointment_status_type
    END,
    'Treatment appointment for ' || t.name,
    'Appointment for specific treatment session'
FROM patients p
CROSS JOIN doctors d
CROSS JOIN cases c
CROSS JOIN case_treatments ct
CROSS JOIN treatments t
WHERE c.patient_id = p.id 
  AND ct.case_id = c.id 
  AND ct.treatment_id = t.id
  AND random() < 0.3 -- Randomly select some combinations
LIMIT 15;

-- Generate some sample invoices (Updated for new schema)
INSERT INTO invoices (patient_id, case_id, invoice_number, amount, status, due_date, payment_date, payment_method)
SELECT 
    c.patient_id,
    c.id,
    'INV-2024-' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
    c.total_cost,
    CASE 
        WHEN random() < 0.6 THEN 'Paid'::invoice_status_type
        WHEN random() < 0.8 THEN 'Pending'::invoice_status_type
        ELSE 'Overdue'::invoice_status_type
    END,
    CURRENT_DATE + (random() * 30)::integer,
    CASE WHEN random() < 0.6 THEN CURRENT_DATE - (random() * 10)::integer ELSE NULL END,
    CASE WHEN random() < 0.6 THEN (ARRAY['Cash', 'Card', 'UPI', 'Bank Transfer'])[floor(random() * 4 + 1)] ELSE NULL END
FROM cases c
WHERE random() < 0.8
LIMIT 15;

-- Enable Row Level Security (RLS) - Configure as needed
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your authentication setup)
-- For now, allow all operations (you should restrict this in production)
CREATE POLICY "Allow all operations" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON doctors FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON treatments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON cases FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON case_treatments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON invoices FOR ALL USING (true);

-- Summary of Schema Changes:
-- 1. **Multiple Cases per Patient**: Patients can now have multiple cases (emergency, routine, cosmetic, etc.)
-- 2. **Multiple Treatments per Case**: Cases can now have multiple treatments via the case_treatments junction table
-- 3. **Phone Number as Unique Identifier**: patient_phone is now unique, email is optional
-- 4. **Enhanced Appointment System**: Appointments can reference specific case_treatments for precise scheduling
-- 5. **Comprehensive Sample Data**: Demonstrates real-world scenarios with multiple treatments and cases
-- 6. **Professional Dental Terminology**: Uses proper dental notation, procedures, and clinical documentation

-- Key Benefits:
-- - Realistic workflow: Patients often need multiple treatments for one condition
-- - Flexible treatment planning: Can add/remove treatments from cases as needed
-- - Better financial tracking: Each treatment has individual cost and status
-- - Improved appointment scheduling: Can schedule specific treatment sessions
-- - Comprehensive medical records: Detailed dental findings and treatment progress

-- Doctors table
CREATE TABLE doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatments table
CREATE TABLE treatments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    category VARCHAR(50) NOT NULL,
    
    -- Dental specific fields
    tooth_numbers TEXT, -- Which teeth are involved (e.g., "11,12,21,22")
    procedure_code VARCHAR(20), -- ADA/CDT procedure codes
    anesthesia_required BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT false,
    materials_used TEXT,
    contraindications TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100), -- Made nullable, no longer unique
    patient_phone VARCHAR(15) UNIQUE NOT NULL, -- Made unique
    date_of_birth DATE, -- Made nullable
    gender gender_type DEFAULT 'Male', -- Added default value
    address TEXT, -- Made nullable
    city VARCHAR(50), -- Made nullable
    state VARCHAR(50), -- Made nullable
    postal_code VARCHAR(10), -- Made nullable
    emergency_contact_name VARCHAR(100), -- Made nullable
    emergency_contact_phone VARCHAR(15), -- Made nullable
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases table (Modified: Removed direct treatment_id reference since cases can have multiple treatments)
CREATE TABLE cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    case_status case_status_type NOT NULL DEFAULT 'Consultation',
    priority priority_type NOT NULL DEFAULT 'Medium',
    
    -- Chief complaint and clinical details
    chief_complaint TEXT NOT NULL,
    history_of_present_illness TEXT,
    clinical_findings TEXT,
    intraoral_examination TEXT,
    extraoral_examination TEXT,
    
    -- Dental specific assessments
    oral_hygiene_status VARCHAR(50), -- Poor, Fair, Good, Excellent
    periodontal_status TEXT,
    tooth_charting TEXT, -- JSON or structured format for tooth conditions
    radiographic_findings TEXT,
    
    -- Additional dental examinations
    occlusion_analysis TEXT, -- Class I, II, III malocclusion details
    tmj_evaluation TEXT, -- TMJ dysfunction assessment
    soft_tissue_examination TEXT, -- Gingival, mucosal conditions
    hard_tissue_examination TEXT, -- Enamel, dentin conditions
    
    -- Pain and symptom assessment
    pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
    pain_location TEXT,
    pain_characteristics TEXT, -- Sharp, dull, throbbing, etc.
    triggering_factors TEXT,
    relieving_factors TEXT,
    
    -- Periodontal specific
    bleeding_on_probing TEXT,
    pocket_depths TEXT, -- Periodontal pocket measurements
    gingival_recession TEXT,
    furcation_involvement TEXT,
    mobility_assessment TEXT,
    
    -- Diagnostic tests
    vitality_tests TEXT, -- Pulp vitality test results
    percussion_tests TEXT,
    palpation_findings TEXT,
    thermal_tests TEXT,
    electric_pulp_test TEXT,
    
    -- Diagnosis and treatment
    differential_diagnosis TEXT,
    final_diagnosis TEXT,
    icd_10_code VARCHAR(10), -- Medical diagnosis code
    cdt_code VARCHAR(10), -- Current Dental Terminology code
    treatment_plan TEXT,
    treatment_provided TEXT,
    treatment_outcome TEXT,
    
    -- Medications and instructions
    medications_prescribed TEXT,
    post_treatment_instructions TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    -- Administrative
    notes TEXT,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_pending DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Treatments Junction Table (NEW: Many-to-many relationship between cases and treatments)
CREATE TABLE case_treatments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE RESTRICT,
    
    -- Treatment-specific details for this case
    tooth_numbers TEXT, -- Specific teeth involved for this treatment in this case
    treatment_status VARCHAR(20) DEFAULT 'Planned', -- Planned, In Progress, Completed, Cancelled
    treatment_date DATE,
    duration_minutes INTEGER,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0, -- Individual treatment cost for this case
    notes TEXT,
    
    -- Clinical details specific to this treatment session
    anesthesia_used BOOLEAN DEFAULT false,
    anesthesia_type VARCHAR(50),
    complications TEXT,
    post_treatment_notes TEXT,
    next_appointment_needed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a treatment can only be added once per case (prevent duplicates)
    UNIQUE(case_id, treatment_id)
);

-- Appointments table (Modified: Now references case_treatments for specific treatment sessions)
CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    case_treatment_id UUID REFERENCES case_treatments(id) ON DELETE SET NULL, -- Optional: specific treatment session
    appointment_time TIME NOT NULL,
    appointment_date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status appointment_status_type NOT NULL DEFAULT 'Scheduled',
    purpose TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status invoice_status_type NOT NULL DEFAULT 'Pending',
    due_date DATE NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_patients_email ON patients(email); -- Optional field index
CREATE INDEX idx_patients_phone ON patients(patient_phone); -- Phone number index (unique constraint already in table)
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_cases_patient_id ON cases(patient_id);
CREATE INDEX idx_cases_status ON cases(case_status);
CREATE INDEX idx_case_treatments_case_id ON case_treatments(case_id);
CREATE INDEX idx_case_treatments_treatment_id ON case_treatments(treatment_id);
CREATE INDEX idx_case_treatments_status ON case_treatments(treatment_status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_case_id ON appointments(case_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_treatments_updated_at BEFORE UPDATE ON case_treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Doctors
INSERT INTO doctors (name, specialization, phone, email, license_number) VALUES
('Dr. Rajesh Kumar', 'General Dentistry', '+91-98765-43210', 'rajesh.kumar@dentalcare.com', 'DL-12345'),
('Dr. Priya Sharma', 'Orthodontics', '+91-98765-43211', 'priya.sharma@dentalcare.com', 'DL-12346'),
('Dr. Amit Patel', 'Oral Surgery', '+91-98765-43212', 'amit.patel@dentalcare.com', 'DL-12347'),
('Dr. Sunita Reddy', 'Pediatric Dentistry', '+91-98765-43213', 'sunita.reddy@dentalcare.com', 'DL-12348');

-- Treatments
INSERT INTO treatments (name, description, price, duration_minutes, category, procedure_code, anesthesia_required, follow_up_required, materials_used) VALUES
-- Consultation and Diagnostic
('General Consultation', 'Comprehensive oral examination and consultation', 500.00, 30, 'Consultation', 'D0150', false, true, 'Examination instruments'),
('Emergency Consultation', 'Urgent dental problem evaluation', 800.00, 20, 'Emergency', 'D0140', false, true, 'Examination instruments'),
('Full Mouth X-Ray (OPG)', 'Panoramic radiograph of entire mouth', 1200.00, 15, 'Diagnostic', 'D0330', false, false, 'Digital X-ray'),
('Intraoral X-Ray', 'Single tooth or area radiograph', 300.00, 5, 'Diagnostic', 'D0220', false, false, 'Digital X-ray'),

-- Preventive Care
('Teeth Cleaning (Scaling)', 'Professional dental cleaning and polishing', 1500.00, 45, 'Preventive', 'D1110', false, true, 'Ultrasonic scaler, polishing paste'),
('Deep Cleaning (SRP)', 'Scaling and root planing per quadrant', 2500.00, 60, 'Periodontics', 'D4341', true, true, 'Ultrasonic scaler, hand instruments'),
('Fluoride Treatment', 'Topical fluoride application', 800.00, 15, 'Preventive', 'D1206', false, false, 'Fluoride gel/varnish'),
('Dental Sealants', 'Pit and fissure sealants per tooth', 1200.00, 20, 'Preventive', 'D1351', false, false, 'Resin sealant'),

-- Restorative Dentistry
('Amalgam Filling', 'Silver amalgam restoration', 2000.00, 45, 'Restorative', 'D2140', true, false, 'Amalgam, bonding agent'),
('Composite Filling', 'Tooth-colored resin restoration', 2500.00, 60, 'Restorative', 'D2391', true, false, 'Composite resin, bonding agent'),
('Glass Ionomer Filling', 'Glass ionomer restoration', 2200.00, 45, 'Restorative', 'D2394', true, false, 'Glass ionomer cement'),
('Inlay/Onlay', 'Indirect restoration', 8500.00, 90, 'Restorative', 'D2510', true, true, 'Ceramic/composite material'),

-- Crown and Bridge
('Ceramic Crown', 'Full ceramic crown restoration', 12000.00, 120, 'Restorative', 'D2740', true, true, 'Ceramic, cement'),
('Metal Crown', 'Gold/metal crown restoration', 15000.00, 120, 'Restorative', 'D2790', true, true, 'Metal alloy, cement'),
('Porcelain Fused to Metal Crown', 'PFM crown restoration', 10000.00, 120, 'Restorative', 'D2750', true, true, 'Metal, porcelain, cement'),
('Bridge (3 Unit)', 'Fixed partial denture', 35000.00, 180, 'Restorative', 'D6240', true, true, 'Crown materials, cement'),

-- Endodontics
('Root Canal Treatment (Anterior)', 'RCT for front teeth', 6500.00, 90, 'Endodontics', 'D3310', true, true, 'Gutta-percha, sealer, files'),
('Root Canal Treatment (Premolar)', 'RCT for premolar teeth', 8500.00, 120, 'Endodontics', 'D3320', true, true, 'Gutta-percha, sealer, files'),
('Root Canal Treatment (Molar)', 'RCT for molar teeth', 12000.00, 150, 'Endodontics', 'D3330', true, true, 'Gutta-percha, sealer, files'),
('Pulpotomy', 'Partial pulp removal', 4500.00, 60, 'Endodontics', 'D3220', true, true, 'MTA, cotton pellet'),

-- Oral Surgery
('Simple Extraction', 'Simple tooth removal', 3000.00, 30, 'Oral Surgery', 'D7140', true, true, 'Forceps, elevators'),
('Surgical Extraction', 'Complex tooth removal', 6000.00, 60, 'Oral Surgery', 'D7210', true, true, 'Surgical instruments, sutures'),
('Wisdom Tooth Extraction', 'Third molar removal', 8500.00, 90, 'Oral Surgery', 'D7240', true, true, 'Surgical instruments, sutures'),
('Dental Implant', 'Single tooth implant placement', 25000.00, 120, 'Oral Surgery', 'D6010', true, true, 'Titanium implant, healing cap'),
('Bone Grafting', 'Alveolar bone augmentation', 15000.00, 90, 'Oral Surgery', 'D7950', true, true, 'Bone graft material, membrane'),

-- Periodontics
('Gingivectomy', 'Gum tissue removal', 4500.00, 45, 'Periodontics', 'D4210', true, true, 'Surgical instruments'),
('Crown Lengthening', 'Gum and bone reshaping', 8000.00, 90, 'Periodontics', 'D4249', true, true, 'Surgical instruments'),
('Gum Grafting', 'Soft tissue graft', 12000.00, 120, 'Periodontics', 'D4270', true, true, 'Graft material, sutures'),

-- Orthodontics
('Orthodontic Consultation', 'Braces and alignment consultation', 1000.00, 45, 'Orthodontics', 'D8660', false, true, 'Examination instruments'),
('Metal Braces', 'Traditional metal braces (per arch)', 35000.00, 60, 'Orthodontics', 'D8080', false, true, 'Metal brackets, wires'),
('Ceramic Braces', 'Tooth-colored braces (per arch)', 45000.00, 60, 'Orthodontics', 'D8080', false, true, 'Ceramic brackets, wires'),
('Invisalign', 'Clear aligner therapy', 75000.00, 45, 'Orthodontics', 'D8080', false, true, 'Clear aligners'),

-- Cosmetic Dentistry
('Teeth Whitening (In-office)', 'Professional teeth whitening', 8500.00, 90, 'Cosmetic', 'D9972', false, false, 'Bleaching gel, light activation'),
('Teeth Whitening (Take-home)', 'Custom whitening trays', 5500.00, 30, 'Cosmetic', 'D9975', false, true, 'Custom trays, bleaching gel'),
('Dental Veneers', 'Porcelain veneers per tooth', 18000.00, 120, 'Cosmetic', 'D2962', true, true, 'Porcelain, bonding agent'),
('Dental Bonding', 'Cosmetic tooth bonding', 4500.00, 45, 'Cosmetic', 'D2391', false, false, 'Composite resin'),

-- Prosthodontics
('Complete Denture (Upper)', 'Full upper denture', 25000.00, 180, 'Prosthodontics', 'D5110', false, true, 'Acrylic resin, teeth'),
('Complete Denture (Lower)', 'Full lower denture', 25000.00, 180, 'Prosthodontics', 'D5120', false, true, 'Acrylic resin, teeth'),
('Partial Denture', 'Removable partial denture', 18000.00, 150, 'Prosthodontics', 'D5213', false, true, 'Metal framework, acrylic'),

-- Pediatric Dentistry
('Pediatric Consultation', 'Child dental examination', 600.00, 30, 'Pediatric', 'D0145', false, true, 'Child-friendly instruments'),
('Pediatric Cleaning', 'Child teeth cleaning', 1200.00, 30, 'Pediatric', 'D1120', false, true, 'Gentle cleaning instruments'),
('Pulp Cap', 'Direct pulp capping', 3500.00, 45, 'Pediatric', 'D3110', true, true, 'Calcium hydroxide, MTA'),
('Stainless Steel Crown', 'Pediatric crown restoration', 4500.00, 45, 'Pediatric', 'D2930', true, false, 'SSC, cement'),

-- Emergency Treatments
('Emergency Pain Relief', 'Immediate pain management', 2000.00, 30, 'Emergency', 'D9110', true, false, 'Analgesics, temporary materials'),
('Temporary Filling', 'Emergency temporary restoration', 1500.00, 20, 'Emergency', 'D2940', false, true, 'Temporary filling material'),
('Abscess Drainage', 'Emergency abscess treatment', 3500.00, 45, 'Emergency', 'D7510', true, true, 'Drainage instruments, antibiotics'),

-- Orthodontic Treatments
('Metal Braces', 'Traditional metal braces', 75000.00, 120, 'Orthodontics', 'D8080', true, true, 'Metal brackets, wires'),
('Ceramic Braces', 'Tooth-colored ceramic braces', 95000.00, 120, 'Orthodontics', 'D8080', true, true, 'Ceramic brackets, wires'),
('Invisalign Treatment', 'Clear aligner therapy', 150000.00, 18, 'Orthodontics', 'D8090', false, true, 'Custom aligners'),
('Retainer Fabrication', 'Post-treatment retention', 8000.00, 30, 'Orthodontics', 'D8692', false, false, 'Retainer materials'),

-- Emergency Treatments (Additional)
('Emergency Treatment', 'Emergency dental care', 2000.00, 60, 'Emergency', 'D9110', true, false, 'Emergency medications');

-- Patients
INSERT INTO patients (first_name, last_name, email, patient_phone, date_of_birth, gender, address, city, state, postal_code, emergency_contact_name, emergency_contact_phone, medical_history, allergies, current_medications) VALUES
('Arjun', 'Singh', 'arjun.singh@email.com', '+91-98765-11111', '1985-03-15', 'Male', '123 MG Road', 'Mumbai', 'Maharashtra', '400001', 'Sunita Singh', '+91-98765-11112', 'No significant medical history', 'None known', 'None'),
('Kavita', 'Gupta', 'kavita.gupta@email.com', '+91-98765-22222', '1990-07-22', 'Female', '456 Sector 15', 'Gurgaon', 'Haryana', '122001', 'Rohit Gupta', '+91-98765-22223', 'Hypertension', 'Penicillin', 'Amlodipine 5mg'),
('Ravi', 'Iyer', 'ravi.iyer@email.com', '+91-98765-33333', '1978-12-10', 'Male', '789 Brigade Road', 'Bangalore', 'Karnataka', '560001', 'Lakshmi Iyer', '+91-98765-33334', 'Diabetes Type 2', 'Sulfa drugs', 'Metformin 500mg'),
('Neha', 'Joshi', 'neha.joshi@email.com', '+91-98765-44444', '1992-05-18', 'Female', '321 CP Tank', 'Mumbai', 'Maharashtra', '400004', 'Vikram Joshi', '+91-98765-44445', 'No medical issues', 'Latex', 'None'),
('Suresh', 'Reddy', 'suresh.reddy@email.com', '+91-98765-55555', '1965-09-25', 'Male', '654 Jubilee Hills', 'Hyderabad', 'Telangana', '500033', 'Kamala Reddy', '+91-98765-55556', 'Heart disease, High cholesterol', 'Aspirin', 'Atorvastatin 20mg'),
('Anita', 'Sharma', 'anita.sharma@email.com', '+91-98765-66666', '1988-01-30', 'Female', '987 Civil Lines', 'Delhi', 'Delhi', '110054', 'Raj Sharma', '+91-98765-66667', 'Asthma', 'Dust mites', 'Inhaler - Salbutamol'),
('Kiran', 'Kumar', 'kiran.kumar@email.com', '+91-98765-77777', '1995-11-08', 'Male', '111 Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', 'Sita Kumar', '+91-98765-77778', 'No medical history', 'None', 'None'),
('Deepika', 'Patel', 'deepika.patel@email.com', '+91-98765-88888', '1983-04-12', 'Female', '222 Satellite', 'Ahmedabad', 'Gujarat', '380015', 'Himesh Patel', '+91-98765-88889', 'Migraine', 'NSAIDs', 'Sumatriptan as needed');

-- Generate comprehensive sample cases with dental technical terms (Updated for new schema)
INSERT INTO cases (
    patient_id, doctor_id, case_status, priority, 
    chief_complaint, history_of_present_illness, clinical_findings, 
    intraoral_examination, extraoral_examination, oral_hygiene_status, 
    periodontal_status, tooth_charting, radiographic_findings,
    occlusion_analysis, tmj_evaluation, soft_tissue_examination,
    pain_scale, pain_location, pain_characteristics,
    bleeding_on_probing, pocket_depths, vitality_tests,
    differential_diagnosis, final_diagnosis, icd_10_code,
    treatment_plan, treatment_provided, medications_prescribed,
    post_treatment_instructions, follow_up_required, notes,
    total_cost, amount_paid, amount_pending
) VALUES 

-- Case 1: Comprehensive treatment case for Arjun (multiple treatments needed)
(1, 1, 'In Progress', 'High', 
 'In Progress', 'High',
 'Severe toothache in upper right side and broken front tooth',
 'Patient reports severe pain for past 3 days, started after eating hard food. Also has broken front tooth from accident 2 weeks ago affecting smile and confidence.',
 'Multiple carious lesions, fractured central incisor, gingival inflammation',
 'Tooth #3 (upper right first molar): Deep carious lesion with pulpal involvement. Tooth #8 (upper right central incisor): Crown fracture involving enamel and dentin. Gingiva: Generalized mild erythema and edema.',
 'No facial asymmetry or swelling. Slight tenderness on palpation over apical region of #3.',
 'Fair', 'Generalized mild gingivitis with BOP in posterior regions',
 '#3: Deep carious lesion, pulpal involvement; #8: Crown fracture; #14,#15: Superficial caries',
 'Periapical radiolucency associated with #3. Crown fracture of #8 visible on radiograph.',
 'Class I occlusion. Normal overbite and overjet.',
 'No TMJ symptoms or dysfunction reported',
 'Oral mucosa appears normal. Mild gingival inflammation around multiple teeth.',
 8, 'Upper right molar (#3)', 'Severe, throbbing pain, worse with hot/cold',
 'Positive BOP around teeth #2,#3,#14,#15',
 'Generalized 2-3mm pockets. #3: 4mm mesial pocket',
 '#3: Negative response to cold test and EPT. #8: Positive response indicating vital pulp',
 'Acute pulpitis #3 vs irreversible pulpitis. Crown fracture #8.',
 'Irreversible pulpitis #3. Complicated crown fracture #8.',
 'K08.1',
 'Phase 1: RCT #3, temporary restoration #8. Phase 2: Crown #3, Composite veneer #8. Phase 3: Preventive care and oral hygiene instruction.',
 'Emergency pain relief provided. Treatment planned in phases.',
 'Ibuprofen 400mg TID, Amoxicillin 500mg TID if infection develops',
 'Avoid hard foods. Cold compress for swelling. Return if pain worsens.',
 true, 'Complex case requiring multiple treatment modalities. Patient motivated for comprehensive care.',
 45000.00, 8000.00, 37000.00),

-- Case 2: Orthodontic case for Neha (multiple orthodontic treatments)
(4, 2, 'In Progress', 'Medium', 
 'In Progress', 'Medium',
 'Crooked teeth affecting smile and confidence',
 'Patient reports crooked front teeth since childhood. Wants to improve smile for upcoming wedding. No pain but difficulty in cleaning certain areas.',
 'Moderate anterior crowding, rotated laterals, Class I malocclusion',
 'Lower anterior crowding 6mm. Rotated lateral incisors. Mild plaque accumulation in crowded areas.',
 'Symmetric facial profile. Competent lips.',
 'Good', 'Healthy gingiva with minimal inflammation in crowded areas',
 'Lower anterior crowding. Rotated #7, #10. Otherwise normal tooth morphology.',
 'No pathology detected. Normal root length and morphology.',
 'Class I molar relationship. Increased overjet 5mm.',
 'No TMJ symptoms',
 'Healthy oral tissues throughout',
 0, 'None', 'No pain',
 'Mild BOP in crowded areas only',
 'Normal 1-2mm pockets throughout',
 'All teeth respond normally to vitality tests',
 'Orthodontic malocclusion vs cosmetic concerns only',
 'Class I malocclusion with moderate anterior crowding',
 'M26.4',
 'Comprehensive orthodontic treatment with clear aligners. Duration 18-24 months. Option for ceramic braces discussed.',
 'Initial consultation completed. Impressions taken for treatment planning.',
 'None required initially',
 'Excellent oral hygiene required during treatment. Regular check-ups every 6 weeks.',
 true, 'Motivated patient. Good oral hygiene. Excellent candidate for clear aligner therapy.',
 85000.00, 25000.00, 60000.00),

-- Case 3: Periodontal case for Suresh (multiple periodontal treatments needed)
(5, 1, 'In Progress', 'High', 
 'In Progress', 'High',
 'Bleeding gums and loose teeth',
 'Patient reports bleeding gums for 6 months, getting worse. Two lower teeth feel loose. Bad taste in mouth in mornings.',
 'Generalized moderate to severe periodontitis, tooth mobility',
 'Generalized 4-7mm pockets. Bleeding on probing throughout. Teeth #24, #25 Grade II mobility. Heavy calculus deposits.',
 'No facial swelling. Halitosis present.',
 'Poor', 'Generalized moderate to severe periodontitis',
 'Generalized bone loss. #24, #25: Grade II mobility. Heavy calculus and plaque.',
 'Generalized horizontal and vertical bone loss. Furcation involvement #19.',
 'Class I occlusion. Some mobility affecting function.',
 'No TMJ issues reported',
 'Gingiva: Generalized erythema, edema, and bleeding. Some areas of recession.',
 3, 'Generalized gum discomfort', 'Dull, constant discomfort',
 'Generalized positive BOP',
 'Generalized 4-7mm pockets. #24,#25: 6-7mm pockets',
 'All teeth vital except questionable response #25',
 'Generalized periodontitis vs aggressive periodontitis',
 'Generalized moderate to severe chronic periodontitis',
 'K05.3',
 'Phase I: Scaling and root planing (4 quadrants). Phase II: Surgical periodontal therapy if needed. Phase III: Maintenance.',
 'Initial debridement completed. SRP scheduled.',
 'Doxycycline 100mg daily x 10 days post-SRP',
 'Meticulous oral hygiene. Soft diet for 48 hours post-treatment. Chlorhexidine rinse.',
 true, 'Requires long-term periodontal maintenance. Patient counseled on importance of home care.',
 28000.00, 10000.00, 18000.00),

-- Case 4: Pediatric case for young patient (multiple pediatric treatments)
(7, 4, 'Completed', 'Medium', 
 'Completed', 'Medium',
 'Multiple cavities and toothache',
 'Patient reports cavities in back teeth causing food impaction and mild sensitivity. Parent reports child avoiding sweets due to discomfort.',
 'Multiple carious lesions in primary and permanent molars',
 'Primary molars: Multiple carious lesions. #19: MOD carious lesion. #30: DO carious lesion. Fair oral hygiene.',
 'No facial swelling. Normal appearance.',
 'Fair', 'Healthy gingiva around most teeth. Mild inflammation around carious teeth.',
 'Multiple carious lesions: #19 (MOD), #30 (DO), #K,#S (occlusal caries)',
 'Multiple radiolucent areas corresponding to clinical findings. No periapical pathology.',
 'Class I occlusion developing normally',
 'No TMJ symptoms',
 'Healthy oral mucosa throughout',
 4, 'Back teeth when eating sweets', 'Sharp pain with cold/sweet',
 'Minimal BOP',
 'Normal pocket depths for age',
 'All teeth respond positively to vitality tests',
 'Multiple dental caries vs arrested caries',
 'Multiple dental caries - moderate depth',
 'Z01.20',
 'Preventive program with fluoride. Restorative treatment for active caries. Oral hygiene instruction.',
 'Fluoride treatment applied. Composite restorations placed. Parent education provided.',
 'Children''s fluoride toothpaste',
 'Avoid sticky sweets. Good brushing twice daily. Fluoride rinse at bedtime.',
 true, 'Excellent cooperation. Parents very committed to preventive care.',
 12500.00, 12500.00, 0.00);

-- Case Treatments: Link treatments to cases (Many-to-Many relationship)
INSERT INTO case_treatments (case_id, treatment_id, tooth_numbers, treatment_status, treatment_date, cost, notes, anesthesia_used, anesthesia_type) VALUES

-- Case 1 (Arjun) - Multiple treatments for comprehensive care
(1, 11, '#3', 'Completed', CURRENT_DATE - INTERVAL '5 days', 12000.00, 'RCT completed in 2 sessions. Patient tolerated procedure well.', true, 'Lidocaine with epinephrine'),

(1, 8, '#3', 'In Progress', CURRENT_DATE + INTERVAL '7 days', 12000.00, 'Crown preparation completed. Impression taken. Temporary crown placed.', true, 'Lidocaine with epinephrine'), 
 '#3', 'In Progress', CURRENT_DATE + INTERVAL '7 days', 12000.00, 'Crown preparation completed. Impression taken. Temporary crown placed.', true, 'Lidocaine with epinephrine'),

(1, 6, '#8', 'Completed', CURRENT_DATE - INTERVAL '3 days', 2500.00, 'Composite restoration completed. Excellent esthetics achieved.', false, 'None'),

(1, 5, 'Full mouth', 'Planned', CURRENT_DATE + INTERVAL '14 days', 1500.00, 'Scheduled for preventive maintenance.', false, 'None'),

-- Case 2 (Neha) - Orthodontic treatment with multiple phases
((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Neha') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Orthodontic Consultation'), 
 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '14 days', 1000.00, 'Comprehensive orthodontic evaluation completed. Treatment plan developed.', false, 'None'),

((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Neha') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Invisalign Treatment'), 
 'Full mouth', 'In Progress', CURRENT_DATE - INTERVAL '7 days', 75000.00, 'Aligners 1-3 of 24 completed. Excellent patient compliance.', false, 'None'),

((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Neha') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Retainer Fabrication'), 
 'Full mouth', 'Planned', CURRENT_DATE + INTERVAL '365 days', 8000.00, 'To be fabricated upon completion of active treatment.', false, 'None'),

-- Case 3 (Suresh) - Comprehensive periodontal treatment
((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Suresh') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Deep Cleaning (SRP)'), 
 'Quadrant 1', 'Completed', CURRENT_DATE - INTERVAL '21 days', 2500.00, 'SRP quadrant 1 completed. Good patient response.', true, 'Lidocaine'),

((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Suresh') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Deep Cleaning (SRP)'), 
 'Quadrant 2', 'Completed', CURRENT_DATE - INTERVAL '14 days', 2500.00, 'SRP quadrant 2 completed. Reduced inflammation noted.', true, 'Lidocaine'),

((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Suresh') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Deep Cleaning (SRP)'), 
 'Quadrant 3', 'In Progress', CURRENT_DATE + INTERVAL '7 days', 2500.00, 'Scheduled for next week.', false, 'Lidocaine planned'),

((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Suresh') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Deep Cleaning (SRP)'), 
 'Quadrant 4', 'Planned', CURRENT_DATE + INTERVAL '14 days', 2500.00, 'Final quadrant scheduled.', false, 'Lidocaine planned'),

((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Suresh') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Gingivectomy'), 
 '#24, #25', 'Planned', CURRENT_DATE + INTERVAL '28 days', 4500.00, 'Planned if tissue response inadequate after SRP.', false, 'Local anesthesia planned'),

-- Case 4 (Kiran) - Multiple pediatric treatments
((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Kiran') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Pediatric Consultation'), 
 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '30 days', 600.00, 'Comprehensive pediatric examination completed.', false, 'None'),

((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Kiran') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Composite Filling'), 
 '#19', 'Completed', CURRENT_DATE - INTERVAL '14 days', 2500.00, 'MOD composite restoration completed successfully.', false, 'None'),

((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Kiran') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Composite Filling'), 
 '#30', 'Completed', CURRENT_DATE - INTERVAL '7 days', 2200.00, 'DO composite restoration completed.', false, 'None'),

((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Kiran') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Fluoride Treatment'), 
 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '7 days', 800.00, 'Fluoride varnish applied. Home care instructions given.', false, 'None'),

((SELECT id FROM cases WHERE patient_id = (SELECT id FROM patients WHERE first_name = 'Kiran') LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Dental Sealants'), 
 '#6, #11', 'Planned', CURRENT_DATE + INTERVAL '30 days', 2400.00, 'Sealants planned for newly erupted permanent molars.', false, 'None');

-- Additional cases for more patients to demonstrate multiple cases per patient

-- Kavita - Second case: Cosmetic treatment
INSERT INTO cases (
    patient_id, doctor_id, case_status, priority, 
    chief_complaint, history_of_present_illness, clinical_findings, 
    intraoral_examination, extraoral_examination, oral_hygiene_status, 
    periodontal_status, notes, total_cost, amount_paid, amount_pending
) VALUES 
((SELECT id FROM patients WHERE first_name = 'Kavita'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Priya Sharma'), 
 'Consultation', 'Low',
 'Wants whiter teeth for special occasion',
 'Patient satisfied with periodontal treatment outcome. Now interested in cosmetic whitening for upcoming family wedding.',
 'Healthy oral condition post-periodontal therapy. Slight tooth discoloration',
 'Excellent oral hygiene post-treatment. No active periodontal disease. Mild tooth staining.',
 'Normal facial appearance.',
 'Excellent', 'Healthy gingiva post-treatment. Stable periodontal condition.',
 'Second case for same patient - cosmetic focus after successful periodontal therapy.',
 8500.00, 0.00, 8500.00);

-- Add treatments for Kavita's second case
INSERT INTO case_treatments (case_id, treatment_id, tooth_numbers, treatment_status, treatment_date, cost, notes) VALUES
((SELECT c.id FROM cases c 
  JOIN patients p ON c.patient_id = p.id 
  WHERE p.first_name = 'Kavita' 
  AND c.chief_complaint LIKE '%whiter teeth%' LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Teeth Whitening (In-office)'), 
 'Full mouth', 'Planned', CURRENT_DATE + INTERVAL '10 days', 8500.00, 'In-office whitening scheduled after periodontal stability confirmed.');

-- Ravi - Multiple cases: Emergency and follow-up
INSERT INTO cases (
    patient_id, doctor_id, case_status, priority, 
    chief_complaint, history_of_present_illness, clinical_findings, 
    notes, total_cost, amount_paid, amount_pending
) VALUES 
((SELECT id FROM patients WHERE first_name = 'Ravi'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Amit Patel'), 
 'Completed', 'Emergency',
 'Broken tooth from accident',
 'Patient had cycling accident yesterday. Front tooth chipped.',
 'Fractured upper central incisor with sharp edges',
 'Emergency treatment completed successfully. Patient very satisfied with cosmetic outcome.',
 4500.00, 4500.00, 0.00),

((SELECT id FROM patients WHERE first_name = 'Ravi'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Rajesh Kumar'), 
 'In Progress', 'Medium',
 'Routine dental checkup and cleaning',
 'Patient returning for 6-month maintenance visit. No specific complaints.',
 'Generally good oral health. Some plaque accumulation',
 'Routine maintenance case. Patient maintains good oral hygiene.',
 2300.00, 1500.00, 800.00);

-- Add treatments for Ravi's cases
INSERT INTO case_treatments (case_id, treatment_id, tooth_numbers, treatment_status, treatment_date, cost, notes) VALUES
-- Emergency case
((SELECT c.id FROM cases c 
  JOIN patients p ON c.patient_id = p.id 
  WHERE p.first_name = 'Ravi' 
  AND c.chief_complaint LIKE '%Broken tooth%' LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Dental Bonding'), 
 '#8', 'Completed', CURRENT_DATE - INTERVAL '2 days', 4500.00, 'Emergency bonding completed. Excellent esthetic result.'),

-- Routine case
((SELECT c.id FROM cases c 
  JOIN patients p ON c.patient_id = p.id 
  WHERE p.first_name = 'Ravi' 
  AND c.chief_complaint LIKE '%Routine%' LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'General Consultation'), 
 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '1 day', 500.00, 'Routine examination completed.'),

((SELECT c.id FROM cases c 
  JOIN patients p ON c.patient_id = p.id 
  WHERE p.first_name = 'Ravi' 
  AND c.chief_complaint LIKE '%Routine%' LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Teeth Cleaning (Scaling)'), 
 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '1 day', 1500.00, 'Routine scaling completed.'),

((SELECT c.id FROM cases c 
  JOIN patients p ON c.patient_id = p.id 
  WHERE p.first_name = 'Ravi' 
  AND c.chief_complaint LIKE '%Routine%' LIMIT 1), 
 (SELECT id FROM treatments WHERE name = 'Fluoride Treatment'), 
 'Full mouth', 'Planned', CURRENT_DATE + INTERVAL '7 days', 800.00, 'Fluoride treatment scheduled for next visit.');
-- Case 1: Acute pulpitis
((SELECT id FROM patients WHERE first_name = 'Arjun'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Priya Sharma'), 
 (SELECT id FROM treatments WHERE name = 'Root Canal Treatment (Molar)'),
 'In Progress', 'Emergency',
 'Severe throbbing pain in upper left back tooth for 3 days',
 'Patient reports spontaneous pain, especially at night. Pain triggered by hot/cold stimuli and persists after stimulus removal. No relief with OTC analgesics.',
 'Deep carious lesion on tooth #26 (upper left first molar) with possible pulpal involvement',
 'Tooth #26: Deep occlusal cavity with undermined enamel. Gingiva appears normal. No swelling observed.',
 'No facial asymmetry. No lymphadenopathy. No trismus.',
 'Fair', 'Generalized gingivitis. No periodontal involvement noted.',
 '#26: Deep carious lesion, MO cavity classification',
 'Periapical radiograph shows radiolucent area approaching pulp chamber in #26. No periapical pathology visible.',
 'Class I occlusion. Slight premature contact on #26.',
 'No TMJ symptoms reported. Normal mouth opening.',
 'Oral mucosa appears healthy. Tongue and floor of mouth normal.',
 8, 'Tooth #26', 'Sharp, throbbing, radiating to temporal region',
 'No bleeding on probing in affected area',
 'Normal pocket depths 2-3mm around #26',
 'Negative response to cold test on #26. Positive response to electric pulp test (delayed)',
 'Reversible vs irreversible pulpitis. Deep caries.',
 'Irreversible pulpitis tooth #26. Deep caries.',
 'D3310',
 'Root canal therapy tooth #26 followed by crown restoration. Pain management with analgesics.',
 'Access cavity prepared. Pulp chamber accessed. Canals located and initial cleaning performed.',
 'Ibuprofen 400mg TID, Amoxicillin 500mg TID if signs of infection develop',
 'Avoid chewing on affected side. Soft diet for 24 hours. Return if severe pain persists.',
 true, 'RCT initiated. Patient responded well to local anesthesia. Follow-up in 1 week for continuation.',
 25000.00, 10000.00, 15000.00),

-- Case 2: Periodontal disease
((SELECT id FROM patients WHERE first_name = 'Kavita'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Rajesh Kumar'), 
 (SELECT id FROM treatments WHERE name = 'Deep Cleaning (SRP)'),
 'Consultation', 'High',
 'Bleeding gums and bad breath for 6 months',
 'Patient reports spontaneous gingival bleeding, especially during brushing. Persistent halitosis despite good oral hygiene attempts.',
 'Generalized chronic periodontitis with moderate bone loss',
 'Generalized gingival inflammation, edema, and bleeding. Plaque and calculus deposits. Pocket depths 4-7mm.',
 'No extraoral swelling. Slight malodor detected.',
 'Poor', 'Chronic periodontitis - moderate to severe. Generalized 4-7mm pockets.',
 'Generalized calculus deposits. Missing #18, #32. Mobility grade 1 on #31.',
 'Bitewing radiographs show horizontal bone loss of 30-50% in posterior regions. Calculus visible.',
 'Class I occlusion with some secondary trauma from occlusion',
 'No TMJ involvement',
 'Gingiva: erythematous, edematous, loss of stippling. No oral lesions noted.',
 2, 'Generalized gums', 'Dull aching, bleeding',
 'Positive bleeding on probing in all quadrants',
 'Generalized 4-7mm pockets. Deepest: #17MB-7mm, #31L-6mm',
 'Normal vitality responses on all teeth tested',
 'Chronic periodontitis vs aggressive periodontitis',
 'Chronic periodontitis - moderate to severe',
 'D4341',
 'Scaling and root planing (SRP) full mouth. Oral hygiene instruction. Re-evaluation in 6 weeks.',
 'Phase I therapy: SRP quadrants 1&4 completed. Patient education provided.',
 'Chlorhexidine 0.12% rinse BID for 2 weeks',
 'Soft diet for 24 hours. No smoking. Use prescribed mouth rinse. Gentle brushing with soft toothbrush.',
 true, 'Patient motivated for treatment. Good compliance expected. SRP remaining quadrants scheduled.',
 15000.00, 5000.00, 10000.00),

-- Case 3: Orthodontic consultation
((SELECT id FROM patients WHERE first_name = 'Neha'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Amit Patel'), 
 (SELECT id FROM treatments WHERE name = 'Orthodontic Consultation'),
 'Consultation', 'Medium',
 'Crowded teeth and desire for straighter smile',
 'Patient concerned about crowded lower anterior teeth. Difficulty cleaning between teeth. Esthetic concerns.',
 'Moderate crowding lower anterior. Class I malocclusion.',
 'Lower incisors crowded 4mm. Upper arch adequate space. All permanent teeth present except 3rd molars.',
 'Competent lips. Balanced facial profile. No asymmetry.',
 'Good', 'Gingiva healthy. No periodontal issues.',
 'All permanent teeth present except 3rd molars. Lower 4mm crowding.',
 'Panoramic radiograph shows all permanent teeth present. 3rd molars developing normally.',
 'Class I molar relationship. Class I canine relationship. Lower incisor crowding.',
 'No TMJ symptoms. Normal function.',
 'Healthy oral tissues. No pathology detected.',
 0, 'None', 'No pain',
 'No bleeding on probing',
 'Normal sulcus depths 1-3mm throughout',
 'Normal vitality responses all teeth',
 'Dental crowding vs need for extraction',
 'Lower anterior crowding 4mm. Class I malocclusion.',
 'D8010',
 'Treatment options: 1) Fixed appliances with IPR, 2) Clear aligners, 3) Lower premolar extraction. Discuss pros/cons.',
 'Clinical examination completed. Impressions taken for study models. Treatment options discussed.',
 'None required',
 'Consider treatment options. Return for treatment planning appointment if decides to proceed.',
 true, 'Motivated patient. Good oral hygiene. Excellent candidate for orthodontic treatment.',
 1000.00, 1000.00, 0.00),

-- Case 4: Pediatric restoration
((SELECT id FROM patients WHERE first_name = 'Ravi'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Sunita Reddy'), 
 (SELECT id FROM treatments WHERE name = 'Composite Filling'),
 'Completed', 'Medium',
 'Cavity in back tooth causing food impaction',
 'Patient reports food getting stuck in cavity of lower right back tooth. Mild sensitivity to cold.',
 'Moderate carious lesion on #30 (lower right first molar)',
 'Tooth #30: MOD carious lesion. Adequate tooth structure remaining. Gingiva normal.',
 'No facial swelling. Normal appearance.',
 'Good', 'Healthy gingiva. No periodontal concerns.',
 '#30: MOD carious lesion. Good remaining tooth structure.',
 'Bitewing shows radiolucent area in #30 not approaching pulp chamber.',
 'Class I occlusion. Normal contact relationships.',
 'No TMJ symptoms',
 'Healthy oral mucosa throughout',
 3, 'Tooth #30', 'Mild sensitivity to cold',
 'No bleeding on probing',
 'Normal pocket depths around #30',
 'Positive response to cold test and EPT on #30',
 'Dental caries vs arrested caries',
 'Dental caries #30 - moderate depth',
 'D2391',
 'Composite restoration #30 MOD. Caries removal and adhesive restoration.',
 'Local anesthesia administered. Caries removed completely. Composite restoration placed with proper isolation.',
 'Ibuprofen as needed for mild discomfort',
 'Avoid hard foods for 24 hours. Normal function after that. Good oral hygiene.',
 false, 'Treatment completed successfully. Patient comfortable. Restoration properly contoured and polished.',
 3500.00, 3500.00, 0.00);

-- Generate some sample appointments
INSERT INTO appointments (patient_id, doctor_id, treatment_id, appointment_time, appointment_date, status, purpose, notes)
SELECT 
    p.id,
    d.id,
    t.id,
    (ARRAY['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'])[floor(random() * 6 + 1)]::time,
    CURRENT_DATE + (random() * 30)::integer,
    CASE 
        WHEN random() < 0.2 THEN 'Completed'::appointment_status_type
        WHEN random() < 0.4 THEN 'Confirmed'::appointment_status_type
        WHEN random() < 0.6 THEN 'In Progress'::appointment_status_type
        ELSE 'Scheduled'::appointment_status_type
    END,
    'Routine dental appointment',
    'Patient confirmed attendance'
FROM patients p
CROSS JOIN doctors d
CROSS JOIN treatments t
WHERE random() < 0.2 -- Randomly select some combinations
LIMIT 15;

-- Generate some sample invoices
INSERT INTO invoices (patient_id, case_id, invoice_number, amount, status, due_date, payment_date, payment_method)
SELECT 
    c.patient_id,
    c.id,
    'INV-2024-' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
    c.total_cost,
    CASE 
        WHEN random() < 0.6 THEN 'Paid'::invoice_status_type
        WHEN random() < 0.8 THEN 'Pending'::invoice_status_type
        ELSE 'Overdue'::invoice_status_type
    END,
    CURRENT_DATE + (random() * 30)::integer,
    CASE WHEN random() < 0.6 THEN CURRENT_DATE - (random() * 10)::integer ELSE NULL END,
    CASE WHEN random() < 0.6 THEN (ARRAY['Cash', 'Card', 'UPI', 'Bank Transfer'])[floor(random() * 4 + 1)] ELSE NULL END
FROM cases c
WHERE random() < 0.8
LIMIT 15;

-- Enable Row Level Security (RLS) - Configure as needed
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your authentication setup)
-- For now, allow all operations (you should restrict this in production)
CREATE POLICY "Allow all operations" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON doctors FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON treatments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON cases FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON invoices FOR ALL USING (true);
