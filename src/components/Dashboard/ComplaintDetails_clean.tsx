'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { User, ComplaintStatus, FIRStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, FileText, UserIcon, AlertTriangle, Phone, MessageSquare, Calendar, CheckCircle } from 'lucide-react';
import FIRManagement from './FIRManagement';
import CommentManagement from './CommentManagement';
import EnquiryReport from './EnquiryReport';
import NoticeOne from './NoticeOne';
import NoticeTwo from '../NoticeTwo';
import NoticeApproval from './NoticeApproval';
import ApprovalWorkflow from '../ApprovalWorkflow';
import SpeakingOrder from './SpeakingOrder';
import { generateNotice } from '@/utils/noticeGenerator';
import { saveAs } from 'file-saver';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const PlatePEEditor = dynamic(() => import('@/components/PlatePEEditor').then((m) => m.default), { ssr: false });
const PlateNoticeEditor = dynamic(() => import('@/components/PlateNoticeEditor').then((m) => m.PlateNoticeEditor), { ssr: false });


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
  finalStatus: ComplaintStatus | null;
  sourceOfComplaint: string | null;
  modeOfComplaint: string | null;
  noticeStatus: string | null;
  peReport: string | null;
  peDiscussions?: string | null;
  fieldVisitDate: Date | null;
  peStatus: string | null;
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
  // Notice tracking fields
  firstNoticeNumber?: string | null;
  firstNoticeDate?: Date | null;
  firstNoticeStatus?: string | null;
  firstNoticeContent?: string | null;
  firstNoticeDiscussions?: string | null;
  secondNoticeNumber?: string | null;
  secondNoticeDate?: Date | null;
  secondNoticeStatus?: string | null;
  secondNoticeContent?: string | null;
  secondNoticeDiscussions?: string | null;
  noticeApprovalStatus?: string | null;
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
  approvedById?: string | null;
  approvalDate?: Date | null;
  approvedBy?: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdBy: User;
  updatedBy?: User;
  assignedTo?: User;
  commissionerate?: { id: number; name: string };
  dcpZone?: { id: number; name: string };
  municipalZone?: { id: number; name: string };
  acpDivision?: { id: number; name: string };
  createdAt: Date;
  updatedAt: Date;
  firs?: Array<{
    id: number;
    firNumber: string;
    dateOfRegistration: Date;
    policeStation: string;
    investigatingOfficer?: string;
    investigatingOfficerContact?: string;
    sectionsApplied?: string;
    status: string;
    details?: string;
    remarks?: string;
    createdBy: { name: string };
    updatedBy?: { name: string };
    createdAt: Date;
    updatedAt: Date;
  }>;
  comments?: Array<{
    id: number;
    content: string;
    isInternal: boolean;
    parentId: number | null;
    createdBy: User;
    updatedBy?: User;
    createdAt: Date;
    updatedAt: Date;
    replies?: Array<{
      id: number;
      content: string;
      isInternal: boolean;
      parentId: number | null;
      createdBy: User;
      updatedBy?: User;
      createdAt: Date;
      updatedAt: Date;
      replies?: any[];
    }>;
  }>;
};

interface ComplaintDetailsProps {
  complaint: ComplaintWithRelations;
  user: User;
  onUpdate: () => void;
}

