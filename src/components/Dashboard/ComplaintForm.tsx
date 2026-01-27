'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, MapPin, FileText, User as UserIcon, AlertTriangle, Phone, Calendar, Building, Briefcase } from 'lucide-react';

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
    <div className="h-full bg-gradient-to-br from-gray-50 to-white p-1">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-4">
            <Badge variant="secondary" className="px-3 py-1">
              <Building className="h-3 w-3 mr-1" />
              Step 1: Jurisdiction
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <FileText className="h-3 w-3 mr-1" />
              Step 2: Details
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <UserIcon className="h-3 w-3 mr-1" />
              Step 3: Contact
            </Badge>
          </div>
        </div>

        {/* Jurisdiction Selection */}
        <Card className="border bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Building className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-medium text-gray-800">Jurisdiction Selection</CardTitle>
                  <p className="text-xs text-gray-600">Choose the administrative area for this complaint</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fetchJurisdictionData()}
                disabled={jurisdictionLoading}
                className="bg-white hover:bg-gray-50 border-gray-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${jurisdictionLoading ? 'animate-spin' : ''}`} />
                {jurisdictionLoading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissionerate" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-blue-500" />
                  Commissionerate
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select value={formData.commissionerateId} onValueChange={(value) => handleInputChange('commissionerateId', value)}>
                  <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                <Label htmlFor="dcpZone" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-green-500" />
                  DCP Zone
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.dcpZoneId}
                  onValueChange={(value) => handleInputChange('dcpZoneId', value)}
                  disabled={!formData.commissionerateId}
                >
                  <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50">
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
                <Label htmlFor="municipalZone" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-purple-500" />
                  Municipal Zone
                </Label>
                <Select
                  value={formData.municipalZoneId}
                  onValueChange={(value) => handleInputChange('municipalZoneId', value)}
                  disabled={!formData.dcpZoneId}
                >
                  <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50">
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
                <Label htmlFor="acpDivision" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-indigo-500" />
                  ACP Division
                </Label>
                <Select
                  value={formData.acpDivisionId}
                  onValueChange={(value) => handleInputChange('acpDivisionId', value)}
                  disabled={!formData.municipalZoneId}
                >
                  <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50">
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
            </div>
          </CardContent>
        </Card>

        {/* Complaint Details */}
        <Card className="border bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg border-b py-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-gray-800">Complaint Details</CardTitle>
                <p className="text-xs text-gray-600">Provide detailed information about the complaint</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="natureOfComplaint" className="text-sm font-semibold text-gray-700 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    Nature of Complaint
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={formData.natureOfComplaint} onValueChange={(value) => handleInputChange('natureOfComplaint', value)}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select nature of complaint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lake Encroachment">Lake Encroachment</SelectItem>
                      <SelectItem value="Dumping in Lake">Dumping in Lake</SelectItem>
                      <SelectItem value="Illegal Constructions in Lake">Illegal Constructions in Lake</SelectItem>
                      <SelectItem value="Park Encroachment">Park Encroachment</SelectItem>
                      <SelectItem value="Road/Footpath Encroachment">Road/Footpath Encroachment</SelectItem>
                      <SelectItem value="Nala Encroachment">Nala Encroachment</SelectItem>
                      <SelectItem value="Govt. Land Encroachment">Govt. Land Encroachment</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complaintPriority" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                    Priority
                  </Label>
                  <Select value={formData.complaintPriority} onValueChange={(value) => handleInputChange('complaintPriority', value)}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                <Label htmlFor="placeOfComplaint" className="text-sm font-semibold text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-green-500" />
                  Place of Complaint
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="placeOfComplaint"
                  value={formData.placeOfComplaint}
                  onChange={(e) => handleInputChange('placeOfComplaint', e.target.value)}
                  placeholder="Location where incident occurred"
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressOfComplaintPlace" className="text-sm font-semibold text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                  Address of Complaint Place
                </Label>
                <Textarea
                  id="addressOfComplaintPlace"
                  value={formData.addressOfComplaintPlace}
                  onChange={(e) => handleInputChange('addressOfComplaintPlace', e.target.value)}
                  placeholder="Detailed address of the incident location"
                  rows={2}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="briefDetailsOfTheComplaint" className="text-sm font-semibold text-gray-700 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-orange-500" />
                  Brief Details of the Complaint
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  id="briefDetailsOfTheComplaint"
                  value={formData.briefDetailsOfTheComplaint}
                  onChange={(e) => handleInputChange('briefDetailsOfTheComplaint', e.target.value)}
                  placeholder="Describe what happened"
                  rows={4}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailsOfRespondent" className="text-sm font-semibold text-gray-700 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-red-500" />
                  Details of Respondent
                </Label>
                <Textarea
                  id="detailsOfRespondent"
                  value={formData.detailsOfRespondent}
                  onChange={(e) => handleInputChange('detailsOfRespondent', e.target.value)}
                  placeholder="Information about the person/party against whom complaint is made"
                  rows={3}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments" className="text-sm font-semibold text-gray-700 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-purple-500" />
                  Attachments
                </Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleAttachmentsChange}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500">
                  You can upload supporting documents, images, or PDFs. (Optional)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sourceOfComplaint" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-green-500" />
                    Source of Complaint
                  </Label>
                  <Select value={formData.sourceOfComplaint} onValueChange={(value) => handleInputChange('sourceOfComplaint', value)}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                  <Label htmlFor="modeOfComplaint" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                    Mode of Complaint
                  </Label>
                  <Select value={formData.modeOfComplaint} onValueChange={(value) => handleInputChange('modeOfComplaint', value)}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
            </div>
          </CardContent>
        </Card>

        {/* Complainant Details */}
        <Card className="border bg-white">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b py-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <UserIcon className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-gray-800">Complainant Details</CardTitle>
                <p className="text-xs text-gray-600">Your contact information for follow-up</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nameOfTheComplainant" className="text-sm font-semibold text-gray-700 flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
                    Name of the Complainant
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="nameOfTheComplainant"
                    value={formData.nameOfTheComplainant}
                    onChange={(e) => handleInputChange('nameOfTheComplainant', e.target.value)}
                    placeholder="Full name of the complainant"
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneOfTheComplainant" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-green-500" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneOfTheComplainant"
                    value={formData.phoneOfTheComplainant}
                    onChange={(e) => handleInputChange('phoneOfTheComplainant', e.target.value)}
                    placeholder="Contact phone number"
                    type="tel"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressOfTheComplainant" className="text-sm font-semibold text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                  Address of the Complainant
                </Label>
                <Textarea
                  id="addressOfTheComplainant"
                  value={formData.addressOfTheComplainant}
                  onChange={(e) => handleInputChange('addressOfTheComplainant', e.target.value)}
                  placeholder="Complete address of the complainant"
                  rows={3}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="bg-gray-50 rounded-lg p-6 mt-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p>* Required fields must be filled</p>
            </div>
            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="px-6 py-2 h-11 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="px-8 py-2 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    {complaint ? 'Update Complaint' : 'Create New Complaint'}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
