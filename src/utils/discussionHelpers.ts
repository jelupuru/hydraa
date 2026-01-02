import { prisma } from '@/utils/prismaDB';

/**
 * Enriches discussions with real user data from the database
 * @param discussions - Array of discussions to enrich
 * @returns Object with users map and enriched discussions
 */
export async function enrichDiscussionsWithUsers(discussions: any[]) {
  if (!discussions || discussions.length === 0) {
    return { usersMap: {}, discussions };
  }

  // Collect all unique user IDs from discussions
  const userIds = new Set<string>();
  
  discussions.forEach((discussion) => {
    if (discussion.userId) userIds.add(discussion.userId);
    discussion.comments?.forEach((comment: any) => {
      if (comment.userId) userIds.add(comment.userId);
    });
  });

  // Fetch user data from database
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: Array.from(userIds),
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  // Build users map
  const usersMap: Record<string, any> = {};
  users.forEach((user) => {
    usersMap[user.id] = {
      id: user.id,
      name: user.name || user.email || 'Unknown User',
      avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${user.id}`,
      role: user.role,
    };
  });

  return { usersMap, discussions };
}
