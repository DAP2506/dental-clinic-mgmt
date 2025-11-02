'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { supabase, formatDate, type Patient } from '@/lib/supabase';
import { getInitials, getAvatarColor, calculateAge, generateCaseId } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Clock,
  Activity,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Case {
  id: string;
  patient_id: string;
  case_status: 'Consultation' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';

  // Chief complaint and clinical details
  chief_complaint: string;
  history_of_present_illness: string;
  clinical_findings: string;
  intraoral_examination: string;
  extraoral_examination: string;

  // Dental specific assessments
  oral_hygiene_status: string;
  periodontal_status: string;
  tooth_charting: string;
  radiographic_findings: string;

  // Diagnosis and treatment
  differential_diagnosis: string;
  final_diagnosis: string;
  treatment_plan: string;
  treatment_provided: string;

  // Medications and instructions
  medications_prescribed: string;
  post_treatment_instructions: string;
  follow_up_required: boolean;
  follow_up_date: string;

  // Administrative
  notes: string;
  total_cost: number;
  amount_paid: number;
  amount_pending: number;
  created_at: string;
  updated_at: string;
    treatments?: {
      name: string;
      category: string;
      procedure_code: string;
    }[];
}

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  purpose?: string;
  notes?: string;
  created_at: string;
}

interface Invoice {
  id: string;
  patient_id: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  due_date: string;
  created_at: string;
  invoice_number: string;
}

interface PatientViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export default function PatientViewModal({ isOpen, onClose, patient }: PatientViewModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'cases' | 'appointments' | 'billing'>('info');
  const [cases, setCases] = useState<Case[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patient && activeTab !== 'info') {
      fetchPatientHistory();
    }
  }, [isOpen, patient, activeTab]);

  const fetchPatientHistory = async () => {
    if (!patient) return;

    setLoading(true);
    try {
      // Fetch cases with treatment information
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select(`
          *,
          treatments:treatments (
            name,
            category,
            procedure_code
          )
        `)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (!casesError) {
        setCases(casesData || []);
      }

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patient.id)
        .order('appointment_date', { ascending: false });

      if (!appointmentsError) {
        setAppointments(appointmentsData || []);
      }

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (!invoicesError) {
        setInvoices(invoicesData || []);
      }
    } catch (error) {
      console.error('Error fetching patient history:', error);
    } finally {
      setLoading(false);
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Progress':
      case 'Scheduled':
      case 'Confirmed':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'Completed':
      case 'Paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Consultation':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
      case 'Scheduled':
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Consultation':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!patient) return null;

  const age = calculateAge(patient.date_of_birth);
  const caseId = generateCaseId(patient.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Patient Details" size="xl">
      <div className="space-y-6">
        {/* Patient Header */}
        <div className="flex items-center space-x-4 p-4 bg-gray-50  rounded-lg">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(parseInt(patient.id))}`}>
            {getInitials(patient.first_name, patient.last_name)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h2>
            <p className="text-sm text-gray-500">
              Patient ID: {caseId}
            </p>
            <p className="text-sm text-gray-500">
              {age} years old • {patient.gender}
            </p>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'info', label: 'Information', icon: User },
            { id: 'cases', label: 'Cases', icon: FileText },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'billing', label: 'Billing', icon: CreditCard }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              type="button"
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900  mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{patient.email || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{patient.patient_phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-gray-900">
                        {patient.date_of_birth 
                          ? new Date(patient.date_of_birth).toLocaleDateString('en-IN')
                          : 'Not provided'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900  mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Address
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-900">{patient.address || 'Not provided'}</p>
                      <p className="text-gray-900">
                        {patient.city && patient.state ? `${patient.city}, ${patient.state}` : 'City, State not provided'}
                      </p>
                      <p className="text-gray-900">{patient.postal_code || 'Postal code not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900  mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Medical Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Medical History</label>
                    <p className="text-gray-900">{patient.medical_history || 'No medical history recorded'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Medications</label>
                    <p className="text-gray-900">{patient.current_medications || 'No current medications'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Allergies</label>
                    <p className="text-gray-900">{patient.allergies || 'No known allergies'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                    <p className="text-gray-900">
                      {patient.emergency_contact_name ?
                        `${patient.emergency_contact_name} - ${patient.emergency_contact_phone}` :
                        'Not provided'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'cases' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900  mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Treatment Cases
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                  <p className="text-gray-500">Loading treatment cases...</p>
                </div>
              ) : cases.length > 0 ? (
                <div className="space-y-4">
                  {cases.map((case_) => (
                    <div key={case_.id} className="border border-gray-200  rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {case_.treatments && case_.treatments.length > 0
                            ? case_.treatments.map((t) => t.name).join(', ')
                            : 'Treatment Not Found'}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(case_.case_status)}`}>
                          {getStatusIcon(case_.case_status)}
                          <span className="ml-1">{case_.case_status}</span>
                        </span>
                      </div>
                      <div className="space-y-3">
                        {case_.chief_complaint && (
                          <p className="text-sm text-gray-600">
                            <strong>Chief Complaint:</strong> {case_.chief_complaint}
                          </p>
                        )}
                        {case_.final_diagnosis && (
                          <p className="text-sm text-gray-600">
                            <strong>Diagnosis:</strong> {case_.final_diagnosis}
                          </p>
                        )}
                        {case_.treatment_plan && (
                          <p className="text-sm text-gray-600">
                            <strong>Treatment Plan:</strong> {case_.treatment_plan}
                          </p>
                        )}
                        {case_.oral_hygiene_status && (
                          <p className="text-sm text-gray-600">
                            <strong>Oral Hygiene:</strong> {case_.oral_hygiene_status}
                          </p>
                        )}
                        {case_.medications_prescribed && (
                          <p className="text-sm text-gray-600">
                            <strong>Medications:</strong> {case_.medications_prescribed}
                          </p>
                        )}
                        {case_.follow_up_required && (
                          <p className="text-sm text-blue-600">
                            <strong>Follow-up Required:</strong> {case_.follow_up_date ? new Date(case_.follow_up_date).toLocaleDateString('en-IN') : 'Date TBD'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Created: {formatDate(case_.created_at)}</span>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            Total: ₹{case_.total_cost.toLocaleString('en-IN')}
                          </div>
                          {case_.amount_pending > 0 && (
                            <div className="text-xs text-red-600">
                              Pending: ₹{case_.amount_pending.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No treatment cases found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900  mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Appointments
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                  <p className="text-gray-500">Loading appointments...</p>
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50  rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(appointment.appointment_date).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.appointment_time}
                        </p>
                        {appointment.purpose && (
                          <p className="text-sm text-gray-600">
                            {appointment.purpose}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1">{appointment.status}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments found</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'billing' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900  mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Billing & Invoices
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                  <p className="text-gray-500">Loading invoices...</p>
                </div>
              ) : invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50  rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {invoice.invoice_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          ₹{invoice.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1">{invoice.status}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No invoices found</p>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
    </Modal>
  );
}
