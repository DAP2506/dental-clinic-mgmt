'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Save, X } from 'lucide-react'

interface Patient {
  id: string;
  first_name: string;
  last_name: string
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface Treatment {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
}

interface CaseFormData {
  patient_id: string;
  doctor_id: string;
  treatment_id: string;
  case_status: 'Consultation' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  // Chief complaint and clinical details
  chief_complaint: string;
  history_of_present_illness: string;
  clinical_findings: string;
  intraoral_examination: string;
  extraoral_examination: string;

  // Dental specific assessments
  oral_hygiene_status: 'Poor' | 'Fair' | 'Good' | 'Excellent' | '';
  periodontal_status: string;
  tooth_charting: string;
  radiographic_findings: string;

  // Additional dental examinations
  occlusion_analysis: string;
  tmj_evaluation: string;
  soft_tissue_examination: string;
  hard_tissue_examination: string;

  // Pain and symptom assessment
  pain_scale: number;
  pain_location: string;
  pain_characteristics: string;
  triggering_factors: string;
  relieving_factors: string;

  // Periodontal specific
  bleeding_on_probing: string;
  pocket_depths: string;
  gingival_recession: string;
  furcation_involvement: string;
  mobility_assessment: string;

  // Diagnostic tests
  vitality_tests: string;
  percussion_tests: string;
  palpation_findings: string;
  thermal_tests: string;
  electric_pulp_test: string;
  // Diagnosis and treatment
  differential_diagnosis: string;
  final_diagnosis: string;
  icd_10_code: string;
  cdt_code: string;
  treatment_plan: string;
  treatment_provided: string;
  treatment_outcome: string;
  // Medications and instructions
  medications_prescribed: string;
  post_treatment_instructions: string;
  follow_up_required: boolean;
  follow_up_date: string;

  // Administrative
  notes: string;
  total_cost: number;
}
interface CaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  caseData?: any;
  isEditing?: boolean;
}

