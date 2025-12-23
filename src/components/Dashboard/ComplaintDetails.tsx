'use client';

import { useState, useRef } from 'react';
import { User, ComplaintStatus, FIRStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, FileText, UserIcon, AlertTriangle, Phone, MessageSquare } from 'lucide-react';
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
  fieldVisitDate: Date | null;
  peStatus: string | null;
  // Notice tracking fields
  firstNoticeNumber?: string | null;
  firstNoticeDate?: Date | null;
  firstNoticeStatus?: string | null;
  secondNoticeNumber?: string | null;
  secondNoticeDate?: Date | null;
  secondNoticeStatus?: string | null;
  noticeApprovalStatus?: string | null;
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
  const [actionDetails, setActionDetails] = useState(complaint.actionTakenBriefDetails || '');
  const [legalIssues, setLegalIssues] = useState(complaint.legalIssues || '');
  const [reviewComments, setReviewComments] = useState(complaint.investigationOfficerReviewComments || '');
  const [firDetails, setFirDetails] = useState(complaint.firDetails || '');
  const [peReport, setPeReport] = useState(complaint.peReport || '');
  const [showPEReport, setShowPEReport] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [noticeType, setNoticeType] = useState<'first' | 'second'>('first');
  const [loading, setLoading] = useState(false);

  const [editorMode, setEditorMode] = useState<'plate'>('plate');
  const plateRef = useRef<any>(null);
  const PlatePEEditor = dynamic(() => import('@/components/PlatePEEditor').then((m) => m.default), { ssr: false });

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
      case 'FIELD_OFFICER':
      case 'COMPLAINANT':
        return false; // Field officers can only view
      case 'DCP':
        return ['actionTakenBriefDetails', 'legalIssues', 'anyLegalIssues'].includes(field);
      case 'ACP':
        return ['actionTakenBriefDetails', 'legalIssues', 'anyLegalIssues', 'firRegistered', 'firNumber', 'firDetails', 'investigationOfficerReviewComments', 'investigationOfficerReviewDate'].includes(field);
      case 'COMMISSIONER':
        return ['actionTakenBriefDetails', 'legalIssues', 'anyLegalIssues', 'firRegistered', 'firNumber', 'firDetails', 'investigationOfficerReviewComments', 'investigationOfficerReviewDate', 'peReport', 'fieldVisitDate', 'peStatus'].includes(field);
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
    <div className="space-y-6 h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{complaint.complaintId || `Complaint #${complaint.id}`}</h2>
          <p className="text-muted-foreground">
            Created by {complaint.createdBy.name} on {new Date(complaint.createdAt).toLocaleDateString()}
          </p>
          
          {/* Notice Status Overview */}
          <div className="flex gap-4 mt-3">
            {(complaint.firstNoticeNumber || complaint.firstNoticeDate) && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Notice 1:</span>
                <Badge variant={
                  complaint.notice1ApprovalStatus === 'APPROVED' ? 'default' :
                  complaint.notice1ApprovalStatus === 'REJECTED' ? 'destructive' : 'secondary'
                } size="sm">
                  {complaint.notice1ApprovalStatus || 'PENDING'}
                </Badge>
              </div>
            )}
            {(complaint.secondNoticeNumber || complaint.secondNoticeDate) && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Notice 2:</span>
                <Badge variant={
                  complaint.notice2ApprovalStatus === 'APPROVED' ? 'default' :
                  complaint.notice2ApprovalStatus === 'REJECTED' ? 'destructive' : 'secondary'
                } size="sm">
                  {complaint.notice2ApprovalStatus || 'PENDING'}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <Badge variant={getStatusBadgeVariant(complaint.finalStatus)} className="text-sm">
          {complaint.finalStatus?.replace('_', ' ') || 'Unknown Status'}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approval-status">Approval Status</TabsTrigger>
          <TabsTrigger value="fir">FIR Details</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="pe-report">PE Report</TabsTrigger>
          <TabsTrigger value="notice">Notice</TabsTrigger>
          <TabsTrigger value="speaking-order">Speaking Order</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">

      {/* Jurisdiction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Jurisdiction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Commissionerate</Label>
              <p className="text-sm text-muted-foreground">{complaint.commissionerate?.name || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">DCP Zone</Label>
              <p className="text-sm text-muted-foreground">{complaint.dcpZone?.name || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Municipal Zone</Label>
              <p className="text-sm text-muted-foreground">{complaint.municipalZone?.name || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">ACP Division</Label>
              <p className="text-sm text-muted-foreground">{complaint.acpDivision?.name || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaint Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Complaint Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Nature of Complaint</Label>
              <p className="text-sm">{complaint.natureOfComplaint || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <Badge variant={complaint.complaintPriority === 'HIGH' || complaint.complaintPriority === 'URGENT' ? 'destructive' : 'secondary'}>
                {complaint.complaintPriority || 'NORMAL'}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Place of Complaint</Label>
              <p className="text-sm">{complaint.placeOfComplaint || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Source</Label>
              <p className="text-sm">{complaint.sourceOfComplaint || 'Not specified'}</p>
            </div>
          </div>

          {complaint.addressOfComplaintPlace && (
            <div>
              <Label className="text-sm font-medium">Address of Complaint Place</Label>
              <p className="text-sm text-muted-foreground">{complaint.addressOfComplaintPlace}</p>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Brief Details</Label>
            <p className="text-sm text-muted-foreground">{complaint.briefDetailsOfTheComplaint || 'No details provided'}</p>
          </div>

          {complaint.detailsOfRespondent && (
            <div>
              <Label className="text-sm font-medium">Details of Respondent</Label>
              <p className="text-sm text-muted-foreground">{complaint.detailsOfRespondent}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complainant Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Complainant Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm">{complaint.nameOfTheComplainant || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Phone</Label>
              <p className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {complaint.phoneOfTheComplainant || 'Not provided'}
              </p>
            </div>
          </div>

          {complaint.addressOfTheComplainant && (
            <div>
              <Label className="text-sm font-medium">Address</Label>
              <p className="text-sm text-muted-foreground">{complaint.addressOfTheComplainant}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investigation Details */}
      {(user.role !== 'FIELD_OFFICER' && user.role !== 'COMPLAINANT') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Investigation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canEdit('actionTakenBriefDetails') && (
              <div>
                <Label className="text-sm font-medium">Action Taken</Label>
                <Textarea
                  value={actionDetails}
                  onChange={(e) => setActionDetails(e.target.value)}
                  placeholder="Brief details of actions taken"
                  rows={3}
                />
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => handleSaveField('actionTakenBriefDetails', actionDetails)}
                  disabled={loading}
                >
                  Save Action Details
                </Button>
              </div>
            )}

            {canEdit('legalIssues') && (
              <div>
                <Label className="text-sm font-medium">Legal Issues</Label>
                <Textarea
                  value={legalIssues}
                  onChange={(e) => setLegalIssues(e.target.value)}
                  placeholder="Any legal issues identified"
                  rows={3}
                />
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => handleSaveField('legalIssues', legalIssues)}
                  disabled={loading}
                >
                  Save Legal Issues
                </Button>
              </div>
            )}

            {complaint.firRegistered && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">FIR Registered</Label>
                  <Badge variant={complaint.firRegistered === 'YES' ? 'default' : 'secondary'}>
                    {complaint.firRegistered}
                  </Badge>
                </div>
                {complaint.firNumber && (
                  <div>
                    <Label className="text-sm font-medium">FIR Number</Label>
                    <p className="text-sm">{complaint.firNumber}</p>
                  </div>
                )}
              </div>
            )}

            {complaint.firDetails && (
              <div>
                <Label className="text-sm font-medium">FIR Details</Label>
                <p className="text-sm text-muted-foreground">{complaint.firDetails}</p>
              </div>
            )}

            {complaint.investigationOfficerReviewComments && (
              <div>
                <Label className="text-sm font-medium">Investigation Officer Review</Label>
                <p className="text-sm text-muted-foreground">{complaint.investigationOfficerReviewComments}</p>
                {complaint.investigationOfficerReviewDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Reviewed on {new Date(complaint.investigationOfficerReviewDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

        </TabsContent>

        <TabsContent value="approval-status" className="space-y-6 mt-6">
          {/* Always show Notice 1 Approval Workflow */}
          <ApprovalWorkflow
            noticeType="notice1"
            status={complaint.notice1ApprovalStatus as any || 'PENDING'}
            dcpApprovalDate={complaint.notice1DcpApprovalDate}
            dcpApprovedBy={complaint.notice1DcpApprovedBy}
            acpApprovalDate={complaint.notice1AcpApprovalDate}
            acpApprovedBy={complaint.notice1AcpApprovedBy}
            commissionerApprovalDate={complaint.notice1CommissionerApprovalDate}
            commissionerApprovedBy={complaint.notice1CommissionerApprovedBy}
            rejectionDate={complaint.notice1RejectionDate}
            rejectedBy={complaint.notice1RejectedBy}
            rejectionReason={complaint.notice1RejectionReason}
            userRole={user.role}
            onApprove={
              (complaint.firstNoticeNumber || complaint.firstNoticeDate) 
                ? (stage) => handleApprovalAction('notice1', stage)
                : undefined
            }
            onReject={
              (complaint.firstNoticeNumber || complaint.firstNoticeDate)
                ? (stage, reason) => handleRejectionAction('notice1', stage, reason)
                : undefined
            }
          />
          
          {!(complaint.firstNoticeNumber || complaint.firstNoticeDate) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <p className="text-sm text-orange-700 text-center">
                  📝 Notice 1 has not been generated yet. Generate it from the Notice tab to begin the approval process.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Always show Notice 2 Approval Workflow */}
          <ApprovalWorkflow
            noticeType="notice2"
            status={complaint.notice2ApprovalStatus as any || 'PENDING'}
            dcpApprovalDate={complaint.notice2DcpApprovalDate}
            dcpApprovedBy={complaint.notice2DcpApprovedBy}
            acpApprovalDate={complaint.notice2AcpApprovalDate}
            acpApprovedBy={complaint.notice2AcpApprovedBy}
            commissionerApprovalDate={complaint.notice2CommissionerApprovalDate}
            commissionerApprovedBy={complaint.notice2CommissionerApprovedBy}
            rejectionDate={complaint.notice2RejectionDate}
            rejectedBy={complaint.notice2RejectedBy}
            rejectionReason={complaint.notice2RejectionReason}
            userRole={user.role}
            onApprove={
              (complaint.secondNoticeNumber || complaint.secondNoticeDate) 
                ? (stage) => handleApprovalAction('notice2', stage)
                : undefined
            }
            onReject={
              (complaint.secondNoticeNumber || complaint.secondNoticeDate)
                ? (stage, reason) => handleRejectionAction('notice2', stage, reason)
                : undefined
            }
          />
          
          {!(complaint.secondNoticeNumber || complaint.secondNoticeDate) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <p className="text-sm text-orange-700 text-center">
                  📝 Notice 2 has not been generated yet. Generate it from the Notice tab to begin the approval process.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Overall Approval Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Notice 1 Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Overall Status:</span>
                      <Badge variant={
                        complaint.notice1ApprovalStatus === 'APPROVED' ? 'default' :
                        complaint.notice1ApprovalStatus === 'REJECTED' ? 'destructive' : 'secondary'
                      }>
                        {complaint.notice1ApprovalStatus || 'Not Generated'}
                      </Badge>
                    </div>
                    {complaint.notice1DcpApprovalDate && (
                      <div className="flex justify-between text-sm">
                        <span>DCP Approved:</span>
                        <span>{new Date(complaint.notice1DcpApprovalDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {complaint.notice1AcpApprovalDate && (
                      <div className="flex justify-between text-sm">
                        <span>ACP Approved:</span>
                        <span>{new Date(complaint.notice1AcpApprovalDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {complaint.notice1CommissionerApprovalDate && (
                      <div className="flex justify-between text-sm">
                        <span>Commissioner Approved:</span>
                        <span>{new Date(complaint.notice1CommissionerApprovalDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Notice 2 Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Overall Status:</span>
                      <Badge variant={
                        complaint.notice2ApprovalStatus === 'APPROVED' ? 'default' :
                        complaint.notice2ApprovalStatus === 'REJECTED' ? 'destructive' : 'secondary'
                      }>
                        {complaint.notice2ApprovalStatus || 'Not Generated'}
                      </Badge>
                    </div>
                    {complaint.notice2DcpApprovalDate && (
                      <div className="flex justify-between text-sm">
                        <span>DCP Approved:</span>
                        <span>{new Date(complaint.notice2DcpApprovalDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {complaint.notice2AcpApprovalDate && (
                      <div className="flex justify-between text-sm">
                        <span>ACP Approved:</span>
                        <span>{new Date(complaint.notice2AcpApprovalDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {complaint.notice2CommissionerApprovalDate && (
                      <div className="flex justify-between text-sm">
                        <span>Commissioner Approved:</span>
                        <span>{new Date(complaint.notice2CommissionerApprovalDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fir" className="space-y-6 mt-6">
          <FIRManagement
            complaintId={complaint.id}
            firs={(complaint.firs || []).map(fir => ({
              ...fir,
              status: fir.status as FIRStatus
            }))}
            canCreateFIR={['DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN', 'FIELD_OFFICER'].includes(user.role)}
            onFIRCreated={onUpdate}
            onFIREdited={onUpdate}
            onFIRDeleted={onUpdate}
          />
        </TabsContent>

        <TabsContent value="comments" className="space-y-6 mt-6">
          <CommentManagement
            complaintId={complaint.id}
            comments={complaint.comments || []}
            canAddComments={['DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN'].includes(user.role)}
            onCommentCreated={onUpdate}
            onCommentEdited={onUpdate}
            onCommentDeleted={onUpdate}
          />
        </TabsContent>

        <TabsContent value="pe-report" className="space-y-6 mt-6">
          {!showPEReport ? (
            <Card>
              <CardHeader>
                <CardTitle>PE Report / Notice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Notice Content</Label>
                  <div className="border rounded-md p-2 min-h-[200px]">
                    <PlatePEEditor ref={plateRef} initialHtml={buildPEReportHtml(complaint)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleGenerateNotice}>Generate Notice</Button>
                  <Button variant="outline" onClick={async () => {
                    if (!plateRef.current) {
                      alert('Editor not ready');
                      return;
                    }
                    let html = '';
                    try {
                      html = await plateRef.current.getHtml();
                    } catch (e) {
                      html = plateRef.current.getMarkdown();
                    }
                    handleSaveField('peReport', html);
                  }}>Save PE Report</Button>
                  <Button variant="secondary" onClick={() => setShowPEReport(true)}>View PE Report</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Preliminary Enquiry Report</span>
                  <Button variant="outline" onClick={() => setShowPEReport(false)}>Back to Editor</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnquiryReport complaint={complaint} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notice" className="space-y-6 mt-6">
          {!showNotice ? (
            <>
              {/* Notice 1 Approval Workflow */}
              {(complaint.firstNoticeNumber || complaint.firstNoticeDate) && (
                <ApprovalWorkflow
                  noticeType="notice1"
                  status={complaint.notice1ApprovalStatus as any || 'PENDING'}
                  dcpApprovalDate={complaint.notice1DcpApprovalDate}
                  dcpApprovedBy={complaint.notice1DcpApprovedBy}
                  acpApprovalDate={complaint.notice1AcpApprovalDate}
                  acpApprovedBy={complaint.notice1AcpApprovedBy}
                  commissionerApprovalDate={complaint.notice1CommissionerApprovalDate}
                  commissionerApprovedBy={complaint.notice1CommissionerApprovedBy}
                  rejectionDate={complaint.notice1RejectionDate}
                  rejectedBy={complaint.notice1RejectedBy}
                  rejectionReason={complaint.notice1RejectionReason}
                  userRole={user.role}
                  onApprove={(stage) => handleApprovalAction('notice1', stage)}
                  onReject={(stage, reason) => handleRejectionAction('notice1', stage, reason)}
                />
              )}

              {/* Notice 2 Approval Workflow */}
              {(complaint.secondNoticeNumber || complaint.secondNoticeDate) && (
                <ApprovalWorkflow
                  noticeType="notice2"
                  status={complaint.notice2ApprovalStatus as any || 'PENDING'}
                  dcpApprovalDate={complaint.notice2DcpApprovalDate}
                  dcpApprovedBy={complaint.notice2DcpApprovedBy}
                  acpApprovalDate={complaint.notice2AcpApprovalDate}
                  acpApprovedBy={complaint.notice2AcpApprovedBy}
                  commissionerApprovalDate={complaint.notice2CommissionerApprovalDate}
                  commissionerApprovedBy={complaint.notice2CommissionerApprovedBy}
                  rejectionDate={complaint.notice2RejectionDate}
                  rejectedBy={complaint.notice2RejectedBy}
                  rejectionReason={complaint.notice2RejectionReason}
                  userRole={user.role}
                  onApprove={(stage) => handleApprovalAction('notice2', stage)}
                  onReject={(stage, reason) => handleRejectionAction('notice2', stage, reason)}
                />
              )}
              
              {/* Notice Generation */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Official Notices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Generate official HYDRAA notices based on this complaint.
                    {user.role === 'FIELD_OFFICER' && ' Generated notices will require approval from DCP, ACP, and Commissioner.'}
                    {(['DCP', 'ACP', 'COMMISSIONER'].includes(user.role)) && ' You can view and approve notices once generated.'}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Notice Block */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">First Notice</h4>
                        {(complaint.firstNoticeNumber || complaint.firstNoticeDate) && (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-xs text-green-600 font-medium">Generated</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Initial notice for document submission and show cause
                      </p>
                      <Button 
                        onClick={() => {
                          setNoticeType('first');
                          setShowNotice(true);
                        }}
                        variant={(complaint.firstNoticeNumber || complaint.firstNoticeDate) ? "default" : "outline"}
                        className="w-full"
                        size="sm"
                      >
                        {(['DCP', 'ACP', 'COMMISSIONER'].includes(user.role)) ? 
                          'View & Approve First Notice' : 
                          (complaint.firstNoticeNumber || complaint.firstNoticeDate) ? 
                            'View First Notice' : 'Generate First Notice'
                        }
                      </Button>
                    </div>

                    {/* Second Notice Block */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Second Notice</h4>
                        {(complaint.secondNoticeNumber || complaint.secondNoticeDate) && (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-xs text-green-600 font-medium">Generated</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Final notice with compliance deadline and actions
                      </p>
                      <Button 
                        onClick={() => {
                          setNoticeType('second');
                          setShowNotice(true);
                        }}
                        variant={(complaint.secondNoticeNumber || complaint.secondNoticeDate) ? "default" : "outline"}
                        className="w-full"
                        size="sm"
                      >
                        {(['DCP', 'ACP', 'COMMISSIONER'].includes(user.role)) ? 
                          'View & Approve Second Notice' : 
                          (complaint.secondNoticeNumber || complaint.secondNoticeDate) ? 
                            'View Second Notice' : 'Generate Second Notice'
                        }
                      </Button>
                    </div>
                  </div>

                  {/* Role-specific information */}
                  {(['DCP', 'ACP', 'COMMISSIONER'].includes(user.role)) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-white text-xs font-bold">i</span>
                        </div>
                        <div>
                          <h5 className="font-medium text-blue-800 mb-1">Your Role: {user.role}</h5>
                          <p className="text-sm text-blue-700">
                            You can view generated notices and provide approval decisions. 
                            Each notice requires sequential approval from DCP → ACP → Commissioner.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {noticeType === 'first' ? 'First Notice' : 'Notice 2'}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>Print</Button>
                    <Button variant="outline" onClick={() => setShowNotice(false)}>Back</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {noticeType === 'first' ? (
                  <NoticeOne 
                    complaint={complaint} 
                    user={user}
                    onApprovalAction={(stage) => handleApprovalAction('notice1', stage)}
                    onRejectionAction={(stage, reason) => handleRejectionAction('notice1', stage, reason)}
                  />
                ) : (
                  <NoticeTwo 
                    complaint={complaint} 
                    user={user}
                    onApprovalAction={(stage) => handleApprovalAction('notice2', stage)}
                    onRejectionAction={(stage, reason) => handleRejectionAction('notice2', stage, reason)}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="speaking-order" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Speaking Order - Final Decision</CardTitle>
            </CardHeader>
            <CardContent>
              <SpeakingOrder complaint={complaint} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}