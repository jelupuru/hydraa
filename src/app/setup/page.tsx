import { redirect } from 'next/navigation';
import { prisma } from '@/utils/prismaDB';
import SuperAdminSetup from '@/components/SuperAdminSetup';

// Force this page to be dynamic to prevent prerendering during build
export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (existingSuperAdmin) {
      redirect('/signin');
    }
  } catch (error) {
    // If database is not available during build or runtime, continue to setup
    console.log('Database not available, proceeding to setup page');
  }

  return <SuperAdminSetup />;
}