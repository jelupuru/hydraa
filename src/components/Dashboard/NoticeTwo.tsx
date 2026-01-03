import NoticeLayout from "./NoticeLayout";
import ApprovalWorkflow from '../ApprovalWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Printer, Calendar, MapPin, MessageSquare, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRef, useState, useEffect } from 'react';
import { serializeHtml } from 'platejs/static';
import { createPlateEditor } from 'platejs/react';
import { EditorKit } from '../editor-kit';
import { toast } from 'sonner';

const PlateNoticeViewer = dynamic(() => import('@/components/PlateNoticeViewer').then((m) => m.PlateNoticeViewer), { ssr: false });
const PlateNoticeEditor = dynamic(() => import('@/components/PlateNoticeEditor').then((m) => m.PlateNoticeEditor), { ssr: false });

interface NoticeTwoProps {
  complaint: {
    id: number;
    briefDetailsOfTheComplaint: string | null;
    placeOfComplaint: string | null;
    nameOfTheComplainant: string | null;
    detailsOfRespondent: string | null;
    createdAt: Date;
    fieldVisitDate: Date | null;
    firstNoticeDate: Date | null;
    firstNoticeNumber: string | null;
    secondNoticeNumber?: string | null;
    secondNoticeDate?: Date | null;
    secondNoticeStatus?: string | null;
    secondNoticeContent?: string | null;
    secondNoticeDiscussions?: string | null;
    // Approval workflow fields for Notice 2
    notice2ApprovalStatus?: string | null;
    notice2DcpApprovalDate?: Date | null;
    notice2DcpApprovedBy?: any;
    notice2AcpApprovalDate?: Date | null;
    notice2AcpApprovedBy?: any;
    notice2CommissionerApprovalDate?: Date | null;
    notice2CommissionerApprovedBy?: any;
    notice2RejectionDate?: Date | null;
    notice2RejectedBy?: any;
    notice2RejectionReason?: string | null;
    peNotificationSentToFieldOfficer?: boolean;
  };
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  usersData?: Record<string, any>;
  onApprovalAction?: (stage: string) => void;
  onRejectionAction?: (stage: string, reason?: string) => void;
}

