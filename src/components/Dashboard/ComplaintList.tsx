'use client';

import { useState, useEffect } from 'react';
import { User, Complaint, ComplaintStatus } from '@prisma/client';

interface ComplaintListProps {
  user: User;
}

export default function ComplaintList({ user }: ComplaintListProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, [user.role]);

  const fetchComplaints = async () => {
    try {
      const response = await fetch(`/api/complaints?role=${user.role}`);
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (complaintId: string, newStatus: ComplaintStatus, nextAssigneeRole?: string) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finalStatus: newStatus,
          assignedToRole: nextAssigneeRole,
        }),
      });

      if (response.ok) {
        fetchComplaints();
      } else {
        alert('Failed to update complaint');
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('An error occurred');
    }
  };

  const getNextStatus = (currentRole: string): ComplaintStatus => {
    switch (currentRole) {
      case 'FIELD_OFFICER':
      case 'COMPLAINANT':
        return ComplaintStatus.UNDER_REVIEW_DCP;
      case 'DCP':
        return ComplaintStatus.UNDER_REVIEW_ACP;
      case 'ACP':
        return ComplaintStatus.UNDER_REVIEW_COMMISSIONER;
      case 'COMMISSIONER':
        return ComplaintStatus.RESOLVED;
      default:
        return ComplaintStatus.PENDING;
    }
  };

  const getNextAssigneeRole = (currentRole: string): string | undefined => {
    switch (currentRole) {
      case 'FIELD_OFFICER':
      case 'COMPLAINANT':
        return 'DCP';
      case 'DCP':
        return 'ACP';
      case 'ACP':
        return 'COMMISSIONER';
      default:
        return undefined;
    }
  };

  if (loading) {
    return <div>Loading complaints...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Manage Complaints</h2>
      {complaints.length === 0 ? (
        <p>No complaints to manage.</p>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="border p-4 rounded">
              <h3 className="font-semibold">{complaint.natureOfComplaint || 'No title'}</h3>
              <p className="text-sm text-gray-600">{complaint.briefDetailsOfTheComplaint || 'No description'}</p>
              <p className="text-sm">Status: {complaint.finalStatus?.replace('_', ' ') || 'Unknown Status'}</p>
              <div className="mt-2 space-x-2">
                {user.role === 'DCP' && complaint.finalStatus === ComplaintStatus.PENDING && (
                  <button
                    onClick={() => updateStatus(complaint.id.toString(), ComplaintStatus.UNDER_REVIEW_DCP)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Review
                  </button>
                )}
                {user.role === 'DCP' && complaint.finalStatus === ComplaintStatus.UNDER_REVIEW_DCP && (
                  <button
                    onClick={() => updateStatus(complaint.id.toString(), getNextStatus(user.role), getNextAssigneeRole(user.role))}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Forward to ACP
                  </button>
                )}
                {user.role === 'ACP' && complaint.finalStatus === ComplaintStatus.UNDER_REVIEW_ACP && (
                  <button
                    onClick={() => updateStatus(complaint.id.toString(), getNextStatus(user.role), getNextAssigneeRole(user.role))}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Forward to Commissioner
                  </button>
                )}
                {user.role === 'COMMISSIONER' && complaint.finalStatus === ComplaintStatus.UNDER_REVIEW_COMMISSIONER && (
                  <>
                    <button
                      onClick={() => updateStatus(complaint.id.toString(), ComplaintStatus.RESOLVED)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => updateStatus(complaint.id.toString(), ComplaintStatus.REJECTED)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}
                {(user.role === 'FIELD_OFFICER' || user.role === 'COMPLAINANT') && complaint.finalStatus === ComplaintStatus.PENDING && (
                  <>
                    <button
                      onClick={() => updateStatus(complaint.id.toString(), ComplaintStatus.UNDER_REVIEW_DCP)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => updateStatus(complaint.id.toString(), ComplaintStatus.UNDER_REVIEW_DCP, 'DCP')}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Forward to DCP
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}