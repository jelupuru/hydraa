'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Complaint, ComplaintStatus, ComplaintAttachment, FIRStatus, NoticeStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, ArrowRight, CheckCircle, XCircle, FileText, Paperclip, Trash2 } from 'lucide-react';
import ComplaintForm from './ComplaintForm';
import ComplaintDetails from './ComplaintDetails';

interface ComplaintsManagementProps {
  user: User;
}

// PE workflow is UI/workflow-only, not Prisma-backed
export type PEStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'COMPLETED'
  | 'NOT_STARTED'
  | 'NOTICE_REQUESTED';

// Notice filter statuses map UI filter options to computed workflow states
export type NoticeFilterStatus =
  | 'NOT_GENERATED'
  | 'NOT_ISSUED'
  | 'ISSUED'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'REJECTED';

type ComplaintWithRelations = Complaint & {
  createdBy: User;
  updatedBy?: User;
  assignedTo?: User;
  commissionerate?: { id: number; name: string };
  dcpZone?: { id: number; name: string };
  municipalZone?: { id: number; name: string };
  acpDivision?: { id: number; name: string };
  attachments?: ComplaintAttachment[];
  firs?: any[];
  comments?: any[];
  noticeContent?: string; // Added property
  // Notice fields
  firstNoticeNumber?: string | null;
  firstNoticeDate?: Date | null;
  firstNoticeStatus?: NoticeStatus | null;
  firstNoticeContent?: string | null;
  firstNoticeDiscussions?: string | null;
  secondNoticeNumber?: string | null;
  secondNoticeDate?: Date | null;
  secondNoticeStatus?: NoticeStatus | null;
  secondNoticeContent?: string | null;
  secondNoticeDiscussions?: string | null;
  // Notice 1 approval fields
  notice1ApprovalStatus?: string | null;
  notice1DcpApprovalDate?: Date | null;
  notice1AcpApprovalDate?: Date | null;
  notice1CommissionerApprovalDate?: Date | null;
  notice1RejectionDate?: Date | null;
  notice1RejectionReason?: string | null;
  notice1CommissionerApprovedBy?: { name: string } | null;
  notice1AcpApprovedBy?: { name: string } | null;
  notice1DcpApprovedBy?: { name: string } | null;
  notice1RejectedBy?: { name: string } | null;
  // Notice 2 approval fields  
  notice2ApprovalStatus?: string | null;
  notice2DcpApprovalDate?: Date | null;
  notice2AcpApprovalDate?: Date | null;
  notice2CommissionerApprovalDate?: Date | null;
  notice2RejectionDate?: Date | null;
  notice2RejectionReason?: string | null;
  notice2CommissionerApprovedBy?: { name: string } | null;
  notice2AcpApprovedBy?: { name: string } | null;
  notice2DcpApprovedBy?: { name: string } | null;
  notice2RejectedBy?: { name: string } | null;
  // PE Report fields
  peReport?: string | null;
  fieldVisitDate?: Date | null;
  peStatus?: string | null;
  // PE Workflow fields
  peDcpComments?: string | null;
  peDcpCommentsDate?: Date | null;
  peDcpCommentedBy?: { name: string } | null;
  peNotificationSentToFieldOfficer?: boolean;
  peNotificationDate?: Date | null;
  peNotificationBy?: { name: string } | null;
  // Notice sent dates
  firstNoticeSentDate?: Date | null;
  secondNoticeSentDate?: Date | null;
  // Notice 1 citizen response
  firstNoticeIssuedDate?: Date | null;
  firstNoticeCitizenReply?: string | null;
  firstNoticeCitizenReplyDate?: Date | null;
};

