import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

// GET - Fetch all PE review comments for a complaint
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const complaintId = parseInt(id);

  try {
    const comments = await prisma.pEReviewComment.findMany({
      where: { complaintId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching PE review comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new PE review comment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const complaintId = parseInt(id);
  const body = await request.json();
  const { comment } = body;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user || !['DCP', 'ACP', 'COMMISSIONER'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Only DCP, ACP, or Commissioner can add review comments' },
      { status: 403 }
    );
  }

  try {
    const reviewComment = await prisma.pEReviewComment.create({
      data: {
        complaintId,
        comment,
        reviewerRole: user.role,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(reviewComment, { status: 201 });
  } catch (error) {
    console.error('Error creating PE review comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
