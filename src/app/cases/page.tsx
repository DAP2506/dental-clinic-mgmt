'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CaseForm from '@/components/ui/CaseForm'
import { Case, Patient, Doctor, Treatment, supabase, formatCurrency, formatDate } from '@/lib/supabase'
import { generateCaseId, getStatusColor, getPriorityColor } from '@/lib/utils'
import { MagnifyingGlassIcon, PlusIcon, FolderIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline'

interface CaseWithRelations {
  id: string
  patient_id: string
  doctor_id: string
  case_status: string
  priority: string
  chief_complaint: string
  history_of_present_illness: string
  clinical_findings: string
  final_diagnosis: string
  treatment_plan: string
  notes: string
  total_cost: number
  amount_paid: number
  amount_pending: number
  created_at: string
  updated_at: string
  patients?: Patient
  doctors?: Doctor
  case_treatments?: Array<{
    treatments: Treatment
  }>
}

export default function CasesPage() {
  const router = useRouter()
  const [cases, setCases] = useState<CaseWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCases, setTotalCases] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    emergency: 0
  })
  const searchInputRef = useRef<HTMLInputElement>(null)

  const itemsPerPage = 5

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset to first page when search actually triggers
      if (searchTerm !== debouncedSearchTerm) {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    fetchCases()
    fetchStats()
  }, [currentPage, debouncedSearchTerm, statusFilter, priorityFilter])

  // Focus search input only after initial data is loaded
  useEffect(() => {
    if (!loading && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading]);

  const fetchStats = async () => {
    try {
      // Get total count
      const { count: totalCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })

      // Get status counts
      const { count: inProgressCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('case_status', 'In Progress')

      const { count: completedCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('case_status', 'Completed')

      const { count: emergencyCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'Emergency')

      setStats({
        total: totalCount || 0,
        inProgress: inProgressCount || 0,
        completed: completedCount || 0,
        emergency: emergencyCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchCases = async () => {
    try {
      setLoading(true)

      // If searching by patient name, we need to get patient IDs first
      let patientIds: string[] = []
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase()
        // Check if the search term might be a patient name
        const { data: patientsData } = await supabase
          .from('patients')
          .select('id')
          .or(`first_name.ilike.%${debouncedSearchTerm}%,last_name.ilike.%${debouncedSearchTerm}%`)
        
        if (patientsData && patientsData.length > 0) {
          patientIds = patientsData.map(p => p.id)
        }
      }

      // Build the base query with count for total
      let baseQuery = supabase
        .from('cases')
        .select(`
          *,
          patients(first_name, last_name, patient_phone),
          doctors(name, specialization),
          case_treatments(
            treatments(name, price)
          )
        `, { count: 'exact' })

      if (statusFilter !== 'all') {
        baseQuery = baseQuery.eq('case_status', statusFilter)
      }
      if (priorityFilter !== 'all') {
        baseQuery = baseQuery.eq('priority', priorityFilter)
      }

      // Add search filtering at database level if search term exists
      if (debouncedSearchTerm) {
        const searchPattern = `%${debouncedSearchTerm}%`
        let searchConditions = `chief_complaint.ilike.${searchPattern},final_diagnosis.ilike.${searchPattern},treatment_plan.ilike.${searchPattern},notes.ilike.${searchPattern}`
        
        // Add patient ID filter if we found matching patients
        if (patientIds.length > 0) {
          const patientIdConditions = patientIds.map(id => `patient_id.eq.${id}`).join(',')
          searchConditions += `,${patientIdConditions}`
        }
        
        baseQuery = baseQuery.or(searchConditions)
      }

      // Apply pagination and ordering
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage - 1

      const { data, error, count } = await baseQuery
        .order('updated_at', { ascending: false })
        .range(startIndex, endIndex)

      if (error) {
        throw error
      }

      setCases(data || [])
      setTotalCases(count || 0)
    } catch (error) {
      console.error('Error fetching cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCases / itemsPerPage)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    // Don't reset current page here - let debounce handle it
  };
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Immediate search on Enter key press
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
      // Maintain focus after Enter search
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  const handleViewCase = (case_: CaseWithRelations) => {
    router.push(`/case/${case_.id}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Treatment Cases
        </h1>
        <Link
          href="/cases/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Case
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white  overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500  truncate">
                    Total Cases
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white  overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500  truncate">
                    In Progress
                  </dt>
                  <dd className="text-lg font-medium text-blue-600">
                    {stats.inProgress}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white  overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500  truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {stats.completed}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white  overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500  truncate">
                    Emergency
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {stats.emergency}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white  shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search cases by complaint, diagnosis, patient name, or notes..."
                value={searchTerm}
                onChange={handleSearch}
                onKeyPress={handleSearchKeyPress}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300  rounded-md leading-5 bg-white  placeholder-gray-500  focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Consultation">Consultation</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white  shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Cases List
              </h3>
              <p className="text-sm text-gray-500  mt-1">
                Click on any row to view case details
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Showing {cases.length} of {totalCases} cases
            </p>
          </div>

          {cases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Case ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white  divide-y divide-gray-200">
                  {cases.map((case_) => (
                    <tr
                      key={case_.id}
                      onClick={() => handleViewCase(case_)}
                      className="hover:bg-blue-50  cursor-pointer transition-colors duration-200 group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900  group-hover:text-blue-600  transition-colors duration-200">
                              {generateCaseId(case_.id)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(case_.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {case_.patients?.first_name} {case_.patients?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {case_.patients?.patient_phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900  max-w-xs truncate">
                          {case_.final_diagnosis || case_.chief_complaint}
                        </div>
                        <div className="text-sm text-gray-500">
                          {case_.case_treatments && case_.case_treatments.length > 0 
                            ? `${case_.case_treatments.length} treatment${case_.case_treatments.length > 1 ? 's' : ''}`
                            : 'No treatments'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {case_.doctors?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {case_.doctors?.specialization}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(case_.case_status)}`}>
                          {case_.case_status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(case_.priority)}`}>
                          {case_.priority}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(case_.total_cost)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Paid: {formatCurrency(case_.amount_paid)}
                            </div>
                          </div>
                          <EyeIcon className="h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No cases found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new treatment case.
              </p>
              <div className="mt-6">
                <Link
                  href="/cases/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Case
                </Link>
              </div>
            </div>
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white  px-4 py-3 flex items-center justify-between border-t border-gray-200  sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300  text-sm font-medium rounded-md text-gray-700  bg-white  hover:bg-gray-50  disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300  text-sm font-medium rounded-md text-gray-700  bg-white  hover:bg-gray-50  disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalCases)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalCases}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {(() => {
                    const maxPagesToShow = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                    
                    // Adjust start page if we're near the end
                    if (endPage - startPage + 1 < maxPagesToShow) {
                      startPage = Math.max(1, endPage - maxPagesToShow + 1);
                    }
                    
                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === i
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
    </DashboardLayout>
  )
}
