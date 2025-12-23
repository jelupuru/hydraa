import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

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

    // Check permissions - users can only see comments for complaints they have access to
    if (user.role === 'FIELD_OFFICER' && complaint.createdById !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch parent comments with nested replies
    const comments = await prisma.comment.findMany({
      where: {
        complaintId,
        parentId: null, // Only root comments
      },
      include: {
        createdBy: true,
        updatedBy: true,
        replies: {
          include: {
            createdBy: true,
            updatedBy: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
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

    // Check permissions - only certain roles can add comments
    if (!['DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to add comments' }, { status: 403 });
    }

    const { content, parentId, isInternal = false } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // If parentId is provided, check if the parent comment exists and belongs to the same complaint
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.complaintId !== complaintId) {
        return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        isInternal,
        complaintId,
        parentId,
        createdById: user.id,
      },
      include: {
        createdBy: true,
        updatedBy: true,
        replies: {
          include: {
            createdBy: true,
            updatedBy: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}