export default function CaseForm({ isOpen, onClose, onSave, caseData, isEditing = false }: CaseFormProps) {
  const [formData, setFormData] = useState<CaseFormData>({
    patient_id: '',
    doctor_id: '',
    treatment_id: '',
    case_status: 'Consultation',
    priority: 'Medium',
    chief_complaint: '',
    history_of_present_illness: '',
    clinical_findings: '',
    intraoral_examination: '',
    extraoral_examination: '',
    oral_hygiene_status: '',
    periodontal_status: '',
    tooth_charting: '',
    radiographic_findings: '',

    // Additional dental examinations
    occlusion_analysis: '',
    tmj_evaluation: '',
    soft_tissue_examination: '',
    hard_tissue_examination: '',

    // Pain and symptom assessment
    pain_scale: 0,
    pain_location: '',
    pain_characteristics: '',
    triggering_factors: '',
    relieving_factors: '',

    // Periodontal specific
    bleeding_on_probing: '',
    pocket_depths: '',
    gingival_recession: '',
    furcation_involvement: '',
    mobility_assessment: '',

    // Diagnostic tests
    vitality_tests: '',
    percussion_tests: '',
    palpation_findings: '',
    thermal_tests: '',
    electric_pulp_test: '',

    // Diagnosis and treatment
    differential_diagnosis: '',
    final_diagnosis: '',
    icd_10_code: '',
    cdt_code: '',
    treatment_plan: '',
    treatment_provided: '',
    treatment_outcome: '',
    medications_prescribed: '',
    post_treatment_instructions: '',
    follow_up_required: false,
    follow_up_date: '',
    notes: '',
    total_cost: 0
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFormData();
      if (isEditing && caseData) {
        setFormData(caseData);
      }
    }
  }, [isOpen, caseData, isEditing]);

  const fetchFormData = async () => {
    try {
      // Fetch patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .order('first_name');
      // Fetch doctors
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, name, specialization')
        .order('name');
      // Fetch treatments
      const { data: treatmentsData } = await supabase
        .from('treatments')
        .select('id, name, description, category, price')
        .order('category, name');

      setPatients(patientsData || []);
      setDoctors(doctorsData || []);
      setTreatments(treatmentsData || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleTreatmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const treatmentId = e.target.value;
    const selectedTreatment = treatments.find(t => t.id === treatmentId);

    setFormData(prev => ({
      ...prev,
      treatment_id: treatmentId,
      total_cost: selectedTreatment?.price || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('cases')
          .update(formData)
          .eq('id', caseData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cases')
          .insert([formData]);

        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving case:', error);
      setError(error.message || 'Failed to save case');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">
              {isEditing ? 'Edit Case' : 'New Case'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900  mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Patient *
                  </label>
                  <select
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Doctor *
                  </label>
                  <select
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Treatment *
                  </label>
                  <select
                    name="treatment_id"
                    value={formData.treatment_id}
                    onChange={handleTreatmentChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Treatment</option>
                    {treatments.map(treatment => (
                      <option key={treatment.id} value={treatment.id}>
                        {treatment.name} - ₹{treatment.price.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Case Status
                  </label>
                  <select
                    name="case_status"
                    value={formData.case_status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Total Cost (₹)
                  </label>
                  <input
                    type="number"
                    name="total_cost"
                    value={formData.total_cost}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Chief Complaint and History */}
            <div>
              <h4 className="text-lg font-medium text-gray-900  mb-4">Chief Complaint & History</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Chief Complaint *
                  </label>
                  <textarea
                    name="chief_complaint"
                    value={formData.chief_complaint}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Patient's main complaint in their own words..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    History of Present Illness
                  </label>
                  <textarea
                    name="history_of_present_illness"
                    value={formData.history_of_present_illness}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Detailed history of current dental problem..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Clinical Examination */}
            <div>
              <h4 className="text-lg font-medium text-gray-900  mb-4">Clinical Examination</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Intraoral Examination
                  </label>
                  <textarea
                    name="intraoral_examination"
                    value={formData.intraoral_examination}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Findings from examination inside the mouth..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Extraoral Examination
                  </label>
                  <textarea
                    name="extraoral_examination"
                    value={formData.extraoral_examination}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Findings from examination outside the mouth..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Oral Hygiene Status
                  </label>
                  <select
                    name="oral_hygiene_status"
                    value={formData.oral_hygiene_status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    <option value="Poor">Poor</option>
                    <option value="Fair">Fair</option>
                    <option value="Good">Good</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Periodontal Status
                  </label>
                  <textarea
                    name="periodontal_status"
                    value={formData.periodontal_status}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Gum health, pocket depths, bleeding..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Tooth Charting
                  </label>
                  <textarea
                    name="tooth_charting"
                    value={formData.tooth_charting}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Tooth conditions, missing teeth, restorations..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Radiographic Findings
                  </label>
                  <textarea
                    name="radiographic_findings"
                    value={formData.radiographic_findings}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="X-ray findings, bone levels, pathology..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Additional Dental Examinations */}
            <div>
              <h4 className="text-lg font-medium text-gray-900  mb-4">Additional Dental Examinations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Occlusion Analysis
                  </label>
                  <textarea
                    name="occlusion_analysis"
                    value={formData.occlusion_analysis}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Class I/II/III malocclusion, bite analysis..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    TMJ Evaluation
                  </label>
                  <textarea
                    name="tmj_evaluation"
                    value={formData.tmj_evaluation}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="TMJ dysfunction, clicking, pain, range of motion..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Soft Tissue Examination
                  </label>
                  <textarea
                    name="soft_tissue_examination"
                    value={formData.soft_tissue_examination}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Gingival, mucosal conditions, tongue, floor of mouth..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Hard Tissue Examination
                  </label>
                  <textarea
                    name="hard_tissue_examination"
                    value={formData.hard_tissue_examination}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Enamel, dentin conditions, tooth structure..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Pain and Symptom Assessment */}
            <div>
              <h4 className="text-lg font-medium text-gray-900  mb-4">Pain & Symptom Assessment</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Pain Scale (0-10)
                  </label>
                  <input
                    type="number"
                    name="pain_scale"
                    value={formData.pain_scale}
                    onChange={handleInputChange}
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Pain Location
                  </label>
                  <input
                    type="text"
                    name="pain_location"
                    value={formData.pain_location}
                    onChange={handleInputChange}
                    placeholder="Specific tooth/area..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Pain Characteristics
                  </label>
                  <input
                    type="text"
                    name="pain_characteristics"
                    value={formData.pain_characteristics}
                    onChange={handleInputChange}
                    placeholder="Sharp, dull, throbbing..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Triggering Factors
                  </label>
                  <textarea
                    name="triggering_factors"
                    value={formData.triggering_factors}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Hot/cold, pressure, chewing..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Relieving Factors
                  </label>
                  <textarea
                    name="relieving_factors"
                    value={formData.relieving_factors}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Medications, positioning, cold/heat..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Periodontal Assessment */}
            <div>
              <h4 className="text-lg font-medium text-gray-900  mb-4">Periodontal Assessment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Bleeding on Probing
                  </label>
                  <textarea
                    name="bleeding_on_probing"
                    value={formData.bleeding_on_probing}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Areas of bleeding, percentage, severity..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Pocket Depths
                  </label>
                  <textarea
                    name="pocket_depths"
                    value={formData.pocket_depths}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Probing depths by tooth/area (mm)..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Gingival Recession
                  </label>
                  <textarea
                    name="gingival_recession"
                    value={formData.gingival_recession}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Recession measurements, Miller class..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Furcation Involvement
                  </label>
                  <textarea
                    name="furcation_involvement"
                    value={formData.furcation_involvement}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Grade I/II/III furcation involvement..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Mobility Assessment
                  </label>
                  <textarea
                    name="mobility_assessment"
                    value={formData.mobility_assessment}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Grade 0/I/II/III mobility by tooth..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            {/* Diagnostic Tests */}
            <div>
              <h4 className="text-lg font-medium text-gray-900  mb-4">Diagnostic Tests</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Vitality Tests
                  </label>
                  <textarea
                    name="vitality_tests"
                    value={formData.vitality_tests}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Pulp vitality test results by tooth..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Percussion Tests
                  </label>
                  <textarea
                    name="percussion_tests"
                    value={formData.percussion_tests}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Percussion test results, sensitivity..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Palpation Findings
                  </label>
                  <textarea
                    name="palpation_findings"
                    value={formData.palpation_findings}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Palpation of tissues, swelling, tenderness..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Thermal Tests
                  </label>
                  <textarea
                    name="thermal_tests"
                    value={formData.thermal_tests}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Hot/cold sensitivity tests..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Electric Pulp Test
                  </label>
                  <textarea
                    name="electric_pulp_test"
                    value={formData.electric_pulp_test}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="EPT results, response levels..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis and Treatment */}
            <div>
              <h4 className="text-lg font-medium text-gray-900  mb-4">Diagnosis & Treatment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Differential Diagnosis
                  </label>
                  <textarea
                    name="differential_diagnosis"
                    value={formData.differential_diagnosis}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Possible diagnoses to consider..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Final Diagnosis
                  </label>
                  <textarea
                    name="final_diagnosis"
                    value={formData.final_diagnosis}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Confirmed diagnosis..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Treatment Plan
                  </label>
                  <textarea
                    name="treatment_plan"
                    value={formData.treatment_plan}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Proposed treatment steps..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Treatment Provided
                  </label>
                  <textarea
                    name="treatment_provided"
                    value={formData.treatment_provided}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Treatment already completed..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Medications and Follow-up */}
            <div>
              <h4 className="text-lg font-medium text-gray-900  mb-4">Medications & Follow-up</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Medications Prescribed
                  </label>
                  <textarea
                    name="medications_prescribed"
                    value={formData.medications_prescribed}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Prescribed medications with dosage..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Post-treatment Instructions
                  </label>
                  <textarea
                    name="post_treatment_instructions"
                    value={formData.post_treatment_instructions}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Instructions for patient care..."
                    className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="follow_up_required"
                      checked={formData.follow_up_required}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Follow-up Required
                    </span>
                  </label>
                </div>

                {formData.follow_up_required && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700  mb-2">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      name="follow_up_date"
                      value={formData.follow_up_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any additional observations or notes..."
                className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : (isEditing ? 'Update Case' : 'Create Case')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
