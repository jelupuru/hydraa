import { Document, Packer, Paragraph, TextRun } from 'docx';
import type { ComplaintWithRelations } from '@/components/Dashboard/ComplaintsManagement';

const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>/g, '');
};

export const generateNotice = async (complaint: ComplaintWithRelations) => {
  console.log('Generating notice for complaint:', complaint);
  console.log('Notice content:', complaint.noticeContent);
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'HYDERABAD DISASTER RESPONSE & ASSET PROTECTION AGENCY', bold: true, size: 28 }),
            ],
            alignment: 'center',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'ENQUIRY REPORT', bold: true, size: 24 }),
            ],
            alignment: 'center',
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Petition No: ${complaint.id}` }),
              new TextRun({ text: `Date: ${new Date().toLocaleDateString()}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Name & Address of the Petitioner: ${complaint.nameOfTheComplainant || 'N/A'}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Name & Address of the Respondent: ${complaint.detailsOfRespondent || 'N/A'}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Brief facts of the complaint: ${complaint.briefDetailsOfTheComplaint || 'N/A'}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Location of encroachment: ${complaint.placeOfComplaint || 'N/A'}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Field Visit Date: ${complaint.fieldVisitDate || 'N/A'}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Any Court cases pending: ${complaint.anyLegalIssues || 'N/A'}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Preliminary Enquiry Findings of the IO: ${complaint.investigationOfficerReviewComments || 'N/A'}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Notice Content: ${stripHtml(complaint.noticeContent || '')}` }),
            ],
          }),
        ],
      },
    ],
  });

  try {
    const blob = await Packer.toBlob(doc);
    return blob;
  } catch (packerError) {
    console.error('Error in Packer.toBlob:', packerError);
    throw packerError;
  }
};