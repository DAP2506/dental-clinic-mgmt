-- Dental Clinic Management System Database Setup
-- Updated for Phone as Unique Identifier and Many-to-Many Case-Treatment Relationship

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS case_treatments CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS treatments CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS appointment_status_type CASCADE;
DROP TYPE IF EXISTS invoice_status_type CASCADE;

-- Create custom types
CREATE TYPE appointment_status_type AS ENUM ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show');
CREATE TYPE invoice_status_type AS ENUM ('Pending', 'Paid', 'Overdue', 'Cancelled');

-- Patients table (updated schema - phone as unique identifier)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255), -- Made nullable since phone is now the unique identifier
    patient_phone VARCHAR(20) UNIQUE NOT NULL, -- This is now the unique identifier
    date_of_birth DATE,
    gender VARCHAR(20) DEFAULT 'Male',
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    specialization VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Treatments table
CREATE TABLE treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 30,
    category VARCHAR(100),
    procedure_code VARCHAR(20),
    anesthesia_required BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT false,
    materials_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cases table (removed treatment_id since it's now many-to-many)
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    case_status VARCHAR(50) DEFAULT 'Consultation',
    priority VARCHAR(20) DEFAULT 'Medium',
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    clinical_findings TEXT,
    intraoral_examination TEXT,
    extraoral_examination TEXT,
    oral_hygiene_status VARCHAR(50),
    periodontal_status TEXT,
    tooth_charting TEXT,
    radiographic_findings TEXT,
    occlusion_analysis TEXT,
    tmj_evaluation TEXT,
    soft_tissue_examination TEXT,
    pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
    pain_location TEXT,
    pain_characteristics TEXT,
    bleeding_on_probing TEXT,
    pocket_depths TEXT,
    vitality_tests TEXT,
    differential_diagnosis TEXT,
    final_diagnosis TEXT,
    icd_10_code VARCHAR(20),
    treatment_plan TEXT,
    treatment_provided TEXT,
    medications_prescribed TEXT,
    post_treatment_instructions TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    notes TEXT,
    total_cost DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_pending DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Case Treatments junction table (Many-to-Many relationship)
CREATE TABLE case_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE RESTRICT,
    tooth_numbers TEXT, -- e.g., "#3, #4" or "Upper Right Quadrant"
    treatment_status VARCHAR(50) DEFAULT 'Planned', -- Planned, In Progress, Completed, Cancelled
    treatment_date DATE,
    cost DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    anesthesia_used BOOLEAN DEFAULT false,
    anesthesia_type VARCHAR(100),
    next_appointment_needed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(case_id, treatment_id, tooth_numbers) -- Prevent duplicate treatments for same case/tooth
);

-- Appointments table (updated to reference case_treatments for specific treatment sessions)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    case_treatment_id UUID REFERENCES case_treatments(id) ON DELETE SET NULL, -- Links to specific treatment
    appointment_time TIME NOT NULL,
    appointment_date DATE NOT NULL,
    status appointment_status_type DEFAULT 'Scheduled',
    purpose VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table (updated to reference cases)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status invoice_status_type DEFAULT 'Pending',
    due_date DATE,
    payment_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_patients_phone ON patients(patient_phone);
CREATE INDEX idx_patients_email ON patients(email);
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

-- Add triggers for updated_at timestamps
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

-- Sample Data
INSERT INTO doctors (name, specialization, phone, email, license_number) VALUES
('Dr. Rajesh Kumar', 'General Dentistry', '+91-98765-43210', 'rajesh.kumar@dentalcare.com', 'DL-12345'),
('Dr. Priya Sharma', 'Orthodontics', '+91-98765-43211', 'priya.sharma@dentalcare.com', 'DL-12346'),
('Dr. Amit Patel', 'Oral Surgery', '+91-98765-43212', 'amit.patel@dentalcare.com', 'DL-12347'),
('Dr. Sunita Reddy', 'Pediatric Dentistry', '+91-98765-43213', 'sunita.reddy@dentalcare.com', 'DL-12348');

