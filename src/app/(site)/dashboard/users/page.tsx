import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import UsersManagement from '@/components/Dashboard/UsersManagement';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      _count: {
        select: {
          createdComplaints: true,
          assignedComplaints: true,
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  return <UsersManagement users={users} />;
}