export default function ComplaintDetails({ complaint, user, onUpdate }: ComplaintDetailsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const availableTabs = useMemo(() => (
    user.role === 'COMPLAINANT'
      ? ['overview']
      : ['overview', 'approval-status', 'fir', 'comments', 'pe-report', 'notice', 'speaking-order']
  ), [user.role]);

  const normalizeTab = useMemo(
    () => (value: string | null) => (value && availableTabs.includes(value) ? value : 'overview'),
    [availableTabs]
  );

  const [activeTab, setActiveTab] = useState<string>(normalizeTab(searchParams.get('tab')));

  useEffect(() => {
    const paramTab = normalizeTab(searchParams.get('tab'));
    if (paramTab !== activeTab) {
      setActiveTab(paramTab);
    }
  }, [activeTab, normalizeTab, searchParams]);

  const handleTabChange = (value: string) => {
    const nextTab = normalizeTab(value);
    setActiveTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [actionDetails, setActionDetails] = useState(complaint.actionTakenBriefDetails || '');
  const [legalIssues, setLegalIssues] = useState(complaint.legalIssues || '');
  const [reviewComments, setReviewComments] = useState(complaint.investigationOfficerReviewComments || '');
  const [firDetails, setFirDetails] = useState(complaint.firDetails || '');
  const [peReport, setPeReport] = useState(complaint.peReport || '');
  const [showPEReport, setShowPEReport] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [showNoticeEditor, setShowNoticeEditor] = useState(false);
  const [noticeType, setNoticeType] = useState<'first' | 'second'>('first');
  const [loading, setLoading] = useState(false);
  
  // Citizen reply state
  const [citizenReply, setCitizenReply] = useState('');
  const [citizenReplyDate, setCitizenReplyDate] = useState('');

  const [editorMode, setEditorMode] = useState<'plate'>('plate');
  const plateRef = useRef<any>(null);
  const noticeEditorRef = useRef<any>(null);
  const noticeAutoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNoticeContentRef = useRef<{ first?: string; second?: string }>({
    first: complaint.firstNoticeContent || '',
    second: complaint.secondNoticeContent || '',
  });
  const PlatePEEditor = dynamic(() => import('@/components/PlatePEEditor').then((m) => m.default), { ssr: false });

  useEffect(() => {
    return () => {
      if (noticeAutoSaveTimer.current) clearTimeout(noticeAutoSaveTimer.current);
    };
  }, []);

  // Helper functions to determine next action badges for tabs
  const getPEReportBadge = () => {
    if (user.role === 'INVESTIGATION_OFFICER') {
      // New complaint - no PE report generated yet
      if (!complaint.peReport && !complaint.fieldVisitDate) {
        return { text: 'Generate', className: 'bg-red-600 hover:bg-red-700 text-white' };
      }
      // DCP has approved for creating notice
      else if (complaint.peNotificationSentToFieldOfficer) {
        return { text: 'DCP approved for creating notice 1', className: 'bg-green-600 hover:bg-green-700 text-white' };
      }
      // PE report completed but not yet approved by DCP
      else {
        return { text: 'PE Report Completed', className: 'bg-green-600 hover:bg-green-700 text-white' };
      }
    }

    if (user.role === 'DCP') {
      // PE report not yet generated
      if (!complaint.peReport) {
        return { text: 'Not yet Generated', className: 'bg-orange-500 hover:bg-orange-600 text-white' };
      }
      // PE report saved in draft mode (not submitted for review)
      else if (complaint.peStatus === 'DRAFT') {
        return { text: 'Draft', className: 'bg-gray-500 hover:bg-gray-600 text-white' };
      }
      // Investigation officer submitted for review but not yet approved
      else if (!complaint.peNotificationSentToFieldOfficer && complaint.peStatus === 'SUBMITTED') {
        return { text: 'Waiting for approval', className: 'bg-blue-600 hover:bg-blue-700 text-white' };
      }
      // DCP has approved (notified investigation officer)
      else if (complaint.peNotificationSentToFieldOfficer) {
        return { text: 'Investigation Officer Notified', className: 'bg-green-600 hover:bg-green-700 text-white' };
      }
      // Default case
      else {
        return { text: 'Review PE Report', className: 'bg-orange-500 hover:bg-orange-600 text-white' };
      }
    }

    if (['ACP', 'COMMISSIONER'].includes(user.role)) {
      // DCP has approved (notified investigation officer)
      if (complaint.peNotificationSentToFieldOfficer) {
        return { text: 'Investigation Officer Notified', className: 'bg-green-600 hover:bg-green-700 text-white' };
      }
      // Waiting for DCP approval
      else if (!complaint.peNotificationSentToFieldOfficer && complaint.peStatus === 'SUBMITTED') {
        return { text: 'Waiting for DCP approval', className: 'bg-blue-600 hover:bg-blue-700 text-white' };
      }
      // PE report not ready
      else {
        return { text: 'PE Report Pending', className: 'bg-orange-500 hover:bg-orange-600 text-white' };
      }
    }

    return null;
  };

  const getNoticeOneBadge = () => {
    if (user.role === 'INVESTIGATION_OFFICER') {
      // Check if notice is in draft mode (content exists but not officially issued)
      if (complaint.firstNoticeContent && (!complaint.firstNoticeNumber || complaint.firstNoticeStatus !== 'ISSUED')) {
        return { text: 'Draft', className: 'bg-orange-500 hover:bg-orange-600 text-white' };
      }
      // No notice generated yet
      else if (!complaint.firstNoticeNumber) {
        return { text: 'Generate Notice', className: 'bg-red-600 hover:bg-red-700 text-white' };
      }
      // Notice generated and issued
      else {
        return { text: 'Notice Generated', className: 'bg-green-600 hover:bg-green-700 text-white' };
      }
    }
    if (['DCP', 'ACP', 'COMMISSIONER'].includes(user.role)) {
      // Check if notice is in draft mode (content exists but not officially issued)
      if (complaint.firstNoticeContent && (!complaint.firstNoticeNumber || complaint.firstNoticeStatus !== 'ISSUED')) {
        return { text: 'Draft', className: 'bg-orange-500 hover:bg-orange-600 text-white' };
      }
      // Notice issued but not yet approved
      else if (complaint.firstNoticeNumber && complaint.firstNoticeStatus === 'ISSUED' && !complaint.notice1CommissionerApprovalDate) {
        return { text: 'Approve Notice', className: 'bg-blue-600 hover:bg-blue-700 text-white' };
      }
      // Notice approved
      else if (complaint.notice1CommissionerApprovalDate) {
        return { text: 'Notice Approved', className: 'bg-green-600 hover:bg-green-700 text-white' };
      }
      return null;
    }
    return null;
  };

  const getNoticeTwoBadge = () => {
    if (user.role === 'INVESTIGATION_OFFICER') {
      // Check if notice is in draft mode (content exists but not officially issued)
      if (complaint.secondNoticeContent && (!complaint.secondNoticeNumber || complaint.secondNoticeStatus !== 'ISSUED')) {
        return { text: 'Draft', className: 'bg-orange-500 hover:bg-orange-600 text-white' };
      }
      // No notice generated yet
      else if (!complaint.secondNoticeNumber) {
        return { text: 'Generate Notice', className: 'bg-red-600 hover:bg-red-700 text-white' };
      }
      // Notice generated and issued
      else {
        return { text: 'Notice Generated', className: 'bg-green-600 hover:bg-green-700 text-white' };
      }
    }
    if (['DCP', 'ACP', 'COMMISSIONER'].includes(user.role)) {
      // Check if notice is in draft mode (content exists but not officially issued)
      if (complaint.secondNoticeContent && (!complaint.secondNoticeNumber || complaint.secondNoticeStatus !== 'ISSUED')) {
        return { text: 'Draft', className: 'bg-orange-500 hover:bg-orange-600 text-white' };
      }
      // Notice issued but not yet approved
      else if (complaint.secondNoticeNumber && complaint.secondNoticeStatus === 'ISSUED' && !complaint.notice2CommissionerApprovalDate) {
        return { text: 'Approve Notice', className: 'bg-blue-600 hover:bg-blue-700 text-white' };
      }
      // Notice approved
      else if (complaint.notice2CommissionerApprovalDate) {
        return { text: 'Notice Approved', className: 'bg-green-600 hover:bg-green-700 text-white' };
      }
      return null;
    }
    return null;
  };

  const getSpeakingOrderBadge = () => {
    // Speaking Order logic - assuming it's for final resolution
    if (['ACP', 'COMMISSIONER'].includes(user.role)) {
      if (complaint.finalStatus === 'PENDING' || complaint.finalStatus === 'UNDER_REVIEW_COMMISSIONER') {
        return { text: 'Issue Order', className: 'bg-blue-600 hover:bg-blue-700 text-white' };
      } else if (complaint.finalStatus === 'RESOLVED' || complaint.finalStatus === 'CLOSED') {
        return { text: 'Order Issued', className: 'bg-green-600 hover:bg-green-700 text-white' };
      }
      return null;
    }
    return null;
  };

  // Build a PE Report HTML that mimics a bordered enquiry report layout.
  const buildPEReportHtml = (c: ComplaintWithRelations) => {
    const petitionNo = c.complaintUniqueId || c.complaintId || `#${c.id}`;
    const createdDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '';
    const fieldVisitDate = c.fieldVisitDate ? new Date(c.fieldVisitDate).toLocaleDateString() : '';
    const brief = c.briefDetailsOfTheComplaint || c.actionTakenBriefDetails || '';
    const respondent = c.detailsOfRespondent || 'Nil';
    const petitioner = c.nameOfTheComplainant || '';
    const location = c.placeOfComplaint || c.addressOfComplaintPlace || '';

    return `
      <div style="font-family: serif; color: #000;">
        <div style="text-align:center; font-weight:bold; font-size:14px;">HYDERABAD DISASTER RESPONSE &amp; ASSET PROTECTION AGENCY</div>
        <div style="text-align:center; font-weight:bold; font-size:18px; margin-top:6px;">ENQUIRY REPORT</div>
        <div style="display:flex; justify-content:space-between; margin-top:10px;">
          <div><strong>Petition No :</strong> ${escapeHtml(petitionNo)}</div>
          <div><strong>Dt:</strong> ${escapeHtml(createdDate)}</div>
        </div>

        <div style="border:1px solid #000; margin-top:12px; padding:6px;">
          <div style="display:flex; border-bottom:1px solid #000;">
            <div style="width:40px; font-weight:bold;">1.</div>
            <div style="flex:1; font-weight:bold;">Name &amp; Address of the petitioner:</div>
            <div style="width:300px; border-left:1px solid #000; padding-left:8px;">${escapeHtml(petitioner)}</div>
          </div>
          <div style="display:flex; border-bottom:1px solid #000;">
            <div style="width:40px; font-weight:bold;">2.</div>
            <div style="flex:1; font-weight:bold;">Name &amp; Address of the Respondent:</div>
            <div style="width:300px; border-left:1px solid #000; padding-left:8px;">${escapeHtml(respondent)}</div>
          </div>
          <div style="display:flex; border-bottom:1px solid #000;">
            <div style="width:40px; font-weight:bold;">3.</div>
            <div style="flex:1; font-weight:bold;">Brief facts of the complaint:</div>
            <div style="width:300px; border-left:1px solid #000; padding-left:8px;">${escapeHtml(brief)}</div>
          </div>
          <div style="display:flex; border-bottom:1px solid #000;">
            <div style="width:40px; font-weight:bold;">4.</div>
            <div style="flex:1; font-weight:bold;">Location of encroachment:</div>
            <div style="width:300px; border-left:1px solid #000; padding-left:8px;">${escapeHtml(location)}</div>
          </div>
          <div style="display:flex; border-bottom:1px solid #000;">
            <div style="width:40px; font-weight:bold;">5.</div>
            <div style="flex:1; font-weight:bold;">Field Visit Date:</div>
            <div style="width:300px; border-left:1px solid #000; padding-left:8px;">${escapeHtml(fieldVisitDate)}</div>
          </div>
          <div style="display:flex; border-bottom:1px solid #000;">
            <div style="width:40px; font-weight:bold;">6.</div>
            <div style="flex:1; font-weight:bold;">Any Court cases pending:</div>
            <div style="width:300px; border-left:1px solid #000; padding-left:8px;">${escapeHtml(c.noticeStatus || 'Nil')}</div>
          </div>

          <div style="display:flex;">
            <div style="width:40px; font-weight:bold;">7.</div>
            <div style="flex:1; font-weight:bold;">Preliminary Enquiry Findings of the IO:</div>
            <div style="width:300px; border-left:1px solid #000; padding-left:8px;">${escapeHtml(c.investigationOfficerReviewComments || '')}</div>
          </div>
        </div>

        <div style="margin-top:18px; display:flex; justify-content:flex-end;"> 
          <div style="text-align:right;">Signature,<br/>EO, APC SEZ, HYDRAA</div>
        </div>
      </div>
    `;
  };

  // Basic HTML escape to avoid breaking generated HTML
  const escapeHtml = (str: any) => {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Plate editor receives initialHtml via props; no Tiptap prefill required here.

  const canEdit = (field: string) => {
    switch (user.role) {
      case 'INVESTIGATION_OFFICER':
        return ['peReport', 'fieldVisitDate', 'peStatus'].includes(field);
      case 'COMPLAINANT':
        return false; // Complainants can only view
      case 'DCP':
        return ['actionTakenBriefDetails', 'legalIssues', 'anyLegalIssues'].includes(field);
      case 'ACP':
        return ['actionTakenBriefDetails', 'legalIssues', 'anyLegalIssues', 'firRegistered', 'firNumber', 'firDetails', 'investigationOfficerReviewComments', 'investigationOfficerReviewDate'].includes(field);
      case 'COMMISSIONER':
        return ['actionTakenBriefDetails', 'legalIssues', 'anyLegalIssues', 'firRegistered', 'firNumber', 'firDetails', 'investigationOfficerReviewComments', 'investigationOfficerReviewDate', 'fieldVisitDate', 'peStatus'].includes(field);
      case 'SUPER_ADMIN':
        return true;
      default:
        return false;
    }
  };

  const handleSaveField = async (field: string, value: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to update complaint');
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // PE Workflow Handlers
  const handleDcpComment = async (comments: string) => {
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/pe-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'add_comments',
          comments 
        }),
      });

      if (response.ok) {
        onUpdate(); // Refresh complaint data
        alert('Comments saved successfully');
      } else {
        alert('Failed to save comments');
      }
    } catch (error) {
      console.error('Error saving DCP comments:', error);
      alert('An error occurred while saving comments');
    }
  };

  const handleNotifyFieldOfficer = async () => {
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/pe-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'notify_investigation_officer'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(); // Refresh complaint data
        alert(data.message || 'Investigation Officer has been notified successfully');
      } else {
        alert('Failed to notify investigation officer');
      }
    } catch (error) {
      console.error('Error notifying investigation officer:', error);
      alert('An error occurred while sending notification');
    }
  };

  const handleUpdateNoticeSentDate = async (noticeType: 'first' | 'second', sentDate: Date) => {
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/pe-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'update_sent_date',
          noticeType,
          sentDate: sentDate.toISOString()
        }),
      });

      if (response.ok) {
        onUpdate(); // Refresh complaint data
        alert('Notice sent date updated successfully');
      } else {
        alert('Failed to update notice sent date');
      }
    } catch (error) {
      console.error('Error updating notice sent date:', error);
      alert('An error occurred while updating sent date');
    }
  };

  const noticeUsersData: any = useMemo(
    (): Record<string, { id: string; name: string; email?: string; role?: string }> => {
      type NoticeUser = { id: string; name: string; email?: string; role?: string };

      const mapUser = (u?: { id?: string | number | null; name?: string | null; email?: unknown; role?: unknown }): NoticeUser | null => {
        if (!u?.id) return null;
        const role = typeof u.role === 'string' ? u.role : u.role ? String(u.role) : undefined;
        const email = typeof u.email === 'string' ? u.email : undefined;
        const name = typeof u.name === 'string' && u.name.trim().length > 0 ? u.name : 'Unknown';

        return {
          id: String(u.id),
          name,
          email,
          role,
        } satisfies NoticeUser;
      };

      const entries: Record<string, NoticeUser> = {};
      const created = mapUser((complaint as any).createdBy);
      if (created) entries[created.id] = created;

      const assigned = mapUser((complaint as any).assignedTo);
      if (assigned) entries[assigned.id] = assigned;

      const current = mapUser(user as any);
      if (current) entries[current.id] = current;

      return entries;
    },
    [complaint, user]
  );

  // Handler for updating notice issued date
  const handleUpdateNoticeIssuedDate = async (issuedDate: Date) => {
    console.log('Updating notice issued date:', issuedDate);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstNoticeIssuedDate: issuedDate.toISOString(),
        }),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        onUpdate();
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        alert(`Failed to update notice issued date: ${errorData.error || 'Unknown error'}${errorData.details ? ' - ' + errorData.details : ''}`);
      }
    } catch (error) {
      console.error('Error updating notice issued date:', error);
      alert('Failed to update notice issued date');
    }
  };

  // Handler for saving citizen reply
  const handleSaveCitizenReply = async () => {
    try {
      const response = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstNoticeCitizenReply: citizenReply,
          firstNoticeCitizenReplyDate: new Date(citizenReplyDate).toISOString(),
        }),
      });

      if (response.ok) {
        setCitizenReply('');
        setCitizenReplyDate('');
        onUpdate();
      } else {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        alert(`Failed to save citizen reply: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving citizen reply:', error);
      alert('Failed to save citizen reply');
    }
  };

  const handleGenerateNotice = async () => {
    try {
      let htmlContent = '';

      if (!plateRef.current) {
        alert('Plate editor is not ready yet. Please wait.');
        return;
      }
      // Plate exporter: try HTML then fallback to markdown
      try {
        htmlContent = await plateRef.current.getHtml();
      } catch (e) {
        htmlContent = plateRef.current.getMarkdown();
      }

      const noticeBlob = await generateNotice({ ...complaint, noticeContent: htmlContent } as any);
      saveAs(noticeBlob, `PE_Report_${complaint.id}.docx`);
    } catch (error) {
      console.error('Error generating notice:', error);
      alert(`Failed to generate notice: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleApprovalAction = async (noticeType: 'notice1' | 'notice2', stage: 'dcp' | 'acp' | 'commissioner') => {
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          type: noticeType === 'notice1' ? 'first' : 'second',
          stage
        }),
      });

      if (response.ok) {
        onUpdate(); // Refresh the complaint data
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve notice');
      }
    } catch (error) {
      console.error('Error approving notice:', error);
      alert('Failed to approve notice');
    }
  };

  const handleRejectionAction = async (noticeType: 'notice1' | 'notice2', stage: 'dcp' | 'acp' | 'commissioner', reason: string) => {
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          type: noticeType === 'notice1' ? 'first' : 'second',
          stage,
          rejectionReason: reason
        }),
      });

      if (response.ok) {
        onUpdate(); // Refresh the complaint data
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject notice');
      }
    } catch (error) {
      console.error('Error rejecting notice:', error);
      alert('Failed to reject notice');
    }
  };

  const getStatusBadgeVariant = (status: ComplaintStatus | null) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'UNDER_REVIEW_DCP':
      case 'UNDER_REVIEW_ACP':
      case 'UNDER_REVIEW_COMMISSIONER':
      case 'INVESTIGATION_IN_PROGRESS':
        return 'default';
      case 'LEGAL_REVIEW':
        return 'outline';
      case 'RESOLVED':
        return 'default';
      case 'REJECTED':
      case 'CLOSED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Enhanced Header with Status Cards */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Complaint Details
              </h1>
              <Badge 
                variant={getStatusBadgeVariant(complaint.finalStatus)} 
                className="text-sm px-3 py-1 font-semibold"
              >
                {complaint.finalStatus?.replace('_', ' ') || 'PENDING'}
              </Badge>
            </div>
            <p className="text-gray-600 mb-4">Full details of the complaint</p>
            
            {/* Complaint ID and Creation Info */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {complaint.complaintId || `CMP-${complaint.id}`}
                </h2>
                <span className="text-sm text-gray-500">
                  Created by {complaint.createdBy.name} on {new Date(complaint.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {/* Quick Status Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Notice 1 Status */}
                {(complaint.firstNoticeNumber || complaint.firstNoticeDate) && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-1">Notice 1</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            complaint.notice1ApprovalStatus === 'APPROVED' ? 'default' :
                            complaint.notice1ApprovalStatus === 'REJECTED' ? 'destructive' : 'secondary'
                          } className="text-xs">
                            {complaint.notice1ApprovalStatus || 'PENDING'}
                          </Badge>
                          {complaint.firstNoticeDate && (
                            <span className="text-xs text-gray-600">
                              {new Date(complaint.firstNoticeDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                )}
                
                {/* Notice 2 Status */}
                {(complaint.secondNoticeNumber || complaint.secondNoticeDate) && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-purple-700 mb-1">Notice 2</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            complaint.notice2ApprovalStatus === 'APPROVED' ? 'default' :
                            complaint.notice2ApprovalStatus === 'REJECTED' ? 'destructive' : 'secondary'
                          } className="text-xs">
                            {complaint.notice2ApprovalStatus || 'PENDING'}
                          </Badge>
                          {complaint.secondNoticeDate && (
                            <span className="text-xs text-gray-600">
                              {new Date(complaint.secondNoticeDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                )}
                
                {/* Priority & Source */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">Priority & Source</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          complaint.complaintPriority === 'HIGH' || complaint.complaintPriority === 'URGENT' 
                            ? 'destructive' : 'secondary'
                        } className="text-xs">
                          {complaint.complaintPriority || 'NORMAL'}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {complaint.sourceOfComplaint || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => router.push('/dashboard/complaints')}
            variant="outline"
            className="ml-4 bg-white hover:bg-gray-50 border-gray-300"
          >
            ← Back to Complaints
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="bg-white border border-gray-200 rounded-lg sticky top-0 z-10 shadow-sm overflow-hidden">
          <TabsList className={`grid w-full ${user.role === 'COMPLAINANT' ? 'grid-cols-1' : 'grid-cols-7'} p-0 h-auto bg-transparent border-0 gap-0`}>
            <TabsTrigger 
              value="overview" 
              className={`relative w-full cursor-pointer px-4 py-4 h-14 font-medium transition-all duration-200 rounded-none flex items-center justify-center text-sm hover:bg-blue-50 ${
                activeTab === 'overview' 
                  ? 'text-blue-700 bg-blue-100 font-semibold border-b-2 border-blue-500' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>Overview</span>
              </div>
            </TabsTrigger>
            {user.role !== 'COMPLAINANT' && (
              <>
                <TabsTrigger 
                  value="pe-report" 
                  className={`relative w-full cursor-pointer px-4 py-4 h-14 font-medium transition-all duration-200 rounded-none flex items-center justify-center text-sm hover:bg-blue-50 ${
                    activeTab === 'pe-report' 
                      ? 'text-blue-700 bg-blue-100 font-semibold border-b-2 border-blue-500' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>PE Report</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="notice" 
                  className={`relative w-full cursor-pointer px-4 py-4 h-14 font-medium transition-all duration-200 rounded-none flex items-center justify-center text-sm hover:bg-blue-50 ${
                    activeTab === 'notice' 
                      ? 'text-blue-700 bg-blue-100 font-semibold border-b-2 border-blue-500' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Notice</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="speaking-order" 
                  className={`relative w-full cursor-pointer px-4 py-4 h-14 font-medium transition-all duration-200 rounded-none flex items-center justify-center text-sm hover:bg-blue-50 ${
                    activeTab === 'speaking-order' 
                      ? 'text-blue-700 bg-blue-100 font-semibold border-b-2 border-blue-500' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Speaking Order</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="fir" 
                  className={`relative w-full cursor-pointer px-4 py-4 h-14 font-medium transition-all duration-200 rounded-none flex items-center justify-center text-sm hover:bg-blue-50 ${
                    activeTab === 'fir' 
                      ? 'text-blue-700 bg-blue-100 font-semibold border-b-2 border-blue-500' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>FIR Details</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="comments" 
                  className={`relative w-full cursor-pointer px-4 py-4 h-14 font-medium transition-all duration-200 rounded-none flex items-center justify-center text-sm hover:bg-blue-50 ${
                    activeTab === 'comments' 
                      ? 'text-blue-700 bg-blue-100 font-semibold border-b-2 border-blue-500' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Comments</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="approval-status" 
                  className={`relative w-full cursor-pointer px-4 py-4 h-14 font-medium transition-all duration-200 rounded-none flex items-center justify-center text-sm hover:bg-blue-50 ${
                    activeTab === 'approval-status' 
                      ? 'text-blue-700 bg-blue-100 font-semibold border-b-2 border-blue-500' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Approval Status</span>
                  </div>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="w-full max-w-full mt-6 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Jurisdiction Card - Enhanced */}
            <Card className="w-full border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  Jurisdiction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Commissionerate</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {complaint.commissionerate?.name || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">DCP Zone</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {complaint.dcpZone?.name || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Municipal Zone</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {complaint.municipalZone?.name || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">ACP Division</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {complaint.acpDivision?.name || 'Not specified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Complaint Basic Info - Enhanced */}
            <Card className="w-full border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  Complaint Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nature of Complaint</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {complaint.natureOfComplaint || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Place of Complaint</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {complaint.placeOfComplaint || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                {complaint.addressOfComplaintPlace && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Address of Complaint Place</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1 leading-relaxed">
                      {complaint.addressOfComplaintPlace}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complainant Details - Enhanced */}
            <Card className="w-full border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UserIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  Complainant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {complaint.nameOfTheComplainant && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</Label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {complaint.nameOfTheComplainant}
                      </p>
                    </div>
                  )}
                  {complaint.phoneOfTheComplainant && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone
                      </Label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {complaint.phoneOfTheComplainant}
                      </p>
                    </div>
                  )}
                </div>
                
                {complaint.addressOfTheComplainant && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Address</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1 leading-relaxed">
                      {complaint.addressOfTheComplainant}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Timeline - New Section */}
            <Card className="w-full border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  Key Dates & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-900">Complaint Created</span>
                    <span className="text-sm text-blue-700">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {complaint.dateOfApplicationReceived && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-green-900">Application Received</span>
                      <span className="text-sm text-green-700">
                        {new Date(complaint.dateOfApplicationReceived).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {complaint.fieldVisitDate && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="text-sm font-medium text-purple-900">Field Visit</span>
                      <span className="text-sm text-purple-700">
                        {new Date(complaint.fieldVisitDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Width Description Section */}
          <div className="mt-6">
            <Card className="w-full border-l-4 border-l-gray-500 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  Detailed Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 w-full">
                {complaint.briefDetailsOfTheComplaint && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                      Brief Details of Complaint
                    </Label>
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {complaint.briefDetailsOfTheComplaint}
                    </p>
                  </div>
                )}

                {complaint.detailsOfRespondent && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                      Details of Respondent
                    </Label>
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {complaint.detailsOfRespondent}
                    </p>
                  </div>
                )}

                {complaint.actionTakenBriefDetails && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <Label className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2 block">
                      Action Taken - Brief Details
                    </Label>
                    <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
                      {complaint.actionTakenBriefDetails}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pe-report" className="w-full max-w-full space-y-6 mt-6">
          <EnquiryReport complaint={complaint} user={user} />
        </TabsContent>

        <TabsContent value="notice" className="w-full max-w-full space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NoticeOne complaint={complaint} user={user} />
            <NoticeTwo complaint={complaint} user={user} />
          </div>
        </TabsContent>

        <TabsContent value="speaking-order" className="w-full max-w-full space-y-6 mt-6">
          <SpeakingOrder complaint={complaint} />
        </TabsContent>

        <TabsContent value="fir" className="w-full max-w-full space-y-6 mt-6">
          <FIRManagement 
            complaintId={complaint.id}
            firs={(complaint.firs || []).map(fir => ({
              ...fir,
              status: fir.status as any,
              createdBy: fir.createdBy || { name: 'Unknown' },
              updatedBy: fir.updatedBy || undefined
            }))}
            canCreateFIR={user.role === 'SUPER_ADMIN' || user.role === 'INVESTIGATION_OFFICER'}
            onFIRCreated={() => {}}
            onFIREdited={() => {}}
            onFIRDeleted={() => {}}
          />
        </TabsContent>

        <TabsContent value="comments" className="w-full max-w-full space-y-6 mt-6">
          <CommentManagement 
            complaintId={complaint.id}
            comments={complaint.comments || []}
            canAddComments={true}
            onCommentCreated={() => {}}
            onCommentEdited={() => {}}
            onCommentDeleted={() => {}}
          />
        </TabsContent>

        <TabsContent value="approval-status" className="w-full max-w-full space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NoticeApproval 
              complaint={complaint} 
              userRole={user.role}
              onApprovalUpdate={() => {}}
            />
            <ApprovalWorkflow 
              noticeType="notice1"
              status="PENDING"
              dcpApprovalDate={complaint.notice1DcpApprovalDate || undefined}
              acpApprovalDate={complaint.notice1AcpApprovalDate || undefined}
              commissionerApprovalDate={complaint.notice1CommissionerApprovalDate || undefined}
              rejectionDate={complaint.notice1RejectionDate || undefined}
              rejectionReason={complaint.notice1RejectionReason || undefined}
              userRole={user.role}
              onApprove={() => {}}
              onReject={() => {}}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
