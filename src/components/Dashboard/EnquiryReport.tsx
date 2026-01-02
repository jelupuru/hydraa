import "./EnquiryReport.css";
import { useState, useEffect } from 'react';
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
  const [reviewComments, setReviewComments] = useState<any[]>([]);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Check if user can add review comments
  const canAddComments = user && ['DCP', 'ACP', 'COMMISSIONER'].includes(user.role);

  // Fetch PE review comments
  useEffect(() => {
    const fetchReviewComments = async () => {
      try {
        const response = await fetch(`/api/complaints/${complaint.id}/pe-review-comments`);
        if (response.ok) {
          const data = await response.json();
          setReviewComments(data);
        }
      } catch (error) {
        console.error('Error fetching review comments:', error);
      }
    };
    fetchReviewComments();
  }, [complaint.id]);

  const handleAddReviewComment = async () => {
    if (!newReviewComment.trim()) return;
    setIsAddingComment(true);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/pe-review-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newReviewComment }),
      });
      if (response.ok) {
        const newComment = await response.json();
        setReviewComments([...reviewComments, newComment]);
        setNewReviewComment('');
      }
    } catch (error) {
      console.error('Error adding review comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

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
      {/* Investigation Officer Notification Alert */}
      {isInvestigationOfficer && complaint.peNotificationSentToFieldOfficer && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Send className="h-5 w-5 text-yellow-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">Action Required: Create Notice 1</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  The DCP has reviewed the PE report and requests you to proceed with creating Notice 1.
                </p>
                <div className="text-xs text-yellow-700">
                  Notified on {formatDateTime(complaint.peNotificationDate || null)} by {complaint.peNotificationBy?.name}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          </CardContent>
        </Card>
      )}

      {/* PE Review Comments - Multiple comments from DCP/ACP/Commissioner */}
      {canViewComments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              PE Review Comments
              {isInvestigationOfficer && <Badge variant="outline">For Review</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Display all review comments */}
            {reviewComments.length > 0 ? (
              <div className="space-y-4 mb-4">
                {reviewComments.map((comment) => (
                  <div key={comment.id} className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{comment.reviewerRole} Review</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(comment.createdAt)} by {comment.user.name}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">No review comments yet</p>
            )}

            {/* Add new comment form for DCP/ACP/Commissioner */}
            {canAddComments && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Review Comment</label>
                <Textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Enter your review comments here..."
                  rows={4}
                  className="w-full"
                />
                <Button 
                  onClick={handleAddReviewComment} 
                  disabled={isAddingComment || !newReviewComment.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isAddingComment ? 'Adding Comment...' : 'Add Review Comment'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legacy DCP Comments - Keep for backwards compatibility */}
      {canViewComments && complaint.peDcpComments && reviewComments.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              DCP Review Comments (Legacy)
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