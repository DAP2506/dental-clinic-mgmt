'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Save, 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

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

interface Treatment {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration_minutes: number;
}

interface Doctor {
  id: string;
  email: string;
  full_name: string | null;
  specialization: string | null;
  role: string;
}

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showNewPatientCreated, setShowNewPatientCreated] = useState(false);

  // Patient search and selection
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // New patient form data (simplified)
  const [newPatientData, setNewPatientData] = useState({
    first_name: '',
    last_name: '',
    patient_phone: '',
  });

  // Treatments and doctors
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedTreatments, setSelectedTreatments] = useState<Treatment[]>([]); // Changed to array for multiple treatments
  const [treatmentSearchTerm, setTreatmentSearchTerm] = useState('');

  // Case form data
  const [caseData, setCaseData] = useState({
    doctor_id: '',
    case_status: 'Consultation' as 'Consultation' | 'In Progress' | 'Completed' | 'Cancelled',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Emergency',
    chief_complaint: '',
    history_of_present_illness: '',
    clinical_findings: '',
    total_cost: 0,
    amount_paid: 0,
    amount_pending: 0,
  });

  useEffect(() => {
    fetchTreatments();
    fetchDoctors();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.patient-search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (patientSearchTerm.trim().length >= 1) { // Changed from 2 to 1
        searchPatients(patientSearchTerm);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearchTerm]);

  useEffect(() => {
    // Recalculate total cost when selected treatments change
    const total = selectedTreatments.reduce((sum, treatment) => sum + treatment.price, 0);
    setCaseData(prev => ({
      ...prev,
      total_cost: total,
      amount_pending: total - prev.amount_paid
    }));
  }, [selectedTreatments]);

  const fetchTreatments = async () => {
    try {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .order('name');

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Error fetching treatments:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('id, email, full_name, specialization, role')
        .eq('role', 'doctor')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const searchPatients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchingPatient(true);
    try {
      // Try the original search first
      let { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .order('first_name')
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      // If no results with original search, try a more permissive search
      if (!data || data.length === 0) {
        const result = await supabase
          .from('patients')
          .select('*')
          .ilike('first_name', `%${searchTerm}%`)
          .order('first_name')
          .limit(10);

        if (!result.error && result.data && result.data.length > 0) {
          data = result.data;
        } else {
          // Try searching last name separately
          const lastNameResult = await supabase
            .from('patients')
            .select('*')
            .ilike('last_name', `%${searchTerm}%`)
            .order('first_name')
            .limit(10);

          if (!lastNameResult.error && lastNameResult.data) {
            data = lastNameResult.data;
          }
        }
      }

      setSearchResults(data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching patients:', error);
      setErrorMessage('Error searching for patients. Please check console for details.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      setSearchResults([]);
    } finally {
      setSearchingPatient(false);
    }
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearchTerm(`${patient.first_name} ${patient.last_name}`);
    setIsNewPatient(false);
    setShowDropdown(false);
    await fetchPatientHistory(patient.id);
  };

  const handleNewPatientOption = () => {
    setSelectedPatient(null);
    setIsNewPatient(true);
    setShowDropdown(false);
    setPatientHistory([]);
    // Extract name from search term for new patient
    const nameParts = patientSearchTerm.trim().split(' ');
    setNewPatientData({
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      patient_phone: '',
    });
  };

  const fetchPatientHistory = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          treatments (name, description),
          doctors (name)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatientHistory(data || []);
    } catch (error) {
      console.error('Error fetching patient history:', error);
    }
  };

  const createPatient = async () => {
    try {
      const patientToCreate = {
        first_name: newPatientData.first_name,
        last_name: newPatientData.last_name,
        patient_phone: newPatientData.patient_phone, // This is now unique
        // All other fields are now nullable, so we can omit them or set to null
        email: null,
        date_of_birth: null,
        gender: 'Male' as const, // Default value
        address: null,
        city: null,
        state: null,
        postal_code: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        medical_history: null,
        allergies: null,
        current_medications: null,
      };

      const { data, error } = await supabase
        .from('patients')
        .insert([patientToCreate])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  };

  const handleTreatmentSelect = (treatment: Treatment) => {
    // Check if treatment is already selected
    const isAlreadySelected = selectedTreatments.find(t => t.id === treatment.id);
    
    if (isAlreadySelected) {
      // Remove treatment if already selected
      setSelectedTreatments(prev => prev.filter(t => t.id !== treatment.id));
    } else {
      // Add treatment to selection
      setSelectedTreatments(prev => [...prev, treatment]);
    }
    
    // Update total cost
    updateTotalCostFromTreatments();
  };

  const updateTotalCostFromTreatments = () => {
    const total = selectedTreatments.reduce((sum, treatment) => sum + treatment.price, 0);
    setCaseData(prev => ({
      ...prev,
      total_cost: total,
      amount_pending: total - prev.amount_paid
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient && !isNewPatient) {
      setErrorMessage('Please search for a patient or create a new one');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      return;
    }

    if (isNewPatient) {
      if (!newPatientData.first_name.trim() || !newPatientData.last_name.trim() || !newPatientData.patient_phone.trim()) {
        setErrorMessage('Please fill in all required patient fields (name and phone number)');
        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 3000);
        return;
      }

      // Check if phone number already exists
      try {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id, first_name, last_name')
          .eq('patient_phone', newPatientData.patient_phone.trim())
          .single();

        if (existingPatient) {
          setErrorMessage(`Phone number already exists for patient: ${existingPatient.first_name} ${existingPatient.last_name}`);
          setShowErrorMessage(true);
          setTimeout(() => setShowErrorMessage(false), 5000);
          return;
        }
      } catch (error: any) {
        // If error is PGRST116, it means no patient found, which is good
        if (error?.code !== 'PGRST116') {
          console.error('Error checking phone number:', error);
          setErrorMessage('Error validating phone number');
          setShowErrorMessage(true);
          setTimeout(() => setShowErrorMessage(false), 3000);
          return;
        }
      }
    }

    if (selectedTreatments.length === 0) {
      setErrorMessage('Please select at least one treatment');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      return;
    }

    if (!caseData.doctor_id) {
      setErrorMessage('Please select a doctor');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      return;
    }

    if (!caseData.chief_complaint.trim()) {
      setErrorMessage('Please enter the chief complaint');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      return;
    }

    setLoading(true);
    try {
      let patientId = selectedPatient?.id;
      let patientCreated = false;

      // Create new patient if needed
      if (isNewPatient) {
        const newPatient = await createPatient();
        patientId = newPatient.id;
        patientCreated = true;
      }

      // Create the case (without treatment_id since it's now many-to-many)
      const caseToCreate = {
        patient_id: patientId,
        doctor_id: caseData.doctor_id,
        case_status: caseData.case_status,
        priority: caseData.priority,
        chief_complaint: caseData.chief_complaint,
        history_of_present_illness: caseData.history_of_present_illness,
        clinical_findings: caseData.clinical_findings,
        total_cost: caseData.total_cost,
        amount_paid: caseData.amount_paid,
        amount_pending: caseData.amount_pending,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: caseResult, error: caseError } = await supabase
        .from('cases')
        .insert([caseToCreate])
        .select()
        .single();

      if (caseError) throw caseError;

      // Now create case_treatments entries for each selected treatment
      const caseTreatmentsToCreate = selectedTreatments.map(treatment => ({
        case_id: caseResult.id,
        treatment_id: treatment.id,
        treatment_status: 'Planned',
        cost: treatment.price,
        notes: `Treatment planned for case: ${caseData.chief_complaint}`,
        anesthesia_used: false,
        next_appointment_needed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: caseTreatmentsError } = await supabase
        .from('case_treatments')
        .insert(caseTreatmentsToCreate);

      if (caseTreatmentsError) throw caseTreatmentsError;

      if (patientCreated) {
        setShowNewPatientCreated(true);
        setTimeout(() => setShowNewPatientCreated(false), 5000);
      }

      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        router.push(`/case/${caseResult.id}`);
      }, 2000);

    } catch (error) {
      console.error('Error creating case:', error);
      setErrorMessage('Error creating case. Please try again.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filteredTreatments = treatments.filter(treatment =>
    treatment.name.toLowerCase().includes(treatmentSearchTerm.toLowerCase()) ||
    treatment.category.toLowerCase().includes(treatmentSearchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/cases"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Case</h1>
          <p className="mt-2 text-sm text-gray-600">
            Search for an existing patient or create a new one, then add case details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Patient Search Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Patient Information</h2>
            </div>
            <div className="p-6">
              {/* Patient Name Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Patient by Name
                </label>
                <div className="relative patient-search-container">
                  <input
                    type="text"
                    value={patientSearchTerm}
                    onChange={(e) => {
                      setPatientSearchTerm(e.target.value);
                      // Reset state when search term changes
                      if (!e.target.value.trim()) {
                        setSelectedPatient(null);
                        setIsNewPatient(false);
                        setPatientHistory([]);
                      }
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                    placeholder="Type patient name (minimum 1 character)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  
                  {/* Search Results Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchingPatient ? (
                        <div className="px-4 py-2 text-sm text-gray-500">Searching...</div>
                      ) : (
                        <>
                          {searchResults.map((patient) => (
                            <div
                              key={patient.id}
                              onClick={() => handlePatientSelect(patient)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {patient.first_name} {patient.last_name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    <Phone className="h-3 w-3 inline mr-1" />
                                    {patient.patient_phone}
                                  </p>
                                </div>
                                <User className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          ))}
                          {searchResults.length === 0 && patientSearchTerm.trim() && !searchingPatient && (
                            <>
                              <div className="px-4 py-2 text-sm text-gray-500 border-t border-gray-200">
                                No patients found matching "{patientSearchTerm}"
                              </div>
                              <div
                                onClick={handleNewPatientOption}
                                className="px-4 py-2 hover:bg-green-50 cursor-pointer"
                              >
                                <div className="flex items-center">
                                  <Plus className="h-4 w-4 text-green-600 mr-2" />
                                  <span className="text-sm text-green-600 font-medium">
                                    Create new patient: "{patientSearchTerm}"
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Results */}
              {selectedPatient && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-green-900">
                        Patient Found
                      </h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-green-700">
                          <User className="h-4 w-4 inline mr-1" />
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </p>
                        <p className="text-sm text-green-700">
                          <Mail className="h-4 w-4 inline mr-1" />
                          {selectedPatient.email}
                        </p>
                        <p className="text-sm text-green-700">
                          <Phone className="h-4 w-4 inline mr-1" />
                          {selectedPatient.patient_phone}
                        </p>
                        <p className="text-sm text-green-700">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Born: {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>

                  {/* Patient History */}
                  {patientHistory.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-green-900 mb-2">
                        Previous Cases ({patientHistory.length})
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {patientHistory.map((case_) => (
                          <div key={case_.id} className="text-xs text-green-700 bg-green-100 p-2 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{case_.treatments?.name}</p>
                                <p>{case_.chief_complaint}</p>
                              </div>
                              <span className="text-xs text-green-600">
                                {new Date(case_.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* New Patient Form */}
              {isNewPatient && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center mb-4">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-medium text-blue-900">
                      Create New Patient
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPatientData.first_name}
                        onChange={(e) => setNewPatientData(prev => ({...prev, first_name: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPatientData.last_name}
                        onChange={(e) => setNewPatientData(prev => ({...prev, last_name: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newPatientData.patient_phone}
                        onChange={(e) => setNewPatientData(prev => ({...prev, patient_phone: e.target.value}))}
                        placeholder="Enter 10-digit phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-blue-600">
                    * Phone number must be unique. A patient profile will be created with the provided details. Additional information can be updated later from the patient's profile page.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Treatment Selection */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Treatment Selection</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Treatments
                </label>
                <input
                  type="text"
                  value={treatmentSearchTerm}
                  onChange={(e) => setTreatmentSearchTerm(e.target.value)}
                  placeholder="Search by treatment name or category..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedTreatments.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-lg font-medium text-green-900 mb-3">Selected Treatments ({selectedTreatments.length})</h3>
                  <div className="space-y-2">
                    {selectedTreatments.map((treatment) => (
                      <div key={treatment.id} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{treatment.name}</p>
                          <p className="text-sm text-gray-600">{treatment.category}</p>
                          <p className="text-sm font-medium text-green-900">₹{treatment.price}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTreatmentSelect(treatment)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-lg font-medium text-green-900">
                        Total: ₹{selectedTreatments.reduce((sum, t) => sum + t.price, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredTreatments.map((treatment) => {
                  const isSelected = selectedTreatments.find(t => t.id === treatment.id);
                  return (
                    <div
                      key={treatment.id}
                      onClick={() => handleTreatmentSelect(treatment)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{treatment.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{treatment.description}</p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">{treatment.category}</span>
                            <span className="font-medium text-blue-600">₹{treatment.price}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="ml-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Case Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Case Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor *
                  </label>
                  <select
                    required
                    value={caseData.doctor_id}
                    onChange={(e) => setCaseData(prev => ({...prev, doctor_id: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.full_name || doctor.email} {doctor.specialization ? `- ${doctor.specialization}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Case Status
                  </label>
                  <select
                    value={caseData.case_status}
                    onChange={(e) => setCaseData(prev => ({...prev, case_status: e.target.value as 'Consultation' | 'In Progress' | 'Completed' | 'Cancelled'}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={caseData.priority}
                    onChange={(e) => setCaseData(prev => ({...prev, priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Emergency'}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chief Complaint *
                  </label>
                  <textarea
                    required
                    value={caseData.chief_complaint}
                    onChange={(e) => setCaseData(prev => ({...prev, chief_complaint: e.target.value}))}
                    rows={3}
                    placeholder="Describe the main complaint..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    History of Present Illness
                  </label>
                  <textarea
                    value={caseData.history_of_present_illness}
                    onChange={(e) => setCaseData(prev => ({...prev, history_of_present_illness: e.target.value}))}
                    rows={3}
                    placeholder="Describe the history and timeline..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinical Findings
                  </label>
                  <textarea
                    value={caseData.clinical_findings}
                    onChange={(e) => setCaseData(prev => ({...prev, clinical_findings: e.target.value}))}
                    rows={3}
                    placeholder="Initial clinical observations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={caseData.total_cost}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 0;
                        setCaseData(prev => ({
                          ...prev, 
                          total_cost: cost,
                          amount_pending: cost - prev.amount_paid
                        }));
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={caseData.amount_paid}
                      onChange={(e) => {
                        const paid = parseFloat(e.target.value) || 0;
                        setCaseData(prev => ({
                          ...prev, 
                          amount_paid: paid,
                          amount_pending: prev.total_cost - paid
                        }));
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Amount Pending:</span>
                  <span className="font-medium">₹{caseData.amount_pending}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/cases"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Case created successfully!
          </div>
        </div>
      )}

      {/* New Patient Created Notification */}
      {showNewPatientCreated && (
        <div className="fixed top-16 right-4 z-50 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            New patient also created!
          </div>
        </div>
      )}

      {/* Error Notification */}
      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {errorMessage}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
