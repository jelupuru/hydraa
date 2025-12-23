import NoticeLayout from "./NoticeLayout";
import ApprovalWorkflow from '../ApprovalWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface NoticeOneProps {
  complaint: {
    id: number;
    briefDetailsOfTheComplaint: string | null;
    placeOfComplaint: string | null;
    nameOfTheComplainant: string | null;
    detailsOfRespondent: string | null;
    createdAt: Date;
    fieldVisitDate: Date | null;
    // Approval workflow fields for Notice 1
    notice1ApprovalStatus?: string;
    notice1DcpApprovalDate?: Date | null;
    notice1DcpApprovedBy?: any;
    notice1AcpApprovalDate?: Date | null;
    notice1AcpApprovedBy?: any;
    notice1CommissionerApprovalDate?: Date | null;
    notice1CommissionerApprovedBy?: any;
    notice1RejectionDate?: Date | null;
    notice1RejectedBy?: any;
    notice1RejectionReason?: string | null;
  };
  user?: {
    role: string;
  };
  onApprovalAction?: (stage: string) => void;
  onRejectionAction?: (stage: string, reason?: string) => void;
}

const NoticeOne = ({ complaint, user, onApprovalAction, onRejectionAction }: NoticeOneProps) => {
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

  return (
    <div className="space-y-6">
      {/* Approval Workflow Section */}
      {user && user.role && (onApprovalAction || onRejectionAction) && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Notice 1 - View and Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalWorkflow
                noticeType="notice1"
                status={(complaint.notice1ApprovalStatus as any) || 'PENDING'}
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
                onApprove={onApprovalAction || (() => {})}
                onReject={onRejectionAction || (() => {})}
              />
            </CardContent>
          </Card>
          <Separator className="my-6" />
        </>
      )}

      {/* Notice Content */}
      <NoticeLayout
        title="NOTICE"
        noticeNo={getNoticeNo()}
        date={formatDate(new Date())}
        subject={getSubject()}
        references={[
          `Complaint received at O/o Commissioner of HYDRAA, Dated: ${formatDate(complaint.createdAt)}.`,
          "Field inspection conducted by HYDRAA officials.",
        ]}
        days="(7)"
        body={
          <>
            <p>
              Vide reference to the above-cited matter, this Office has received a
              complaint regarding {complaint.briefDetailsOfTheComplaint || "encroachment/violation"} 
              {complaint.placeOfComplaint && ` at ${complaint.placeOfComplaint}`}.
            </p>

            {complaint.fieldVisitDate && (
              <p>
                As per instructions of the Commissioner, HYDRAA, the subject site was
                inspected on {formatDate(complaint.fieldVisitDate)} and prima facie violations 
                were observed at the said location.
              </p>
            )}

            <p>
              In view of the above, you are issued notice to furnish the following
              documents:
            </p>

            <ul className="list-disc list-inside ml-4 mb-4">
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
          </>
        }
      />
    </div>
  );
};

export default NoticeOne;