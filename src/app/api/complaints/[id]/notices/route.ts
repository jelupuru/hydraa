import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prismaDB';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utils/auth';

interface ApprovalActionParams {
  complaintId: number;
  action: 'approve' | 'reject';
  type: 'first' | 'second';
  stage: 'dcp' | 'acp' | 'commissioner';
  rejectionReason?: string;
  userId: string;
  userRole: string;
}

async function handleApprovalAction({
  complaintId,
  action,
  type,
  stage,
  rejectionReason,
  userId,
  userRole
}: ApprovalActionParams) {
  // Verify user has permission for this stage
  const stagePermissions = {
    dcp: ['DCP', 'SUPER_ADMIN'],
    acp: ['ACP', 'SUPER_ADMIN'], 
    commissioner: ['COMMISSIONER', 'SUPER_ADMIN']
  };

  if (!stagePermissions[stage].includes(userRole)) {
    return NextResponse.json(
      { error: `Insufficient permissions for ${stage} approval` },
      { status: 403 }
    );
  }

  // Get current complaint state
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId }
  });

  if (!complaint) {
    return NextResponse.json(
      { error: 'Complaint not found' },
      { status: 404 }
    );
  }

  const updateData: any = {};
  const noticePrefix = type === 'first' ? 'notice1' : 'notice2';

  if (action === 'approve') {
    // Set approval fields for current stage
    updateData[`${noticePrefix}${stage.charAt(0).toUpperCase() + stage.slice(1)}ApprovedById`] = userId;
    updateData[`${noticePrefix}${stage.charAt(0).toUpperCase() + stage.slice(1)}ApprovalDate`] = new Date();

    // Check if this completes the approval process
    const isFullyApproved = 
      (stage === 'dcp' && 
        complaint[`${noticePrefix}AcpApprovalDate` as keyof typeof complaint] && 
        complaint[`${noticePrefix}CommissionerApprovalDate` as keyof typeof complaint]) ||
      (stage === 'acp' && 
        complaint[`${noticePrefix}DcpApprovalDate` as keyof typeof complaint] && 
        complaint[`${noticePrefix}CommissionerApprovalDate` as keyof typeof complaint]) ||
      (stage === 'commissioner' && 
        complaint[`${noticePrefix}DcpApprovalDate` as keyof typeof complaint] && 
        complaint[`${noticePrefix}AcpApprovalDate` as keyof typeof complaint]);

    if (isFullyApproved || stage === 'commissioner') {
      updateData[`${noticePrefix}ApprovalStatus`] = 'APPROVED';
    }

  } else if (action === 'reject') {
    // Set rejection fields
    updateData[`${noticePrefix}ApprovalStatus`] = 'REJECTED';
    updateData[`${noticePrefix}RejectedById`] = userId;
    updateData[`${noticePrefix}RejectionDate`] = new Date();
    if (rejectionReason) {
      updateData[`${noticePrefix}RejectionReason`] = rejectionReason;
    }
  }

  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: updateData,
    include: {
      [`${noticePrefix}DcpApprovedBy`]: { select: { name: true, role: true } },
      [`${noticePrefix}AcpApprovedBy`]: { select: { name: true, role: true } },
      [`${noticePrefix}CommissionerApprovedBy`]: { select: { name: true, role: true } },
      [`${noticePrefix}RejectedBy`]: { select: { name: true, role: true } }
    }
  });

  return NextResponse.json({
    message: `Notice ${action}d successfully`,
    complaint: updatedComplaint
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const complaintId = parseInt(resolvedParams.id);
    const { type, noticeNumber, noticeDate, action, stage, rejectionReason } = await request.json();

    // Handle approval/rejection actions
    if (action === 'approve' || action === 'reject') {
      return handleApprovalAction({
        complaintId,
        action,
        type,
        stage,
        rejectionReason,
        userId: session.user.id,
        userRole: session.user.role
      });
    }

    // Handle notice creation
    if (!type || !noticeNumber || !noticeDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'first' && type !== 'second') {
      return NextResponse.json(
        { error: 'Invalid notice type' },
        { status: 400 }
      );
    }

    // Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Check user permissions (investigation officers and above can create notices)
    const allowedRoles = ['FIELD_OFFICER', 'DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create notices' },
        { status: 403 }
      );
    }

    // Update complaint with notice information
    const updateData: any = {};
    
    if (type === 'first') {
      updateData.firstNoticeNumber = noticeNumber;
      updateData.firstNoticeDate = new Date(noticeDate);
      updateData.firstNoticeStatus = 'ISSUED';
    } else {
      updateData.secondNoticeNumber = noticeNumber;
      updateData.secondNoticeDate = new Date(noticeDate);
      updateData.secondNoticeStatus = 'ISSUED';
    }

    // Reset approval workflow for new notice
    const noticePrefix = type === 'first' ? 'notice1' : 'notice2';
    updateData[`${noticePrefix}ApprovalStatus`] = 'PENDING';
    updateData[`${noticePrefix}DcpApprovedById`] = null;
    updateData[`${noticePrefix}DcpApprovalDate`] = null;
    updateData[`${noticePrefix}AcpApprovedById`] = null;
    updateData[`${noticePrefix}AcpApprovalDate`] = null;
    updateData[`${noticePrefix}CommissionerApprovedById`] = null;
    updateData[`${noticePrefix}CommissionerApprovalDate`] = null;
    updateData[`${noticePrefix}RejectedById`] = null;
    updateData[`${noticePrefix}RejectionDate`] = null;
    updateData[`${noticePrefix}RejectionReason`] = null;

    const updatedComplaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: updateData,
    });

    return NextResponse.json({
      message: `${type === 'first' ? 'First' : 'Second'} notice created successfully`,
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complaintId = parseInt(params.id);

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        notice1DcpApprovedBy: { select: { name: true, role: true } },
        notice1AcpApprovedBy: { select: { name: true, role: true } },
        notice1CommissionerApprovedBy: { select: { name: true, role: true } },
        notice1RejectedBy: { select: { name: true, role: true } },
        notice2DcpApprovedBy: { select: { name: true, role: true } },
        notice2AcpApprovedBy: { select: { name: true, role: true } },
        notice2CommissionerApprovedBy: { select: { name: true, role: true } },
        notice2RejectedBy: { select: { name: true, role: true } }
      }
    });

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ complaint });
  } catch (error) {
    console.error('Error fetching notice details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}