export default function ComplaintsManagement({ user }: ComplaintsManagementProps) {
  const router = useRouter();
  const [complaints, setComplaints] = useState<ComplaintWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithRelations | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateFIRDialog, setShowCreateFIRDialog] = useState(false);
  const [selectedComplaintForFIR, setSelectedComplaintForFIR] = useState<ComplaintWithRelations | null>(null);
  const [firFormData, setFirFormData] = useState({
    firNumber: '',
    dateOfRegistration: '',
    policeStation: '',
    investigatingOfficer: '',
    investigatingOfficerContact: '',
    sectionsApplied: '',
    status: FIRStatus.REGISTERED as string,
    details: '',
    remarks: '',
  });
  const [isCreatingFIR, setIsCreatingFIR] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    peStatus: '' as PEStatus | '',
    noticeStatus: '' as NoticeFilterStatus | '',
    overdue: false,
    dateRange: { start: '', end: '' },
    createdBy: ''
  });
  const [filteredComplaints, setFilteredComplaints] = useState<ComplaintWithRelations[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ComplaintWithRelations | null>(null);

  // Helper function to check if notice is overdue (3+ days without reply)
  const isNoticeOverdue = (complaint: ComplaintWithRelations): boolean => {
    if (!complaint.firstNoticeSentDate) return false;
    
    const sentDate = new Date(complaint.firstNoticeSentDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Consider overdue if 3+ days and no response received
    // You might want to add a field for response tracking
    return daysDiff >= 3;
  };

  // Helper function to check if first notice reply is overdue
  const isFirstNoticeReplyOverdue = (complaint: ComplaintWithRelations): boolean => {
    if (!complaint.firstNoticeIssuedDate) return false;
    if (complaint.firstNoticeCitizenReply) return false; // Reply received
    
    const issuedDate = new Date(complaint.firstNoticeIssuedDate);
    const threeDaysLater = new Date(issuedDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    return new Date() > threeDaysLater;
  };

  // Helper function to check if notice 1 is created but not approved
  const isNotice1PendingApproval = (complaint: ComplaintWithRelations): boolean => {
    return Boolean(
      (complaint.firstNoticeNumber || complaint.firstNoticeDate) &&
      !complaint.notice1DcpApprovalDate &&
      !complaint.notice1AcpApprovalDate &&
      !complaint.notice1CommissionerApprovalDate
    );
  };

  // Helper function to check if notice 1 is approved but not issued
  const isNotice1ApprovedButNotIssued = (complaint: ComplaintWithRelations): boolean => {
    return Boolean(
      complaint.notice1DcpApprovalDate &&
      complaint.notice1AcpApprovalDate &&
      complaint.notice1CommissionerApprovalDate &&
      !complaint.firstNoticeIssuedDate
    );
  };

  // Helper function to check if notice 1 is issued and awaiting reply
  const isNotice1AwaitingReply = (complaint: ComplaintWithRelations): boolean => {
    return Boolean(
      complaint.firstNoticeIssuedDate &&
      !complaint.firstNoticeCitizenReply &&
      !isFirstNoticeReplyOverdue(complaint)
    );
  };

  // Helper function to get days since notice sent
  const getDaysSinceNoticeSent = (complaint: ComplaintWithRelations): number => {
    if (!complaint.firstNoticeSentDate) return 0;
    
    const sentDate = new Date(complaint.firstNoticeSentDate);
    const now = new Date();
    return Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const resolvePEStatus = (c: ComplaintWithRelations): PEStatus => {
    if (c.peNotificationSentToFieldOfficer) return 'NOTICE_REQUESTED';
    return (c.peStatus as PEStatus) || 'NOT_STARTED';
  };

  const resolveNoticeStatus = (c: ComplaintWithRelations): NoticeFilterStatus => {
    if (!c.firstNoticeNumber && !c.firstNoticeDate) return 'NOT_GENERATED';

    if (c.notice1ApprovalStatus === 'REJECTED' || c.notice1RejectionDate) {
      return 'REJECTED';
    }

    if (c.notice1ApprovalStatus === 'APPROVED' || c.notice1CommissionerApprovalDate) {
      return 'APPROVED';
    }

    
    const status = c.firstNoticeStatus as NoticeStatus | null;

    if (status === NoticeStatus.NOT_ISSUED) return 'NOT_ISSUED';
    if (status === NoticeStatus.ISSUED) return 'ISSUED';
    return 'APPROVAL_PENDING';
  };
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);
  const [showAddFIRModal, setShowAddFIRModal] = useState(false);
  const [showAddInvestigationModal, setShowAddInvestigationModal] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [user.role]);

  // Filter complaints based on selected filters
  useEffect(() => {
    let filtered = [...complaints];

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(c => c.finalStatus === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(c => c.complaintPriority === filters.priority);
    }

    // PE Status filter
    if (filters.peStatus) {
      filtered = filtered.filter((c) => resolvePEStatus(c) === filters.peStatus);
    }

    // Notice Status filter
    if (filters.noticeStatus) {
      filtered = filtered.filter((c) => resolveNoticeStatus(c) === filters.noticeStatus);
    }

    // Overdue filter
    if (filters.overdue) {
      filtered = filtered.filter(c => isNoticeOverdue(c));
    }

    // Date range filter
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      filtered = filtered.filter(c => new Date(c.createdAt) >= startDate);
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter(c => new Date(c.createdAt) <= endDate);
    }

    // Created by filter
    if (filters.createdBy) {
      filtered = filtered.filter(c => 
        c.createdBy.name?.toLowerCase().includes(filters.createdBy.toLowerCase())
      );
    }

    setFilteredComplaints(filtered);
  }, [complaints, filters]);

  const fetchComplaints = async () => {
    try {
      setError(null);
      console.log('Fetching complaints for role:', user.role);
      const response = await fetch(`/api/complaints?role=${user.role}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched complaints:', data.length);
        setComplaints(data);
      } else {
        const errorData = await response.text();
        console.error('Failed to fetch complaints:', response.status, errorData);
        setError(`Failed to fetch complaints: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Network error occurred while fetching complaints');
    } finally {
      setLoading(false);
    }
  };

  const updateComplaint = async (complaintId: number, updateData: any) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        fetchComplaints();
        return true;
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update complaint');
        return false;
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('An error occurred');
      return false;
    }
  };

  const getStatusBadgeVariant = (status: ComplaintStatus | null) => {
    if (!status) return 'secondary';
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'UNDER_REVIEW_DCP':
      case 'UNDER_REVIEW_ACP':
      case 'UNDER_REVIEW_COMMISSIONER':
        return 'default';
      case 'RESOLVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'CLOSED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const canUpdateComplaint = (complaintStatus: ComplaintStatus, userRole: string): boolean => {
    switch (userRole) {
      case 'INVESTIGATION_OFFICER':
      case 'COMPLAINANT':
        return true; // Allow investigation officers and complainants to update complaints
      case 'DCP':
        return complaintStatus === ComplaintStatus.PENDING || complaintStatus === ComplaintStatus.UNDER_REVIEW_DCP;
      case 'ACP':
        return complaintStatus === ComplaintStatus.UNDER_REVIEW_DCP || complaintStatus === ComplaintStatus.UNDER_REVIEW_ACP;
      case 'COMMISSIONER':
        return complaintStatus === ComplaintStatus.UNDER_REVIEW_ACP || complaintStatus === ComplaintStatus.UNDER_REVIEW_COMMISSIONER;
      default:
        return false;
    }
  };

  const getNextStatus = (userRole: string): ComplaintStatus => {
    switch (userRole) {
      case 'INVESTIGATION_OFFICER':
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

  const getNextAssigneeRole = (userRole: string): string => {
    switch (userRole) {
      case 'INVESTIGATION_OFFICER':
      case 'COMPLAINANT':
        return 'DCP';
      case 'DCP':
        return 'ACP';
      case 'ACP':
        return 'COMMISSIONER';
      default:
        return 'COMMISSIONER';
    }
  };

  const handleViewDetails = (complaint: ComplaintWithRelations) => {
    router.push(`/dashboard/complaints/${complaint.id}`);
  };

  const canDeleteComplaint = (complaint: ComplaintWithRelations) => {
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'INVESTIGATION_OFFICER') return true;
    if (user.role === 'COMPLAINANT' && complaint.createdById === user.id) {
      const blockedStatuses: ComplaintStatus[] = [
        ComplaintStatus.RESOLVED,
        ComplaintStatus.CLOSED,
        ComplaintStatus.INVESTIGATION_IN_PROGRESS,
        ComplaintStatus.UNDER_REVIEW_DCP,
        ComplaintStatus.UNDER_REVIEW_ACP,
        ComplaintStatus.UNDER_REVIEW_COMMISSIONER,
      ];
      return !blockedStatuses.includes((complaint.finalStatus as ComplaintStatus) || ComplaintStatus.PENDING);
    }
    return false;
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !canDeleteComplaint(deleteTarget)) return;

    try {
      setDeletingId(deleteTarget.id);
      const res = await fetch(`/api/complaints/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        alert(data.error || 'Failed to delete complaint');
        return;
      }
      setComplaints((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting complaint:', error);
      alert('Failed to delete complaint');
    } finally {
      setDeletingId(null);
    }
  };

  const canCreateFIR = (userRole: string): boolean => {
    return ['INVESTIGATION_OFFICER', 'DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN'].includes(userRole);
  };

  const handleCreateFIR = (complaint: ComplaintWithRelations) => {
    setSelectedComplaintForFIR(complaint);
    setShowCreateFIRDialog(true);
  };

  const handleFIRFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintForFIR) return;

    setIsCreatingFIR(true);
    try {
      const response = await fetch(`/api/complaints/${selectedComplaintForFIR.id}/firs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...firFormData,
          status: firFormData.status as FIRStatus
        }),
      });

      if (response.ok) {
        setShowCreateFIRDialog(false);
        setFirFormData({
          firNumber: '',
          dateOfRegistration: '',
          policeStation: '',
          investigatingOfficer: '',
          investigatingOfficerContact: '',
          sectionsApplied: '',
          status: FIRStatus.REGISTERED,
          details: '',
          remarks: '',
        });
        setSelectedComplaintForFIR(null);
        fetchComplaints(); // Refresh the complaints list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create FIR');
      }
    } catch (error) {
      console.error('Error creating FIR:', error);
      alert('An error occurred while creating FIR');
    } finally {
      setIsCreatingFIR(false);
    }
  };

  const handleAddComment = async (comment: string) => {
    if (!selectedComplaint) return;
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      });

      if (response.ok) {
        setShowAddCommentModal(false);
        fetchComplaints();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('An error occurred while adding comment');
    }
  };

  const handleAddFIRDetails = async (firNumber: string, details: string) => {
    if (!selectedComplaint) return;
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}/firs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firNumber, details }),
      });

      if (response.ok) {
        setShowAddFIRModal(false);
        fetchComplaints();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add FIR details');
      }
    } catch (error) {
      console.error('Error adding FIR details:', error);
      alert('An error occurred while adding FIR details');
    }
  };

  const handleAddInvestigationDetails = async (investigationDetails: string) => {
    if (!selectedComplaint) return;
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}/investigations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details: investigationDetails }),
      });

      if (response.ok) {
        setShowAddInvestigationModal(false);
        fetchComplaints();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add investigation details');
      }
    } catch (error) {
      console.error('Error adding investigation details:', error);
      alert('An error occurred while adding investigation details');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading complaints...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={() => {
          setLoading(true);
          fetchComplaints();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Complaints Management</h2>
          <p className="text-muted-foreground">
            Manage and track complaint progress through the system.
          </p>
        </div>
        {(user.role === 'INVESTIGATION_OFFICER' || user.role === 'COMPLAINANT') && (
          <Sheet open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Complaint
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="min-w-[600px] w-[90%] flex flex-col h-full p-4">
              <SheetHeader className="shrink-0">
                <SheetTitle>Create New Complaint</SheetTitle>
                <SheetDescription>
                  Fill in the details to submit a new complaint.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto mt-6">
                <ComplaintForm
                  user={user}
                  onSuccess={() => {
                    setShowCreateDialog(false);
                    fetchComplaints();
                  }}
                  onCancel={() => setShowCreateDialog(false)}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Complaints</CardTitle>
          <CardDescription>
            A list of all complaints in the system that you have access to.
          </CardDescription>
        </CardHeader>
        
        {/* Comprehensive Filters */}
        <div className="px-6 pb-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW_DCP">Under DCP Review</option>
                <option value="UNDER_REVIEW_ACP">Under ACP Review</option>
                <option value="UNDER_REVIEW_COMMISSIONER">Under Commissioner Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Priority</label>
              <select 
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
              >
                <option value="">All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* PE Status Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">PE Status</label>
              <select 
                value={filters.peStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, peStatus: e.target.value as PEStatus | '' }))}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
              >
                <option value="">All PE Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted for Review</option>
                <option value="REVIEWED">Under Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="NOTICE_REQUESTED">DCP → Create Notice 1</option>
                <option value="NOT_STARTED">Not Started</option>
              </select>
            </div>

            {/* Notice Status Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Notice Status</label>
              <select 
                value={filters.noticeStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, noticeStatus: e.target.value as NoticeFilterStatus | '' }))}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
              >
                <option value="">All Notices</option>
                <option value="NOT_GENERATED">Not Generated</option>
                <option value="NOT_ISSUED">Not Issued</option>
                <option value="ISSUED">Issued</option>
                <option value="APPROVAL_PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Overdue Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Overdue</label>
              <label className="flex items-center text-xs">
                <input 
                  type="checkbox"
                  checked={filters.overdue}
                  onChange={(e) => setFilters(prev => ({ ...prev, overdue: e.target.checked }))}
                  className="mr-1"
                />
                Show Overdue Only
              </label>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Date From</label>
              <input 
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Date To</label>
              <input 
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-600">
              Showing {filteredComplaints.length} of {complaints.length} complaints
              {filters.overdue && ` • ${filteredComplaints.filter(c => isNoticeOverdue(c)).length} overdue`}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilters({
                status: '', priority: '', peStatus: '', noticeStatus: '', overdue: false,
                dateRange: { start: '', end: '' }, createdBy: ''
              })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
        
        <CardContent>
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {complaints.length === 0 ? 'No complaints found.' : 'No complaints match the selected filters.'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Your role: {user.role}</p>
              {(user.role === 'INVESTIGATION_OFFICER' || user.role === 'COMPLAINANT') && complaints.length === 0 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create your first complaint
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Status Legend */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Complaint Status Colors:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Overdue Reply</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span>Ready to Issue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span>Pending Approval</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Awaiting Reply</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Needs Notice</span>
                  </div>
                </div>
              </div>

              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Complaint ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>PE Status</TableHead>
                  <TableHead>Notice 1 Status</TableHead>
                  <TableHead>Notice 2 Status</TableHead>
                  <TableHead>Speaking Order Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.map((complaint) => {
                  const isOverdue = isNoticeOverdue(complaint) || isFirstNoticeReplyOverdue(complaint);
                  const daysSinceSent = getDaysSinceNoticeSent(complaint);
                  const isPendingNotice1 = (complaint.peNotificationSentToFieldOfficer as boolean) && 
                                          user.role === 'INVESTIGATION_OFFICER' && 
                                          !complaint.firstNoticeNumber && 
                                          !complaint.firstNoticeDate;
                  const isPendingApproval = isNotice1PendingApproval(complaint);
                  const isApprovedNotIssued = isNotice1ApprovedButNotIssued(complaint);
                  const isAwaitingReply = isNotice1AwaitingReply(complaint);
                  
                  // Priority order: overdue (red) > approved not issued (purple) > pending approval (orange) > awaiting reply (blue) > pending creation (yellow)
                  let rowClassName = 'cursor-pointer hover:bg-gray-50';
                  if (isOverdue) {
                    rowClassName += ' bg-red-50 border-l-4 border-l-red-500';
                  } else if (isApprovedNotIssued) {
                    rowClassName += ' bg-purple-50 border-l-4 border-l-purple-500';
                  } else if (isPendingApproval) {
                    rowClassName += ' bg-orange-50 border-l-4 border-l-orange-500';
                  } else if (isAwaitingReply) {
                    rowClassName += ' bg-blue-50 border-l-4 border-l-blue-500';
                  } else if (isPendingNotice1) {
                    rowClassName += ' bg-yellow-50 border-l-4 border-l-yellow-500';
                  }
                  
                  return (
                    <TableRow 
                      key={complaint.id} 
                      className={rowClassName}
                      onClick={() => handleViewDetails(complaint)}
                    >
                      <TableCell className="font-medium text-blue-600">
                        <div className="flex items-center gap-2">
                          {complaint.complaintId || complaint.complaintUniqueId || `#${complaint.id}`}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              OVERDUE {daysSinceSent}d
                            </Badge>
                          )}
                          {isPendingNotice1 && (
                            <Badge variant="default" className="text-xs bg-yellow-600 hover:bg-yellow-700 animate-pulse">
                              CREATE NOTICE 1
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    <TableCell className="font-medium">{complaint.natureOfComplaint || 'Untitled Complaint'}</TableCell>
                    
                    {/* Enhanced PE Status with details */}
                    <TableCell className="min-w-[200px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const peStatus = resolvePEStatus(complaint);
                            if (peStatus === 'NOTICE_REQUESTED') {
                              return <Badge variant="default" className="text-xs bg-orange-600 hover:bg-orange-700">DCP → Create Notice 1</Badge>;
                            }
                            if (peStatus === 'COMPLETED') {
                              return <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">✓ PE Completed</Badge>;
                            }
                            if (peStatus === 'SUBMITTED') {
                              return <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700">Submitted for Review</Badge>;
                            }
                            if (peStatus === 'REVIEWED') {
                              return <Badge variant="default" className="text-xs bg-purple-600 hover:bg-purple-700">Under Review</Badge>;
                            }
                            if (peStatus === 'DRAFT') {
                              return <Badge variant="secondary" className="text-xs">Draft</Badge>;
                            }
                            if (peStatus === 'NOT_STARTED' && complaint.fieldVisitDate) {
                              return <Badge variant="outline" className="text-xs bg-yellow-50">Field Visit Done</Badge>;
                            }
                            return <Badge variant="outline" className="text-xs">Not Started</Badge>;
                          })()}
                        </div>
                        {complaint.fieldVisitDate && (
                          <div className="text-xs text-gray-600">
                            Visit: {new Date(complaint.fieldVisitDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Enhanced Notice 1 Status with details */}
                    <TableCell className="min-w-[250px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {!complaint.firstNoticeNumber && !complaint.firstNoticeDate ? (
                            <Badge variant="outline" className="text-xs">
                              Not Generated
                            </Badge>
                          ) : complaint.notice1RejectionDate ? (
                            <Badge variant="destructive" className="text-xs">
                              ✗ Rejected
                            </Badge>
                          ) : complaint.notice1CommissionerApprovalDate ? (
                            <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                              ✓ Fully Approved
                            </Badge>
                          ) : complaint.notice1AcpApprovalDate ? (
                            <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700">
                              Commissioner Pending
                            </Badge>
                          ) : complaint.notice1DcpApprovalDate ? (
                            <Badge variant="default" className="text-xs bg-yellow-600 hover:bg-yellow-700">
                              ACP Pending
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              DCP Pending
                            </Badge>
                          )}
                        </div>
                        {complaint.firstNoticeDate && (
                          <div className="text-xs text-gray-600">
                            Generated: {new Date(complaint.firstNoticeDate).toLocaleDateString()}
                          </div>
                        )}
                        {complaint.notice1CommissionerApprovalDate && complaint.notice1CommissionerApprovedBy && (
                          <div className="text-xs text-gray-600">
                            Approved by: {complaint.notice1CommissionerApprovedBy.name}<br/>
                            Date: {new Date(complaint.notice1CommissionerApprovalDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Enhanced Notice 2 Status with details */}
                    <TableCell className="min-w-[250px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {!complaint.secondNoticeNumber && !complaint.secondNoticeDate ? (
                            <Badge variant="outline" className="text-xs">
                              Not Generated
                            </Badge>
                          ) : complaint.notice2RejectionDate ? (
                            <Badge variant="destructive" className="text-xs">
                              ✗ Rejected
                            </Badge>
                          ) : complaint.notice2CommissionerApprovalDate ? (
                            <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                              ✓ Fully Approved
                            </Badge>
                          ) : complaint.notice2AcpApprovalDate ? (
                            <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700">
                              Commissioner Pending
                            </Badge>
                          ) : complaint.notice2DcpApprovalDate ? (
                            <Badge variant="default" className="text-xs bg-yellow-600 hover:bg-yellow-700">
                              ACP Pending
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              DCP Pending
                            </Badge>
                          )}
                        </div>
                        {complaint.secondNoticeDate && (
                          <div className="text-xs text-gray-600">
                            Generated: {new Date(complaint.secondNoticeDate).toLocaleDateString()}
                          </div>
                        )}
                        {complaint.notice2CommissionerApprovalDate && complaint.notice2CommissionerApprovedBy && (
                          <div className="text-xs text-gray-600">
                            Approved by: {complaint.notice2CommissionerApprovedBy.name}<br/>
                            Date: {new Date(complaint.notice2CommissionerApprovalDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Speaking Order Status (placeholder for now) */}
                    <TableCell className="min-w-[200px]">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          Not Generated
                        </Badge>
                        <div className="text-xs text-gray-500">
                          Speaking Order functionality pending
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Created By */}
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{complaint.createdBy.name}</div>
                        <div className="text-xs text-gray-500">{complaint.createdBy.role}</div>
                      </div>
                    </TableCell>
                    
                    {/* Created Date */}
                    <TableCell>
                      <div className="text-sm">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                      {canDeleteComplaint(complaint) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteTarget(complaint)}
                          disabled={deletingId === complaint.id}
                        >
                          {deletingId === complaint.id ? 'Deleting...' : (
                            <span className="inline-flex items-center gap-1">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </span>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* FIR Creation Dialog */}
      <Dialog open={showCreateFIRDialog} onOpenChange={setShowCreateFIRDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create FIR for Complaint</DialogTitle>
            <DialogDescription>
              Create a First Information Report for complaint #{selectedComplaintForFIR?.complaintId || selectedComplaintForFIR?.id}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFIRFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firNumber">FIR Number *</Label>
                <Input
                  id="firNumber"
                  value={firFormData.firNumber}
                  onChange={(e) => setFirFormData({ ...firFormData, firNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dateOfRegistration">Date of Registration *</Label>
                <Input
                  id="dateOfRegistration"
                  type="date"
                  value={firFormData.dateOfRegistration}
                  onChange={(e) => setFirFormData({ ...firFormData, dateOfRegistration: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="policeStation">Police Station *</Label>
              <Input
                id="policeStation"
                value={firFormData.policeStation}
                onChange={(e) => setFirFormData({ ...firFormData, policeStation: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="investigatingOfficer">Investigating Officer</Label>
                <Input
                  id="investigatingOfficer"
                  value={firFormData.investigatingOfficer}
                  onChange={(e) => setFirFormData({ ...firFormData, investigatingOfficer: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="investigatingOfficerContact">Officer Contact</Label>
                <Input
                  id="investigatingOfficerContact"
                  value={firFormData.investigatingOfficerContact}
                  onChange={(e) => setFirFormData({ ...firFormData, investigatingOfficerContact: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sectionsApplied">Sections Applied</Label>
              <Input
                id="sectionsApplied"
                value={firFormData.sectionsApplied}
                onChange={(e) => setFirFormData({ ...firFormData, sectionsApplied: e.target.value })}
                placeholder="e.g., Section 420, 406 IPC"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={firFormData.status}
                onValueChange={(value) => setFirFormData({ ...firFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FIRStatus.REGISTERED}>Registered</SelectItem>
                  <SelectItem value={FIRStatus.UNDER_INVESTIGATION}>Under Investigation</SelectItem>
                  <SelectItem value={FIRStatus.CHARGESHEET_FILED}>Chargesheet Filed</SelectItem>
                  <SelectItem value={FIRStatus.COURT_PROCEEDINGS}>Court Proceedings</SelectItem>
                  <SelectItem value={FIRStatus.CLOSED}>Closed</SelectItem>
                  <SelectItem value={FIRStatus.WITHDRAWN}>Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                value={firFormData.details}
                onChange={(e) => setFirFormData({ ...firFormData, details: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={firFormData.remarks}
                onChange={(e) => setFirFormData({ ...firFormData, remarks: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateFIRDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingFIR}>
                {isCreatingFIR ? 'Creating...' : 'Create FIR'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Comment Modal */}
      {showAddCommentModal && (
        <Dialog open={showAddCommentModal} onOpenChange={setShowAddCommentModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Enter your comment for complaint #{selectedComplaint?.complaintId}
            </DialogDescription>
            <div className="mt-4">
              <Textarea
                placeholder="Enter your comment here..."
                onChange={(e) => setFirFormData({ ...firFormData, details: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddCommentModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleAddComment(firFormData.details);
                  setFirFormData({ ...firFormData, details: '' });
                }}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add FIR Details Modal */}
      {showAddFIRModal && (
        <Dialog open={showAddFIRModal} onOpenChange={setShowAddFIRModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add FIR Details</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Enter the FIR details for complaint #{selectedComplaint?.complaintId}
            </DialogDescription>
            <div className="mt-4">
              <Input
                placeholder="FIR Number"
                onChange={(e) => setFirFormData({ ...firFormData, firNumber: e.target.value })}
                className="mb-2"
              />
              <Textarea
                placeholder="FIR Details"
                onChange={(e) => setFirFormData({ ...firFormData, details: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddFIRModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleAddFIRDetails(firFormData.firNumber, firFormData.details);
                  setFirFormData({ ...firFormData, firNumber: '', details: '' });
                }}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Investigation Details Modal */}
      {showAddInvestigationModal && (
        <Dialog open={showAddInvestigationModal} onOpenChange={setShowAddInvestigationModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Investigation Details</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Enter the investigation details for complaint #{selectedComplaint?.complaintId}
            </DialogDescription>
            <div className="mt-4">
              <Textarea
                placeholder="Enter investigation details here..."
                onChange={(e) => setFirFormData({ ...firFormData, details: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddInvestigationModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleAddInvestigationDetails(firFormData.details);
                  setFirFormData({ ...firFormData, details: '' });
                }}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>

    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete complaint?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is permanent. The complaint and its related records will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingId !== null}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deletingId !== null}
            className="bg-red-600 hover:bg-red-700"
            onClick={handleConfirmDelete}
          >
            {deletingId && deleteTarget ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export type { ComplaintWithRelations };