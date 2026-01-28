'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { CogIcon, UserIcon, BellIcon, LockClosedIcon, PaintBrushIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface ClinicSettings {
  id: string
  clinic_name: string
  clinic_email: string
  clinic_phone: string
  clinic_address: string
  clinic_city: string
  clinic_state: string
  clinic_postal_code: string
  clinic_country: string
  business_hours: string
  timezone: string
  currency: string
  currency_symbol: string
  tax_rate: number
}

function SettingsContent() {
  const { user, role } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [settings, setSettings] = useState<ClinicSettings | null>(null)

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: LockClosedIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200  pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-sm text-gray-600  mt-1">
          Manage your clinic settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 space-y-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white  shadow rounded-lg">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900  mb-4">
                  Clinic Information
                </h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Clinic Name
                      </label>
                      <input
                        type="text"
                        defaultValue="SmileCare Dental Clinic"
                        className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        defaultValue="+91 98765 43210"
                        className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      defaultValue="123 Medical Plaza, Green Park, New Delhi, India - 110016"
                      className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Business Hours
                      </label>
                      <input
                        type="text"
                        defaultValue="Mon-Sat: 9:00 AM - 7:00 PM"
                        className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Time Zone
                      </label>
                      <select className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option>Asia/Kolkata (IST)</option>
                        <option>Asia/Mumbai (IST)</option>
                        <option>Asia/Delhi (IST)</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900  mb-4">
                  User Profile
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="h-20 w-20 rounded-full bg-gray-200  flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <button className="bg-white  py-2 px-3 border border-gray-300  rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700  hover:bg-gray-50">
                        Change Photo
                      </button>
                    </div>
                  </div>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Dr. Admin"
                          className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Last Name
                        </label>
                        <input
                          type="text"
                          defaultValue="User"
                          className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue="admin@smilecare.com"
                        className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <select className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option>Administrator</option>
                        <option>Doctor</option>
                        <option>Receptionist</option>
                      </select>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Update Profile
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900  mb-4">
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Appointment Reminders
                      </h4>
                      <p className="text-sm text-gray-500">
                        Get notified about upcoming appointments
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Payment Notifications
                      </h4>
                      <p className="text-sm text-gray-500">
                        Receive notifications for payments and invoices
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        New Patient Registration
                      </h4>
                      <p className="text-sm text-gray-500">
                        Get notified when new patients register
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="pt-4">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900  mb-4">
                  Security Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900  mb-2">
                      Change Password
                    </h4>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Update Password
                      </button>
                    </form>
                  </div>

                  <div className="border-t border-gray-200  pt-6">
                    <h4 className="text-sm font-medium text-gray-900  mb-2">
                      Two-Factor Authentication
                    </h4>
                    <p className="text-sm text-gray-500  mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300  text-sm font-medium rounded-md text-gray-700  bg-white  hover:bg-gray-50">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900  mb-4">
                  Appearance Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900  mb-2">
                      Theme
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          Light
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          Dark
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="theme"
                          value="system"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          System
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900  mb-2">
                      Language
                    </h4>
                    <select className="mt-1 block w-full border-gray-300  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                      <option>English (India)</option>
                      <option>हिंदी (Hindi)</option>
                      <option>मराठी (Marathi)</option>
                      <option>தமிழ் (Tamil)</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
