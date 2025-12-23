import React from 'react';

interface NoticeLayoutProps {
  title: string;
  noticeNo: string;
  date: string;
  subject: string;
  references: string[];
  days: string;
  body: React.ReactNode;
}

const NoticeLayout = ({
  title,
  noticeNo,
  date,
  subject,
  references,
  days,
  body
}: NoticeLayoutProps) => {
  return (
    <div className="notice-container max-w-4xl mx-auto p-6 bg-white text-black font-serif">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold mb-2">
          HYDERABAD DISASTER RESPONSE & ASSET PROTECTION AGENCY
        </h1>
        <h2 className="text-lg font-bold underline">
          {title}
        </h2>
      </div>

      {/* Notice Details */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <strong>No:</strong> {noticeNo}
          </div>
          <div>
            <strong>Date:</strong> {date}
          </div>
        </div>
      </div>

      {/* Subject */}
      <div className="mb-4">
        <div className="flex">
          <strong className="mr-2">Sub:</strong>
          <span>{subject}</span>
        </div>
      </div>

      {/* References */}
      <div className="mb-4">
        <strong>Ref:</strong>
        <ol className="list-decimal list-inside ml-4 mt-1">
          {references.map((ref, index) => (
            <li key={index} className="mb-1">{ref}</li>
          ))}
        </ol>
      </div>

      {/* Address */}
      <div className="mb-4">
        <strong>To</strong><br />
        <span>The Respondent(s)</span>
      </div>

      <div className="mb-4">
        <strong>Sir/Madam,</strong>
      </div>

      {/* Body Content */}
      <div className="mb-6 leading-relaxed">
        {body}
      </div>

      {/* Footer */}
      <div className="mb-4">
        <p>
          You are therefore called upon to submit the above said documents 
          within {days} days from the date of service of this notice, 
          failing which it shall be construed that you have no documents 
          to produce and action will be initiated as deemed fit.
        </p>
      </div>

      {/* Signature Block */}
      <div className="text-right mt-8">
        <div className="mb-16">
          <div className="border-b border-black w-48 ml-auto mb-2"></div>
          <div>
            <strong>Executive Officer</strong><br />
            <strong>HYDRAA</strong>
          </div>
        </div>
      </div>

      {/* Copy Section */}
      <div className="mt-8">
        <strong>Copy to:</strong>
        <ol className="list-decimal list-inside ml-4 mt-1">
          <li>Commissioner, HYDRAA - for information.</li>
          <li>Additional Commissioner, HYDRAA - for information.</li>
          <li>File.</li>
        </ol>
      </div>

      <style jsx>{`
        .notice-container {
          line-height: 1.6;
        }
        @media print {
          .notice-container {
            padding: 0;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default NoticeLayout;