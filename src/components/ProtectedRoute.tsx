'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isLoading, isAuthorized, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthorized) {
        // Not logged in at all
        router.push('/login');
      } else if (allowedRoles && !allowedRoles.includes(role)) {
        // Logged in but doesn't have the required role
        router.push('/unauthorized');
      }
    }
  }, [isLoading, isAuthorized, role, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized || (allowedRoles && !allowedRoles.includes(role))) {
    return null;
  }

  return <>{children}</>;
}
