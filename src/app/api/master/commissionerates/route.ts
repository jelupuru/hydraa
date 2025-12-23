import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'SUPER_ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user };
}

export async function GET() {
  try {
    // Any authenticated user can read master data (used in complaint form)
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.commissionerate.findMany({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching commissionerates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if ('error' in auth) return auth.error;

    const { name, code } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const created = await prisma.commissionerate.create({
      data: { name, code },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating commissionerate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


