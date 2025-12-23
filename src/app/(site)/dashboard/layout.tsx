import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/utils/auth';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardLayout>
        {children}
      </DashboardLayout>
      {/* No footer in dashboard */}
    </div>
  );
}