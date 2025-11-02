// 'use client';

// import React, { useEffect, useState, useRef } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import DashboardLayout from '@/components/layout/DashboardLayout';
// import { supabase, formatDate } from '@/lib/supabase';
// import { calculateAge, getInitials, getAvatarColor } from '@/lib/utils';
// import {
//   ArrowLeft,
//   User,
//   Phone,
//   Mail,
//   Calendar,
//   MapPin,
//   Activity,
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   FileText,
//   Stethoscope,
//   Heart,
//   Eye,
//   TrendingUp,
//   Filter,
//   Search
// } from 'lucide-react';

// interface Patient {
//   id: string;
//   first_name: string;
//   last_name: string;
//   email: string;
//   patient_phone: string;
//   date_of_birth: string;
//   gender: string;
//   address: string;
//   city: string;
//   state: string;
//   postal_code: string;
//   emergency_contact_name: string;
//   emergency_contact_phone: string;
//   medical_history: string;
//   allergies: string;
//   current_medications: string;
//   created_at: string;
// }
// interface Doctor {
//   id: string;
//   name: string;
//   specialization: string;
// }

// interface Treatment {
//   id: string;
//   name: string;
//   description: string;
//   category: string;
//   price: number;
// }

// interface Case {
//   id: string;
//   case_status: string;
//   priority: string;
//   chief_complaint: string;
//   history_of_present_illness: string;
//   clinical_findings: string;
//   intraoral_examination: string;
//   extraoral_examination: string;
//   oral_hygiene_status: string;
//   periodontal_status: string;
//   tooth_charting: string;
//   radiographic_findings: string;
//   occlusion_analysis: string;
//   tmj_evaluation: string;
//   soft_tissue_examination: string;
//   hard_tissue_examination: string;
//   pain_scale: number;
//   pain_location: string;
//   pain_characteristics: string;
//   triggering_factors: string;
//   relieving_factors: string;
//   bleeding_on_probing: string;
//   pocket_depths: string;
//   gingival_recession: string;
//   furcation_involvement: string;
//   mobility_assessment: string;
//   vitality_tests: string;
//   percussion_tests: string;
//   palpation_findings: string;
//   thermal_tests: string;
//   electric_pulp_test: string;
//   differential_diagnosis: string;
//   final_diagnosis: string;
//   icd_10_code: string;
//   cdt_code: string;
//   treatment_plan: string;
//   treatment_provided: string;
//   treatment_outcome: string;
//   medications_prescribed: string;
//   post_treatment_instructions: string;
//   follow_up_required: boolean;
//   follow_up_date: string;
//   notes: string;
//   total_cost: number;
//   amount_paid: number;
//   amount_pending: number;
//   created_at: string;
//   updated_at: string;
//   doctor: Doctor;
//   treatment: Treatment;
// }

// export default function PatientHistoryPage() {
//   const params = useParams();
//   const router = useRouter();
//   const patientId = params.id as string;

//   const [patient, setPatient] = useState<Patient | null>(null);
//   const [cases, setCases] = useState<Case[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedCase, setSelectedCase] = useState<Case | null>(null);
//   const [filterStatus, setFilterStatus] = useState<string>('all');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
//   const searchInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (patientId) {
//       fetchPatientHistory();
//     }
//   }, [patientId]);

//   // Debounce search term
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearchTerm(searchTerm);
//     }, 500);

//     return () => clearTimeout(timer);
//   }, [searchTerm]);

//   // Auto-focus search input when component mounts
//   useEffect(() => {
//     if (searchInputRef.current) {
//       searchInputRef.current.focus();
//     }
//   }, []);

//   const fetchPatientHistory = async () => {
//     try {
//       setLoading(true);

//       // Fetch patient details
//       const { data: patientData, error: patientError } = await supabase
//         .from('patients')
//         .select('*')
//         .eq('id', patientId)
//         .single();

//       if (patientError) throw patientError;

