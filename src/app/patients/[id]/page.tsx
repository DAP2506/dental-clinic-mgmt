'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { supabase, formatDate, type Patient } from '../../../lib/supabase';
import { getInitials, getAvatarColor, calculateAge, generateCaseId } from '../../../lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Edit,
  Calendar,
  FileText,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Trash2
} from 'lucide-react';

interface CaseWithRelations {
  id: string;
  patient_id: string;
  doctor_id: string;
  case_status: 'Consultation' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: string;
  chief_complaint: string;
  history_of_present_illness: string;
  clinical_findings: string;
  final_diagnosis: string;
  treatment_plan: string;
  notes: string;
  total_cost: number;
  amount_paid: number;
  amount_pending: number;
  created_at: string;
  updated_at: string;
  doctors?: {
    name: string;
    specialization: string;
  };
  case_treatments?: Array<{
    treatments: {
      name: string;
      category: string;
      price: number;
    }
  }>;
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

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [cases, setCases] = useState<CaseWithRelations[]>([]);
  const [allCases, setAllCases] = useState<CaseWithRelations[]>([]);
  const [casesCurrentPage, setCasesCurrentPage] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch patient details (check if deleted)
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .is('deleted_at', null)
        .single();

      if (patientError) {
        if (patientError.code === 'PGRST116') {
          setError('Patient not found or has been deleted');
          return;
        }
        throw patientError;
      }

      setPatient(patientData);

