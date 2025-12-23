'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import ComplaintDetails from '@/components/Dashboard/ComplaintDetails';

type ComplaintWithRelations = {
  id: number;
  complaintId: string | null;
  complaintUniqueId: string | null;
  dateOfApplicationReceived: Date | null;
  complaintCategoryReceivedFrom: string | null;
  natureOfComplaint: string | null;
  placeOfComplaint: string | null;
  addressOfComplaintPlace: string | null;
  nameOfTheComplainant: string | null;
  phoneOfTheComplainant: string | null;
  addressOfTheComplainant: string | null;
  briefDetailsOfTheComplaint: string | null;
  detailsOfRespondent: string | null;
  complaintPriority: string | null;
  actionTakenBriefDetails: string | null;
  legalIssues: string | null;
  anyLegalIssues: string | null;
  firRegistered: string | null;
  firNumber: string | null;
  firDetails: string | null;
  investigationOfficerReviewComments: string | null;
  investigationOfficerReviewDate: Date | null;
  finalStatus: any;
  sourceOfComplaint: string | null;
  modeOfComplaint: string | null;
  noticeStatus: string | null;
  peReport: string | null;
  fieldVisitDate: Date | null;
  peStatus: string | null;
  createdBy: User;
  updatedBy?: User;
  assignedTo?: User;
  commissionerate?: { id: number; name: string };
  dcpZone?: { id: number; name: string };
  municipalZone?: { id: number; name: string };
  acpDivision?: { id: number; name: string };
  createdAt: Date;
  updatedAt: Date;
  firs?: any[];
  comments?: any[];
  attachments?: any[];
  noticeContent?: string;
};

export default function ComplaintPage() {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<ComplaintWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchComplaint();
    fetchUser();
  }, [params.id]);

  const fetchComplaint = async () => {
    try {
      const response = await fetch(`/api/complaints/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setComplaint(data);
      } else {
        console.error('Failed to fetch complaint');
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  if (loading || !complaint || !user) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Complaint Details</h1>
          <p className="text-muted-foreground">Full details of the complaint</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Complaints
        </Button>
      </div>

      <ComplaintDetails complaint={complaint} user={user} onUpdate={fetchComplaint} />
    </div>
  );
}