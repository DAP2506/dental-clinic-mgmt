'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase, formatCurrency, formatDate } from '@/lib/supabase';
import { ArrowLeft, User, FileText, DollarSign, Calendar, Save } from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  patient_phone: string;
}

interface CaseData {
  id: string;
  patient_id: string;
  total_cost: number;
  amount_paid: number;
  amount_pending: number;
  patients: Patient;
  treatments: {
    name: string;
    description: string;
    price: number;
  };
  all_treatments?: Array<{
    name: string;
    description: string;
    price: number;
  }>;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('caseId');

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: '',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    payment_method: '',
    status: 'Pending' as 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
  });

  useEffect(() => {
    if (caseId) {
      fetchCaseData();
    }
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    setFormData(prev => ({ ...prev, invoice_number: invoiceNumber }));
  }, [caseId]);

  const fetchCaseData = async () => {
    if (!caseId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select(`
          id,
          patient_id,
          total_cost,
          amount_paid,
          amount_pending,
          patients(id, first_name, last_name, email, patient_phone),
          case_treatments(
            treatments(name, description, price)
          )
        `)
        .eq('id', caseId)
        .single();

      if (error) throw error;
      
      console.log('Raw case data from Supabase:', data);
      
      // Check if we have valid data
      if (!data) {
        throw new Error('No case data found');
      }
      
      // Handle the case where patients might be an array or single object
      const patient = Array.isArray(data.patients) ? data.patients[0] : data.patients;
      
      // Handle case_treatments - extract all treatments from the case_treatments array
      const treatments = data.case_treatments?.map((ct: any) => ct.treatments).filter(Boolean) || [];
      const treatment = treatments.length > 0 ? treatments[0] : { name: 'Unknown', description: '', price: 0 };
      
      if (!patient) {
        throw new Error('No patient data found for this case');
      }
      
      setCaseData({
        ...data,
        patients: patient,
        treatments: treatment,
        all_treatments: treatments // Store all treatments for reference
      });
      
      // Pre-fill amount with pending amount
      setFormData(prev => ({
        ...prev,
        amount: data.amount_pending || data.total_cost
      }));
    } catch (error) {
      console.error('Error fetching case data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!caseData) return;
    
    try {
      setSaving(true);
      
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          patient_id: caseData.patient_id,
          case_id: caseData.id,
          invoice_number: formData.invoice_number,
          amount: formData.amount,
          status: formData.status,
          due_date: formData.due_date,
          payment_method: formData.payment_method || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // If paid, update case payment status
      if (formData.status === 'Paid') {
        const newAmountPaid = caseData.amount_paid + formData.amount;
        const newAmountPending = Math.max(0, caseData.total_cost - newAmountPaid);
        
        const { error: caseError } = await supabase
          .from('cases')
          .update({
            amount_paid: newAmountPaid,
            amount_pending: newAmountPending,
            updated_at: new Date().toISOString()
          })
          .eq('id', caseData.id);

        if (caseError) throw caseError;
      }

      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        router.push('/billing');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          <div className="bg-white shadow rounded-lg animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Case & Patient Information */}
            {caseData && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Patient</p>
                    <p className="font-medium text-gray-900">
                      {caseData.patients?.first_name || ''} {caseData.patients?.last_name || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{caseData.patients?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{caseData.patients?.patient_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Treatment</p>
                    <p className="font-medium text-gray-900">{caseData.treatments?.name || 'N/A'}</p>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Cost:</span>
                      <span className="font-medium">{formatCurrency(caseData.total_cost || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Paid:</span>
                      <span className="font-medium text-green-600">{formatCurrency(caseData.amount_paid || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Pending:</span>
                      <span className="font-medium text-orange-600">{formatCurrency(caseData.amount_pending || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Invoice Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {formData.status === 'Paid' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => handleInputChange('payment_method', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select payment method</option>
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <Save className="w-5 h-5 mr-2" />
            Invoice created successfully!
          </div>
        </div>
      )}

      {/* Error Notification */}
      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <Save className="w-5 h-5 mr-2" />
            Error creating invoice. Please try again.
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
