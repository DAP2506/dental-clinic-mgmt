'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase, formatCurrency, formatDate } from '@/lib/supabase';
import { getInitials, getAvatarColor } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Building,
  Phone,
  Mail,
  Edit,
  Download,
  Send
} from 'lucide-react';

interface InvoiceDetails {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  payment_date?: string;
  payment_method?: string;
  created_at: string;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    patient_phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
  };
  cases: {
    id: string;
    case_status: string;
    final_diagnosis: string;
    total_cost: number;
    amount_paid: number;
    amount_pending: number;
    treatments: {
      name: string;
      description: string;
      category: string;
    };
  };
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_method: '',
    payment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patients(id, first_name, last_name, email, patient_phone, address, city, state, postal_code),
          cases(id, case_status, final_diagnosis, total_cost, amount_paid, amount_pending, 
            case_treatments(
              treatments(name, description, category)
            )
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      // Handle case_treatments - extract all treatments from the case_treatments array
      const treatments = data.cases?.case_treatments?.map((ct: any) => ct.treatments).filter(Boolean) || [];
      const treatment = treatments.length > 0 ? treatments[0] : { name: 'Unknown', description: '', category: 'Unknown' };

      setInvoice({
        ...data,
        patients: Array.isArray(data.patients) ? data.patients[0] : data.patients,
        cases: {
          ...data.cases,
          treatments: treatment,
          all_treatments: treatments // Store all treatments for reference
        }
      });
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'Cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    
    try {
      setUpdating(true);
      
      // Start a transaction to update both invoice and case
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: 'Paid',
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method
        })
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      // Update the case's payment details
      const newAmountPaid = (invoice.cases.amount_paid || 0) + invoice.amount;
      const newAmountPending = Math.max(0, (invoice.cases.total_cost || 0) - newAmountPaid);
      
      const { error: caseError } = await supabase
        .from('cases')
        .update({
          amount_paid: newAmountPaid,
          amount_pending: newAmountPending,
          // Update case status to completed if fully paid
          case_status: newAmountPending === 0 ? 'Completed' : invoice.cases.case_status
        })
        .eq('id', invoice.cases.id);

      if (caseError) throw caseError;

      // Refresh the invoice details
      await fetchInvoiceDetails();
      setShowPaymentModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      setPaymentData({
        payment_method: '',
        payment_date: new Date().toISOString().split('T')[0]
      });
      
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const openPaymentModal = () => {
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
          </div>
          <div className="bg-white shadow rounded-lg animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Invoice Not Found</h1>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">The invoice you're looking for could not be found.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice {invoice.invoice_number}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
            {invoice.status !== 'Paid' ? (
              <button
                onClick={openPaymentModal}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {updating ? 'Processing...' : 'Mark as Paid'}
              </button>
            ) : (
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Payment processed successfully! The case payment details have been updated.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(invoice.status)}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(invoice.amount)}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Invoice Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Invoice Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Invoice Number</p>
                    <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium text-gray-900">{formatDate(invoice.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created Date</p>
                    <p className="font-medium text-gray-900">{formatDate(invoice.created_at)}</p>
                  </div>
                  {invoice.payment_date && (
                    <div>
                      <p className="text-sm text-gray-500">Payment Date</p>
                      <p className="font-medium text-green-600">{formatDate(invoice.payment_date)}</p>
                    </div>
                  )}
                  {invoice.payment_method && (
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium text-gray-900">{invoice.payment_method}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(0)}`}>
                      {getInitials(invoice.patients.first_name, invoice.patients.last_name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {invoice.patients.first_name} {invoice.patients.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{invoice.patients.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{invoice.patients.patient_phone}</span>
                  </div>
                  {invoice.patients.address && (
                    <div className="flex items-start space-x-2">
                      <Building className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        <p>{invoice.patients.address}</p>
                        <p>{invoice.patients.city}, {invoice.patients.state} {invoice.patients.postal_code}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Treatment Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Treatment & Billing
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Treatment</p>
                    <p className="font-medium text-gray-900">{invoice.cases.treatments?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{invoice.cases.treatments?.category || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Diagnosis</p>
                    <p className="font-medium text-gray-900">{invoice.cases.final_diagnosis || 'N/A'}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Cost:</span>
                      <span className="font-medium">{formatCurrency(invoice.cases.total_cost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount Paid:</span>
                      <span className="font-medium text-green-600">{formatCurrency(invoice.cases.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount Pending:</span>
                      <span className="font-medium text-orange-600">{formatCurrency(invoice.cases.amount_pending)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items/Services */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
          </div>
          <div className="p-6">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.cases.treatments?.name || 'Treatment'}</p>
                        <p className="text-sm text-gray-500">{invoice.cases.treatments?.description || ''}</p>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</p>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td className="py-4 text-right font-medium text-gray-900">Total:</td>
                    <td className="py-4 text-right">
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Related</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push(`/case/${invoice.cases.id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View Case Details
            </button>
            <button
              onClick={() => router.push(`/patients/${invoice.patients.id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View Patient Profile
            </button>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mark Invoice as Paid</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentData.payment_method}
                      onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select payment method</option>
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={paymentData.payment_date}
                      onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">
                      <strong>Invoice Amount:</strong> {formatCurrency(invoice.amount)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      This payment will update the case's payment status automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={updating}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={updating || !paymentData.payment_method || !paymentData.payment_date}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {updating ? 'Processing...' : 'Mark as Paid'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
