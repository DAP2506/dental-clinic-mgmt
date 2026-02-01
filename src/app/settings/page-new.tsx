'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { CogIcon, CheckCircleIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

interface ClinicSettings {
  id: string
  clinic_name: string
  clinic_email: string | null
  clinic_phone: string | null
  clinic_address: string | null
  clinic_city: string | null
  clinic_state: string | null
  clinic_postal_code: string | null
  clinic_country: string
  business_hours: string | null
  timezone: string
  currency: string
  currency_symbol: string
  tax_rate: number
}

function SettingsContent() {
  const { user, role } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [settings, setSettings] = useState<ClinicSettings | null>(null)
  const [formData, setFormData] = useState<Partial<ClinicSettings>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .single()

      if (error) {
        console.error('Error fetching settings:', error)
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          await createDefaultSettings()
        }
      } else {
        setSettings(data)
        setFormData(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .insert([{
          clinic_name: 'Dental Clinic',
          clinic_email: 'info@dentalclinic.com',
          clinic_phone: '(555) 123-4567',
          clinic_address: '123 Medical Street',
          clinic_city: 'City',
          clinic_state: 'State',
          clinic_postal_code: '12345',
          clinic_country: 'India',
          business_hours: 'Mon-Sat: 9:00 AM - 7:00 PM',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          currency_symbol: '₹',
          tax_rate: 0
        }])
        .select()
        .single()

      if (error) throw error
      setSettings(data)
      setFormData(data)
    } catch (error) {
      console.error('Error creating default settings:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (role !== 'admin') {
      alert('Only administrators can update clinic settings.')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('clinic_settings')
        .update({
          clinic_name: formData.clinic_name,
          clinic_email: formData.clinic_email,
          clinic_phone: formData.clinic_phone,
          clinic_address: formData.clinic_address,
          clinic_city: formData.clinic_city,
          clinic_state: formData.clinic_state,
          clinic_postal_code: formData.clinic_postal_code,
          clinic_country: formData.clinic_country,
          business_hours: formData.business_hours,
          timezone: formData.timezone,
          currency: formData.currency,
          currency_symbol: formData.currency_symbol,
          tax_rate: formData.tax_rate
        })
        .eq('id', settings?.id)

      if (error) throw error

      setSuccessMessage('Clinic settings updated successfully!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
      
      // Refresh settings
      await fetchSettings()
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Failed to update settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
          <div className="bg-white shadow rounded-lg animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CogIcon className="h-8 w-8 mr-3 text-blue-600" />
            Settings
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your clinic settings and preferences
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
              Clinic Information
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This information will appear on invoices, receipts, and other documents.
              {role !== 'admin' && (
                <span className="block mt-1 text-orange-600 font-medium">
                  ⚠️ Only administrators can modify these settings.
                </span>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clinic Name *
                    </label>
                    <input
                      type="text"
                      name="clinic_name"
                      value={formData.clinic_name || ''}
                      onChange={handleInputChange}
                      required
                      disabled={role !== 'admin'}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="clinic_email"
                      value={formData.clinic_email || ''}
                      onChange={handleInputChange}
                      disabled={role !== 'admin'}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="clinic_phone"
                      value={formData.clinic_phone || ''}
                      onChange={handleInputChange}
                      disabled={role !== 'admin'}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Hours
                    </label>
                    <input
                      type="text"
                      name="business_hours"
                      value={formData.business_hours || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Mon-Sat: 9:00 AM - 7:00 PM"
                      disabled={role !== 'admin'}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Address Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="clinic_address"
                      value={formData.clinic_address || ''}
                      onChange={handleInputChange}
                      disabled={role !== 'admin'}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="clinic_city"
                        value={formData.clinic_city || ''}
                        onChange={handleInputChange}
                        disabled={role !== 'admin'}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        name="clinic_state"
                        value={formData.clinic_state || ''}
                        onChange={handleInputChange}
                        disabled={role !== 'admin'}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="clinic_postal_code"
                        value={formData.clinic_postal_code || ''}
                        onChange={handleInputChange}
                        disabled={role !== 'admin'}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="clinic_country"
                      value={formData.clinic_country || ''}
                      onChange={handleInputChange}
                      disabled={role !== 'admin'}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Regional Settings */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Regional Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      name="timezone"
                      value={formData.timezone || 'Asia/Kolkata'}
                      onChange={handleInputChange}
                      disabled={role !== 'admin'}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Mumbai">Asia/Mumbai (IST)</option>
                      <option value="Asia/Delhi">Asia/Delhi (IST)</option>
                      <option value="America/New_York">America/New York (EST)</option>
                      <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        name="currency"
                        value={formData.currency || 'INR'}
                        onChange={handleInputChange}
                        disabled={role !== 'admin'}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="INR">INR (Indian Rupee)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="GBP">GBP (British Pound)</option>
                      </select>
                      <input
                        type="text"
                        name="currency_symbol"
                        value={formData.currency_symbol || '₹'}
                        onChange={handleInputChange}
                        placeholder="Symbol"
                        maxLength={3}
                        disabled={role !== 'admin'}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              {role === 'admin' && (
                <div className="pt-6 border-t border-gray-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Information Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About Clinic Settings
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  These settings control how your clinic information appears on invoices, receipts, and other documents.
                  Make sure to keep this information up to date for professional communication with patients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'doctor', 'helper']}>
      <SettingsContent />
    </ProtectedRoute>
  )
}
