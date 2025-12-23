import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
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

    const { id, commentId } = await params;
    const complaintId = Number(id);
    const commentIdNum = Number(commentId);

    if (!Number.isFinite(complaintId) || !Number.isFinite(commentIdNum)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Check if comment exists and belongs to the complaint
    const comment = await prisma.comment.findUnique({
      where: { id: commentIdNum },
      include: { createdBy: true },
    });

    if (!comment || comment.complaintId !== complaintId) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permissions - only the creator or SUPER_ADMIN can edit
    if (comment.createdById !== user.id && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions to edit comment' }, { status: 403 });
    }

    const { content, isInternal } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentIdNum },
      data: {
        content: content.trim(),
        isInternal: isInternal !== undefined ? isInternal : comment.isInternal,
        updatedById: user.id,
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

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
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

    const { id, commentId } = await params;
    const complaintId = Number(id);
    const commentIdNum = Number(commentId);

    if (!Number.isFinite(complaintId) || !Number.isFinite(commentIdNum)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Check if comment exists and belongs to the complaint
    const comment = await prisma.comment.findUnique({
      where: { id: commentIdNum },
      include: { createdBy: true },
    });

    if (!comment || comment.complaintId !== complaintId) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permissions - only the creator or SUPER_ADMIN can delete
    if (comment.createdById !== user.id && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions to delete comment' }, { status: 403 });
    }

    // Delete the comment (cascade will handle replies)
    await prisma.comment.delete({
      where: { id: commentIdNum },
    });

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}