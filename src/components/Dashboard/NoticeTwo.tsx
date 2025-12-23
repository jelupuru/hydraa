import NoticeLayout from "./NoticeLayout";

interface NoticeTwoProps {
  complaint: {
    id: number;
    briefDetailsOfTheComplaint: string | null;
    placeOfComplaint: string | null;
    nameOfTheComplainant: string | null;
    detailsOfRespondent: string | null;
    createdAt: Date;
    fieldVisitDate: Date | null;
    firstNoticeDate: Date | null;
    firstNoticeNumber: string | null;
  };
}

const NoticeTwo = ({ complaint }: NoticeTwoProps) => {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "__.__.2025";
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  };

  const getNoticeNo = () => {
    return `${complaint.id}/Comm/HYDRAA/2025`;
  };

  const getSubject = () => {
    const location = complaint.placeOfComplaint || "specified location";
    const details = complaint.briefDetailsOfTheComplaint || "reported encroachment";
    
    return `HYDRAA – COMM – Issue of Notice - ${details} at ${location} - Call for documents - Regd.`;
  };

  const getReferences = () => {
    const refs = [
      `Complaint received at O/o Commissioner of HYDRAA, Dated: ${formatDate(complaint.createdAt)}.`,
    ];
    
    if (complaint.firstNoticeNumber && complaint.firstNoticeDate) {
      refs.push(`Notice No.${complaint.firstNoticeNumber}, Date: ${formatDate(complaint.firstNoticeDate)}.`);
    }
    
    refs.push("Field inspection and follow-up actions.");
    
    return refs;
  };

  return (
    <NoticeLayout
      title="NOTICE-2"
      noticeNo={getNoticeNo()}
      date={formatDate(new Date())}
      subject={getSubject()}
      references={getReferences()}
      days="(7)"
      body={
        <>
          <p>
            Vide reference to the above-cited matter, this Office has received a
            complaint regarding {complaint.briefDetailsOfTheComplaint || "encroachment/violation"} 
            {complaint.placeOfComplaint && ` at ${complaint.placeOfComplaint}`}.
          </p>

          <p>
            However, reply has not been received till now. In view of this, you
            are issued a <strong>2nd Notice</strong>, following due process of law,
            to furnish the following documents:
          </p>

          <ul className="list-disc list-inside ml-4 mb-4">
            <li>Copy of approved Layout plan and GPA proceedings.</li>
            <li>Details of Court cases (if any).</li>
            <li>Permission obtained for construction/development activities.</li>
            <li>NOC from concerned authorities (if applicable).</li>
            <li>Any other relevant documents supporting your case.</li>
          </ul>

          <p>
            <strong>This is the final notice.</strong> Failure to comply within the stipulated 
            time shall result in initiation of appropriate action as per law without any 
            further notice.
          </p>
        </>
      }
    />
  );
};

export default NoticeTwo;