      // Fetch cases (with treatment and doctor information, exclude deleted)
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select(`
          *,
          doctors(name, specialization),
          case_treatments(
            treatments(name, category, price)
          )
        `)
        .eq('patient_id', patientId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (casesError && casesError.code !== 'PGRST116') {
        console.warn('Cases table might not exist:', casesError);
        setAllCases([]);
        setCases([]);
        setTotalCases(0);
      } else {
        const allCasesData = casesData || [];
        setAllCases(allCasesData);
        setTotalCases(allCasesData.length);
        
        // Set initial paginated cases
        const itemsPerPage = 5;
        const paginatedCases = allCasesData.slice(0, itemsPerPage);
        setCases(paginatedCases);
      }

      // Fetch invoices
      const { data: invoicesData, error: invoicesError} = await supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false});
      if (invoicesError && invoicesError.code !== 'PGRST116') {
        console.warn('Invoices table might not exist:', invoicesError);
        setInvoices([]);
      } else {
        setInvoices(invoicesData || []);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleCasesPagination = (page: number) => {
    const itemsPerPage = 5;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCases = allCases.slice(startIndex, endIndex);
    setCases(paginatedCases);
    setCasesCurrentPage(page);
  };

  const handleDeletePatient = async () => {
    if (role !== 'admin') {
      alert('Only administrators can delete patients.');
      return;
    }

    if (!patient) return;

    const confirmMessage = `Are you sure you want to delete patient ${patient.first_name} ${patient.last_name}?\n\nThis will:\n- Mark the patient as deleted\n- Hide them from the patient list\n- Preserve all data for records\n\nNote: The patient data will NOT be permanently removed and can be restored by an administrator if needed.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleting(true);

      // Get current user email for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'unknown';

      // Soft delete: Set deleted_at timestamp instead of actually deleting
      const { error } = await supabase
        .from('patients')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userEmail
        })
        .eq('id', patientId);

      if (error) throw error;

      alert(`Patient ${patient.first_name} ${patient.last_name} has been deleted successfully.`);
      router.push('/patients');
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Failed to delete patient. Please try again or contact support.');
    } finally {
      setDeleting(false);
    }
  };

  const getCaseStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Consultation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200  rounded w-64 mb-6"></div>
            <div className="bg-white  shadow rounded-lg p-6">
              <div className="h-64 bg-gray-200  rounded-lg"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !patient) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/patients"
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Link>
          </div>
          <div className="bg-white  shadow rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900  mb-2">
              {error || 'Patient Not Found'}
            </h3>
            <p className="text-gray-500  mb-4">
              The patient you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/patients"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const age = patient.date_of_birth ? calculateAge(patient.date_of_birth) : 0;
  const caseId = generateCaseId(patient.id);
  const activeCases = allCases.filter(c => c.case_status === 'In Progress' || c.case_status === 'Consultation');
  const unpaidInvoices = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue');
  
  const casesPerPage = 5;
  const totalCasesPages = Math.ceil(totalCases / casesPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/patients"
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/patients/${patient.id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Patient
            </Link>
            {role === 'admin' && (
              <button
                onClick={handleDeletePatient}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete Patient'}
              </button>
            )}
          </div>
        </div>

        {/* Patient Header Card */}
        <div className="bg-white  shadow rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ${getAvatarColor(parseInt(patient.id))}`}>
                {getInitials(patient.first_name, patient.last_name)}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {patient.first_name} {patient.last_name}
                </h1>
                <p className="text-lg text-gray-500">
                  Patient ID: {caseId}
                </p>
                <p className="text-gray-500">
                  {age > 0 ? `${age} years old` : 'Age not available'} • {patient.gender}
                </p>
                <p className="text-sm text-gray-500">
                  Registered on {formatDate(patient.created_at)}
                </p>
              </div>
              <div className="text-right">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50  p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalCases}
                    </div>
                    <div className="text-xs text-gray-500">Total Cases</div>
                  </div>
                  <div className="bg-yellow-50  p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {unpaidInvoices.length}
                    </div>
                    <div className="text-xs text-gray-500">Bills</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white  shadow rounded-lg border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900  mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number (Primary ID)</p>
                    <p className="text-gray-900 font-medium">
                      {patient.patient_phone || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">
                      {patient.email || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900">
                      {patient.address || 'Not provided'}
                      {patient.city && (
                        <>
                          <br />
                          {patient.city}, {patient.state} {patient.postal_code}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Medical Information */}
          <div className="bg-white  shadow rounded-lg border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900  mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Medical Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">History</p>
                  <p className="text-gray-900">
                    {patient.medical_history || 'No medical history recorded'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Medications</p>
                  <p className="text-gray-900">
                    {patient.current_medications || 'No current medications'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Allergies</p>
                  <p className="text-gray-900">
                    {patient.allergies || 'No known allergies'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Emergency Contact</p>
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
        {/* All Treatment Cases */}
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Treatment Cases
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Complete treatment history for this patient
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-500">
                  Showing {cases.length} of {totalCases} cases
                </p>
                <Link
                  href="/cases/new"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Case
                </Link>
              </div>
            </div>

            {cases.length > 0 ? (
              <div className="space-y-4">
                {cases.map((case_) => (
                  <div key={case_.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            Case #{generateCaseId(case_.id)}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCaseStatusColor(case_.case_status)}`}>
                            {case_.case_status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(case_.priority)}`}>
                            {case_.priority}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-500">Chief Complaint</p>
                            <p className="text-sm font-medium text-gray-900">
                              {case_.chief_complaint || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Final Diagnosis</p>
                            <p className="text-sm font-medium text-gray-900">
                              {case_.final_diagnosis || 'Pending diagnosis'}
                            </p>
                          </div>
                        </div>

                        {case_.case_treatments && case_.case_treatments.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-1">Treatments</p>
                            <div className="flex flex-wrap gap-2">
                              {case_.case_treatments.map((ct, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {ct.treatments.name} - ₹{ct.treatments.price.toLocaleString('en-IN')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {case_.doctors && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-500">Assigned Doctor</p>
                            <p className="text-sm font-medium text-gray-900">
                              Dr. {case_.doctors.name} - {case_.doctors.specialization}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ₹{case_.total_cost.toLocaleString('en-IN')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Paid: ₹{case_.amount_paid.toLocaleString('en-IN')}
                        </div>
                        {case_.amount_pending > 0 && (
                          <div className="text-sm font-medium text-red-600">
                            Pending: ₹{case_.amount_pending.toLocaleString('en-IN')}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          {formatDate(case_.updated_at)}
                        </div>
                        <Link
                          href={`/case/${case_.id}`}
                          className="inline-flex items-center px-2 py-1 mt-2 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No treatment cases found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This patient hasn't had any treatment cases yet.
                </p>
                <div className="mt-6">
                  <Link
                    href="/cases/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Case
                  </Link>
                </div>
              </div>
            )}
            
            {/* Cases Pagination */}
            {totalCasesPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handleCasesPagination(Math.max(1, casesCurrentPage - 1))}
                    disabled={casesCurrentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleCasesPagination(Math.min(totalCasesPages, casesCurrentPage + 1))}
                    disabled={casesCurrentPage === totalCasesPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(casesCurrentPage - 1) * casesPerPage + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(casesCurrentPage * casesPerPage, totalCases)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalCases}</span>
                      {' '}cases
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                      <button
                        onClick={() => handleCasesPagination(Math.max(1, casesCurrentPage - 1))}
                        disabled={casesCurrentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      {(() => {
                        const maxPagesToShow = 5;
                        let startPage = Math.max(1, casesCurrentPage - Math.floor(maxPagesToShow / 2));
                        let endPage = Math.min(totalCasesPages, startPage + maxPagesToShow - 1);
                        
                        if (endPage - startPage + 1 < maxPagesToShow) {
                          startPage = Math.max(1, endPage - maxPagesToShow + 1);
                        }
                        
                        const pages = [];
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handleCasesPagination(i)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                                casesCurrentPage === i
                                  ? 'bg-blue-600 text-white focus-visible:outline-blue-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        return pages;
                      })()}
                      
                      <button
                        onClick={() => handleCasesPagination(Math.min(totalCasesPages, casesCurrentPage + 1))}
                        disabled={casesCurrentPage === totalCasesPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="grid grid-cols-1 gap-6">
          {/* Pending Invoices */}
          <div className="bg-white  shadow rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900  flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pending Invoices
                </h2>
                <Link
                  href="/billing"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </Link>
              </div>
              {unpaidInvoices.length > 0 ? (
                <div className="space-y-3">
                  {unpaidInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50  rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          ₹{invoice.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1 capitalize">{invoice.status}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500  text-center py-4">
                  No pending invoices
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
