import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/utils/auth';
import MasterDataManagement from '@/components/Dashboard/MasterDataManagement';
import { prisma } from '@/utils/prismaDB';

export default async function MasterDataPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return <MasterDataManagement />;
}