//       // Fetch all cases for this patient with related data
//       const { data: casesData, error: casesError } = await supabase
//         .from('cases')
//         .select(`
//           *,
//           doctor:doctors(id, name, specialization),
//           treatment:treatments(id, name, description, category, price)
//         `)
//         .eq('patient_id', patientId)
//         .order('created_at', { ascending: false });

//       if (casesError) throw casesError;

//       setPatient(patientData);
//       setCases(casesData || []);
//     } catch (error) {
//       console.error('Error fetching patient history:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'Completed':
//         return <CheckCircle className="h-4 w-4 text-green-500" />;
//       case 'In Progress':
//         return <Clock className="h-4 w-4 text-blue-500" />;
//       case 'Cancelled':
//         return <XCircle className="h-4 w-4 text-red-500" />;
//       default:
//         return <AlertCircle className="h-4 w-4 text-yellow-500" />;
//     }
//   };

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case 'Emergency':
//         return 'bg-red-100 text-red-800';
//       case 'High':
//         return 'bg-orange-100 text-orange-800';
//       case 'Medium':
//         return 'bg-blue-100 text-blue-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const filteredCases = cases.filter(caseItem => {
//     const matchesStatus = filterStatus === 'all' || caseItem.case_status === filterStatus;
//     const matchesSearch = debouncedSearchTerm === '' ||
//       caseItem.chief_complaint.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
//       caseItem.final_diagnosis.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
//       caseItem.treatment.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
//     return matchesStatus && matchesSearch;
//   });

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setSearchTerm(value);
//   };

//   const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === 'Enter') {
//       // Immediate search on Enter key press
//       setDebouncedSearchTerm(searchTerm);
//       // Maintain focus after Enter search
//       if (searchInputRef.current) {
//         searchInputRef.current.focus();
//       }
//     }
//   };
//   if (loading) {
//     return (
//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold text-gray-900">History</h1>
//           </div>
//           <div className="bg-white shadow rounded-lg animate-pulse">
//             <div className="h-64 bg-gray-200 rounded-lg"></div>
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (!patient) {
//     return (
//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold text-gray-900">Not Found</h1>
//           </div>
//           <div className="bg-white shadow rounded-lg p-6">
//             <p className="text-gray-500">The patient you're looking for could not be found.</p>
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }
//   return (
//     <DashboardLayout>
//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <button
//               onClick={() => router.back()}
//               className="inline-flex items-center px-3 py-2 border border-gray-300  shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700  bg-white  hover:bg-gray-50"
//             >
//               <ArrowLeft className="h-4 w-4 mr-2" />
//               Back
//             </button>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Patient History: {patient.first_name} {patient.last_name}
//             </h1>
//           </div>
//         </div>

