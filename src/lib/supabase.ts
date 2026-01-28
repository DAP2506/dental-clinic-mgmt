import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Patient {
  id: string
  first_name: string
  last_name: string
  email?: string | null  // Email is now optional since phone is the unique identifier
  patient_phone: string  // This is now the unique identifier
  date_of_birth?: string | null
  gender: 'Male' | 'Female' | 'Other'
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  medical_history?: string | null
  allergies?: string | null
  current_medications?: string | null
  created_at: string
  updated_at: string
}

export interface Doctor {
  id: string
  email: string
  full_name: string | null
  role: string
  specialization: string | null
  phone: string | null
  license_number: string | null
  bio: string | null
  available_days: string | null
  available_hours: string | null
  is_active: boolean
  created_at: string
}

export interface Treatment {
  id: string
  name: string
  description: string
  price: number
  duration_minutes: number
  category: string
  created_at: string
}

export interface Case {
  id: string
  patient_id: string
  doctor_id: string // Legacy, still exists but deprecated
  doctor_user_id?: string // New field - references authorized_users.id
  case_status: 'Consultation' | 'In Progress' | 'Completed' | 'Cancelled'
  priority: 'Low' | 'Medium' | 'High' | 'Emergency'
  chief_complaint: string
  history_of_present_illness?: string
  clinical_findings?: string
  intraoral_examination?: string
  extraoral_examination?: string
  oral_hygiene_status?: string
  periodontal_status?: string
  tooth_charting?: string
  radiographic_findings?: string
  occlusion_analysis?: string
  tmj_evaluation?: string
  soft_tissue_examination?: string
  pain_scale?: number
  pain_location?: string
  pain_characteristics?: string
  triggering_factors?: string
  relieving_factors?: string
  bleeding_on_probing?: string
  pocket_depths?: string
  gingival_recession?: string
  furcation_involvement?: string
  mobility_assessment?: string
  vitality_tests?: string
  percussion_tests?: string
  palpation_findings?: string
  thermal_tests?: string
  electric_pulp_test?: string
  differential_diagnosis?: string
  final_diagnosis?: string
  icd_10_code?: string
  cdt_code?: string
  treatment_plan?: string
  treatment_provided?: string
  treatment_outcome?: string
  medications_prescribed?: string
  post_treatment_instructions?: string
  follow_up_required?: boolean
  follow_up_date?: string
  notes?: string
  total_cost: number
  amount_paid: number
  amount_pending: number
  created_at: string
  updated_at: string
  // Relations
  patients?: Patient
  doctors?: Doctor
  case_treatments?: CaseTreatment[]
}

export interface CaseTreatment {
  id: string
  case_id: string
  treatment_id: string
  tooth_numbers?: string
  treatment_status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled'
  treatment_date?: string
  duration_minutes?: number
  cost: number
  notes?: string
  anesthesia_used: boolean
  anesthesia_type?: string
  complications?: string
  post_treatment_notes?: string
  next_appointment_needed: boolean
  created_at: string
  updated_at: string
  // Relations
  cases?: Case
  treatments?: Treatment
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  case_id: string
  case_treatment_id?: string
  appointment_time: string
  appointment_date: string
  duration_minutes: number
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'
  purpose: string
  notes: string
  created_at: string
  // Relations
  patients?: Patient
  doctors?: Doctor
  cases?: Case
  case_treatments?: CaseTreatment
}

export interface Invoice {
  id: string
  patient_id: string
  case_id: string
  invoice_number: string
  amount: number
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
  due_date: string
  payment_date?: string
  payment_method?: string
  created_at: string
  // Relations
  patients?: Patient
  cases?: Case
}

// Utility functions for formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatTime = (time: string): string => {
  // Handle both time-only strings (HH:MM) and full datetime strings
  if (time.includes('T') || time.includes(' ')) {
    return new Date(time).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  // For time-only strings, create a dummy date
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Database utility functions
export const getPatient = async (id: string): Promise<Patient | null> => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching patient:', error)
    return null
  }
  
  return data
}

export const getPatientCases = async (patientId: string): Promise<Case[]> => {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      doctors(name, specialization),
      treatments(name, price)
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching patient cases:', error)
    return []
  }
  
  return data || []
}

export const getPatientAppointments = async (patientId: string): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      doctors(name, specialization),
      treatments(name)
    `)
    .eq('patient_id', patientId)
    .gte('appointment_date', new Date().toISOString().split('T')[0])
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
  
  if (error) {
    console.error('Error fetching patient appointments:', error)
    return []
  }
  
  return data || []
}
