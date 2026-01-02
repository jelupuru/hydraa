import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prismaDB';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utils/auth';

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
    const { action, comments, notifyFieldOfficer } = await request.json();

    // Check user permissions
    const allowedRoles = ['DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (action === 'add_comments') {
      // DCP adds comments to PE report
      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          peDcpComments: comments,
          peDcpCommentsDate: new Date(),
          peDcpCommentsById: session.user.id,
        },
        include: {
          peDcpCommentedBy: {
            select: { name: true }
          }
        }
      });

      return NextResponse.json({ 
        success: true, 
        complaint: updatedComplaint 
      });
    }

    if (action === 'notify_investigation_officer') {
      // DCP sends notification to investigation officer to create Notice 1
      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          peNotificationSentToFieldOfficer: true,
          peNotificationDate: new Date(),
          peNotificationById: session.user.id,
        },
        include: {
          peNotificationBy: {
            select: { name: true }
          }
        }
      });

      // Here you could add email/notification logic
      // await sendNotificationToFieldOfficer(complaintId, session.user);

      return NextResponse.json({ 
        success: true, 
        complaint: updatedComplaint,
        message: 'Investigation Officer has been notified to create Notice 1'
      });
    }

    if (action === 'update_sent_date') {
      const { noticeType, sentDate } = await request.json();
      
      const updateData = noticeType === 'first' ? 
        { firstNoticeSentDate: new Date(sentDate) } : 
        { secondNoticeSentDate: new Date(sentDate) };

      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: updateData
      });

      return NextResponse.json({ 
        success: true, 
        complaint: updatedComplaint 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in PE workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
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

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: {
        id: true,
        peReport: true,
        peStatus: true,
        peDcpComments: true,
        peDcpCommentsDate: true,
        peDcpCommentedBy: {
          select: { name: true }
        },
        peNotificationSentToFieldOfficer: true,
        peNotificationDate: true,
        peNotificationBy: {
          select: { name: true }
        },
        firstNoticeSentDate: true,
        secondNoticeSentDate: true,
      }
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json({ complaint });
  } catch (error) {
    console.error('Error fetching PE workflow data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}