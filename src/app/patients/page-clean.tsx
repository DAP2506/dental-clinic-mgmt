'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase, formatDate, type Patient } from '@/lib/supabase';
import { getInitials, getAvatarColor, calculateAge, generateCaseId } from '@/lib/utils';
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import PatientViewModal from '@/components/ui/PatientViewModal';
import PatientEditModal from '@/components/ui/PatientEditModal';

const ITEMS_PER_PAGE = 10;

// Patient Row Component
interface PatientRowProps {
  patient: Patient;
  index: number;
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onViewHistory: (patient: Patient) => void;
}

const PatientRow: React.FC<PatientRowProps> = ({ patient, index, onViewPatient, onEditPatient, onViewHistory }) => {
  return (
    <tr className="bg-white border-b hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(index)}`}>
            {getInitials(patient.first_name, patient.last_name)}
          </div>
          <div>
            <div className="text-base font-semibold text-gray-900">
              {patient.first_name} {patient.last_name}
            </div>
            <div className="text-sm text-gray-500">
              {patient.id ? generateCaseId(patient.id) : '#C000000'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {patient.email}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {patient.patient_phone}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {calculateAge(patient.date_of_birth)} years
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {patient.gender}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {formatDate(patient.created_at)}
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <button
            onClick={() => onViewPatient(patient)}
            className="text-blue-600 hover:text-blue-900 font-medium"
          >
            View
          </button>
          <button
            onClick={() => onEditPatient(patient)}
            className="text-green-600 hover:text-green-900 font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onViewHistory(patient)}
            className="text-purple-600 hover:text-purple-900 font-medium"
          >
            History
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    // Auto-focus search input on mount
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,patient_phone.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      setPatients(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchPatients();
    }
  };

  const handleViewPatient = (patient: Patient) => {
    console.log('View patient:', patient);
    setSelectedPatient(patient);
    setViewModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    console.log('Edit patient:', patient);
    setEditingPatient(patient);
    setEditModalOpen(true);
  };

  const handleViewHistory = (patient: Patient) => {
    router.push(`/patient-history/${patient.id}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          </div>
          <div className="bg-white shadow rounded-lg animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <Link
            href="/patients/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search patients by name, email, or phone..."
                value={searchTerm}
                onChange={handleSearch}
                onKeyPress={handleSearchKeyPress}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Patient</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Phone</th>
                  <th scope="col" className="px-6 py-3">Age</th>
                  <th scope="col" className="px-6 py-3">Gender</th>
                  <th scope="col" className="px-6 py-3">Registered</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length > 0 ? (
                  patients.map((patient, index) => (
                    <PatientRow
                      key={patient.id}
                      patient={patient}
                      index={index}
                      onViewPatient={handleViewPatient}
                      onEditPatient={handleEditPatient}
                      onViewHistory={handleViewHistory}
                    />
                  ))
                ) : (
                  <tr key="no-patients-row">
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'No patients found matching your search.' : 'No patients registered yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Patient Modal */}
      {selectedPatient && (
        <PatientViewModal
          patient={selectedPatient}
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedPatient(null);
          }}
        />
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <PatientEditModal
          patient={editingPatient}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingPatient(null);
          }}
          onSave={() => {
            fetchPatients(); // Refresh the list
            setEditModalOpen(false);
            setEditingPatient(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
