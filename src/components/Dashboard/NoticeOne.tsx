"use client";

import NoticeLayout from "./NoticeLayout";
import ApprovalWorkflow from '../ApprovalWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Printer, Calendar, MapPin, MessageSquare, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRef, useState, useEffect } from 'react';
import { serializeHtml } from 'platejs/static';
import { createPlateEditor } from 'platejs/react';
import { EditorKit } from '../editor-kit';
import { toast } from 'sonner';

const PlateNoticeViewer = dynamic(() => import('@/components/PlateNoticeViewer').then((m) => m.PlateNoticeViewer), { ssr: false });
const PlateNoticeEditor = dynamic(() => import('@/components/PlateNoticeEditor').then((m) => m.PlateNoticeEditor), { ssr: false });

interface NoticeOneProps {
  complaint: {
    id: number;
    briefDetailsOfTheComplaint: string | null;
    placeOfComplaint: string | null;
    nameOfTheComplainant: string | null;
    detailsOfRespondent: string | null;
    createdAt: Date;
    fieldVisitDate: Date | null;
    firstNoticeNumber?: string | null;
    firstNoticeDate?: Date | null;
    firstNoticeContent?: string | null;
    firstNoticeDiscussions?: string | null;
    // Approval workflow fields for Notice 1
    notice1ApprovalStatus?: string | null;
    notice1DcpApprovalDate?: Date | null;
    notice1DcpApprovedBy?: any;
    notice1AcpApprovalDate?: Date | null;
    notice1AcpApprovedBy?: any;
    notice1CommissionerApprovalDate?: Date | null;
    notice1CommissionerApprovedBy?: any;
    notice1RejectionDate?: Date | null;
    notice1RejectedBy?: any;
    notice1RejectionReason?: string | null;
    peNotificationSentToFieldOfficer?: boolean;
    // Notice 1 citizen response fields
    firstNoticeIssuedDate?: Date | null;
    firstNoticeCitizenReply?: string | null;
    firstNoticeCitizenReplyDate?: Date | null;
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

const NoticeOne = ({ complaint, user, usersData, onApprovalAction, onRejectionAction }: NoticeOneProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [reviewComments, setReviewComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const noticeAutoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string>(complaint.firstNoticeContent || '');
  const pendingDiscussionsRef = useRef<string>(complaint.firstNoticeDiscussions || '[]');
  const lastSavedContentRef = useRef<string>(complaint.firstNoticeContent || '');
  const lastSavedDiscussionsRef = useRef<string>(complaint.firstNoticeDiscussions || '[]');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const hadInitialNotice = useRef<boolean>(!!complaint.firstNoticeContent);
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

    paragraphs.push('In view of the above, you are issued notice to furnish the following documents:');
    paragraphs.push(
      '• Copy of approved Layout plan and GPA proceedings.\n• Details of Court cases (if any).\n• Permission obtained for construction/development activities.\n• NOC from concerned authorities (if applicable).\n• Any other relevant documents supporting your case.'
    );
    paragraphs.push(
      'You are also called upon to show cause as to why action should not be initiated against you for the alleged violations.'
    );
    paragraphs.push(
      'You are therefore called upon to submit the above said documents within (7) days from the date of service of this notice, failing which it shall be construed that you have no documents to produce and action will be initiated as deemed fit.'
    );

    return paragraphs.map((text) => ({ type: 'p', children: [{ text }] }));
  };

  const initialNoticeContent = complaint.firstNoticeContent || JSON.stringify(buildDefaultNoticeContent());

  const currentUserRole = user?.role ?? '';
  const hasUserApproved = 
    (currentUserRole === 'DCP' && complaint.notice1DcpApprovalDate) ||
    (currentUserRole === 'ACP' && complaint.notice1AcpApprovalDate) ||
    (currentUserRole === 'COMMISSIONER' && complaint.notice1CommissionerApprovalDate) ||
    (complaint.notice1DcpApprovalDate && complaint.notice1AcpApprovalDate && complaint.notice1CommissionerApprovalDate);
  const canEdit = ['INVESTIGATION_OFFICER', 'DCP', 'ACP', 'COMMISSIONER'].includes(currentUserRole) && !hasUserApproved;

  useEffect(() => {
    if (!canEdit || infoToastShown.current) return;
    infoToastShown.current = true;
    if (complaint.firstNoticeContent) {
      toast.info('Editing Notice 1. Changes auto-save.', { id: 'notice1-edit-info' });
    } else {
      toast.info('Create Notice 1: start typing to auto-save.', { id: 'notice1-create-info' });
    }
  }, [canEdit, complaint.firstNoticeContent]);

  // Fetch review comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/complaints/${complaint.id}/notice1-review-comments`);
        if (response.ok) {
          const data = await response.json();
          setReviewComments(data);
        }
      } catch (error) {
        console.error('Error fetching Notice 1 review comments:', error);
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
      const response = await fetch(`/api/complaints/${complaint.id}/notice1-review-comments`, {
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
    
    return `HYDRAA – COMM – Issue of Notice - ${details} at ${location} - Call for documents - Regd.`;
  };

  const scheduleAutoSave = (contentJson: string, discussionsJson: string) => {
    if (!canEdit) return;
    if (noticeAutoSaveTimer.current) clearTimeout(noticeAutoSaveTimer.current);

    noticeAutoSaveTimer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        const res = await fetch(`/api/complaints/${complaint.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstNoticeContent: contentJson,
            firstNoticeDiscussions: discussionsJson,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({} as any));
          throw new Error(data.error || `Save failed (${res.status})`);
        }
        lastSavedContentRef.current = contentJson;
        lastSavedDiscussionsRef.current = discussionsJson;
        setSaveState('saved');
        setLastSavedAt(new Date());
        console.log('[NoticeOne] auto-saved Notice 1 content/discussions');
        toast.success('Notice 1 saved', { id: 'notice1-save' });
        if (!hadInitialNotice.current && !creationToastSent.current) {
          creationToastSent.current = true;
          toast.success('Notice 1 created and saved', { id: 'notice1-created' });
        }
      } catch (e) {
        console.error('Auto-save failed for Notice 1 template', e);
        setSaveState('error');
        toast.error('Failed to save Notice 1');
      }
    }, 1200);
  };

  const handlePrint = async () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        // Convert PlateJS JSON to HTML if firstNoticeContent exists
        let noticeBodyHtml = '';
        if (complaint.firstNoticeContent) {
          try {
            const parsed = JSON.parse(complaint.firstNoticeContent);
            const nodes = Array.isArray(parsed) ? parsed : [{ type: 'p', children: [{ text: '' }] }];
            
            // Create a temporary editor instance for serialization
            const tempEditor = createPlateEditor({
              plugins: [...EditorKit],
              value: nodes,
            });
            
            // Serialize to HTML
            const html = await serializeHtml(tempEditor);
            noticeBodyHtml = html || '<p>No content available</p>';
          } catch (e) {
            console.error('Error converting to HTML:', e);
            // Fallback: try to extract text from JSON
            try {
              const parsed = JSON.parse(complaint.firstNoticeContent);
              const extractText = (nodes: any[]): string => {
                return nodes.map(node => {
                  if (node.text) return node.text;
                  if (node.children) return extractText(node.children);
                  return '';
                }).join('');
              };
              const text = extractText(parsed);
              noticeBodyHtml = `<p>${text}</p>`;
            } catch {
              noticeBodyHtml = '<p>Error rendering content. Please check the notice editor.</p>';
            }
          }
        } else {
          // Default content
          noticeBodyHtml = `
            <p>
              Vide reference to the above-cited matter, this Office has received a
              complaint regarding ${complaint.briefDetailsOfTheComplaint || "encroachment/violation"} 
              ${complaint.placeOfComplaint ? ` at ${complaint.placeOfComplaint}` : ''}.
            </p>
            ${complaint.fieldVisitDate ? `
            <p>
              As per instructions of the Commissioner, HYDRAA, the subject site was
              inspected on ${formatDate(complaint.fieldVisitDate)} and prima facie violations 
              were observed at the said location.
            </p>
            ` : ''}
            <p>
              In view of the above, you are issued notice to furnish the following
              documents:
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li>Copy of approved Layout plan and GPA proceedings.</li>
              <li>Details of Court cases (if any).</li>
              <li>Permission obtained for construction/development activities.</li>
              <li>NOC from concerned authorities (if applicable).</li>
              <li>Any other relevant documents supporting your case.</li>
            </ul>
            <p>
              You are also called upon to show cause as to why action should not be 
              initiated against you for the alleged violations.
            </p>
          `;
        }

        const content = `
          <html>
            <head>
              <title>Notice 1 - ${getNoticeNo()}</title>
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
                  display: flex;
                  justify-content: space-between;
                  align-items: end;
                }
                .signature-section {
                  text-align: center;
                  margin-left: auto;
                }
                .signature-line {
                  border-bottom: 2px solid #000;
                  width: 200px;
                  margin-bottom: 5px;
                }
                .designation {
                  font-weight: bold;
                  font-size: 14px;
                }
                .copy-section {
                  margin-top: 40px;
                  font-size: 14px;
                }
                .copy-section ol {
                  margin-left: 30px;
                }
                @media print {
                  body { margin: 0; }
                  .notice-container { box-shadow: none; }
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
                      <p style="font-size: 12px; color: #666;">
                        Vengal Rao Nagar, Hyderabad - 500038 | Phone: +91-40-23454312 | Email: info@hydraa.telangana.gov.in
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Notice Header -->
                <div class="notice-header">
                  <div class="notice-number">
                    No: ${getNoticeNo()}
                  </div>
                  <div class="notice-date">
                    Date: ${formatDate(new Date())}
                  </div>
                </div>

                <!-- Notice Title -->
                <h2 class="notice-title">
                  NOTICE
                </h2>

                <!-- Notice Body -->
                <div class="notice-body">
                  <p>
                    <strong>To:</strong><br />
                    <strong>The Respondent(s)</strong>
                    ${complaint.detailsOfRespondent ? `<br />${complaint.detailsOfRespondent}` : ''}
                  </p>

                  <p>
                    <strong>Subject:</strong> ${getSubject()}
                  </p>

                  <p>
                    <strong>Reference:</strong>
                  </p>
                  <ol style="margin-left: 30px; margin-bottom: 15px;">
                    <li>Complaint received at O/o Commissioner of HYDRAA, Dated: ${formatDate(complaint.createdAt)}.</li>
                    <li>Field inspection conducted by HYDRAA officials.</li>
                  </ol>

                  <p>
                    <strong>Sir/Madam,</strong>
                  </p>

                  ${noticeBodyHtml}

                  <p>
                    You are therefore called upon to submit the above said documents 
                    within (7) days from the date of service of this notice, 
                    failing which it shall be construed that you have no documents 
                    to produce and action will be initiated as deemed fit.
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
      }
    }
  };

  const showApprovalFlow = ['DCP', 'ACP', 'COMMISSIONER'].includes(currentUserRole) && (onApprovalAction || onRejectionAction);

  return (
    <div className="space-y-6">
      {complaint.peNotificationSentToFieldOfficer && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          DCP has reviewed the PE report and requested creation of Notice 1.
        </div>
      )}
      {/* Print Button */}
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print Notice 1
        </Button>
      </div>

      {/* Auto-save status is shown near the editor (see below) */}

      {/* Approval Workflow Section - Only show if notice is officially created (has notice number) */}
      {showApprovalFlow && (
        <>
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Notice 1 - View and Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalWorkflow
                noticeType="notice1"
                status={(complaint.notice1ApprovalStatus as any) || 'PENDING'}
                dcpApprovalDate={complaint.notice1DcpApprovalDate || undefined}
                dcpApprovedBy={complaint.notice1DcpApprovedBy}
                acpApprovalDate={complaint.notice1AcpApprovalDate || undefined}
                acpApprovedBy={complaint.notice1AcpApprovedBy}
                commissionerApprovalDate={complaint.notice1CommissionerApprovalDate || undefined}
                commissionerApprovedBy={complaint.notice1CommissionerApprovedBy}
                rejectionDate={complaint.notice1RejectionDate || undefined}
                rejectedBy={complaint.notice1RejectedBy}
                rejectionReason={complaint.notice1RejectionReason || undefined}
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
            No: {getNoticeNo()}
          </div>
          <div className="notice-date">
            <Calendar className="inline w-4 h-4 mr-1" />
            Date: {formatDate(new Date())}
          </div>
        </div>

        {/* Notice Title */}
        <h2 className="notice-title">
          NOTICE
        </h2>

        {/* Notice Body */}
        <div className="notice-body">
          <p>
            <strong>To:</strong><br />
            <strong>The Respondent(s)</strong>
            {complaint.detailsOfRespondent && (
              <>
                <br />
                <MapPin className="inline w-4 h-4 mr-1" />
                {complaint.detailsOfRespondent}
              </>
            )}
          </p>

          <p>
            <strong>Subject:</strong> {getSubject()}
          </p>

          <p>
            <strong>Reference:</strong>
          </p>
          <ol style={{ marginLeft: '30px', marginBottom: '15px' }}>
            <li>Complaint received at O/o Commissioner of HYDRAA, Dated: {formatDate(complaint.createdAt)}.</li>
            <li>Field inspection conducted by HYDRAA officials.</li>
          </ol>

          <p>
            <strong>Sir/Madam,</strong>
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground print:hidden">
              {saveState === 'saving' && (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                </span>
              )}
              {saveState === 'saved' && (
                <span className="inline-flex items-center gap-1 text-green-700">
                  <CheckCircle className="h-3 w-3" /> Saved{lastSavedAt ? ` at ${lastSavedAt.toLocaleTimeString()}` : ''}
                </span>
              )}
              {saveState === 'error' && (
                <span className="inline-flex items-center gap-1 text-red-700">
                  <AlertTriangle className="h-3 w-3" /> Save failed — will retry on next change
                </span>
              )}
              {saveState === 'idle' && (
                <span className="inline-flex items-center gap-1">Autosave ready</span>
              )}
            </div>
            <PlateNoticeEditor
              readOnly={!canEdit}
              initialValue={initialNoticeContent}
              initialDiscussions={(() => {
                try {
                  return complaint.firstNoticeDiscussions ? JSON.parse(complaint.firstNoticeDiscussions) : [];
                } catch (e) {
                  console.warn('Failed to parse firstNoticeDiscussions', e);
                  return [];
                }
              })()}
              user={{ id: user?.id || 'viewer', name: user?.name || user?.role || 'Viewer', email: (user as any)?.email ?? null, role: user?.role }}
              usersData={usersData}
              onChange={(json) => {
                if (!canEdit) return;
                pendingContentRef.current = json;
                const discussionsJson = pendingDiscussionsRef.current;
                const changed =
                  json !== lastSavedContentRef.current || discussionsJson !== lastSavedDiscussionsRef.current;
                if (changed) {
                  scheduleAutoSave(json, discussionsJson);
                }
              }}
              onDiscussionsChange={(discussions) => {
                if (!canEdit) return;
                const discussionsJson = JSON.stringify(discussions || []);
                pendingDiscussionsRef.current = discussionsJson;
                const contentJson = pendingContentRef.current;
                const changed =
                  contentJson !== lastSavedContentRef.current || discussionsJson !== lastSavedDiscussionsRef.current;
                if (changed) {
                  scheduleAutoSave(contentJson, discussionsJson);
                }
              }}
            />
          </div>

          <p>
            You are therefore called upon to submit the above said documents 
            within (7) days from the date of service of this notice, 
            failing which it shall be construed that you have no documents 
            to produce and action will be initiated as deemed fit.
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

      <style jsx>{`
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
        .footer {
          margin-top: 40px;
          display: flex;
          justify-content: flex-end;
        }
        .signature-section {
          text-align: center;
        }
        .signature-line {
          border-bottom: 2px solid #000;
          width: 200px;
          margin-bottom: 5px;
        }
        .designation {
          font-weight: bold;
          font-size: 14px;
        }
        .copy-section {
          margin-top: 40px;
          font-size: 14px;
        }
        .copy-section ol {
          margin-left: 30px;
        }
      `}</style>

      {/* Review Comments Section - Only for DCP, ACP, Commissioner */}
      {['DCP', 'ACP', 'COMMISSIONER'].includes(currentUserRole) && (
        <>
          <Separator className="my-6 print:hidden" />
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Review Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Comments */}
              {reviewComments.length > 0 && (
                <div className="space-y-3 mb-4">
                  {reviewComments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-sm">{comment.user.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({comment.reviewerRole})</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add your review comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  size="sm"
                >
                  {isSubmittingComment ? 'Submitting...' : 'Submit Comment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default NoticeOne;