-- Essential treatments
INSERT INTO treatments (name, description, price, duration_minutes, category, procedure_code, anesthesia_required, follow_up_required, materials_used) VALUES
('General Consultation', 'Comprehensive oral examination and consultation', 500.00, 30, 'Consultation', 'D0150', false, true, 'Examination instruments'),
('Emergency Consultation', 'Urgent dental problem evaluation', 800.00, 20, 'Emergency', 'D0140', false, true, 'Examination instruments'),
('Teeth Cleaning (Scaling)', 'Professional dental cleaning and polishing', 1500.00, 45, 'Preventive', 'D1110', false, true, 'Ultrasonic scaler, polishing paste'),
('Composite Filling', 'Tooth-colored filling for cavities', 2500.00, 60, 'Restorative', 'D2391', true, true, 'Composite resin, bonding agent'),
('Deep Cleaning (SRP)', 'Scaling and root planing for gum disease', 2500.00, 90, 'Periodontics', 'D4341', true, true, 'Ultrasonic scalers, curettes'),
('Ceramic Crown', 'Porcelain crown for damaged teeth', 12000.00, 120, 'Restorative', 'D2740', true, true, 'Ceramic material, cement'),
('Fluoride Treatment', 'Professional fluoride application', 800.00, 15, 'Preventive', 'D1206', false, false, 'Fluoride varnish'),
('Dental Sealants', 'Protective coating for molars', 1200.00, 30, 'Preventive', 'D1351', false, false, 'Sealant material'),
('Root Canal Treatment (Molar)', 'RCT for molar teeth', 12000.00, 150, 'Endodontics', 'D3330', true, true, 'Gutta-percha, sealer, files'),
('Simple Extraction', 'Simple tooth removal', 3000.00, 30, 'Oral Surgery', 'D7140', true, true, 'Forceps, elevators'),
('Orthodontic Consultation', 'Braces and alignment consultation', 1000.00, 45, 'Orthodontics', 'D8660', false, true, 'Examination instruments'),
('Invisalign Treatment', 'Clear aligner therapy', 75000.00, 45, 'Orthodontics', 'D8080', false, true, 'Clear aligners'),
('Retainer Fabrication', 'Post-treatment retention', 8000.00, 30, 'Orthodontics', 'D8692', false, false, 'Retainer materials'),
('Teeth Whitening (In-office)', 'Professional teeth whitening', 8500.00, 90, 'Cosmetic', 'D9972', false, false, 'Bleaching gel, light activation'),
('Gingivectomy', 'Gum tissue removal', 4500.00, 45, 'Periodontics', 'D4210', true, true, 'Surgical instruments'),
('Pediatric Consultation', 'Child dental examination', 600.00, 30, 'Pediatric', 'D0145', false, true, 'Child-friendly instruments');

-- Sample patients (phone as unique identifier)
INSERT INTO patients (first_name, last_name, email, patient_phone, date_of_birth, gender, address, city, state, postal_code, emergency_contact_name, emergency_contact_phone, medical_history, allergies, current_medications) VALUES
('Arjun', 'Singh', 'arjun.singh@email.com', '+91-98765-11111', '1985-03-15', 'Male', '123 MG Road', 'Mumbai', 'Maharashtra', '400001', 'Sunita Singh', '+91-98765-11112', 'No significant medical history', 'None known', 'None'),
('Kavita', 'Gupta', 'kavita.gupta@email.com', '+91-98765-22222', '1990-07-22', 'Female', '456 Sector 15', 'Gurgaon', 'Haryana', '122001', 'Rohit Gupta', '+91-98765-22223', 'Hypertension', 'Penicillin', 'Amlodipine 5mg'),
('Ravi', 'Iyer', 'ravi.iyer@email.com', '+91-98765-33333', '1978-12-10', 'Male', '789 Brigade Road', 'Bangalore', 'Karnataka', '560001', 'Lakshmi Iyer', '+91-98765-33334', 'Diabetes Type 2', 'Sulfa drugs', 'Metformin 500mg'),
('Neha', 'Joshi', 'neha.joshi@email.com', '+91-98765-44444', '1992-05-18', 'Female', '321 CP Tank', 'Mumbai', 'Maharashtra', '400004', 'Vikram Joshi', '+91-98765-44445', 'No medical issues', 'Latex', 'None'),
('Suresh', 'Reddy', 'suresh.reddy@email.com', '+91-98765-55555', '1965-09-25', 'Male', '654 Jubilee Hills', 'Hyderabad', 'Telangana', '500033', 'Kamala Reddy', '+91-98765-55556', 'Heart disease, High cholesterol', 'Aspirin', 'Atorvastatin 20mg'),
('Anita', 'Sharma', 'anita.sharma@email.com', '+91-98765-66666', '1988-01-30', 'Female', '987 Civil Lines', 'Delhi', 'Delhi', '110054', 'Raj Sharma', '+91-98765-66667', 'Asthma', 'Dust mites', 'Inhaler - Salbutamol'),
('Kiran', 'Kumar', 'kiran.kumar@email.com', '+91-98765-77777', '1995-11-08', 'Male', '111 Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', 'Sita Kumar', '+91-98765-77778', 'No medical history', 'None', 'None'),
('Deepika', 'Patel', 'deepika.patel@email.com', '+91-98765-88888', '1983-04-12', 'Female', '222 Satellite', 'Ahmedabad', 'Gujarat', '380015', 'Himesh Patel', '+91-98765-88889', 'Migraine', 'NSAIDs', 'Sumatriptan as needed');

