import "./EnquiryReport.css";
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MessageSquare, Send } from 'lucide-react';

const PlatePEViewer = dynamic(() => import('@/components/PlatePEViewer').then(m => m.PlatePEViewer), { ssr: false });

interface EnquiryReportProps {
  complaint: {
    id: number;
    nameOfTheComplainant: string | null;
    detailsOfRespondent: string | null;
    briefDetailsOfTheComplaint: string | null;
    placeOfComplaint: string | null;
    fieldVisitDate: Date | null;
    peReport: string | null;
    peDiscussions?: string | null;
    createdAt: Date;
    // PE Workflow fields
    peDcpComments?: string | null;
    peDcpCommentsDate?: Date | null;
    peDcpCommentedBy?: { name: string } | null;
    peNotificationSentToFieldOfficer?: boolean;
    peNotificationDate?: Date | null;
    peNotificationBy?: { name: string } | null;
  };
  user?: {
    id: string;
    role: string;
    name: string | null;
    email: string | null;
  };
  onDcpComment?: (comments: string) => Promise<void>;
  onNotifyFieldOfficer?: () => Promise<void>;
}

const EnquiryReport = ({ complaint, user, onDcpComment, onNotifyFieldOfficer }: EnquiryReportProps) => {
  const [dcpComments, setDcpComments] = useState(complaint.peDcpComments || '');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not specified";
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "Not specified";
    const d = new Date(date);
    return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB');
  };

  const handleSaveComments = async () => {
    if (!onDcpComment || !dcpComments.trim()) return;
    setIsCommenting(true);
    try {
      await onDcpComment(dcpComments);
    } catch (error) {
      console.error('Error saving comments:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleNotifyFieldOfficer = async () => {
    if (!onNotifyFieldOfficer) return;
    setIsNotifying(true);
    try {
      await onNotifyFieldOfficer();
    } catch (error) {
      console.error('Error notifying investigation officer:', error);
    } finally {
      setIsNotifying(false);
    }
  };

  const isDcp = user?.role === 'DCP';
  const isInvestigationOfficer = user?.role === 'INVESTIGATION_OFFICER';
  const canViewComments = ['DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN', 'INVESTIGATION_OFFICER'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* DCP Workflow Section */}
      {isDcp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              DCP Review & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Add Comments for PE Report</label>
                <Textarea
                  value={dcpComments}
                  onChange={(e) => setDcpComments(e.target.value)}
                  placeholder="Add your review comments for this PE report..."
                  rows={4}
                />
                <Button 
                  onClick={handleSaveComments}
                  disabled={isCommenting || !dcpComments.trim()}
                  className="w-full"
                >
                  {isCommenting ? 'Saving...' : 'Save Comments'}
                </Button>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Workflow Actions</label>
                <div className="space-y-2">
                  {complaint.peNotificationSentToFieldOfficer ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md">
                      <Send className="h-4 w-4 text-green-600" />
                      <div className="text-sm">
                        <div className="font-medium text-green-800">Investigation Officer Notified</div>
                        <div className="text-green-600">
                          {formatDateTime(complaint.peNotificationDate || null)} by {complaint.peNotificationBy?.name}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleNotifyFieldOfficer}
                      disabled={isNotifying}
                      variant="outline"
                      className="w-full"
                    >
                      {isNotifying ? 'Notifying...' : 'Notify Investigation Officer to Create Notice 1'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Comments Display - Visible to Investigation Officers and above */}
      {canViewComments && complaint.peDcpComments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              DCP Review Comments
              {isInvestigationOfficer && <Badge variant="outline">For Review</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">DCP Review</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDateTime(complaint.peDcpCommentsDate || null)} by {complaint.peDcpCommentedBy?.name}
                </span>
              </div>
              <p className="text-sm">{complaint.peDcpComments}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Original Report */}
      <div className="report-container">
      <h2 className="report-title">
        HYDERABAD DISASTER RESPONSE & ASSET PROTECTION AGENCY
      </h2>
      <h3 className="report-subtitle">ENQUIRY REPORT</h3>

      <div className="report-meta">
        <div>
          <strong>Petition No</strong> : {complaint.id}/2025/RAC/HYDRAA
        </div>
        <div>
          <strong>Dt</strong> : {formatDate(complaint.createdAt)}
        </div>
      </div>

      <div className="report-meta">
        <div>
          <strong>Enquiry Officer & Rank</strong> : Field Investigation Officer
        </div>
      </div>

      <div className="report-meta">
        <div>
          <strong>Type of Encroachment</strong> : Environmental/Land Encroachment
        </div>
        <div>
          <strong>Time limit for Enquiry</strong> : Priority
        </div>
        <div>
          <strong>Type of Petition</strong> : Individual
        </div>
      </div>

      <table className="report-table">
        <tbody>
          <tr>
            <td className="col-no">1.</td>
            <td className="col-label">Name & Address of the petitioner</td>
            <td className="col-value">{complaint.nameOfTheComplainant || 'Not specified'}</td>
          </tr>

          <tr>
            <td className="col-no">2.</td>
            <td className="col-label">Name & Address of the Respondent</td>
            <td className="col-value">{complaint.detailsOfRespondent || 'Nil'}</td>
          </tr>

          <tr>
            <td className="col-no">3.</td>
            <td className="col-label">Brief facts of the complaint</td>
            <td className="col-value">
              {complaint.briefDetailsOfTheComplaint || 'No details provided'}
            </td>
          </tr>

          <tr>
            <td className="col-no">4.</td>
            <td className="col-label">Location of encroachment</td>
            <td className="col-value">
              {complaint.placeOfComplaint || 'Not specified'}
            </td>
          </tr>

          <tr>
            <td className="col-no">5.</td>
            <td className="col-label">Field Visit Date</td>
            <td className="col-value">{formatDate(complaint.fieldVisitDate)}</td>
          </tr>

          <tr>
            <td className="col-no">6.</td>
            <td className="col-label">Any Court cases pending</td>
            <td className="col-value">To be verified</td>
          </tr>

          <tr>
            <td className="col-no">7.</td>
            <td className="col-label">Preliminary Enquiry Findings of the IO</td>
            <td className="col-value">
              {complaint.peReport ? (
                <PlatePEViewer 
                  content={complaint.peReport} 
                  complaintId={complaint.id}
                  discussions={
                    (complaint as any).peDiscussions 
                      ? JSON.parse((complaint as any).peDiscussions)
                      : []
                  }
                  user={user}
                />
              ) : 'Preliminary enquiry pending'}
              <br />
              <br />
              <div className="signature-block">
                Signature<br />
                EO, APC SEZ, HYDRAA
              </div>
              <div className="signature-block right">
                Signature<br />
                I/C, APC, HYD, HYDRAA
              </div>
            </td>
          </tr>

          <tr>
            <td className="col-no">8.</td>
            <td className="col-label">Orders of the Additional Commissioner</td>
            <td className="col-value">
              <div className="signature-block right">
                Signature<br />
                Additional Commissioner
              </div>
            </td>
          </tr>

          <tr>
            <td className="col-no">9.</td>
            <td className="col-label">Orders of the Commissioner</td>
            <td className="col-value">
              <div className="signature-block right">
                Signature<br />
                HYDRAA, Commissioner
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default EnquiryReport;