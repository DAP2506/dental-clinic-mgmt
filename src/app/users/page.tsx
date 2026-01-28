'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface AuthorizedUser {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'helper' | 'patient';
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export default function UserManagementPage() {
  const { role, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'doctor' as 'admin' | 'doctor' | 'helper' | 'patient',
    full_name: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [authLoading, role, router]);

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers();
    }
  }, [role]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('authorized_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const { error: insertError } = await supabase
        .from('authorized_users')
        .insert([
          {
            email: newUser.email.toLowerCase().trim(),
            role: newUser.role,
            full_name: newUser.full_name.trim() || null,
            created_by_email: currentUser?.email,
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(`User ${newUser.email} added successfully!`);
      setShowAddModal(false);
      setNewUser({ email: '', role: 'doctor', full_name: '' });
      fetchUsers();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const { error: deleteError } = await supabase
        .from('authorized_users')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      setSuccess(`User ${userEmail} deleted successfully!`);
      fetchUsers();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('authorized_users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (updateError) throw updateError;

      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'doctor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'helper':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'patient':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (authLoading || role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage authorized users and their roles</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {usr.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{usr.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(usr.role)}`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(usr.id, usr.is_active)}
                          disabled={usr.email === currentUser?.email}
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            usr.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          } ${usr.email === currentUser?.email ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                        >
                          {usr.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usr.last_login_at
                          ? new Date(usr.last_login_at).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(usr.id, usr.email)}
                          disabled={usr.email === currentUser?.email}
                          className={`text-red-600 hover:text-red-900 ${
                            usr.email === currentUser?.email
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="helper">Helper</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                >
                  Add User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser({ email: '', role: 'doctor', full_name: '' });
                    setError(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
