'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase, formatCurrency, formatDate, type Case, type Patient } from '@/lib/supabase';
import { Users, CreditCard, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  monthlyRevenue: number;
  pendingCases: number;
  activeCases: number;
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    monthlyRevenue: 0,
    pendingCases: 0,
    activeCases: 0,
  });
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [patientsResult, casesResult] = await Promise.all([
        supabase.from('patients').select('id').is('deleted_at', null),
        supabase.from('cases').select('id, total_cost, case_status, created_at').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()).is('deleted_at', null)
      ]);

      // Calculate stats
      const totalPatients = patientsResult.data?.length || 0;
      const monthlyRevenue = casesResult.data?.reduce((sum, case_) => sum + (case_.total_cost || 0), 0) || 0;
      const pendingCases = casesResult.data?.filter(case_ => 
        case_.case_status === 'In Progress' || case_.case_status === 'Consultation'
      ).length || 0;
      const activeCases = casesResult.data?.filter(case_ => 
        case_.case_status === 'In Progress'
      ).length || 0;

      setStats({
        totalPatients,
        monthlyRevenue,
        pendingCases,
        activeCases,
      });

      // Fetch recent cases
      const { data: cases } = await supabase
        .from('cases')
        .select(`
          *,
          patients(first_name, last_name),
          case_treatments(
            treatments(name)
          ),
          authorized_users!cases_doctor_user_id_fkey(full_name, email)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentCases(cases || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }: {
    icon: any;
    title: string;
    value: string | number;
    color: string;
  }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {formatDate(new Date().toISOString())}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="Total Patients"
            value={stats.totalPatients}
            color="bg-blue-500"
          />
          <StatCard
            icon={TrendingUp}
            title="Active Cases"
            value={stats.activeCases}
            color="bg-green-500"
          />
          <StatCard
            icon={CreditCard}
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            color="bg-purple-500"
          />
          <StatCard
            icon={AlertCircle}
            title="Pending Cases"
            value={stats.pendingCases}
            color="bg-orange-500"
          />
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Cases */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Cases</h2>
              </div>
            </div>
            <div className="p-6">
              {recentCases.length > 0 ? (
                <div className="space-y-4">
                  {recentCases.map((case_) => (
                    <div key={case_.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {case_.patients?.first_name} {case_.patients?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {case_.case_treatments && case_.case_treatments.length > 0 
                            ? `${case_.case_treatments.length} treatment${case_.case_treatments.length > 1 ? 's' : ''}`
                            : 'No treatments'} - {formatCurrency(case_.total_cost || 0)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        case_.case_status === 'Completed' 
                          ? 'bg-green-100 text-green-800'
                          : case_.case_status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {case_.case_status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent cases</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Wrap with ProtectedRoute
export default function ProtectedDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'doctor', 'helper']}>
      <Dashboard />
    </ProtectedRoute>
  );
}
