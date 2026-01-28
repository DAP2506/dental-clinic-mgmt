'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase, formatDate, formatCurrency } from '@/lib/supabase';
import { calculateAge, getInitials, getAvatarColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Stethoscope,
  Heart,
  Eye,
  TrendingUp,
  Edit,
  Save,
  X,
  DollarSign,
  Pill,
  Calendar as CalendarIcon,
  UserCheck,
  Trash2
} from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  patient_phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: string;
  allergies: string;
  current_medications: string;
  created_at: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
}

interface Treatment {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration_minutes: number;
}

interface CaseDetails {
  id: string;
  patient_id: string;
  doctor_id: string;
  case_status: string;
  priority: string;
  chief_complaint: string;
  history_of_present_illness: string;
  clinical_findings: string;
  intraoral_examination: string;
  extraoral_examination: string;
  oral_hygiene_status: string;
  periodontal_status: string;
  tooth_charting: string;
  radiographic_findings: string;
  occlusion_analysis: string;
  tmj_evaluation: string;
  soft_tissue_examination: string;
  hard_tissue_examination: string;
  pain_scale: number;
  pain_location: string;
  pain_characteristics: string;
  triggering_factors: string;
  relieving_factors: string;
  bleeding_on_probing: string;
  pocket_depths: string;
  gingival_recession: string;
  furcation_involvement: string;
  mobility_assessment: string;
  vitality_tests: string;
  percussion_tests: string;
  palpation_findings: string;
  thermal_tests: string;
  electric_pulp_test: string;
  differential_diagnosis: string;
  final_diagnosis: string;
  icd_10_code: string;
  cdt_code: string;
  treatment_plan: string;
  treatment_provided: string;
  treatment_outcome: string;
  medications_prescribed: string;
  post_treatment_instructions: string;
  follow_up_required: boolean;
  follow_up_date: string;
  notes: string;
  total_cost: number;
  amount_paid: number;
  amount_pending: number;
  created_at: string;
  updated_at: string;
  patients: Patient;
  authorized_users?: {
    id: string;
    email: string;
    full_name: string | null;
    specialization: string | null;
    phone: string | null;
    license_number: string | null;
  };
  case_treatments: CaseTreatment[];
}

interface CaseTreatment {
  id: string;
  case_id: string;
  treatment_id: string;
  tooth_numbers: string;
  treatment_status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  treatment_date: string;
  cost: number;
  notes: string;
  anesthesia_used: boolean;
  anesthesia_type: string;
  next_appointment_needed: boolean;
  created_at: string;
  updated_at: string;
  treatments: Treatment;
}

