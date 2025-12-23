import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import { FIRStatus } from '@prisma/client';

export async function GET(
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
    const complaintId = Number(id);
    if (!Number.isFinite(complaintId)) {
      return NextResponse.json({ error: 'Invalid complaint id' }, { status: 400 });
    }

    // Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Check permissions - users can only see FIRs for complaints they have access to
    if (user.role === 'FIELD_OFFICER' && complaint.createdById !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const firs = await prisma.fIR.findMany({
      where: { complaintId },
      include: {
        createdBy: true,
        updatedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(firs);
  } catch (error) {
    console.error('Error fetching FIRs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
    const complaintId = Number(id);
    if (!Number.isFinite(complaintId)) {
      return NextResponse.json({ error: 'Invalid complaint id' }, { status: 400 });
    }

    // Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Check permissions - only certain roles can create FIRs
    if (!['DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to create FIR' }, { status: 403 });
    }

    const { firNumber, dateOfRegistration, policeStation, investigatingOfficer, investigatingOfficerContact, sectionsApplied, details, remarks } = await request.json();

    if (!firNumber || !dateOfRegistration || !policeStation) {
      return NextResponse.json({ error: 'FIR number, date of registration, and police station are required' }, { status: 400 });
    }

    // Check if FIR number already exists
    const existingFIR = await prisma.fIR.findUnique({
      where: { firNumber },
    });

    if (existingFIR) {
      return NextResponse.json({ error: 'FIR number already exists' }, { status: 400 });
    }

    const created = await prisma.fIR.create({
      data: {
        firNumber,
        dateOfRegistration: new Date(dateOfRegistration),
        policeStation,
        investigatingOfficer,
        investigatingOfficerContact,
        sectionsApplied,
        details,
        remarks,
        complaintId,
        createdById: user.id,
      },
      include: {
        createdBy: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating FIR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}