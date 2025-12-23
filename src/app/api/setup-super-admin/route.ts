import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prismaDB';
import bcrypt from 'bcryptjs';

// POST /api/setup-super-admin - Initialize the first super admin user
export async function POST(request: NextRequest) {
  try {
    // Check if any super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (existingSuperAdmin) {
      return NextResponse.json({ error: 'Super admin already exists' }, { status: 400 });
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create super admin user
    const superAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'Super admin created successfully',
      user: superAdmin
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating super admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}