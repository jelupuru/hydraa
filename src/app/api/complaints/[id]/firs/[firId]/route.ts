import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import { FIRStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; firId: string }> }
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

    const { id, firId } = await params;
    const complaintId = parseInt(id);
    const firIdNum = parseInt(firId);

    const fir = await prisma.fIR.findFirst({
      where: {
        id: firIdNum,
        complaintId,
      },
      include: {
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!fir) {
      return NextResponse.json({ error: 'FIR not found' }, { status: 404 });
    }

    // Check permissions - users can only see FIRs for complaints they have access to
    if (user.role === 'FIELD_OFFICER' && fir.createdById !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(fir);
  } catch (error) {
    console.error('Error fetching FIR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; firId: string }> }
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

    // Only DCP, ACP, COMMISSIONER, SUPER_ADMIN can update FIRs
    if (!['DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, firId } = await params;
    const complaintId = parseInt(id);
    const firIdNum = parseInt(firId);

    const fir = await prisma.fIR.findFirst({
      where: {
        id: firIdNum,
        complaintId,
      },
    });

    if (!fir) {
      return NextResponse.json({ error: 'FIR not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.firNumber) updateData.firNumber = body.firNumber;
    if (body.dateOfRegistration) updateData.dateOfRegistration = new Date(body.dateOfRegistration);
    if (body.policeStation) updateData.policeStation = body.policeStation;
    if (body.investigatingOfficer !== undefined) updateData.investigatingOfficer = body.investigatingOfficer;
    if (body.investigatingOfficerContact !== undefined) updateData.investigatingOfficerContact = body.investigatingOfficerContact;
    if (body.sectionsApplied !== undefined) updateData.sectionsApplied = body.sectionsApplied;
    if (body.status) updateData.status = body.status;
    if (body.details !== undefined) updateData.details = body.details;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;

    updateData.updatedById = user.id;

    const updated = await prisma.fIR.update({
      where: { id: firIdNum },
      data: updateData,
      include: {
        createdBy: true,
        updatedBy: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating FIR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; firId: string }> }
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

    const { id, firId } = await params;
    const complaintId = parseInt(id);
    const firIdNum = parseInt(firId);

    const fir = await prisma.fIR.findFirst({
      where: {
        id: firIdNum,
        complaintId,
      },
    });

    if (!fir) {
      return NextResponse.json({ error: 'FIR not found' }, { status: 404 });
    }

    // Check permissions - only SUPER_ADMIN can delete FIRs
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admin can delete FIRs' }, { status: 403 });
    }

    await prisma.fIR.delete({
      where: { id: firIdNum },
    });

    return NextResponse.json({ message: 'FIR deleted successfully' });
  } catch (error) {
    console.error('Error deleting FIR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}