import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, FileText, Calendar, MapPin } from 'lucide-react';

interface Complaint {
  id: number;
  complaintId?: string | null;
  complaintUniqueId?: string | null;
  dateOfApplicationReceived?: Date | null;
  nameOfTheComplainant?: string | null;
  phoneOfTheComplainant?: string | null;
  addressOfTheComplainant?: string | null;
  addressOfComplaintPlace?: string | null;
  briefDetailsOfTheComplaint?: string | null;
  actionTakenBriefDetails?: string | null;
  createdAt: Date;
  secondNoticeNumber?: string | null;
  secondNoticeDate?: Date | null;
}

interface NoticeProps {
  complaint: Complaint;
}

const NoticeTwo: React.FC<NoticeProps> = ({ complaint }) => {
  const [noticeNumber, setNoticeNumber] = useState(complaint.secondNoticeNumber || '');
  const [noticeDate, setNoticeDate] = useState(
    complaint.secondNoticeDate 
      ? complaint.secondNoticeDate.toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [isEditing, setIsEditing] = useState(!complaint.secondNoticeNumber);
  const printRef = useRef<HTMLDivElement>(null);

  // Auto-generate notice number if not present
  useEffect(() => {
    if (!noticeNumber && complaint.id) {
      const generatedNumber = `HYDRAA/NOTICE-2/${complaint.id}/${new Date().getFullYear()}`;
      setNoticeNumber(generatedNumber);
    }
  }, [complaint.id, noticeNumber]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        const content = `
          <html>
            <head>
              <title>Notice - ${noticeNumber}</title>
              <style>
                body {
                  font-family: 'Times New Roman', serif;
                  margin: 0;
                  padding: 20px;
                  line-height: 1.6;
                  color: #000;
                }
                .notice-container {
                  max-width: 800px;
                  margin: 0 auto;
                  background: white;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                  border-bottom: 3px solid #1e40af;
                  padding-bottom: 20px;
                }
                .logo-section {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  gap: 20px;
                  margin-bottom: 20px;
                }
                .emblem {
                  width: 60px;
                  height: 60px;
                  border: 2px solid #1e40af;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: #f8fafc;
                  font-weight: bold;
                  font-size: 12px;
                  color: #1e40af;
                }
                .org-info {
                  text-align: center;
                }
                .org-title {
                  font-size: 22px;
                  font-weight: bold;
                  color: #1e40af;
                  margin: 0;
                }
                .org-subtitle {
                  font-size: 16px;
                  color: #64748b;
                  margin: 5px 0;
                }
                .notice-header {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 30px;
                  padding: 15px 0;
                  border-bottom: 2px solid #e2e8f0;
                }
                .notice-number {
                  font-weight: bold;
                  color: #1e40af;
                }
                .notice-date {
                  font-weight: bold;
                  color: #1e40af;
                }
                .notice-title {
                  text-align: center;
                  font-size: 18px;
                  font-weight: bold;
                  text-decoration: underline;
                  margin-bottom: 25px;
                  color: #dc2626;
                }
                .notice-body {
                  text-align: justify;
                  margin-bottom: 30px;
                  padding: 0 10px;
                }
                .notice-body p {
                  margin-bottom: 15px;
                }
                .highlight {
                  font-weight: bold;
                  color: #dc2626;
                }
                .footer {
                  margin-top: 40px;
                  display: flex;
                  justify-content: space-between;
                  align-items: end;
                }
                .signature-section {
                  text-align: center;
                }
                .signature-line {
                  border-bottom: 2px solid #000;
                  width: 200px;
                  margin-bottom: 5px;
                }
                .designation {
                  font-weight: bold;
                  font-size: 14px;
                }
                .seal-area {
                  border: 2px dashed #64748b;
                  width: 100px;
                  height: 100px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #64748b;
                  font-size: 12px;
                }
                .compliance-info {
                  background: #fef2f2;
                  border-left: 4px solid #dc2626;
                  padding: 15px;
                  margin: 20px 0;
                }
                .deadline {
                  background: #fbbf24;
                  color: #92400e;
                  padding: 8px 15px;
                  border-radius: 4px;
                  font-weight: bold;
                  display: inline-block;
                  margin: 10px 0;
                }
                @media print {
                  body { margin: 0; }
                  .notice-container { box-shadow: none; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'second',
          noticeNumber,
          noticeDate,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        // You might want to show a success message here
      } else {
        throw new Error('Failed to save notice');
      }
    } catch (error) {
      console.error('Error saving notice:', error);
      // You might want to show an error message here
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDeadlineDate = () => {
    const notice = new Date(noticeDate);
    notice.setDate(notice.getDate() + 15); // 15 days from notice date
    return notice.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Control Panel */}
      <div className="mb-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Notice Number:</label>
            <input
              type="text"
              value={noticeNumber}
              onChange={(e) => setNoticeNumber(e.target.value)}
              disabled={!isEditing}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Notice Date:</label>
            <input
              type="date"
              value={noticeDate}
              onChange={(e) => setNoticeDate(e.target.value)}
              disabled={!isEditing}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <FileText className="w-4 h-4 mr-2" />
              Save Notice
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit
            </Button>
          )}
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Notice Document */}
      <div ref={printRef} className="notice-container bg-white p-8 shadow-lg rounded-lg">
        {/* Header */}
        <div className="header">
          <div className="logo-section">
            <div className="emblem">
              HYDRAA
            </div>
            <div className="org-info">
              <h1 className="org-title">HYDERABAD DISASTER RESPONSE AND ASSETS MONITORING AND PROTECTION AGENCY</h1>
              <p className="org-subtitle">Government of Telangana</p>
              <p className="text-sm text-gray-600">
                Vengal Rao Nagar, Hyderabad - 500038 | Phone: +91-40-23454312 | Email: info@hydraa.telangana.gov.in
              </p>
            </div>
          </div>
        </div>

        {/* Notice Header */}
        <div className="notice-header">
          <div className="notice-number">
            No: {noticeNumber}
          </div>
          <div className="notice-date">
            <Calendar className="inline w-4 h-4 mr-1" />
            Date: {formatDate(noticeDate)}
          </div>
        </div>

        {/* Notice Title */}
        <h2 className="notice-title">
          NOTICE 2 UNDER SECTION 10 OF THE HYDRAA ACT, 2024
        </h2>

        {/* Notice Body */}
        <div className="notice-body">
          <p>
            <strong>To:</strong><br />
            <strong>{complaint.nameOfTheComplainant || 'The Respondent'}</strong><br />
            {complaint.addressOfTheComplainant && (
              <>
                <MapPin className="inline w-4 h-4 mr-1" />
                {complaint.addressOfTheComplainant}
              </>
            )}
          </p>

          <p>
            <strong>Subject:</strong> Notice 2 regarding unauthorized construction/encroachment - 
            Complaint ID: <span className="highlight">{complaint.complaintId || complaint.complaintUniqueId}</span>
          </p>

          <p>
            Reference: Our earlier notice dated {complaint.dateOfApplicationReceived ? 
              new Date(complaint.dateOfApplicationReceived).toLocaleDateString('en-IN') : 'N/A'} 
            regarding the above subject.
          </p>

          <div className="compliance-info">
            <p className="font-semibold text-red-600 mb-3">
              WHEREAS, you have failed to comply with the directions contained in our earlier notice, 
              and no satisfactory response has been received within the stipulated time period;
            </p>
            
            <p className="mb-3">
              <strong>WHEREAS,</strong> the unauthorized construction/encroachment at{' '}
              <span className="highlight">
                {complaint.addressOfComplaintPlace || 'the specified location'}
              </span>{' '}
              continues to exist in violation of applicable laws and regulations;
            </p>

            <p className="mb-3">
              <strong>WHEREAS,</strong> the said unauthorized construction/encroachment poses a threat to public safety, 
              environment, and orderly development of the area;
            </p>
          </div>

          <p className="font-semibold">
            <span className="highlight">NOW THEREFORE,</span> you are hereby served with this 
            <span className="highlight"> NOTICE 2</span> to:
          </p>

          <ol className="list-decimal ml-6 mb-4">
            <li className="mb-2">
              <strong>Remove/demolish</strong> the unauthorized construction/encroachment within{' '}
              <span className="deadline">15 (FIFTEEN) DAYS</span> from the date of service of this notice;
            </li>
            <li className="mb-2">
              <strong>Restore</strong> the site to its original condition at your own cost;
            </li>
            <li className="mb-2">
              <strong>Submit</strong> a compliance report with photographic evidence of removal/demolition;
            </li>
            <li className="mb-2">
              <strong>Pay</strong> any applicable penalties as per the HYDRAA Act, 2024.
            </li>
          </ol>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
            <p className="font-semibold text-red-700">
              <strong>WARNING:</strong> This is NOTICE 2. Failure to comply with the above directions 
              within the stipulated time period will result in:
            </p>
            <ul className="list-disc ml-6 mt-2 text-red-700">
              <li>Demolition of unauthorized construction at your risk and cost</li>
              <li>Recovery of demolition costs from you</li>
              <li>Legal action under applicable laws</li>
              <li>Registration of criminal case under relevant sections</li>
            </ul>
          </div>

          <p className="font-semibold">
            <strong>Compliance Deadline:</strong>{' '}
            <span className="deadline">{calculateDeadlineDate()}</span>
          </p>

          <p className="mt-4">
            Any representation against this notice, if any, should be submitted in writing within 7 days 
            from the date of service of this notice, failing which it will be presumed that you have 
            no objection to the action proposed to be taken.
          </p>

          <p className="text-sm mt-4 text-gray-600">
            This notice is issued in public interest and for the protection of water bodies, lakes, 
            and natural resources under the HYDRAA Act, 2024.
          </p>
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="seal-area">
            OFFICIAL<br />SEAL
          </div>
          <div className="signature-section">
            <div className="signature-line"></div>
            <div className="designation">Commissioner</div>
            <div className="text-sm">HYDRAA</div>
            <div className="text-xs text-gray-600 mt-2">
              Date: {formatDate(noticeDate)}
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="mt-8 p-4 bg-gray-50 border rounded">
          <h4 className="font-semibold mb-2">Service Details:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Served by:</strong> _________________<br />
              <strong>Designation:</strong> _________________
            </div>
            <div>
              <strong>Date of Service:</strong> _________________<br />
              <strong>Signature of Recipient:</strong> _________________
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
        <ul className="text-sm text-yellow-700 list-disc ml-4">
          <li>This is an auto-generated notice. Please verify all details before printing.</li>
          <li>Ensure proper service of this notice as per legal requirements.</li>
          <li>Maintain proper records of service for future reference.</li>
          <li>This notice supersedes any earlier notices issued on the same matter.</li>
        </ul>
      </div>
    </div>
  );
};

export default NoticeTwo;