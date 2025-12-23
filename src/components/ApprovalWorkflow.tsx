import React from 'react';
import { Check, Clock, X, User } from 'lucide-react';
import { Button } from './ui/button';

export interface ApprovalWorkflowProps {
  noticeType: 'notice1' | 'notice2';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  dcpApprovalDate?: Date;
  dcpApprovedBy?: { name: string };
  acpApprovalDate?: Date; 
  acpApprovedBy?: { name: string };
  commissionerApprovalDate?: Date;
  commissionerApprovedBy?: { name: string };
  rejectionDate?: Date;
  rejectedBy?: { name: string };
  rejectionReason?: string;
  userRole?: string;
  onApprove?: (stage: 'dcp' | 'acp' | 'commissioner') => void;
  onReject?: (stage: 'dcp' | 'acp' | 'commissioner', reason: string) => void;
}

interface StageStatus {
  label: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  approvedBy?: string;
  approvedDate?: Date;
}

export default function ApprovalWorkflow({
  noticeType,
  status,
  dcpApprovalDate,
  dcpApprovedBy,
  acpApprovalDate,
  acpApprovedBy,
  commissionerApprovalDate,
  commissionerApprovedBy,
  rejectionDate,
  rejectedBy,
  rejectionReason,
  userRole,
  onApprove,
  onReject
}: ApprovalWorkflowProps) {
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = React.useState('');
  const [currentStage, setCurrentStage] = React.useState<'dcp' | 'acp' | 'commissioner' | null>(null);

  const stages: StageStatus[] = [
    {
      label: 'DCP Approval',
      status: status === 'REJECTED' && rejectionDate && !dcpApprovalDate 
        ? 'rejected'
        : dcpApprovalDate 
        ? 'completed' 
        : (!acpApprovalDate && !commissionerApprovalDate) 
        ? 'current' 
        : 'pending',
      approvedBy: dcpApprovedBy?.name,
      approvedDate: dcpApprovalDate
    },
    {
      label: 'ACP Approval',
      status: status === 'REJECTED' && rejectionDate && dcpApprovalDate && !acpApprovalDate
        ? 'rejected'
        : acpApprovalDate 
        ? 'completed'
        : dcpApprovalDate && !commissionerApprovalDate
        ? 'current'
        : 'pending',
      approvedBy: acpApprovedBy?.name,
      approvedDate: acpApprovalDate
    },
    {
      label: 'Commissioner Approval',
      status: status === 'REJECTED' && rejectionDate && acpApprovalDate
        ? 'rejected'
        : commissionerApprovalDate
        ? 'completed'
        : dcpApprovalDate && acpApprovalDate
        ? 'current'
        : 'pending',
      approvedBy: commissionerApprovedBy?.name,
      approvedDate: commissionerApprovalDate
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 border-green-500 text-white';
      case 'current': return 'bg-orange-500 border-orange-500 text-white';
      case 'rejected': return 'bg-red-500 border-red-500 text-white';
      default: return 'bg-gray-200 border-gray-300 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-5 h-5" />;
      case 'current': return <Clock className="w-5 h-5" />;
      case 'rejected': return <X className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getConnectorColor = (prevStatus: string, nextStatus: string) => {
    if (prevStatus === 'completed' && (nextStatus === 'completed' || nextStatus === 'current')) {
      return 'bg-green-500';
    }
    if (prevStatus === 'rejected' || nextStatus === 'rejected') {
      return 'bg-red-500';
    }
    if (prevStatus === 'completed' && nextStatus === 'pending') {
      return 'bg-gradient-to-r from-green-500 to-gray-300';
    }
    return 'bg-gray-300';
  };

  const canUserApprove = (stageIndex: number) => {
    const stage = stages[stageIndex];
    if (stage.status !== 'current') return false;
    
    switch (stageIndex) {
      case 0: return userRole === 'DCP' || userRole === 'SUPER_ADMIN';
      case 1: return userRole === 'ACP' || userRole === 'SUPER_ADMIN';  
      case 2: return userRole === 'COMMISSIONER' || userRole === 'SUPER_ADMIN';
      default: return false;
    }
  };

  const handleApprove = (stageType: 'dcp' | 'acp' | 'commissioner') => {
    onApprove?.(stageType);
  };

  const handleReject = (stageType: 'dcp' | 'acp' | 'commissioner') => {
    setCurrentStage(stageType);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (currentStage && rejectionReasonInput.trim()) {
      onReject?.(currentStage, rejectionReasonInput.trim());
      setShowRejectDialog(false);
      setRejectionReasonInput('');
      setCurrentStage(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-gray-900">
          {noticeType === 'notice1' ? 'Notice 1' : 'Notice 2'} Approval Workflow
        </h3>
        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
          status === 'APPROVED' 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : status === 'REJECTED'
            ? 'bg-red-100 text-red-800 border border-red-200' 
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}>
          {status === 'APPROVED' ? '✅ Fully Approved' : status === 'REJECTED' ? '❌ Rejected' : '⏳ Under Review'}
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="relative mb-8">
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.label}>
              {/* Stage Circle */}
              <div className="flex flex-col items-center relative z-10 min-w-0 flex-1">
                <div className={`w-16 h-16 rounded-full border-3 flex items-center justify-center transition-all duration-300 ${getStatusColor(stage.status)}`}>
                  {getStatusIcon(stage.status)}
                </div>
                <div className="mt-3 text-center max-w-24">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{stage.label}</p>
                  {stage.approvedBy && stage.approvedDate && (
                    <div className="text-xs text-gray-500">
                      <p className="font-medium">{stage.approvedBy}</p>
                      <p>{new Date(stage.approvedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {stage.status === 'current' && (
                    <div className="text-xs text-orange-600 font-medium mt-1">
                      In Progress
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                {canUserApprove(index) && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(
                        index === 0 ? 'dcp' : index === 1 ? 'acp' : 'commissioner'
                      )}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                    >
                      ✓ Approve Notice
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(
                        index === 0 ? 'dcp' : index === 1 ? 'acp' : 'commissioner'
                      )}
                      className="border-red-300 text-red-600 hover:bg-red-50 shadow-md"
                    >
                      ✗ Reject Notice
                    </Button>
                  </div>
                )}
              </div>

              {/* Enhanced Connector Line */}
              {index < stages.length - 1 && (
                <div className="flex-1 mx-6 relative">
                  <div className={`h-2 rounded-full transition-all duration-500 ${getConnectorColor(stages[index].status, stages[index + 1].status)}`} />
                  {/* Animated progress indicator */}
                  {stages[index].status === 'completed' && stages[index + 1].status === 'current' && (
                    <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-green-500 via-orange-500 to-gray-300 rounded-full animate-pulse" />
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Rejection Details */}
      {status === 'REJECTED' && rejectedBy && rejectionDate && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Rejected by {rejectedBy.name}</p>
              <p className="text-sm text-red-600">Date: {rejectionDate.toLocaleDateString()}</p>
              {rejectionReason && (
                <p className="text-sm text-red-700 mt-2">Reason: {rejectionReason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h4 className="text-lg font-semibold mb-4">Reject {noticeType === 'notice1' ? 'Notice 1' : 'Notice 2'}</h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReasonInput('');
                  setCurrentStage(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmReject}
                disabled={!rejectionReasonInput.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}