//         {/* Patient Information Card */}
//         <div className="bg-white shadow rounded-lg">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h3 className="text-lg font-medium text-gray-900">Information</h3>
//           </div>
//           <div className="p-6">
//             <div className="flex items-start space-x-6">
//               <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(0)}`}>
//                 {getInitials(patient.first_name, patient.last_name)}
//               </div>
//               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 <div className="space-y-3">
//                   <div className="flex items-center space-x-2">
//                     <User className="h-4 w-4 text-gray-400" />
//                     <span className="text-sm font-medium text-gray-900">
//                       {patient.first_name} {patient.last_name}
//                     </span>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Mail className="h-4 w-4 text-gray-400" />
//                     <span className="text-sm text-gray-500">
//                       {patient.email}
//                     </span>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Phone className="h-4 w-4 text-gray-400" />
//                     <span className="text-sm text-gray-500">
//                       {patient.phone}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="space-y-3">
//                   <div className="flex items-center space-x-2">
//                     <Calendar className="h-4 w-4 text-gray-400" />
//                     <span className="text-sm text-gray-500">
//                       {formatDate(patient.date_of_birth)} •
//                       {calculateAge(patient.date_of_birth)} years old • {patient.gender}
//                     </span>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <MapPin className="h-4 w-4 text-gray-400" />
//                     <span className="text-sm text-gray-500">
//                       {patient.city}, {patient.state}
//                     </span>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Activity className="h-4 w-4 text-gray-400" />
//                     <span className="text-sm text-gray-500">
//                       Patient since {formatDate(patient.created_at)}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="space-y-3">
//                   <div>
//                     <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Medical History</span>
//                     <p className="text-sm text-gray-900  mt-1">{patient.medical_history || 'None'}</p>
//                   </div>
//                   <div>
//                     <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Allergies</span>
//                     <p className="text-sm text-gray-900  mt-1">{patient.allergies || 'None'}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Filter and Search */}
//       <div className="bg-white  p-6 rounded-lg border border-gray-200">
//         <div className="flex flex-col sm:flex-row gap-4">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
//             <input
//               ref={searchInputRef}
//               type="text"
//               placeholder="Search cases by complaint, diagnosis, or treatment..."
//               value={searchTerm}
//               onChange={handleSearch}
//               onKeyPress={handleSearchKeyPress}
//               className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>
//           <div className="flex items-center space-x-2">
//             <Filter className="h-4 w-4 text-gray-400" />
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="all">All Cases</option>
//               <option value="Consultation">Consultation</option>
//               <option value="In Progress">In Progress</option>
//               <option value="Completed">Completed</option>
//               <option value="Cancelled">Cancelled</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Cases Summary */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         <div className="bg-white  p-6 rounded-lg border border-gray-200">
//           <div className="flex items-center">
//             <FileText className="h-8 w-8 text-blue-500" />
//             <div className="ml-4">
//               <p className="text-2xl font-semibold text-gray-900">
//                 {cases.filter(c => c.case_status === 'Consultation').length}
//               </p>
//               <p className="text-sm text-gray-500">Cases</p>
//             </div>
//           </div>
//           <div className="bg-white  p-6 rounded-lg border border-gray-200">
//             <div className="flex items-center">
//               <Clock className="h-8 w-8 text-orange-500" />
//               <div className="ml-4">
//                 <p className="text-2xl font-semibold text-gray-900">
//                   {cases.filter(c => c.case_status === 'In Progress').length}
//                 </p>
//                 <p className="text-sm text-gray-500">Cases</p>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white  p-6 rounded-lg border border-gray-200">
//             <div className="flex items-center">
//               <CheckCircle className="h-8 w-8 text-green-500" />
//               <div className="ml-4">
//                 <p className="text-2xl font-semibold text-gray-900">
//                   {cases.filter(c => c.case_status === 'Completed').length}
//                 </p>
//                 <p className="text-sm text-gray-500">Cases</p>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white  p-6 rounded-lg border border-gray-200">
//             <div className="flex items-center">
//               <TrendingUp className="h-8 w-8 text-purple-500" />
//               <div className="ml-4">
//                 <p className="text-2xl font-semibold text-gray-900">
//                   ₹{cases.reduce((sum, c) => sum + (c.total_cost || 0), 0).toLocaleString('en-IN')}
//                 </p>
//                 <p className="text-sm text-gray-500">Total Revenue</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Cases List */}
//       <div className="bg-white  shadow rounded-lg">
//         <div className="px-6 py-4 border-b border-gray-200">
//           <h3 className="text-lg font-medium text-gray-900">
//             Case History ({filteredCases.length} cases)
//           </h3>
//         </div>
//         <div className="overflow-hidden">
//           <div className="space-y-0">
//             {filteredCases.length > 0 ? (
//               filteredCases.map((caseItem, index) => (
//                 <div
//                   key={caseItem.id}
//                   className={`p-6 border-b border-gray-200  hover:bg-gray-50  cursor-pointer ${
//                     selectedCase?.id === caseItem.id ? 'bg-blue-50' : ''
//                   }`}
//                   onClick={() => setSelectedCase(selectedCase?.id === caseItem.id ? null : caseItem)}
//                 >
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center space-x-3 mb-2">
//                           {getStatusIcon(caseItem.case_status)}
//                           <span className="text-sm font-medium text-gray-900">
//                             Case #{index + 1}
//                           </span>
//                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
//                             {caseItem.priority}
//                           </span>
//                           <span className="text-sm text-gray-500">
//                             {formatDate(caseItem.created_at)}
//                           </span>
//                         </div>
//                         <h4 className="text-lg font-medium text-gray-900  mb-2">
//                           {caseItem.treatment.name}
//                         </h4>
//                         <p className="text-sm text-gray-600  mb-2">
//                           <strong>Chief Complaint:</strong> {caseItem.chief_complaint}
//                         </p>
//                         {caseItem.final_diagnosis && (
//                           <p className="text-sm text-gray-600  mb-2">
//                             <strong>Diagnosis:</strong> {caseItem.final_diagnosis}
//                           </p>
//                         )}
//                         <div className="flex items-center space-x-4 text-xs text-gray-500">
//                           <span>Dr. {caseItem.doctor.name}</span>
//                           <span>•</span>
//                           <span>{caseItem.treatment.category}</span>
//                           <span>•</span>
//                           <span>₹{caseItem.total_cost?.toLocaleString('en-IN')}</span>
//                           {caseItem.pain_scale > 0 && (
//                             <>
//                               <span>•</span>
//                               <span>Pain: {caseItem.pain_scale}/10</span>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                       <div className="flex flex-col items-end space-y-2">
//                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${"
//                           caseItem.case_status === 'Completed' ? 'bg-green-100 text-green-800   :
//                           caseItem.case_status === 'In Progress' ? 'bg-blue-100 text-blue-800   :
//                           caseItem.case_status === 'Cancelled' ? 'bg-red-100 text-red-800   :
//                           'bg-yellow-100 text-yellow-800"
//                         }`}>
//                           {caseItem.case_status}
//                         </span>
//                         {caseItem.amount_pending > 0 && (
//                           <span className="text-xs text-red-600">
//                             ₹{caseItem.amount_pending.toLocaleString('en-IN')} pending
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PatientHistoryPage;

