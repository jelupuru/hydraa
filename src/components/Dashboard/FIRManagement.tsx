'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, FileText, Plus, Edit, Trash2, Calendar, User, Phone } from 'lucide-react';
import { FIRStatus } from '@prisma/client';

type FIR = {
  id: number;
  firNumber: string;
  dateOfRegistration: Date;
  policeStation: string;
  investigatingOfficer?: string;
  investigatingOfficerContact?: string;
  sectionsApplied?: string;
  status: FIRStatus;
  details?: string;
  remarks?: string;
  createdBy: { name: string };
  updatedBy?: { name: string };
  createdAt: Date;
  updatedAt: Date;
};

type FIRManagementProps = {
  complaintId: number;
  firs: FIR[];
  canCreateFIR: boolean;
  onFIRCreated: () => void;
  onFIREdited: () => void;
  onFIRDeleted: () => void;
};

export default function FIRManagement({
  complaintId,
  firs,
  canCreateFIR,
  onFIRCreated,
  onFIREdited,
  onFIRDeleted,
}: FIRManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFIR, setSelectedFIR] = useState<FIR | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
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

  const resetForm = () => {
    setFormData({
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
  };

  const handleCreateFIR = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/complaints/${complaintId}/firs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: formData.status as FIRStatus
        }),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        resetForm();
        onFIRCreated();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create FIR');
      }
    } catch (error) {
      console.error('Error creating FIR:', error);
      alert('Failed to create FIR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFIR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFIR) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/complaints/${complaintId}/firs/${selectedFIR.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: formData.status as FIRStatus
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedFIR(null);
        resetForm();
        onFIREdited();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update FIR');
      }
    } catch (error) {
      console.error('Error updating FIR:', error);
      alert('Failed to update FIR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFIR = async (firId: number) => {
    if (!confirm('Are you sure you want to delete this FIR? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/complaints/${complaintId}/firs/${firId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onFIRDeleted();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete FIR');
      }
    } catch (error) {
      console.error('Error deleting FIR:', error);
      alert('Failed to delete FIR');
    }
  };

  const openEditDialog = (fir: FIR) => {
    setSelectedFIR(fir);
    setFormData({
      firNumber: fir.firNumber,
      dateOfRegistration: fir.dateOfRegistration.toISOString().split('T')[0],
      policeStation: fir.policeStation,
      investigatingOfficer: fir.investigatingOfficer || '',
      investigatingOfficerContact: fir.investigatingOfficerContact || '',
      sectionsApplied: fir.sectionsApplied || '',
      status: fir.status as string,
      details: fir.details || '',
      remarks: fir.remarks || '',
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: FIRStatus) => {
    switch (status) {
      case FIRStatus.REGISTERED:
        return 'default';
      case FIRStatus.UNDER_INVESTIGATION:
        return 'secondary';
      case FIRStatus.CHARGESHEET_FILED:
        return 'destructive';
      case FIRStatus.COURT_PROCEEDINGS:
        return 'outline';
      case FIRStatus.CLOSED:
        return 'default';
      case FIRStatus.WITHDRAWN:
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          FIRs ({firs.length})
        </h3>
        {canCreateFIR && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add FIR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create FIR</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFIR} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firNumber">FIR Number *</Label>
                    <Input
                      id="firNumber"
                      value={formData.firNumber}
                      onChange={(e) => setFormData({ ...formData, firNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfRegistration">Date of Registration *</Label>
                    <Input
                      id="dateOfRegistration"
                      type="date"
                      value={formData.dateOfRegistration}
                      onChange={(e) => setFormData({ ...formData, dateOfRegistration: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="policeStation">Police Station *</Label>
                  <Input
                    id="policeStation"
                    value={formData.policeStation}
                    onChange={(e) => setFormData({ ...formData, policeStation: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investigatingOfficer">Investigating Officer</Label>
                    <Input
                      id="investigatingOfficer"
                      value={formData.investigatingOfficer}
                      onChange={(e) => setFormData({ ...formData, investigatingOfficer: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="investigatingOfficerContact">Officer Contact</Label>
                    <Input
                      id="investigatingOfficerContact"
                      value={formData.investigatingOfficerContact}
                      onChange={(e) => setFormData({ ...formData, investigatingOfficerContact: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sectionsApplied">Sections Applied (IPC)</Label>
                  <Input
                    id="sectionsApplied"
                    value={formData.sectionsApplied}
                    onChange={(e) => setFormData({ ...formData, sectionsApplied: e.target.value })}
                    placeholder="e.g., 420, 406 IPC"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create FIR'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {firs.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No FIRs registered for this complaint</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {firs.map((fir) => (
            <Card key={fir.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">FIR {fir.firNumber}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(fir.status)}>
                      {fir.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {canCreateFIR && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(fir)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteFIR(fir.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Registered:</span>
                    <span>{new Date(fir.dateOfRegistration).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Police Station:</span>
                    <span>{fir.policeStation}</span>
                  </div>
                  {fir.investigatingOfficer && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Officer:</span>
                      <span>{fir.investigatingOfficer}</span>
                    </div>
                  )}
                  {fir.investigatingOfficerContact && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Contact:</span>
                      <span>{fir.investigatingOfficerContact}</span>
                    </div>
                  )}
                </div>

                {fir.sectionsApplied && (
                  <div>
                    <span className="text-sm text-muted-foreground">Sections Applied:</span>
                    <p className="text-sm font-medium">{fir.sectionsApplied}</p>
                  </div>
                )}

                {fir.details && (
                  <div>
                    <span className="text-sm text-muted-foreground">Details:</span>
                    <p className="text-sm">{fir.details}</p>
                  </div>
                )}

                {fir.remarks && (
                  <div>
                    <span className="text-sm text-muted-foreground">Remarks:</span>
                    <p className="text-sm">{fir.remarks}</p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Created by {fir.createdBy.name} on {new Date(fir.createdAt).toLocaleDateString()}
                  {fir.updatedBy && fir.updatedAt !== fir.createdAt && (
                    <> • Updated by {fir.updatedBy.name} on {new Date(fir.updatedAt).toLocaleDateString()}</>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit FIR</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditFIR} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firNumber">FIR Number *</Label>
                <Input
                  id="edit-firNumber"
                  value={formData.firNumber}
                  onChange={(e) => setFormData({ ...formData, firNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-dateOfRegistration">Date of Registration *</Label>
                <Input
                  id="edit-dateOfRegistration"
                  type="date"
                  value={formData.dateOfRegistration}
                  onChange={(e) => setFormData({ ...formData, dateOfRegistration: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-policeStation">Police Station *</Label>
              <Input
                id="edit-policeStation"
                value={formData.policeStation}
                onChange={(e) => setFormData({ ...formData, policeStation: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-investigatingOfficer">Investigating Officer</Label>
                <Input
                  id="edit-investigatingOfficer"
                  value={formData.investigatingOfficer}
                  onChange={(e) => setFormData({ ...formData, investigatingOfficer: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-investigatingOfficerContact">Officer Contact</Label>
                <Input
                  id="edit-investigatingOfficerContact"
                  value={formData.investigatingOfficerContact}
                  onChange={(e) => setFormData({ ...formData, investigatingOfficerContact: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-sectionsApplied">Sections Applied (IPC)</Label>
              <Input
                id="edit-sectionsApplied"
                value={formData.sectionsApplied}
                onChange={(e) => setFormData({ ...formData, sectionsApplied: e.target.value })}
                placeholder="e.g., 420, 406 IPC"
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
              <Label htmlFor="edit-details">Details</Label>
              <Textarea
                id="edit-details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-remarks">Remarks</Label>
              <Textarea
                id="edit-remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update FIR'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}