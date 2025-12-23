'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface ComplaintFormProps {
  user: User;
  complaint?: any; // For editing existing complaints
  onSuccess: () => void;
  onCancel: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

type JurisdictionData = {
  commissionerates: Array<{ id: number; name: string }>;
  dcpZones: Array<{ id: number; name: string; commissionerateId: number }>;
  municipalZones: Array<{ id: number; name: string; dcpZoneId: number }>;
  acpDivisions: Array<{ id: number; name: string; municipalZoneId: number }>;
};

export default function ComplaintForm({ user, complaint, onSuccess, onCancel, refreshTrigger }: ComplaintFormProps) {
  const [loading, setLoading] = useState(false);
  const [jurisdictionLoading, setJurisdictionLoading] = useState(false);
  const [jurisdictionData, setJurisdictionData] = useState<JurisdictionData>({
    commissionerates: [],
    dcpZones: [],
    municipalZones: [],
    acpDivisions: []
  });

  const [formData, setFormData] = useState({
    // Basic complaint info
    natureOfComplaint: complaint?.natureOfComplaint || '',
    placeOfComplaint: complaint?.placeOfComplaint || '',
    addressOfComplaintPlace: complaint?.addressOfComplaintPlace || '',
    briefDetailsOfTheComplaint: complaint?.briefDetailsOfTheComplaint || '',
    detailsOfRespondent: complaint?.detailsOfRespondent || '',

    // Complainant details
    nameOfTheComplainant: complaint?.nameOfTheComplainant || '',
    phoneOfTheComplainant: complaint?.phoneOfTheComplainant || '',
    addressOfTheComplainant: complaint?.addressOfTheComplainant || '',

    // Priority and category
    complaintPriority: complaint?.complaintPriority || 'NORMAL',
    sourceOfComplaint: complaint?.sourceOfComplaint || '',
    modeOfComplaint: complaint?.modeOfComplaint || '',

    // Jurisdiction
    commissionerateId: complaint?.commissionerateId?.toString() || '',
    dcpZoneId: complaint?.dcpZoneId?.toString() || '',
    municipalZoneId: complaint?.municipalZoneId?.toString() || '',
    acpDivisionId: complaint?.acpDivisionId?.toString() || '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    fetchJurisdictionData();
  }, [refreshTrigger]);

  const fetchJurisdictionData = async () => {
    setJurisdictionLoading(true);
    try {
      const [commissioneratesRes, dcpZonesRes, municipalZonesRes, acpDivisionsRes] = await Promise.all([
        fetch('/api/master/commissionerates'),
        fetch('/api/master/dcp-zones'),
        fetch('/api/master/municipal-zones'),
        fetch('/api/master/acp-divisions')
      ]);

      const commissionerates = commissioneratesRes.ok ? await commissioneratesRes.json() : [];
      const dcpZones = dcpZonesRes.ok ? await dcpZonesRes.json() : [];
      const municipalZones = municipalZonesRes.ok ? await municipalZonesRes.json() : [];
      const acpDivisions = acpDivisionsRes.ok ? await acpDivisionsRes.json() : [];

      setJurisdictionData({
        commissionerates,
        dcpZones,
        municipalZones,
        acpDivisions
      });
    } catch (error) {
      console.error('Error fetching jurisdiction data:', error);
      // Fallback to empty data if API fails
      setJurisdictionData({
        commissionerates: [],
        dcpZones: [],
        municipalZones: [],
        acpDivisions: []
      });
    } finally {
      setJurisdictionLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Reset dependent fields when parent jurisdiction changes
    if (field === 'commissionerateId') {
      setFormData(prev => ({
        ...prev,
        dcpZoneId: '',
        municipalZoneId: '',
        acpDivisionId: ''
      }));
    } else if (field === 'dcpZoneId') {
      setFormData(prev => ({
        ...prev,
        municipalZoneId: '',
        acpDivisionId: ''
      }));
    } else if (field === 'municipalZoneId') {
      setFormData(prev => ({
        ...prev,
        acpDivisionId: ''
      }));
    }
  };

  const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      setAttachments([]);
      return;
    }
    setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.natureOfComplaint.trim()) {
      alert('Nature of complaint is required');
      return;
    }
    if (!formData.placeOfComplaint.trim()) {
      alert('Place of complaint is required');
      return;
    }
    if (!formData.nameOfTheComplainant.trim()) {
      alert('Name of complainant is required');
      return;
    }
    if (!formData.phoneOfTheComplainant.trim()) {
      alert('Phone number of complainant is required');
      return;
    }
    if (!formData.briefDetailsOfTheComplaint.trim()) {
      alert('Brief details of the complaint are required');
      return;
    }
    if (!formData.commissionerateId) {
      alert('Please select a commissionerate');
      return;
    }

    setLoading(true);

    try {
      const method = complaint ? 'PATCH' : 'POST';
      const url = complaint ? `/api/complaints/${complaint.id}` : '/api/complaints';

      // For new complaints we support attachments via FormData.
      // For edits, keep JSON body for now (no attachment editing implemented).
      if (!complaint && attachments.length > 0) {
        const form = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== '') {
            form.append(key, value);
          }
        });
        attachments.forEach((file) => {
          form.append('attachments', file);
        });

        const response = await fetch(url, {
          method,
          body: form,
        });

        if (response.ok) {
          onSuccess();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to save complaint');
        }
      } else {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            commissionerateId: formData.commissionerateId ? parseInt(formData.commissionerateId) : undefined,
            dcpZoneId: formData.dcpZoneId ? parseInt(formData.dcpZoneId) : undefined,
            municipalZoneId: formData.municipalZoneId ? parseInt(formData.municipalZoneId) : undefined,
            acpDivisionId: formData.acpDivisionId ? parseInt(formData.acpDivisionId) : undefined,
          }),
        });

        if (response.ok) {
          onSuccess();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to save complaint');
        }
      }
    } catch (error) {
      console.error('Error saving complaint:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredDCPZones = jurisdictionData.dcpZones.filter(
    zone => zone.commissionerateId.toString() === formData.commissionerateId
  );

  const filteredMunicipalZones = jurisdictionData.municipalZones.filter(
    zone => zone.dcpZoneId.toString() === formData.dcpZoneId
  );

  const filteredACPDivisions = jurisdictionData.acpDivisions.filter(
    division => division.municipalZoneId.toString() === formData.municipalZoneId
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Jurisdiction Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Jurisdiction</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchJurisdictionData()}
              disabled={jurisdictionLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${jurisdictionLoading ? 'animate-spin' : ''}`} />
              {jurisdictionLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="commissionerate">Commissionerate *</Label>
            <Select value={formData.commissionerateId} onValueChange={(value) => handleInputChange('commissionerateId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Commissionerate" />
              </SelectTrigger>
              <SelectContent>
                {jurisdictionData.commissionerates.map((comm) => (
                  <SelectItem key={comm.id} value={comm.id.toString()}>
                    {comm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dcpZone">DCP Zone *</Label>
            <Select
              value={formData.dcpZoneId}
              onValueChange={(value) => handleInputChange('dcpZoneId', value)}
              disabled={!formData.commissionerateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select DCP Zone" />
              </SelectTrigger>
              <SelectContent>
                {filteredDCPZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id.toString()}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="municipalZone">Municipal Zone</Label>
            <Select
              value={formData.municipalZoneId}
              onValueChange={(value) => handleInputChange('municipalZoneId', value)}
              disabled={!formData.dcpZoneId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Municipal Zone" />
              </SelectTrigger>
              <SelectContent>
                {filteredMunicipalZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id.toString()}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acpDivision">ACP Division</Label>
            <Select
              value={formData.acpDivisionId}
              onValueChange={(value) => handleInputChange('acpDivisionId', value)}
              disabled={!formData.municipalZoneId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select ACP Division" />
              </SelectTrigger>
              <SelectContent>
                {filteredACPDivisions.map((division) => (
                  <SelectItem key={division.id} value={division.id.toString()}>
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaint Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Complaint Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="natureOfComplaint">Nature of Complaint *</Label>
              <Input
                id="natureOfComplaint"
                value={formData.natureOfComplaint}
                onChange={(e) => handleInputChange('natureOfComplaint', e.target.value)}
                placeholder="e.g., Theft, Assault, Harassment"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complaintPriority">Priority</Label>
              <Select value={formData.complaintPriority} onValueChange={(value) => handleInputChange('complaintPriority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeOfComplaint">Place of Complaint *</Label>
            <Input
              id="placeOfComplaint"
              value={formData.placeOfComplaint}
              onChange={(e) => handleInputChange('placeOfComplaint', e.target.value)}
              placeholder="Location where incident occurred"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressOfComplaintPlace">Address of Complaint Place</Label>
            <Textarea
              id="addressOfComplaintPlace"
              value={formData.addressOfComplaintPlace}
              onChange={(e) => handleInputChange('addressOfComplaintPlace', e.target.value)}
              placeholder="Detailed address of the incident location"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="briefDetailsOfTheComplaint">Brief Details of the Complaint *</Label>
            <Textarea
              id="briefDetailsOfTheComplaint"
              value={formData.briefDetailsOfTheComplaint}
              onChange={(e) => handleInputChange('briefDetailsOfTheComplaint', e.target.value)}
              placeholder="Describe what happened"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detailsOfRespondent">Details of Respondent</Label>
            <Textarea
              id="detailsOfRespondent"
              value={formData.detailsOfRespondent}
              onChange={(e) => handleInputChange('detailsOfRespondent', e.target.value)}
              placeholder="Information about the person/party against whom complaint is made"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments</Label>
            <Input
              id="attachments"
              type="file"
              multiple
              onChange={handleAttachmentsChange}
            />
            <p className="text-xs text-muted-foreground">
              You can upload supporting documents, images, or PDFs. (Optional)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceOfComplaint">Source of Complaint</Label>
              <Select value={formData.sourceOfComplaint} onValueChange={(value) => handleInputChange('sourceOfComplaint', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How did you hear about this?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT">Direct</SelectItem>
                  <SelectItem value="PHONE">Phone</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="ONLINE">Online Portal</SelectItem>
                  <SelectItem value="WALK_IN">Walk-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modeOfComplaint">Mode of Complaint</Label>
              <Select value={formData.modeOfComplaint} onValueChange={(value) => handleInputChange('modeOfComplaint', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How was complaint received?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WRITTEN">Written</SelectItem>
                  <SelectItem value="VERBAL">Verbal</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="PHONE">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complainant Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Complainant Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameOfTheComplainant">Name of the Complainant *</Label>
              <Input
                id="nameOfTheComplainant"
                value={formData.nameOfTheComplainant}
                onChange={(e) => handleInputChange('nameOfTheComplainant', e.target.value)}
                placeholder="Full name of the complainant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneOfTheComplainant">Phone Number</Label>
              <Input
                id="phoneOfTheComplainant"
                value={formData.phoneOfTheComplainant}
                onChange={(e) => handleInputChange('phoneOfTheComplainant', e.target.value)}
                placeholder="Contact phone number"
                type="tel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressOfTheComplainant">Address of the Complainant</Label>
            <Textarea
              id="addressOfTheComplainant"
              value={formData.addressOfTheComplainant}
              onChange={(e) => handleInputChange('addressOfTheComplainant', e.target.value)}
              placeholder="Complete address of the complainant"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (complaint ? 'Update Complaint' : 'Create Complaint')}
        </Button>
      </div>
    </form>
  );
}