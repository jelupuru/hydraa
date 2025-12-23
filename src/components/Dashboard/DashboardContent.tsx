'use client';

import { useState } from 'react';
import { User, Complaint } from '@prisma/client';
import ComplaintForm from './ComplaintForm';
import ComplaintList from './ComplaintList';

interface DashboardContentProps {
  user: User & {
    createdComplaints: Complaint[];
    assignedComplaints: Complaint[];
  };
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'manage'>('overview');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard - {user.role.replace('_', ' ')}</h1>

      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded ${activeTab === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Overview
          </button>
          {(user.role === 'FIELD_OFFICER' || user.role === 'COMPLAINANT') && (
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded ${activeTab === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Create Complaint
            </button>
          )}
          {['DCP', 'ACP', 'COMMISSIONER', 'FIELD_OFFICER', 'COMPLAINANT'].includes(user.role) && (
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded ${activeTab === 'manage' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Manage Complaints
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium">Created Complaints</h3>
              <p className="text-3xl font-bold">{user.createdComplaints.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium">Assigned Complaints</h3>
              <p className="text-3xl font-bold">{user.assignedComplaints.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium">Role</h3>
              <p className="text-xl font-semibold">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create' && (user.role === 'FIELD_OFFICER' || user.role === 'COMPLAINANT') && <ComplaintForm user={user} onSuccess={() => {}} onCancel={() => {}} />}

      {activeTab === 'manage' && ['DCP', 'ACP', 'COMMISSIONER', 'FIELD_OFFICER', 'COMPLAINANT'].includes(user.role) && (
        <ComplaintList user={user} />
      )}
    </div>
  );
}