//                             {caseItem.history_of_present_illness && (
//                               <div>
//                                 <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">History of Present Illness</span>
//                                 <p className="text-sm text-gray-600  mt-1">{caseItem.history_of_present_illness}</p>
//                               </div>
//                             )}

//                             {caseItem.clinical_findings && (
//                               <div>
//                                 <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Clinical Findings</span>
//                                 <p className="text-sm text-gray-600  mt-1">{caseItem.clinical_findings}</p>
//                               </div>
//                             )}

//                             {caseItem.intraoral_examination && (
//                               <div>
//                                 <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Intraoral Examination</span>
//                                 <p className="text-sm text-gray-600  mt-1">{caseItem.intraoral_examination}</p>
//                               </div>
//                             )}"
// "
//                             {caseItem.radiographic_findings && ("
//                               <div>"
//                                 <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Radiographic Findings</span>"
//                                 <p className="text-sm text-gray-600  mt-1">{caseItem.radiographic_findings}</p>"
//                               </div>"
//                             )}"
//                           </div>"
// "
//                           {/* Treatment Information */}"
//                           <div className="space-y-4">"
//                             <h5 className="font-medium text-gray-900  Information</h5>"
// "
//                             {caseItem.treatment_plan && ("
//                               <div>"
//                                 <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Treatment Plan</span>"
//                                 <p className="text-sm text-gray-600  mt-1">{caseItem.treatment_plan}</p>"
//                               </div>"
//                             )}"
// "
//                             {caseItem.treatment_provided && ("
//                               <div>"
//                                 <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Treatment Provided</span>"
//                                 <p className="text-sm text-gray-600  mt-1">{caseItem.treatment_provided}</p>"
//                               </div>"
//                             )}"
// "
//                             {caseItem.medications_prescribed && ("
//                               <div>"
//                                 <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Medications Prescribed</span>"
//                                 <p className="text-sm text-gray-600  mt-1">{caseItem.medications_prescribed}</p>"
//                               </div>"
//                             )}"
// "
//                             {caseItem.post_treatment_instructions && ("
//                               <div>"
//                                 <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Post-Treatment Instructions</span>"
//                                 <p className="text-sm text-gray-600  mt-1">{caseItem.post_treatment_instructions}</p>"
//                               </div>"
//                             )}"
// "
//                             {/* Billing Information */}"
//                             <div className="bg-gray-50  p-4 rounded-lg">"
//                               <h6 className="font-medium text-gray-900  mb-2">Billing Summary</h6>"
//                               <div className="space-y-1 text-sm">"
//                                 <div className="flex justify-between">"
//                                   <span className="text-gray-600  Cost:</span>"
//                                   <span className="font-medium text-gray-900"
//                                 </div>"
//                                 <div className="flex justify-between">"
//                                   <span className="text-gray-600  Paid:</span>"
//                                   <span className="font-medium text-green-600">₹{caseItem.amount_paid?.toLocaleString('en-IN')}</span>"
//                                 </div>"
//                                 <div className="flex justify-between">"
//                                   <span className="text-gray-600  Pending:</span>"
//                                   <span className={`font-medium ${caseItem.amount_pending > 0 ? 'text-red-600' : 'text-green-600'}`}>"
//                                     ₹{caseItem.amount_pending?.toLocaleString('en-IN')}"
//                                   </span>"
//                                 </div>"
//                               </div>"
//                             </div>"
//                           </div>"
//                         </div>"
// "
//                         {/* Additional Clinical Details */}"
//                         {(caseItem.pain_scale > 0 || caseItem.oral_hygiene_status || caseItem.vitality_tests) && ("
//                           <div className="mt-6 pt-6 border-t border-gray-200"
//                             <h5 className="font-medium text-gray-900  mb-4">Additional Clinical Details</h5>"
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">"
//                               {caseItem.pain_scale > 0 && ("
//                                 <div>"
//                                   <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Pain Assessment</span>"
//                                   <div className="mt-1 space-y-1 text-sm">"
//                                     <p><strong>Scale:</strong> {caseItem.pain_scale}/10</p>"
//                                     {caseItem.pain_location && <p><strong>Location:</strong> {caseItem.pain_location}</p>}"
//                                     {caseItem.pain_characteristics && <p><strong>Type:</strong> {caseItem.pain_characteristics}</p>}"
//                                   </div>"
//                                 </div>"
//                               )}"
// "
//                               {caseItem.oral_hygiene_status && ("
//                                 <div>"
//                                   <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Oral Hygiene</span>"
//                                   <p className="text-sm text-gray-600  mt-1">{caseItem.oral_hygiene_status}</p>"
//                                   {caseItem.periodontal_status && ("
//                                     <p className="text-sm text-gray-600  mt-1">{caseItem.periodontal_status}</p>"
//                                   )}"
//                                 </div>"
//                               )}"
// "
//                               {caseItem.vitality_tests && ("
//                                 <div>"
//                                   <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Diagnostic Tests</span>"
//                                   <p className="text-sm text-gray-600  mt-1">{caseItem.vitality_tests}</p>"
//                                 </div>"
//                               )}"
//                             </div>"
//                           </div>"
//                         )}"
// "
//                         {caseItem.notes && ("
//                           <div className="mt-6 pt-6 border-t border-gray-200"
//                             <span className="text-xs font-medium text-gray-500  uppercase tracking-wide">Notes</span>"
//                             <p className="text-sm text-gray-600  mt-1">{caseItem.notes}</p>"
//                           </div>"
//                         )}"
//                       </div>"
//                     )}"
//                   </div>"
//                 ))"
//               ) : ("
//                 <div className="p-12 text-center">"
//                   <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />"
//                   <h3 className="text-lg font-medium text-gray-900  mb-2">No cases found</h3>"
//                   <p className="text-gray-500"
//                     {searchTerm || filterStatus !== 'all'"
//                       ? 'Try adjusting your search or filter criteria.'"
//                       : 'This patient has no dental cases yet.'}"
//                   </p>"
//                 </div>"
//               )}"
//             </div>"
//           </div>"
//         </div>"
//       </div>"
//     </DashboardLayout>"
//   );"
// }"
  