export default function CaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const caseId = params.id as string;

  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CaseDetails>>({});
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          patients(*),
          authorized_users!cases_doctor_user_id_fkey(id, email, full_name, specialization, phone, license_number),
          case_treatments(
            *,
            treatments(*)
          )
        `)
        .eq('id', caseId)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      setCaseDetails(data);
      setEditForm(data); // Initialize edit form with current data
    } catch (error) {
      console.error('Error fetching case details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm(caseDetails || {});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(caseDetails || {});
  };

  const handleDeleteCase = async () => {
    if (role !== 'admin') {
      alert('Only administrators can delete cases.');
      return;
    }

    if (!caseDetails) return;

    const patientName = `${caseDetails.patients.first_name} ${caseDetails.patients.last_name}`;
    const confirmMessage = `Are you sure you want to delete this case?\n\nPatient: ${patientName}\nDiagnosis: ${caseDetails.final_diagnosis || 'N/A'}\n\nThis will:\n- Mark the case as deleted\n- Hide it from case listings\n- Preserve all data for records\n\nNote: The case data will NOT be permanently removed and can be restored by an administrator if needed.`;
    
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
        .from('cases')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userEmail
        })
        .eq('id', caseId);

      if (error) throw error;

      alert('Case deleted successfully.');
      router.push(`/patients/${caseDetails.patient_id}`);
    } catch (error) {
      console.error('Error deleting case:', error);
      alert('Failed to delete case. Please try again or contact support.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!caseDetails) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('cases')
        .update({
          case_status: editForm.case_status,
          priority: editForm.priority,
          chief_complaint: editForm.chief_complaint,
          history_of_present_illness: editForm.history_of_present_illness,
          clinical_findings: editForm.clinical_findings,
          final_diagnosis: editForm.final_diagnosis,
          treatment_plan: editForm.treatment_plan,
          notes: editForm.notes,
          total_cost: editForm.total_cost,
          amount_paid: editForm.amount_paid,
          amount_pending: editForm.amount_pending,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (error) throw error;

      // Refresh the case details
      await fetchCaseDetails();
      setIsEditing(false);
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error updating case:', error);
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CaseDetails, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'In Progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'Cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Case Details</h1>
          </div>
          <div className="bg-white shadow rounded-lg animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!caseDetails || !caseDetails.patients || !caseDetails.case_treatments) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Case Details - Not Found</h1>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">The case you're looking for could not be found or has been deleted.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'clinical', label: 'Clinical Findings', icon: Stethoscope },
    { id: 'diagnosis', label: 'Diagnosis & Treatment', icon: Heart },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'follow-up', label: 'Follow-up', icon: CalendarIcon }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-3 py-2 border border-gray-300  shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700  bg-white  hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Case Details - {caseDetails.patients.first_name} {caseDetails.patients.last_name}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Case
                </button>
                <button
                  onClick={() => router.push(`/billing/new?caseId=${caseId}`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Create Invoice
                </button>
                <button
                  onClick={() => router.push(`/billing?caseId=${caseId}`)}
                  className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Invoices
                </button>
                {role === 'admin' && (
                  <button
                    onClick={handleDeleteCase}
                    disabled={deleting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete Case'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Case Summary Card */}
        <div className="bg-white  shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(0)}`}>
                  {getInitials(caseDetails.patients?.first_name || '', caseDetails.patients?.last_name || '')}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {caseDetails.patients?.first_name || ''} {caseDetails.patients?.last_name || ''}
                  </h2>
                  <p className="text-sm text-gray-500  mt-1">
                    {caseDetails.patients?.date_of_birth ? calculateAge(caseDetails.patients.date_of_birth) : 'N/A'} years • {caseDetails.patients?.gender || 'N/A'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{caseDetails.patients?.patient_phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{caseDetails.patients?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <select
                      value={editForm.case_status || caseDetails.case_status}
                      onChange={(e) => handleInputChange('case_status', e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Consultation">Consultation</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <>
                      {getStatusIcon(caseDetails.case_status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseDetails.case_status)}`}>
                        {caseDetails.case_status}
                      </span>
                    </>
                  )}
                </div>
                {isEditing ? (
                  <select
                    value={editForm.priority || caseDetails.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Emergency">Emergency Priority</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(caseDetails.priority)}`}>
                    {caseDetails.priority} Priority
                  </span>
                )}
                <p className="text-sm text-gray-500">
                  Created: {formatDate(caseDetails.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.total_cost || ''}
                    onChange={(e) => handleInputChange('total_cost', parseFloat(e.target.value) || 0)}
                    className="text-2xl font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 w-32"
                    placeholder="0"
                  />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(caseDetails.total_cost)}
                  </p>
                )}
                <p className="text-sm text-gray-500">Cost</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.amount_paid || ''}
                    onChange={(e) => handleInputChange('amount_paid', parseFloat(e.target.value) || 0)}
                    className="text-2xl font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 w-32"
                    placeholder="0"
                  />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(caseDetails.amount_paid)}
                  </p>
                )}
                <p className="text-sm text-gray-500">Paid</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.amount_pending || ''}
                    onChange={(e) => handleInputChange('amount_pending', parseFloat(e.target.value) || 0)}
                    className="text-2xl font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 w-32"
                    placeholder="0"
                  />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(caseDetails.amount_pending)}
                  </p>
                )}
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white  p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-lg font-semibold text-gray-900">
                  Dr. {caseDetails.authorized_users?.full_name || caseDetails.authorized_users?.email || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  {caseDetails.authorized_users?.specialization || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white  shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Chief Complaint</h3>
                    {isEditing ? (
                      <textarea
                        value={editForm.chief_complaint || ''}
                        onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Enter chief complaint..."
                      />
                    ) : (
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                        {caseDetails.chief_complaint || 'No chief complaint recorded'}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Treatments</h3>
                    <div className="space-y-3">
                      {caseDetails.case_treatments && caseDetails.case_treatments.length > 0 ? (
                        caseDetails.case_treatments.map((caseTreatment, index) => (
                          <div key={caseTreatment.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {caseTreatment.treatments.name}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {caseTreatment.treatments.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                    {caseTreatment.treatments.category}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    caseTreatment.treatment_status === 'Completed' ? 'bg-green-100 text-green-800' :
                                    caseTreatment.treatment_status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                    caseTreatment.treatment_status === 'Planned' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {caseTreatment.treatment_status}
                                  </span>
                                </div>
                                {caseTreatment.tooth_numbers && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    Tooth/Area: {caseTreatment.tooth_numbers}
                                  </p>
                                )}
                                {caseTreatment.notes && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Notes: {caseTreatment.notes}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-medium text-gray-900">
                                  ₹{caseTreatment.cost.toLocaleString('en-IN')}
                                </p>
                                {caseTreatment.treatment_date && (
                                  <p className="text-sm text-gray-500">
                                    {formatDate(caseTreatment.treatment_date)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-500">No treatments assigned to this case</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clinical Findings Section */}
                {(caseDetails.clinical_findings || isEditing) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Findings</h3>
                    {isEditing ? (
                      <textarea
                        value={editForm.clinical_findings || ''}
                        onChange={(e) => handleInputChange('clinical_findings', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Enter clinical findings..."
                      />
                    ) : (
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                        {caseDetails.clinical_findings}
                      </p>
                    )}
                  </div>
                )}

                {/* Follow-up Section */}
                {(caseDetails.follow_up_required || isEditing) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Follow-up</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {isEditing ? (
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editForm.follow_up_required || false}
                              onChange={(e) => handleInputChange('follow_up_required', e.target.checked)}
                              className="mr-2"
                            />
                            Follow-up required
                          </label>
                          {(editForm.follow_up_required || caseDetails.follow_up_date) && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                              <input
                                type="date"
                                value={editForm.follow_up_date || ''}
                                onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-900 font-medium">
                            {caseDetails.follow_up_required ? 'Follow-up Required' : 'No follow-up required'}
                          </p>
                          {caseDetails.follow_up_date && (
                            <p className="text-gray-600 text-sm mt-1">
                              Scheduled: {formatDate(caseDetails.follow_up_date)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(caseDetails.history_of_present_illness || isEditing) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">History of Present Illness</h3>
                    {isEditing ? (
                      <textarea
                        value={editForm.history_of_present_illness || ''}
                        onChange={(e) => handleInputChange('history_of_present_illness', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Enter history of present illness..."
                      />
                    ) : (
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                        {caseDetails.history_of_present_illness}
                      </p>
                    )}
                  </div>
                )}

                {(caseDetails.notes || isEditing) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                    {isEditing ? (
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Enter notes..."
                      />
                    ) : (
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                        {caseDetails.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'clinical' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {caseDetails.clinical_findings && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900  mb-4">Clinical Findings</h3>
                      <p className="text-gray-600  bg-gray-50  p-4 rounded-lg">
                        {caseDetails.clinical_findings}
                      </p>
                    </div>
                  )}

                  {caseDetails.intraoral_examination && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900  mb-4">Intraoral Examination</h3>
                      <p className="text-gray-600  bg-gray-50  p-4 rounded-lg">
                        {caseDetails.intraoral_examination}
                      </p>
                    </div>
                  )}

                  {caseDetails.extraoral_examination && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900  mb-4">Extraoral Examination</h3>
                      <p className="text-gray-600  bg-gray-50  p-4 rounded-lg">
                        {caseDetails.extraoral_examination}
                      </p>
                    </div>
                  )}

                  {caseDetails.oral_hygiene_status && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900  mb-4">Oral Hygiene Status</h3>
                      <p className="text-gray-600  bg-gray-50  p-4 rounded-lg">
                        {caseDetails.oral_hygiene_status}
                      </p>
                    </div>
                  )}

                  {caseDetails.periodontal_status && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900  mb-4">Periodontal Status</h3>
                      <p className="text-gray-600  bg-gray-50  p-4 rounded-lg">
                        {caseDetails.periodontal_status}
                      </p>
                    </div>
                  )}

                  {caseDetails.radiographic_findings && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900  mb-4">Radiographic Findings</h3>
                      <p className="text-gray-600  bg-gray-50  p-4 rounded-lg">
                        {caseDetails.radiographic_findings}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pain Assessment */}
                {caseDetails.pain_scale > 0 && (
                  <div className="bg-red-50  border border-red-200  rounded-lg p-6">
                    <h3 className="text-lg font-medium text-red-900  mb-4">Pain Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-red-800">Scale: {caseDetails.pain_scale}/10</p>
                        {caseDetails.pain_location && (
                          <p className="text-red-700  mt-2">Location: {caseDetails.pain_location}</p>
                        )}
                      </div>
                      <div>
                        {caseDetails.pain_characteristics && (
                          <p className="text-red-700">{caseDetails.pain_characteristics}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'diagnosis' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(caseDetails.differential_diagnosis || isEditing) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Differential Diagnosis</h3>
                      {isEditing ? (
                        <textarea
                          value={editForm.differential_diagnosis || ''}
                          onChange={(e) => handleInputChange('differential_diagnosis', e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          placeholder="Enter differential diagnosis..."
                        />
                      ) : (
                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                          {caseDetails.differential_diagnosis}
                        </p>
                      )}
                    </div>
                  )}

                  {(caseDetails.final_diagnosis || isEditing) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Final Diagnosis</h3>
                      {isEditing ? (
                        <textarea
                          value={editForm.final_diagnosis || ''}
                          onChange={(e) => handleInputChange('final_diagnosis', e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          placeholder="Enter final diagnosis..."
                        />
                      ) : (
                        <p className="text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                          {caseDetails.final_diagnosis}
                        </p>
                      )}
                    </div>
                  )}

                  {(caseDetails.treatment_plan || isEditing) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Treatment Plan</h3>
                      {isEditing ? (
                        <textarea
                          value={editForm.treatment_plan || ''}
                          onChange={(e) => handleInputChange('treatment_plan', e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          placeholder="Enter treatment plan..."
                        />
                      ) : (
                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                          {caseDetails.treatment_plan}
                        </p>
                      )}
                    </div>
                  )}

                  {(caseDetails.treatment_provided || isEditing) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Treatment Provided</h3>
                      {isEditing ? (
                        <textarea
                          value={editForm.treatment_provided || ''}
                          onChange={(e) => handleInputChange('treatment_provided', e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          placeholder="Enter treatment provided..."
                        />
                      ) : (
                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                          {caseDetails.treatment_provided}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Diagnostic Codes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {caseDetails.icd_10_code && (
                    <div className="bg-gray-50  p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900  mb-2">ICD-10 Code</h4>
                      <p className="text-gray-600  mt-1">{caseDetails.icd_10_code}</p>
                    </div>
                  )}

                  {caseDetails.cdt_code && (
                    <div className="bg-gray-50  p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900  mb-2">CDT Code</h4>
                      <p className="text-gray-600  mt-1">{caseDetails.cdt_code}</p>
                    </div>
                  )}
                </div>

                {/* Medications */}
                {caseDetails.medications_prescribed && (
                  <div className="bg-green-50  border border-green-200  rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Pill className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-medium text-green-900  mb-2">Prescribed</h3>
                    </div>
                    <p className="text-green-800">
                      {caseDetails.medications_prescribed}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50  border border-blue-200  rounded-lg p-6">
                    <h3 className="text-lg font-medium text-blue-900  mb-2">Total Cost</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCurrency(caseDetails.total_cost)}
                    </p>
                  </div>
                  <div className="bg-green-50  border border-green-200  rounded-lg p-6">
                    <h3 className="text-lg font-medium text-green-900  mb-2">Amount Paid</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(caseDetails.amount_paid)}
                    </p>
                  </div>
                  <div className="bg-orange-50  border border-orange-200  rounded-lg p-6">
                    <h3 className="text-lg font-medium text-orange-900  mb-2">Pending Amount</h3>
                    <p className="text-3xl font-bold text-orange-600">
                      {formatCurrency(caseDetails.amount_pending)}
                    </p>
                  </div>
                </div>
                <div className="bg-white  border border-gray-200  rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900  mb-4">Payment Progress</h3>
                  <div className="w-full bg-gray-200  rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${(caseDetails.amount_paid / caseDetails.total_cost) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600  mt-2">
                    {((caseDetails.amount_paid / caseDetails.total_cost) * 100).toFixed(1)}% paid
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'follow-up' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50  p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900  mb-4">Follow-up Required</h3>
                    <div className="flex items-center space-x-2">
                      {caseDetails.follow_up_required ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-gray-600">
                        {caseDetails.follow_up_required ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {caseDetails.follow_up_date && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">Date:</p>
                        <p className="text-gray-900  font-medium">{formatDate(caseDetails.follow_up_date)}</p>
                      </div>
                    )}
                  </div>

                  {caseDetails.post_treatment_instructions && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900  mb-4">Post-Treatment Instructions</h3>
                      <p className="text-gray-600  bg-yellow-50  p-4 rounded-lg border border-yellow-200">
                        {caseDetails.post_treatment_instructions}
                      </p>
                    </div>
                  )}
                </div>

                {caseDetails.treatment_outcome && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Treatment Outcome</h3>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                      {caseDetails.treatment_outcome}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Case updated successfully!
          </div>
        </div>
      )}

      {/* Error Notification */}
      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <X className="w-5 h-5 mr-2" />
            Error updating case. Please try again.
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
