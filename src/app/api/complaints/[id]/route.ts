import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import { ComplaintStatus, Role } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const complaintId = parseInt(id);
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const updateData = await request.json();
    const { assignedToRole, ...otherUpdateData } = updateData;

    // Check if user has permission to update this complaint
    if (!canUpdateComplaint(user.role, complaint.finalStatus)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Prepare update data
    const finalUpdateData: any = {
      ...otherUpdateData,
      updatedById: user.id,
      updatedAt: new Date(),
    };

    // Handle status transitions and assignments
    if (updateData.finalStatus) {
      finalUpdateData.finalStatus = updateData.finalStatus;
    }

    if (assignedToRole) {
      const assignee = await prisma.user.findFirst({
        where: { role: assignedToRole as Role },
      });
      if (assignee) {
        finalUpdateData.assignedToId = assignee.id;
      }
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: finalUpdateData,
      include: {
        createdBy: true,
        updatedBy: true,
        assignedTo: true,
        commissionerate: true,
        dcpZone: true,
        municipalZone: true,
        acpDivision: true,
        firs: {
          include: {
            createdBy: true,
            updatedBy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      }
    });

    return NextResponse.json(updatedComplaint);
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const complaintId = parseInt(id);
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        createdBy: true,
        updatedBy: true,
        assignedTo: true,
        notice1DcpApprovedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        notice1AcpApprovedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        notice1CommissionerApprovedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        notice1RejectedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        notice2DcpApprovedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        notice2AcpApprovedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        notice2CommissionerApprovedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        notice2RejectedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        commissionerate: true,
        dcpZone: true,
        municipalZone: true,
        acpDivision: true,
        firs: {
          include: {
            createdBy: true,
            updatedBy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: {
            createdBy: true,
            updatedBy: true,
            replies: {
              include: {
                createdBy: true,
                updatedBy: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      }
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function canUpdateComplaint(userRole: Role, complaintStatus: ComplaintStatus | null): boolean {
  if (!complaintStatus) return true; // Can update if no status set

  switch (userRole) {
    case 'FIELD_OFFICER':
      return complaintStatus === 'PENDING';
    case 'DCP':
      return ['PENDING', 'UNDER_REVIEW_DCP'].includes(complaintStatus);
    case 'ACP':
      return ['UNDER_REVIEW_DCP', 'UNDER_REVIEW_ACP'].includes(complaintStatus);
    case 'COMMISSIONER':
      return ['UNDER_REVIEW_ACP', 'UNDER_REVIEW_COMMISSIONER'].includes(complaintStatus);
    case 'SUPER_ADMIN':
      return true; // Super admin can update any complaint
    default:
      return false;
  }
}