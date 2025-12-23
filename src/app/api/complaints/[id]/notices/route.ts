import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complaintId = parseInt(params.id);
    const { type, noticeNumber, noticeDate } = await request.json();

    // Validate input
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

    // For investigation officers (FIELD_OFFICER), mark as pending approval
    if (session.user.role === 'FIELD_OFFICER') {
      updateData.noticeApprovalStatus = 'PENDING';
    } else {
      // Higher authorities can approve directly
      updateData.noticeApprovalStatus = 'APPROVED';
      updateData.approvedById = session.user.id;
      updateData.approvalDate = new Date();
    }

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
      select: {
        id: true,
        firstNoticeNumber: true,
        firstNoticeDate: true,
        firstNoticeStatus: true,
        secondNoticeNumber: true,
        secondNoticeDate: true,
        secondNoticeStatus: true,
        noticeApprovalStatus: true,
        approvedById: true,
        approvalDate: true,
        approvedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complaintId = parseInt(params.id);
    const { action, type } = await request.json();

    // Validate input
    if (!action || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action' },
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

    // Check user permissions (only DCP and above can approve notices)
    const allowedRoles = ['DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve notices' },
        { status: 403 }
      );
    }

    // Update approval status
    const updateData: any = {
      noticeApprovalStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedById: session.user.id,
      approvalDate: new Date(),
    };

    const updatedComplaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: updateData,
    });

    return NextResponse.json({
      message: `Notice ${action}d successfully`,
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error('Error updating notice approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}