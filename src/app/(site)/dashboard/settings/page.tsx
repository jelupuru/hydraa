import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import SettingsPage from '@/components/Dashboard/SettingsPage';

export default async function Settings() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { email: session!.user!.email! },
  });

  return <SettingsPage user={user!} />;
}