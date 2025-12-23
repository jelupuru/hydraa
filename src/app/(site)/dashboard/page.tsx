import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import DashboardOverview from '@/components/Dashboard/DashboardOverview';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      createdComplaints: {
        select: {
          id: true,
          finalStatus: true,
          complaintPriority: true,
          createdAt: true,
          natureOfComplaint: true,
          placeOfComplaint: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      assignedComplaints: {
        select: {
          id: true,
          finalStatus: true,
          complaintPriority: true,
          createdAt: true,
          natureOfComplaint: true,
          placeOfComplaint: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  // For super admin, they can access the general dashboard
  // They can navigate to /dashboard/users from the navigation

  return <DashboardOverview user={user} />;
}