'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Complaint, ComplaintStatus, ComplaintAttachment, FIRStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, ArrowRight, CheckCircle, XCircle, FileText, Paperclip } from 'lucide-react';
import ComplaintForm from './ComplaintForm';
import ComplaintDetails from './ComplaintDetails';

interface ComplaintsManagementProps {
  user: User;
}

type ComplaintWithRelations = Complaint & {
  createdBy: User;
  updatedBy?: User;
  assignedTo?: User;
  commissionerate?: { id: number; name: string };
  dcpZone?: { id: number; name: string };
  municipalZone?: { id: number; name: string };
  acpDivision?: { id: number; name: string };
  attachments?: ComplaintAttachment[];
  firs?: any[];
  comments?: any[];
  noticeContent?: string; // Added property
};

export default function ComplaintsManagement({ user }: ComplaintsManagementProps) {
  const router = useRouter();
  const [complaints, setComplaints] = useState<ComplaintWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithRelations | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateFIRDialog, setShowCreateFIRDialog] = useState(false);
  const [selectedComplaintForFIR, setSelectedComplaintForFIR] = useState<ComplaintWithRelations | null>(null);
  const [firFormData, setFirFormData] = useState({
    firNumber: '',
    dateOfRegistration: '',
    policeStation: '',
    investigatingOfficer: '',
    investigatingOfficerContact: '',
    sectionsApplied: '',
    status: FIRStatus.REGISTERED as string,
    details: '',
    remarks: '',
  });
  const [isCreatingFIR, setIsCreatingFIR] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);
  const [showAddFIRModal, setShowAddFIRModal] = useState(false);
  const [showAddInvestigationModal, setShowAddInvestigationModal] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [user.role]);

  const fetchComplaints = async () => {
    try {
      const response = await fetch(`/api/complaints?role=${user.role}`);
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateComplaint = async (complaintId: number, updateData: any) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        fetchComplaints();
        return true;
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update complaint');
        return false;
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('An error occurred');
      return false;
    }
  };

  const getStatusBadgeVariant = (status: ComplaintStatus | null) => {
    if (!status) return 'secondary';
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'UNDER_REVIEW_DCP':
      case 'UNDER_REVIEW_ACP':
      case 'UNDER_REVIEW_COMMISSIONER':
        return 'default';
      case 'RESOLVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'CLOSED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const canUpdateComplaint = (complaintStatus: ComplaintStatus, userRole: string): boolean => {
    switch (userRole) {
      case 'FIELD_OFFICER':
      case 'COMPLAINANT':
        return true; // Allow field officers and complainants to update complaints
      case 'DCP':
        return complaintStatus === ComplaintStatus.PENDING || complaintStatus === ComplaintStatus.UNDER_REVIEW_DCP;
      case 'ACP':
        return complaintStatus === ComplaintStatus.UNDER_REVIEW_DCP || complaintStatus === ComplaintStatus.UNDER_REVIEW_ACP;
      case 'COMMISSIONER':
        return complaintStatus === ComplaintStatus.UNDER_REVIEW_ACP || complaintStatus === ComplaintStatus.UNDER_REVIEW_COMMISSIONER;
      default:
        return false;
    }
  };

  const getNextStatus = (userRole: string): ComplaintStatus => {
    switch (userRole) {
      case 'FIELD_OFFICER':
      case 'COMPLAINANT':
        return ComplaintStatus.UNDER_REVIEW_DCP;
      case 'DCP':
        return ComplaintStatus.UNDER_REVIEW_ACP;
      case 'ACP':
        return ComplaintStatus.UNDER_REVIEW_COMMISSIONER;
      case 'COMMISSIONER':
        return ComplaintStatus.RESOLVED;
      default:
        return ComplaintStatus.PENDING;
    }
  };

  const getNextAssigneeRole = (userRole: string): string => {
    switch (userRole) {
      case 'FIELD_OFFICER':
      case 'COMPLAINANT':
        return 'DCP';
      case 'DCP':
        return 'ACP';
      case 'ACP':
        return 'COMMISSIONER';
      default:
        return 'COMMISSIONER';
    }
  };

  const handleViewDetails = (complaint: ComplaintWithRelations) => {
    router.push(`/dashboard/complaints/${complaint.id}`);
  };

  const canCreateFIR = (userRole: string): boolean => {
    return ['FIELD_OFFICER', 'DCP', 'ACP', 'COMMISSIONER', 'SUPER_ADMIN'].includes(userRole);
  };

  const handleCreateFIR = (complaint: ComplaintWithRelations) => {
    setSelectedComplaintForFIR(complaint);
    setShowCreateFIRDialog(true);
  };

  const handleFIRFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintForFIR) return;

    setIsCreatingFIR(true);
    try {
      const response = await fetch(`/api/complaints/${selectedComplaintForFIR.id}/firs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...firFormData,
          status: firFormData.status as FIRStatus
        }),
      });

      if (response.ok) {
        setShowCreateFIRDialog(false);
        setFirFormData({
          firNumber: '',
          dateOfRegistration: '',
          policeStation: '',
          investigatingOfficer: '',
          investigatingOfficerContact: '',
          sectionsApplied: '',
          status: FIRStatus.REGISTERED,
          details: '',
          remarks: '',
        });
        setSelectedComplaintForFIR(null);
        fetchComplaints(); // Refresh the complaints list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create FIR');
      }
    } catch (error) {
      console.error('Error creating FIR:', error);
      alert('An error occurred while creating FIR');
    } finally {
      setIsCreatingFIR(false);
    }
  };

  const handleAddComment = async (comment: string) => {
    if (!selectedComplaint) return;
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      });

      if (response.ok) {
        setShowAddCommentModal(false);
        fetchComplaints();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('An error occurred while adding comment');
    }
  };

  const handleAddFIRDetails = async (firNumber: string, details: string) => {
    if (!selectedComplaint) return;
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}/firs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firNumber, details }),
      });

      if (response.ok) {
        setShowAddFIRModal(false);
        fetchComplaints();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add FIR details');
      }
    } catch (error) {
      console.error('Error adding FIR details:', error);
      alert('An error occurred while adding FIR details');
    }
  };

  const handleAddInvestigationDetails = async (investigationDetails: string) => {
    if (!selectedComplaint) return;
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}/investigations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details: investigationDetails }),
      });

      if (response.ok) {
        setShowAddInvestigationModal(false);
        fetchComplaints();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add investigation details');
      }
    } catch (error) {
      console.error('Error adding investigation details:', error);
      alert('An error occurred while adding investigation details');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading complaints...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Complaints Management</h2>
          <p className="text-muted-foreground">
            Manage and track complaint progress through the system.
          </p>
        </div>
        {(user.role === 'FIELD_OFFICER' || user.role === 'COMPLAINANT') && (
          <Sheet open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Complaint
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="min-w-[600px] w-[90%] flex flex-col h-full p-4">
              <SheetHeader className="shrink-0">
                <SheetTitle>Create New Complaint</SheetTitle>
                <SheetDescription>
                  Fill in the details to submit a new complaint.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto mt-6">
                <ComplaintForm
                  user={user}
                  onSuccess={() => {
                    setShowCreateDialog(false);
                    fetchComplaints();
                  }}
                  onCancel={() => setShowCreateDialog(false)}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Complaints</CardTitle>
          <CardDescription>
            A list of all complaints in the system that you have access to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No complaints found.</p>
              {(user.role === 'FIELD_OFFICER' || user.role === 'COMPLAINANT') && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create your first complaint
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">{complaint.natureOfComplaint || 'Untitled Complaint'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(complaint.finalStatus)}>
                        {complaint.finalStatus?.replace('_', ' ') || 'Unknown Status'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {complaint.attachments && complaint.attachments.length > 0 ? (
                        <div>
                          <span className="text-sm">
                            {complaint.attachments.length} file{complaint.attachments.length > 1 ? 's' : ''}
                          </span>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              console.log('Button clicked for complaint:', complaint);
                              setSelectedComplaint(complaint);
                            }}
                            className="hover:cursor-pointer"
                          >
                            <Paperclip className="h-4 w-4 text-blue-500" />
                          </Button>
                          {selectedComplaint?.id === complaint.id && (
                            <Dialog open={true} onOpenChange={() => setSelectedComplaint(null)}>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Attachments</DialogTitle>
                                  <DialogDescription>
                                    Attachments for complaint #{complaint.complaintId}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="p-4">
                                  <ul className="list-disc list-inside space-y-2">
                                    {complaint.attachments.map((attachment) => (
                                      <li key={attachment.id}>
                                        <a
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline"
                                        >
                                          {attachment.filename}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(complaint)}>
                          <Eye className="h-4 w-4" />
                        </Button>

                        {canCreateFIR(user.role) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateFIR(complaint)}
                            title="Create FIR"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}

                        {complaint.finalStatus && canUpdateComplaint(complaint.finalStatus, user.role) && (
                          <div className="flex gap-1">
                            {user.role === 'COMMISSIONER' ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateComplaint(complaint.id, { finalStatus: ComplaintStatus.RESOLVED })}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateComplaint(complaint.id, { finalStatus: ComplaintStatus.REJECTED })}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (user.role === 'FIELD_OFFICER' || user.role === 'COMPLAINANT') ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateComplaint(complaint.id, { finalStatus: ComplaintStatus.UNDER_REVIEW_DCP })}
                                >
                                  Review
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => updateComplaint(complaint.id, { finalStatus: getNextStatus(user.role), assignedToRole: getNextAssigneeRole(user.role) })}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                  Forward to DCP
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => updateComplaint(complaint.id, { finalStatus: getNextStatus(user.role), assignedToRole: getNextAssigneeRole(user.role) })}
                              >
                                <ArrowRight className="h-4 w-4" />
                                Forward
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* FIR Creation Dialog */}
      <Dialog open={showCreateFIRDialog} onOpenChange={setShowCreateFIRDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create FIR for Complaint</DialogTitle>
            <DialogDescription>
              Create a First Information Report for complaint #{selectedComplaintForFIR?.complaintId || selectedComplaintForFIR?.id}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFIRFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firNumber">FIR Number *</Label>
                <Input
                  id="firNumber"
                  value={firFormData.firNumber}
                  onChange={(e) => setFirFormData({ ...firFormData, firNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dateOfRegistration">Date of Registration *</Label>
                <Input
                  id="dateOfRegistration"
                  type="date"
                  value={firFormData.dateOfRegistration}
                  onChange={(e) => setFirFormData({ ...firFormData, dateOfRegistration: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="policeStation">Police Station *</Label>
              <Input
                id="policeStation"
                value={firFormData.policeStation}
                onChange={(e) => setFirFormData({ ...firFormData, policeStation: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="investigatingOfficer">Investigating Officer</Label>
                <Input
                  id="investigatingOfficer"
                  value={firFormData.investigatingOfficer}
                  onChange={(e) => setFirFormData({ ...firFormData, investigatingOfficer: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="investigatingOfficerContact">Officer Contact</Label>
                <Input
                  id="investigatingOfficerContact"
                  value={firFormData.investigatingOfficerContact}
                  onChange={(e) => setFirFormData({ ...firFormData, investigatingOfficerContact: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sectionsApplied">Sections Applied</Label>
              <Input
                id="sectionsApplied"
                value={firFormData.sectionsApplied}
                onChange={(e) => setFirFormData({ ...firFormData, sectionsApplied: e.target.value })}
                placeholder="e.g., Section 420, 406 IPC"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={firFormData.status}
                onValueChange={(value) => setFirFormData({ ...firFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FIRStatus.REGISTERED}>Registered</SelectItem>
                  <SelectItem value={FIRStatus.UNDER_INVESTIGATION}>Under Investigation</SelectItem>
                  <SelectItem value={FIRStatus.CHARGESHEET_FILED}>Chargesheet Filed</SelectItem>
                  <SelectItem value={FIRStatus.COURT_PROCEEDINGS}>Court Proceedings</SelectItem>
                  <SelectItem value={FIRStatus.CLOSED}>Closed</SelectItem>
                  <SelectItem value={FIRStatus.WITHDRAWN}>Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                value={firFormData.details}
                onChange={(e) => setFirFormData({ ...firFormData, details: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={firFormData.remarks}
                onChange={(e) => setFirFormData({ ...firFormData, remarks: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateFIRDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingFIR}>
                {isCreatingFIR ? 'Creating...' : 'Create FIR'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Comment Modal */}
      {showAddCommentModal && (
        <Dialog open={showAddCommentModal} onOpenChange={setShowAddCommentModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Enter your comment for complaint #{selectedComplaint?.complaintId}
            </DialogDescription>
            <div className="mt-4">
              <Textarea
                placeholder="Enter your comment here..."
                onChange={(e) => setFirFormData({ ...firFormData, details: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddCommentModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleAddComment(firFormData.details);
                  setFirFormData({ ...firFormData, details: '' });
                }}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add FIR Details Modal */}
      {showAddFIRModal && (
        <Dialog open={showAddFIRModal} onOpenChange={setShowAddFIRModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add FIR Details</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Enter the FIR details for complaint #{selectedComplaint?.complaintId}
            </DialogDescription>
            <div className="mt-4">
              <Input
                placeholder="FIR Number"
                onChange={(e) => setFirFormData({ ...firFormData, firNumber: e.target.value })}
                className="mb-2"
              />
              <Textarea
                placeholder="FIR Details"
                onChange={(e) => setFirFormData({ ...firFormData, details: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddFIRModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleAddFIRDetails(firFormData.firNumber, firFormData.details);
                  setFirFormData({ ...firFormData, firNumber: '', details: '' });
                }}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Investigation Details Modal */}
      {showAddInvestigationModal && (
        <Dialog open={showAddInvestigationModal} onOpenChange={setShowAddInvestigationModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Investigation Details</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Enter the investigation details for complaint #{selectedComplaint?.complaintId}
            </DialogDescription>
            <div className="mt-4">
              <Textarea
                placeholder="Enter investigation details here..."
                onChange={(e) => setFirFormData({ ...firFormData, details: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddInvestigationModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleAddInvestigationDetails(firFormData.details);
                  setFirFormData({ ...firFormData, details: '' });
                }}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

export type { ComplaintWithRelations };