-- Sample cases
INSERT INTO cases (
    patient_id, doctor_id, case_status, priority, 
    chief_complaint, history_of_present_illness, clinical_findings, 
    final_diagnosis, treatment_plan, notes,
    total_cost, amount_paid, amount_pending
) VALUES 
-- Case 1: Arjun needs multiple treatments
((SELECT id FROM patients WHERE patient_phone = '+91-98765-11111'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Rajesh Kumar'), 
 'In Progress', 'High',
 'Severe toothache in upper right side and broken front tooth',
 'Patient reports severe pain for past 3 days, started after eating hard food. Also has broken front tooth from accident 2 weeks ago affecting smile and confidence.',
 'Multiple carious lesions, fractured central incisor, gingival inflammation',
 'Irreversible pulpitis #3. Complicated crown fracture #8.',
 'Phase 1: RCT #3, temporary restoration #8. Phase 2: Crown #3, Composite veneer #8. Phase 3: Preventive care and oral hygiene instruction.',
 'Complex case requiring multiple treatment modalities. Patient motivated for comprehensive care.',
 28000.00, 8000.00, 20000.00),

-- Case 2: Neha orthodontic case
((SELECT id FROM patients WHERE patient_phone = '+91-98765-44444'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Priya Sharma'), 
 'In Progress', 'Medium',
 'Crooked teeth affecting smile and confidence',
 'Patient reports crooked front teeth since childhood. Wants to improve smile for upcoming wedding. No pain but difficulty in cleaning certain areas.',
 'Moderate anterior crowding, rotated laterals, Class I malocclusion',
 'Dental crowding with orthodontic correction needed',
 'Phase 1: Orthodontic consultation and planning. Phase 2: Invisalign treatment. Phase 3: Retention phase.',
 'Motivated patient. Good oral hygiene. Excellent candidate for clear aligner therapy.',
 84000.00, 25000.00, 59000.00),

-- Case 3: Suresh periodontal case
((SELECT id FROM patients WHERE patient_phone = '+91-98765-55555'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Rajesh Kumar'), 
 'In Progress', 'High',
 'Bleeding gums and loose teeth',
 'Patient reports bleeding gums for 6 months, getting worse. Two lower teeth feel loose. Bad taste in mouth in mornings.',
 'Generalized moderate to severe periodontitis, tooth mobility',
 'Chronic periodontitis with localized tooth mobility',
 'Comprehensive periodontal therapy: SRP all quadrants, followed by surgical intervention if needed.',
 'Requires long-term periodontal maintenance. Patient counseled on importance of home care.',
 15000.00, 5000.00, 10000.00),

-- Case 4: Kiran pediatric case
((SELECT id FROM patients WHERE patient_phone = '+91-98765-77777'), 
 (SELECT id FROM doctors WHERE name = 'Dr. Sunita Reddy'), 
 'Completed', 'Medium',
 'Multiple cavities and toothache',
 'Patient reports cavities in back teeth causing food impaction and mild sensitivity. Parent reports child avoiding sweets due to discomfort.',
 'Multiple carious lesions in primary and permanent molars',
 'Early childhood caries with permanent molar involvement',
 'Comprehensive restorative treatment with preventive measures.',
 'Treatment completed successfully. Regular follow-ups scheduled.',
 5700.00, 5700.00, 0.00);

-- Case treatments (Many-to-Many relationship)
INSERT INTO case_treatments (case_id, treatment_id, tooth_numbers, treatment_status, treatment_date, cost, notes, anesthesia_used, anesthesia_type) VALUES
-- Case 1 (Arjun) - Multiple treatments
((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-11111'), 
 (SELECT id FROM treatments WHERE name = 'Root Canal Treatment (Molar)'), 
 '#3', 'Completed', CURRENT_DATE - INTERVAL '5 days', 12000.00, 'RCT completed in 2 sessions. Patient tolerated procedure well.', true, 'Lidocaine with epinephrine'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-11111'), 
 (SELECT id FROM treatments WHERE name = 'Ceramic Crown'), 
 '#3', 'Planned', CURRENT_DATE + INTERVAL '7 days', 12000.00, 'Crown planned after RCT healing.', true, 'Lidocaine with epinephrine'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-11111'), 
 (SELECT id FROM treatments WHERE name = 'Composite Filling'), 
 '#8', 'Completed', CURRENT_DATE - INTERVAL '3 days', 2500.00, 'Composite restoration completed. Excellent esthetics achieved.', false, 'None'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-11111'), 
 (SELECT id FROM treatments WHERE name = 'Teeth Cleaning (Scaling)'), 
 'Full mouth', 'Planned', CURRENT_DATE + INTERVAL '14 days', 1500.00, 'Scheduled for preventive maintenance.', false, 'None'),

-- Case 2 (Neha) - Orthodontic treatments
((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-44444'), 
 (SELECT id FROM treatments WHERE name = 'Orthodontic Consultation'), 
 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '14 days', 1000.00, 'Comprehensive orthodontic evaluation completed.', false, 'None'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-44444'), 
 (SELECT id FROM treatments WHERE name = 'Invisalign Treatment'), 
 'Full mouth', 'In Progress', CURRENT_DATE - INTERVAL '7 days', 75000.00, 'Aligners 1-3 of 24 completed. Excellent patient compliance.', false, 'None'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-44444'), 
 (SELECT id FROM treatments WHERE name = 'Retainer Fabrication'), 
 'Full mouth', 'Planned', CURRENT_DATE + INTERVAL '365 days', 8000.00, 'To be fabricated upon completion of active treatment.', false, 'None'),

-- Case 3 (Suresh) - Periodontal treatments
((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-55555'), 
 (SELECT id FROM treatments WHERE name = 'Deep Cleaning (SRP)'), 
 'Quadrant 1', 'Completed', CURRENT_DATE - INTERVAL '21 days', 2500.00, 'SRP quadrant 1 completed. Good patient response.', true, 'Lidocaine'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-55555'), 
 (SELECT id FROM treatments WHERE name = 'Deep Cleaning (SRP)'), 
 'Quadrant 2', 'Completed', CURRENT_DATE - INTERVAL '14 days', 2500.00, 'SRP quadrant 2 completed. Reduced inflammation noted.', true, 'Lidocaine'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-55555'), 
 (SELECT id FROM treatments WHERE name = 'Deep Cleaning (SRP)'), 
 'Quadrant 3', 'In Progress', CURRENT_DATE + INTERVAL '7 days', 2500.00, 'Scheduled for next week.', false, 'Lidocaine planned'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-55555'), 
 (SELECT id FROM treatments WHERE name = 'Deep Cleaning (SRP)'), 
 'Quadrant 4', 'Planned', CURRENT_DATE + INTERVAL '14 days', 2500.00, 'Final quadrant scheduled.', false, 'Lidocaine planned'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-55555'), 
 (SELECT id FROM treatments WHERE name = 'Gingivectomy'), 
 '#24, #25', 'Planned', CURRENT_DATE + INTERVAL '28 days', 4500.00, 'Planned if tissue response inadequate after SRP.', false, 'Local anesthesia planned'),

-- Case 4 (Kiran) - Pediatric treatments
((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-77777'), 
 (SELECT id FROM treatments WHERE name = 'Pediatric Consultation'), 
 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '30 days', 600.00, 'Comprehensive pediatric examination completed.', false, 'None'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-77777'), 
 (SELECT id FROM treatments WHERE name = 'Composite Filling'), 
 '#19', 'Completed', CURRENT_DATE - INTERVAL '14 days', 2500.00, 'MOD composite restoration completed successfully.', false, 'None'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-77777'), 
 (SELECT id FROM treatments WHERE name = 'Composite Filling'), 
 '#30', 'Completed', CURRENT_DATE - INTERVAL '7 days', 2200.00, 'DO composite restoration completed.', false, 'None'),

((SELECT c.id FROM cases c JOIN patients p ON c.patient_id = p.id WHERE p.patient_phone = '+91-98765-77777'), 
 (SELECT id FROM treatments WHERE name = 'Fluoride Treatment'), 
 'Full mouth', 'Completed', CURRENT_DATE - INTERVAL '7 days', 800.00, 'Fluoride varnish applied. Home care instructions given.', false, 'None');

-- Sample appointments
INSERT INTO appointments (patient_id, doctor_id, case_id, case_treatment_id, appointment_time, appointment_date, status, purpose, notes)
SELECT 
    c.patient_id,
    c.doctor_id,
    c.id,
    ct.id,
    '14:00'::time,
    CURRENT_DATE + INTERVAL '1 week',
    'Scheduled'::appointment_status_type,
    'Treatment: ' || t.name,
    'Follow-up appointment for case treatment'
FROM cases c
JOIN case_treatments ct ON ct.case_id = c.id
JOIN treatments t ON t.id = ct.treatment_id
WHERE ct.treatment_status = 'Planned'
LIMIT 5;

-- Sample invoices
INSERT INTO invoices (patient_id, case_id, invoice_number, amount, status, due_date, payment_date, payment_method)
SELECT 
    c.patient_id,
    c.id,
    'INV-2024-' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
    c.total_cost,
    CASE 
        WHEN c.amount_pending = 0 THEN 'Paid'::invoice_status_type
        ELSE 'Pending'::invoice_status_type
    END,
    CURRENT_DATE + INTERVAL '30 days',
    CASE WHEN c.amount_pending = 0 THEN CURRENT_DATE - INTERVAL '5 days' ELSE NULL END,
    CASE WHEN c.amount_pending = 0 THEN 'UPI' ELSE NULL END
FROM cases c
LIMIT 4;

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your authentication setup)
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
