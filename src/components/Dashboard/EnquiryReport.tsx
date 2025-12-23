import "./EnquiryReport.css";

interface EnquiryReportProps {
  complaint: {
    id: number;
    nameOfTheComplainant: string | null;
    detailsOfRespondent: string | null;
    briefDetailsOfTheComplaint: string | null;
    placeOfComplaint: string | null;
    fieldVisitDate: string | null;
    peReport: string | null;
    createdAt: Date;
  };
}

const EnquiryReport = ({ complaint }: EnquiryReportProps) => {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not specified";
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  };

  return (
    <div className="report-container">
      <h2 className="report-title">
        HYDERABAD DISASTER RESPONSE & ASSET PROTECTION AGENCY
      </h2>
      <h3 className="report-subtitle">ENQUIRY REPORT</h3>

      <div className="report-meta">
        <div>
          <strong>Petition No</strong> : {complaint.id}/2025/RAC/HYDRAA
        </div>
        <div>
          <strong>Dt</strong> : {formatDate(complaint.createdAt)}
        </div>
      </div>

      <div className="report-meta">
        <div>
          <strong>Enquiry Officer & Rank</strong> : Field Investigation Officer
        </div>
      </div>

      <div className="report-meta">
        <div>
          <strong>Type of Encroachment</strong> : Environmental/Land Encroachment
        </div>
        <div>
          <strong>Time limit for Enquiry</strong> : Priority
        </div>
        <div>
          <strong>Type of Petition</strong> : Individual
        </div>
      </div>

      <table className="report-table">
        <tbody>
          <tr>
            <td className="col-no">1.</td>
            <td className="col-label">Name & Address of the petitioner</td>
            <td className="col-value">{complaint.nameOfTheComplainant || 'Not specified'}</td>
          </tr>

          <tr>
            <td className="col-no">2.</td>
            <td className="col-label">Name & Address of the Respondent</td>
            <td className="col-value">{complaint.detailsOfRespondent || 'Nil'}</td>
          </tr>

          <tr>
            <td className="col-no">3.</td>
            <td className="col-label">Brief facts of the complaint</td>
            <td className="col-value">
              {complaint.briefDetailsOfTheComplaint || 'No details provided'}
            </td>
          </tr>

          <tr>
            <td className="col-no">4.</td>
            <td className="col-label">Location of encroachment</td>
            <td className="col-value">
              {complaint.placeOfComplaint || 'Not specified'}
            </td>
          </tr>

          <tr>
            <td className="col-no">5.</td>
            <td className="col-label">Field Visit Date</td>
            <td className="col-value">{formatDate(complaint.fieldVisitDate)}</td>
          </tr>

          <tr>
            <td className="col-no">6.</td>
            <td className="col-label">Any Court cases pending</td>
            <td className="col-value">To be verified</td>
          </tr>

          <tr>
            <td className="col-no">7.</td>
            <td className="col-label">Preliminary Enquiry Findings of the IO</td>
            <td className="col-value">
              {complaint.peReport || 'Preliminary enquiry pending'}
              <br />
              <br />
              <div className="signature-block">
                Signature<br />
                EO, APC SEZ, HYDRAA
              </div>
              <div className="signature-block right">
                Signature<br />
                I/C, APC, HYD, HYDRAA
              </div>
            </td>
          </tr>

          <tr>
            <td className="col-no">8.</td>
            <td className="col-label">Orders of the Additional Commissioner</td>
            <td className="col-value">
              <div className="signature-block right">
                Signature<br />
                Additional Commissioner
              </div>
            </td>
          </tr>

          <tr>
            <td className="col-no">9.</td>
            <td className="col-label">Orders of the Commissioner</td>
            <td className="col-value">
              <div className="signature-block right">
                Signature<br />
                HYDRAA, Commissioner
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default EnquiryReport;