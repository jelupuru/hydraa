import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import ComplaintsManagement from '@/components/Dashboard/ComplaintsManagement';

export default async function ComplaintsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  return <ComplaintsManagement user={user} />;
}