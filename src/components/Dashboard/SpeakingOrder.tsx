import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, FileText, Calendar, MapPin } from 'lucide-react';
import "./SpeakingOrder.css";

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
}

interface SpeakingOrderProps {
  complaint: Complaint;
}

const SpeakingOrder: React.FC<SpeakingOrderProps> = ({ complaint }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        const content = `
          <html>
            <head>
              <title>Speaking Order - ${complaint.complaintId}</title>
              <style>
                body {
                  font-family: "Times New Roman", serif;
                  margin: 0;
                  padding: 20px;
                  line-height: 1.6;
                  color: #000;
                  font-size: 14px;
                }
                .so-container {
                  max-width: 900px;
                  margin: auto;
                  padding: 24px;
                  font-family: "Times New Roman", serif;
                  font-size: 14px;
                  color: #000;
                }
                .so-title {
                  text-align: center;
                  font-weight: bold;
                  font-size: 18px;
                  margin-bottom: 8px;
                }
                .so-office {
                  text-align: center;
                  margin-bottom: 20px;
                }
                .so-meta {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 20px;
                }
                .so-heading {
                  text-align: center;
                  font-size: 16px;
                  font-weight: bold;
                  text-decoration: underline;
                  margin-bottom: 20px;
                }
                .so-ref {
                  margin-left: 24px;
                }
                .so-divider {
                  text-align: center;
                  margin: 16px 0;
                }
                .so-signature {
                  margin-top: 40px;
                  text-align: right;
                }
                .so-to {
                  margin-top: 30px;
                }
                @media print {
                  .so-container {
                    padding: 0;
                  }
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

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Control Panel */}
      <div className="mb-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Speaking Order</h3>
          <p className="text-sm text-gray-600">Final decision document for complaint resolution</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Speaking Order Document */}
      <div ref={printRef} className="bg-white p-8 shadow-lg rounded-lg">
        <div className="so-container">
          {/* Header */}
          <h2 className="so-title">
            HYDERABAD DISASTER RESPONSE &<br />
            ASSET PROTECTION AGENCY
          </h2>

          <p className="so-office">
            O/o The Commissioner,<br />
            Hyderabad Disaster Response & Asset Protection Agency,<br />
            6th & 7th Floor, Buddha Bhavan, Secunderabad – 500003
          </p>

          <div className="so-meta">
            <div>
              <strong>Lr.No.</strong> {complaint.complaintId || complaint.complaintUniqueId}/Comm./HYDRAA/2024
            </div>
            <div>
              <strong>Date:</strong> {formatDate(new Date())}
            </div>
          </div>

          <h3 className="so-heading">Speaking Orders</h3>

          {/* Subject */}
          <p>
            <strong>Sub:</strong> Comm – HYDRAA – Complaint received regarding {complaint.briefDetailsOfTheComplaint || 'unauthorized construction/encroachment'} at {complaint.addressOfComplaintPlace || 'the specified location'} – public hearing conducted on {formatDate(new Date())} at O/o HYDRAA – initiation of further action – speaking orders issued – Reg.
          </p>

          {/* References */}
          <p><strong>Ref:</strong></p>
          <ol className="so-ref">
            <li>Complaint received at the Office of the Commissioner, HYDRAA dated: {complaint.dateOfApplicationReceived ? formatDate(complaint.dateOfApplicationReceived) : formatDate(complaint.createdAt)}.</li>
            <li>Investigation report and field verification.</li>
            <li>Notice issued to the respondent(s).</li>
            <li>Public hearing conducted on {formatDate(new Date())} at O/o HYDRAA.</li>
            <li>Legal provisions under HYDRAA Act, 2024.</li>
          </ol>

          <p className="so-divider">***</p>

          {/* Order Content */}
          <p>
            1. Vide reference 1st cited, a complaint was received at the Office of
            HYDRAA regarding {complaint.briefDetailsOfTheComplaint || 'unauthorized construction/encroachment'} at {complaint.addressOfComplaintPlace || 'the specified location'}.
          </p>

          <p>
            2. Upon receipt of the complaint, this Office conducted detailed investigation
            and field verification to ascertain the facts and circumstances of the case.
          </p>

          <p>
            3. Notice was issued to the respondent(s) calling for explanation and
            compliance with applicable laws and regulations.
          </p>

          <p>
            4. As per due process, personal hearing was conducted on {formatDate(new Date())} 
            at the Office of the Commissioner, HYDRAA, providing adequate opportunity 
            to the respondent(s) to present their case.
          </p>

          <p>
            5. Upon perusal of records, site inspection reports, and representations
            made during the hearing, it was observed that the construction/activity
            is in violation of applicable laws, rules, and regulations.
          </p>

          <p>
            6. The unauthorized construction/encroachment poses threat to public safety,
            environment, and orderly development of the area, and cannot be permitted
            to continue.
          </p>

          <p>
            7. The actions of the respondent(s) are treated as illegal, arbitrary,
            and in violation of statutory provisions and public interest.
          </p>

          <p>
            8. Hence, after careful consideration of all facts and circumstances,
            it is ordered that the unauthorized construction/encroachment be removed
            forthwith and the site be restored to its original condition.
          </p>

          <p>
            9. Non-compliance with this order shall result in enforcement action
            including demolition at the risk and cost of the violator(s) and
            initiation of legal proceedings as per law.
          </p>

          {/* Signature */}
          <div className="so-signature">
            <p><strong>Commissioner</strong></p>
            <p>
              Hyderabad Disaster Response &<br />
              Asset Protection Agency (HYDRAA)
            </p>
          </div>

          {/* Recipients */}
          <div className="so-to">
            <p><strong>To</strong></p>

            <p>
              {complaint.nameOfTheComplainant || 'The Respondent'},<br />
              {complaint.addressOfTheComplainant || 'Address as per complaint records'}
            </p>

            <p><strong>Copy to:</strong></p>
            <ol>
              <li>The District Collector concerned for information and necessary action.</li>
              <li>The Municipal Commissioner/Sarpanch concerned for compliance.</li>
              <li>The SHO, Police Station concerned for assistance in enforcement.</li>
              <li>Office file.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">Important Notes:</h4>
        <ul className="text-sm text-blue-700 list-disc ml-4">
          <li>This speaking order represents the final decision of HYDRAA on the complaint.</li>
          <li>The order is legally binding and enforceable under the HYDRAA Act, 2024.</li>
          <li>Non-compliance may result in legal action and penalties as prescribed by law.</li>
          <li>This document should be preserved for official records and compliance monitoring.</li>
        </ul>
      </div>
    </div>
  );
};

export default SpeakingOrder;