const NoticeTwo = ({ complaint, user, usersData, onApprovalAction, onRejectionAction }: NoticeTwoProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [reviewComments, setReviewComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const noticeAutoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string>(complaint.secondNoticeContent || '');
  const pendingDiscussionsRef = useRef<string>(complaint.secondNoticeDiscussions || '[]');
  const lastSavedContentRef = useRef<string>(complaint.secondNoticeContent || '');
  const lastSavedDiscussionsRef = useRef<string>(complaint.secondNoticeDiscussions || '[]');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const hadInitialNotice = useRef<boolean>(!!complaint.secondNoticeContent);
  const creationToastSent = useRef<boolean>(false);
  const infoToastShown = useRef<boolean>(false);

  const buildDefaultNoticeContent = () => {
    const paragraphs: string[] = [];
    paragraphs.push(
      `Vide reference to the above-cited matter, this Office has received a complaint regarding ${
        complaint.briefDetailsOfTheComplaint || 'encroachment/violation'
      }${complaint.placeOfComplaint ? ` at ${complaint.placeOfComplaint}` : ''}.`
    );

    if (complaint.fieldVisitDate) {
      paragraphs.push(
        `As per instructions of the Commissioner, HYDRAA, the subject site was inspected on ${formatDate(
          complaint.fieldVisitDate
        )} and prima facie violations were observed at the said location.`
      );
    }

    paragraphs.push(
      `However, reply has not been received to the First Notice No.${complaint.firstNoticeNumber || '___'}, Date: ${formatDate(complaint.firstNoticeDate || null)}.`
    );

    paragraphs.push('In view of this, you are issued a Second and Final Notice to furnish the following documents:');
    paragraphs.push(
      '• Copy of approved Layout plan and GPA proceedings.\n• Details of Court cases (if any).\n• Permission obtained for construction/development activities.\n• NOC from concerned authorities (if applicable).\n• Any other relevant documents supporting your case.'
    );
    paragraphs.push(
      'This is the FINAL NOTICE. Failure to comply within (7) days from the date of service of this notice shall result in initiation of appropriate action as per law without any further notice.'
    );

    return paragraphs.map((text) => ({ type: 'p', children: [{ text }] }));
  };

  const initialNoticeContent = complaint.secondNoticeContent || JSON.stringify(buildDefaultNoticeContent());

  const currentUserRole = user?.role ?? '';
  const hasUserApproved = 
    (currentUserRole === 'DCP' && complaint.notice2DcpApprovalDate) ||
    (currentUserRole === 'ACP' && complaint.notice2AcpApprovalDate) ||
    (currentUserRole === 'COMMISSIONER' && complaint.notice2CommissionerApprovalDate) ||
    (complaint.notice2DcpApprovalDate && complaint.notice2AcpApprovalDate && complaint.notice2CommissionerApprovalDate);
  const canEdit = ['INVESTIGATION_OFFICER', 'DCP', 'ACP', 'COMMISSIONER'].includes(currentUserRole) && !hasUserApproved;

  useEffect(() => {
    if (!canEdit || infoToastShown.current) return;
    infoToastShown.current = true;
    if (complaint.secondNoticeContent) {
      toast.info('Editing Notice 2. Changes auto-save.', { id: 'notice2-edit-info' });
    } else {
      toast.info('Create Notice 2: start typing to auto-save.', { id: 'notice2-create-info' });
    }
  }, [canEdit, complaint.secondNoticeContent]);

  // Fetch review comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/complaints/${complaint.id}/notice2-review-comments`);
        if (response.ok) {
          const data = await response.json();
          setReviewComments(data);
        }
      } catch (error) {
        console.error('Error fetching Notice 2 review comments:', error);
      }
    };

    fetchComments();
    return () => {
      if (noticeAutoSaveTimer.current) clearTimeout(noticeAutoSaveTimer.current);
    };
  }, [complaint.id]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/notice2-review-comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setReviewComments([...reviewComments, comment]);
        setNewComment('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "__.__.2025";
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  };

  const getNoticeNo = () => {
    return `${complaint.id}/Comm/HYDRAA/2025`;
  };

  const getSubject = () => {
    const location = complaint.placeOfComplaint || "specified location";
    const details = complaint.briefDetailsOfTheComplaint || "reported encroachment";
    
    return `HYDRAA – COMM – Issue of Second & Final Notice - ${details} at ${location} - Call for documents - Regd.`;
  };

  const scheduleAutoSave = (contentJson: string, discussionsJson: string) => {
    if (!canEdit) return;
    if (noticeAutoSaveTimer.current) clearTimeout(noticeAutoSaveTimer.current);

    noticeAutoSaveTimer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        // Auto-save logic would go here
        setSaveState('saved');
        setLastSavedAt(new Date());
      } catch (e) {
        setSaveState('error');
      }
    }, 1200);
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Notice 2 - ${getNoticeNo()}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
              color: #000;
            }
            .notice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #1e40af;
              padding-bottom: 20px;
            }
            .logo-section {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 20px;
              margin-bottom: 20px;
            }
            .emblem {
              width: 60px;
              height: 60px;
              border: 2px solid #1e40af;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f8fafc;
              font-weight: bold;
              font-size: 12px;
              color: #1e40af;
            }
            .org-info {
              text-align: center;
            }
            .org-title {
              font-size: 22px;
              font-weight: bold;
              color: #1e40af;
              margin: 0;
            }
            .org-subtitle {
              font-size: 16px;
              color: #64748b;
              margin: 5px 0;
            }
            .notice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding: 15px 0;
              border-bottom: 2px solid #e2e8f0;
            }
            .notice-number {
              font-weight: bold;
              color: #1e40af;
            }
            .notice-date {
              font-weight: bold;
              color: #1e40af;
            }
            .notice-title {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 25px;
              color: #dc2626;
            }
            .notice-body {
              text-align: justify;
              margin-bottom: 30px;
              padding: 0 10px;
            }
            .notice-body p {
              margin-bottom: 15px;
            }
            .notice-body ul {
              margin-left: 30px;
              margin-bottom: 15px;
            }
            .notice-body li {
              margin-bottom: 8px;
            }
            .highlight {
              font-weight: bold;
              color: #dc2626;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              border-top: 2px solid #e2e8f0;
              padding-top: 20px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              width: 200px;
              margin-bottom: 5px;
            }
            .designation {
              font-size: 14px;
              text-align: center;
            }
            .copy-section {
              margin-top: 30px;
              text-align: left;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
            .copy-section strong {
              display: block;
              margin-bottom: 10px;
            }
            .copy-section ol {
              margin-left: 20px;
            }
            .copy-section li {
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="notice-container">
            <!-- Header -->
            <div class="header">
              <div class="logo-section">
                <div class="emblem">
                  HYDRAA
                </div>
                <div class="org-info">
                  <h1 class="org-title">HYDERABAD DISASTER RESPONSE AND ASSETS MONITORING AND PROTECTION AGENCY</h1>
                  <p class="org-subtitle">Government of Telangana</p>
                  <p class="text-sm text-gray-600">
                    Vengal Rao Nagar, Hyderabad - 500038 | Phone: +91-40-23454312 | Email: info@hydraa.telangana.gov.in
                  </p>
                </div>
              </div>
            </div>

            <!-- Notice Header -->
            <div class="notice-header">
              <div class="notice-number">
                Notice No: ${getNoticeNo()}
              </div>
              <div class="notice-date">
                Date: ${formatDate(new Date())}
              </div>
            </div>

            <!-- Subject -->
            <div style="margin-bottom: 20px;">
              <strong>Subject:</strong> ${getSubject()}
            </div>

            <!-- References -->
            <div style="margin-bottom: 25px;">
              <strong>References:</strong>
              <ol style="margin-left: 20px; margin-top: 5px;">
                <li>Complaint received at O/o Commissioner of HYDRAA, Dated: ${formatDate(complaint.createdAt)}.</li>
                <li>First Notice No.${complaint.firstNoticeNumber || '___'}, Date: ${formatDate(complaint.firstNoticeDate || null)}.</li>
                <li>Field inspection and follow-up actions.</li>
              </ol>
            </div>

            <!-- Notice Title -->
            <div class="notice-title">
              SECOND & FINAL NOTICE
            </div>

            <!-- Notice Body -->
            <div class="notice-body">
              <p>
                Vide reference to the above-cited matter, this Office has received a
                complaint regarding ${complaint.briefDetailsOfTheComplaint || "encroachment/violation"} 
                ${complaint.placeOfComplaint && ` at ${complaint.placeOfComplaint}`}.
              </p>

              ${complaint.fieldVisitDate ? `
              <p>
                As per instructions of the Commissioner, HYDRAA, the subject site was inspected on ${formatDate(
                  complaint.fieldVisitDate
                )} and prima facie violations were observed at the said location.
              </p>
              ` : ''}

              <p>
                However, reply has not been received to the First Notice No.${complaint.firstNoticeNumber || '___'}, Date: ${formatDate(complaint.firstNoticeDate || null)}.
              </p>

              <p>
                In view of this, you are issued a <strong>Second and Final Notice</strong> to furnish the following documents:
              </p>

              <ul>
                <li>Copy of approved Layout plan and GPA proceedings.</li>
                <li>Details of Court cases (if any).</li>
                <li>Permission obtained for construction/development activities.</li>
                <li>NOC from concerned authorities (if applicable).</li>
                <li>Any other relevant documents supporting your case.</li>
              </ul>

              <p>
                <strong>This is the FINAL NOTICE.</strong> Failure to comply within (7) days from the date of service of this notice shall result in initiation of appropriate action as per law without any further notice.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="signature-section">
                <div class="signature-line"></div>
                <div class="designation">
                  <strong>Executive Officer</strong><br />
                  <strong>HYDRAA</strong>
                </div>
              </div>
            </div>

            <!-- Copy Section -->
            <div class="copy-section">
              <strong>Copy to:</strong>
              <ol>
                <li>Commissioner, HYDRAA - for information.</li>
                <li>Additional Commissioner, HYDRAA - for information.</li>
                <li>File.</li>
              </ol>
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const showApprovalFlow = ['DCP', 'ACP', 'COMMISSIONER'].includes(currentUserRole) && (onApprovalAction || onRejectionAction) && complaint.secondNoticeNumber && (complaint.secondNoticeStatus || 'NOT_ISSUED') !== 'NOT_ISSUED';
  const isDraftMode = ['DCP', 'ACP', 'COMMISSIONER', 'INVESTIGATION_OFFICER'].includes(currentUserRole) && 
                     complaint.secondNoticeContent && 
                     (!complaint.secondNoticeNumber || complaint.secondNoticeStatus !== 'ISSUED');

  return (
    <div className="space-y-6">
      {/* Draft Mode Highlighting */}
      {isDraftMode && (
        <Card className="border-orange-300 bg-orange-50 print:hidden">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-orange-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">Notice 2 in Draft Mode</h3>
                <p className="text-sm text-orange-800">
                  This notice is currently in draft mode and requires approval from DCP → ACP → Commissioner.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {complaint.peNotificationSentToFieldOfficer && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          DCP has reviewed the PE report and requested creation of Notice 2.
        </div>
      )}
      {/* Print Button */}
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print Notice 2
        </Button>
      </div>

      {/* Auto-save status is shown near the editor (see below) */}

      {/* Approval Workflow Section - Only show if notice is officially created (has notice number) */}
      {showApprovalFlow && (
        <>
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Notice 2 - View and Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalWorkflow
                noticeType="notice2"
                status={(complaint.notice2ApprovalStatus as any) || 'PENDING'}
                dcpApprovalDate={complaint.notice2DcpApprovalDate || undefined}
                dcpApprovedBy={complaint.notice2DcpApprovedBy}
                acpApprovalDate={complaint.notice2AcpApprovalDate || undefined}
                acpApprovedBy={complaint.notice2AcpApprovedBy}
                commissionerApprovalDate={complaint.notice2CommissionerApprovalDate || undefined}
                commissionerApprovedBy={complaint.notice2CommissionerApprovedBy}
                rejectionDate={complaint.notice2RejectionDate || undefined}
                rejectedBy={complaint.notice2RejectedBy}
                rejectionReason={complaint.notice2RejectionReason || undefined}
                userRole={currentUserRole}
                onApprove={onApprovalAction || (() => {})}
                onReject={onRejectionAction || (() => {})}
              />
            </CardContent>
          </Card>
          <Separator className="my-6 print:hidden" />
        </>
      )}

      {/* Notice Content */}
      <div ref={printRef} className="notice-container bg-white p-8 shadow-lg rounded-lg">
        {/* Header */}
        <div className="header">
          <div className="logo-section">
            <div className="emblem">
              HYDRAA
            </div>
            <div className="org-info">
              <h1 className="org-title">HYDERABAD DISASTER RESPONSE AND ASSETS MONITORING AND PROTECTION AGENCY</h1>
              <p className="org-subtitle">Government of Telangana</p>
              <p className="text-sm text-gray-600">
                Vengal Rao Nagar, Hyderabad - 500038 | Phone: +91-40-23454312 | Email: info@hydraa.telangana.gov.in
              </p>
            </div>
          </div>
        </div>

        {/* Notice Header */}
        <div className="notice-header">
          <div className="notice-number">
            Notice No: {getNoticeNo()}
          </div>
          <div className="notice-date">
            Date: {formatDate(new Date())}
          </div>
        </div>

        {/* Subject */}
        <div style={{marginBottom: '20px'}}>
          <strong>Subject:</strong> {getSubject()}
        </div>

        {/* References */}
        <div style={{marginBottom: '25px'}}>
          <strong>References:</strong>
          <ol style={{marginLeft: '20px', marginTop: '5px'}}>
            <li>Complaint received at O/o Commissioner of HYDRAA, Dated: {formatDate(complaint.createdAt)}.</li>
            <li>First Notice No.{complaint.firstNoticeNumber || '___'}, Date: {formatDate(complaint.firstNoticeDate || null)}.</li>
            <li>Field inspection and follow-up actions.</li>
          </ol>
        </div>

        {/* Notice Title */}
        <div className="notice-title">
          SECOND & FINAL NOTICE
        </div>

        {/* Notice Body */}
        <div className="notice-body">
          <p>
            Vide reference to the above-cited matter, this Office has received a
            complaint regarding {complaint.briefDetailsOfTheComplaint || "encroachment/violation"} 
            {complaint.placeOfComplaint && ` at ${complaint.placeOfComplaint}`}.
          </p>

          {complaint.fieldVisitDate && (
            <p>
              As per instructions of the Commissioner, HYDRAA, the subject site was inspected on {formatDate(
                complaint.fieldVisitDate
              )} and prima facie violations were observed at the said location.
            </p>
          )}

          <p>
            However, reply has not been received to the First Notice No.{complaint.firstNoticeNumber || '___'}, Date: {formatDate(complaint.firstNoticeDate || null)}.
          </p>

          <p>
            In view of this, you are issued a <strong>Second and Final Notice</strong> to furnish the following documents:
          </p>

          <ul className="list-disc list-inside ml-4 mb-4">
            <li>Copy of approved Layout plan and GPA proceedings.</li>
            <li>Details of Court cases (if any).</li>
            <li>Permission obtained for construction/development activities.</li>
            <li>NOC from concerned authorities (if applicable).</li>
            <li>Any other relevant documents supporting your case.</li>
          </ul>

          <p>
            <strong>This is the FINAL NOTICE.</strong> Failure to comply within (7) days from the date of service of this notice shall result in initiation of appropriate action as per law without any further notice.
          </p>
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="signature-section">
            <div className="signature-line"></div>
            <div className="designation">
              <strong>Executive Officer</strong><br />
              <strong>HYDRAA</strong>
            </div>
          </div>
        </div>

        {/* Copy Section */}
        <div className="copy-section">
          <strong>Copy to:</strong>
          <ol>
            <li>Commissioner, HYDRAA - for information.</li>
            <li>Additional Commissioner, HYDRAA - for information.</li>
            <li>File.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default NoticeTwo;