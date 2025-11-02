'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function PatientHistoryPage() {
  const params = useParams();
  const patientId = params.id as string;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Patient History</h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">Patient history for ID: {patientId}</p>
          <p className="text-sm text-gray-400 mt-2">This page is under development.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
