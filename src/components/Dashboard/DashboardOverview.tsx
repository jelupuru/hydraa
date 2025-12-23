import { User } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, CheckCircle, Clock } from 'lucide-react';

interface DashboardOverviewProps {
  user: User & {
    createdComplaints: Array<{
      id: number;
      finalStatus: string | null;
      complaintPriority: string | null;
      createdAt: Date;
      natureOfComplaint: string | null;
      placeOfComplaint: string | null;
    }>;
    assignedComplaints: Array<{
      id: number;
      finalStatus: string | null;
      complaintPriority: string | null;
      createdAt: Date;
      natureOfComplaint: string | null;
      placeOfComplaint: string | null;
    }>;
  };
}

export default function DashboardOverview({ user }: DashboardOverviewProps) {
  // Adjust stats for COMPLAINANT role (they only see their created complaints)
  const isComplainant = user.role === 'COMPLAINANT';
  
  const stats = [
    {
      title: isComplainant ? 'My Complaints' : 'Created Complaints',
      value: user.createdComplaints.length,
      description: isComplainant ? 'Total complaints you have submitted' : 'Total complaints you have created',
      icon: FileText,
      color: 'text-blue-600',
    },
    ...(!isComplainant ? [{
      title: 'Assigned Complaints',
      value: user.assignedComplaints.length,
      description: 'Complaints assigned to you',
      icon: Users,
      color: 'text-green-600',
    }] : []),
    {
      title: isComplainant ? 'Resolved' : 'Resolved Complaints',
      value: isComplainant ? 
        user.createdComplaints.filter((c) => c.finalStatus === 'RESOLVED').length :
        user.assignedComplaints.filter((c) => c.finalStatus === 'RESOLVED').length,
      description: isComplainant ? 'Your complaints that have been resolved' : 'Complaints you have resolved',
      icon: CheckCircle,
      color: 'text-purple-600',
    },
    {
      title: isComplainant ? 'In Progress' : 'Pending Reviews',
      value: isComplainant ?
        user.createdComplaints.filter((c) =>
          ['PENDING', 'UNDER_REVIEW_DCP', 'UNDER_REVIEW_ACP', 'UNDER_REVIEW_COMMISSIONER', 'INVESTIGATION_IN_PROGRESS'].includes(c.finalStatus || '')
        ).length :
        user.assignedComplaints.filter((c) =>
          ['PENDING', 'UNDER_REVIEW_DCP', 'UNDER_REVIEW_ACP', 'UNDER_REVIEW_COMMISSIONER', 'INVESTIGATION_IN_PROGRESS'].includes(c.finalStatus || '')
        ).length,
      description: isComplainant ? 'Complaints currently being processed' : 'Complaints awaiting your review',
      icon: Clock,
      color: 'text-orange-600',
    },
  ];

  const recentComplaints = isComplainant ? 
    user.createdComplaints.slice(0, 5) :
    [...user.createdComplaints.slice(0, 3), ...user.assignedComplaints.slice(0, 3)].slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}!</h2>
        <p className="text-muted-foreground">
          {user.role === 'COMPLAINANT' 
            ? "Here's an overview of your submitted complaints and their status."
            : "Here's an overview of your complaint management activities."
          }
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>Your current role and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="secondary">{user.role.replace('_', ' ')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Member since:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest complaint activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentComplaints.length > 0 ? (
                recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {complaint.natureOfComplaint || 'No title'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {complaint.finalStatus?.replace('_', ' ') || 'Unknown Status'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}