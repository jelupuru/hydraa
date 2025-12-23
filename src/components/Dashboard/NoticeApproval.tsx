import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  FileText,
  AlertTriangle 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NoticeApprovalProps {
  complaint: {
    id: number;
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
  };
  userRole: string;
  onApprovalUpdate: () => void;
}

const NoticeApproval: React.FC<NoticeApprovalProps> = ({
  complaint,
  userRole,
  onApprovalUpdate
}) => {
  const [loading, setLoading] = useState(false);

  const handleApproval = async (action: 'approve' | 'reject', type: 'first' | 'second') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/notices`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, type }),
      });

      if (response.ok) {
        onApprovalUpdate();
      } else {
        throw new Error('Failed to update notice approval');
      }
    } catch (error) {
      console.error('Error updating notice approval:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">Not Created</Badge>;
    }
  };

  const formatDate = (date?: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canApprove = ['DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN'].includes(userRole);
  const showApprovalSection = complaint.noticeApprovalStatus === 'PENDING' && canApprove;

  return (
    <div className="space-y-6">
      {/* Notice Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notice Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Notice */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-blue-600">First Notice</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(complaint.firstNoticeStatus)}
                </div>
                {complaint.firstNoticeNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Notice Number:</span>
                    <span className="text-sm font-medium">{complaint.firstNoticeNumber}</span>
                  </div>
                )}
                {complaint.firstNoticeDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Issue Date:</span>
                    <span className="text-sm font-medium">{formatDate(complaint.firstNoticeDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Second Notice */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-red-600">Notice 2</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(complaint.secondNoticeStatus)}
                </div>
                {complaint.secondNoticeNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Notice Number:</span>
                    <span className="text-sm font-medium">{complaint.secondNoticeNumber}</span>
                  </div>
                )}
                {complaint.secondNoticeDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Issue Date:</span>
                    <span className="text-sm font-medium">{formatDate(complaint.secondNoticeDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Approval Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-sm font-medium">Overall Approval Status:</span>
                <div className="mt-1">{getStatusBadge(complaint.noticeApprovalStatus)}</div>
              </div>
            </div>
          </div>

          {complaint.approvedBy && (
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Approval Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Approved by:</span>
                  <span className="ml-2 font-medium">{complaint.approvedBy.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Role:</span>
                  <span className="ml-2 font-medium">{complaint.approvedBy.role}</span>
                </div>
                <div>
                  <span className="text-gray-600">Approval Date:</span>
                  <span className="ml-2 font-medium">{formatDate(complaint.approvalDate)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Actions */}
      {showApprovalSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This notice is pending your approval. Please review the notice content and approve or reject as appropriate.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => handleApproval('approve', 'first')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Notice
              </Button>
              <Button
                onClick={() => handleApproval('reject', 'first')}
                disabled={loading}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Notice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions for Investigation Officers */}
      {userRole === 'FIELD_OFFICER' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                As an Investigation Officer, you can create notices that will be sent for approval to higher authorities (DCP/ACP/Commissioner). 
                Once approved, the notices will be ready for service to the concerned parties.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoticeApproval;