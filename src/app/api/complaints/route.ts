import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import { ComplaintStatus, Role, ComplaintPriority } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let complaints;

    if (role === 'FIELD_OFFICER') {
      complaints = await prisma.complaint.findMany({
        where: { createdById: user.id },
        include: {
          createdBy: true,
          updatedBy: true,
          assignedTo: true,
          commissionerate: true,
          dcpZone: true,
          municipalZone: true,
          acpDivision: true,
          attachments: true,
          firs: {
            include: {
              createdBy: true,
              updatedBy: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          comments: {
            where: { isInternal: false }, // Field officers can only see public comments
            include: {
              createdBy: true,
              updatedBy: true,
              replies: {
                include: {
                  createdBy: true,
                  updatedBy: true,
                  replies: {
                    include: {
                      createdBy: true,
                      updatedBy: true,
                      replies: {
                        include: {
                          createdBy: true,
                          updatedBy: true,
                        },
                        orderBy: { createdAt: 'asc' },
                      },
                    },
                    orderBy: { createdAt: 'asc' },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (['DCP', 'ACP', 'COMMISSIONER'].includes(role || '')) {
      // For DCP, ACP, and COMMISSIONER, show all complaints
      complaints = await prisma.complaint.findMany({
        include: {
          createdBy: true,
          updatedBy: true,
          assignedTo: true,
          commissionerate: true,
          dcpZone: true,
          municipalZone: true,
          acpDivision: true,
          attachments: true,
          firs: {
            include: {
              createdBy: true,
              updatedBy: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          comments: {
            include: {
              createdBy: true,
              updatedBy: true,
              replies: {
                include: {
                  createdBy: true,
                  updatedBy: true,
                  replies: {
                    include: {
                      createdBy: true,
                      updatedBy: true,
                      replies: {
                        include: {
                          createdBy: true,
                          updatedBy: true,
                        },
                        orderBy: { createdAt: 'asc' },
                      },
                    },
                    orderBy: { createdAt: 'asc' },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // For other roles or fallback, show complaints assigned to them or pending for their review
      const statusFilter = getStatusFilterForRole(user.role);
      complaints = await prisma.complaint.findMany({
        where: {
          OR: [
            { assignedToId: user.id },
            { finalStatus: { in: statusFilter } },
          ],
        },
        include: {
          createdBy: true,
          updatedBy: true,
          assignedTo: true,
          commissionerate: true,
          dcpZone: true,
          municipalZone: true,
          acpDivision: true,
          attachments: true,
          firs: {
            include: {
              createdBy: true,
              updatedBy: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          comments: {
            include: {
              createdBy: true,
              updatedBy: true,
              replies: {
                include: {
                  createdBy: true,
                  updatedBy: true,
                  replies: {
                    include: {
                      createdBy: true,
                      updatedBy: true,
                      replies: {
                        include: {
                          createdBy: true,
                          updatedBy: true,
                        },
                        orderBy: { createdAt: 'asc' },
                      },
                    },
                    orderBy: { createdAt: 'asc' },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Helper to ensure uploads directory exists
    const ensureUploadsDir = async () => {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'complaints');
      await fs.mkdir(uploadsDir, { recursive: true });
      return uploadsDir;
    };

    // JSON body (no attachments)
    if (contentType.includes('application/json')) {
      const complaintData = await request.json();

    // Validate required fields
      const {
      natureOfComplaint,
      placeOfComplaint,
      nameOfTheComplainant,
      phoneOfTheComplainant,
      briefDetailsOfTheComplaint,
      commissionerateId,
      dcpZoneId,
      municipalZoneId,
      acpDivisionId
      } = complaintData;

      if (!natureOfComplaint || !placeOfComplaint || !nameOfTheComplainant || !briefDetailsOfTheComplaint || !commissionerateId) {
      return NextResponse.json({ error: 'Required fields are missing. Please select a commissionerate.' }, { status: 400 });
      }

    // Validate that the commissionerate exists
      const commissionerate = await prisma.commissionerate.findUnique({
      where: { id: parseInt(commissionerateId) },
    });
      if (!commissionerate) {
      return NextResponse.json({ error: 'Invalid commissionerate selected.' }, { status: 400 });
      }

    // Validate DCP Zone if provided
      if (dcpZoneId) {
      const dcpZone = await prisma.dCPZone.findUnique({
        where: { id: parseInt(dcpZoneId) },
      });
      if (!dcpZone) {
        return NextResponse.json({ error: 'Invalid DCP Zone selected.' }, { status: 400 });
      }
    }

    // Validate Municipal Zone if provided
      if (municipalZoneId) {
      const municipalZone = await prisma.municipalZone.findUnique({
        where: { id: parseInt(municipalZoneId) },
      });
      if (!municipalZone) {
        return NextResponse.json({ error: 'Invalid Municipal Zone selected.' }, { status: 400 });
      }
    }

    // Validate ACP Division if provided
      if (acpDivisionId) {
      const acpDivision = await prisma.aCPDivision.findUnique({
        where: { id: parseInt(acpDivisionId) },
      });
      if (!acpDivision) {
        return NextResponse.json({ error: 'Invalid ACP Division selected.' }, { status: 400 });
      }
    }

    // Generate complaint ID
      const complaintId = `CMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const complaintUniqueId = `UNIQUE-${complaintId}`;

      const complaint = await prisma.complaint.create({
      data: {
        complaintId,
        complaintUniqueId,
        dateOfApplicationReceived: new Date(),
        natureOfComplaint,
        placeOfComplaint,
        addressOfComplaintPlace: complaintData.addressOfComplaintPlace,
        nameOfTheComplainant,
        phoneOfTheComplainant,
        addressOfTheComplainant: complaintData.addressOfTheComplainant,
        briefDetailsOfTheComplaint,
        detailsOfRespondent: complaintData.detailsOfRespondent,
        complaintPriority: complaintData.complaintPriority || 'NORMAL',
        sourceOfComplaint: complaintData.sourceOfComplaint,
        modeOfComplaint: complaintData.modeOfComplaint,
        commissionerateId: commissionerateId ? parseInt(commissionerateId) : null,
        dcpZoneId: dcpZoneId ? parseInt(dcpZoneId) : null,
        municipalZoneId: municipalZoneId ? parseInt(municipalZoneId) : null,
        acpDivisionId: acpDivisionId ? parseInt(acpDivisionId) : null,
        createdById: user.id,
        finalStatus: 'PENDING',
      },
      include: {
        createdBy: true,
        commissionerate: true,
        dcpZone: true,
        municipalZone: true,
        acpDivision: true
      }
      });

      return NextResponse.json(complaint, { status: 201 });
    }

    // Multipart form-data with possible attachments
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      const natureOfComplaint = formData.get('natureOfComplaint') as string | null;
      const placeOfComplaint = formData.get('placeOfComplaint') as string | null;
      const nameOfTheComplainant = formData.get('nameOfTheComplainant') as string | null;
      const phoneOfTheComplainant = formData.get('phoneOfTheComplainant') as string | null;
      const briefDetailsOfTheComplaint = formData.get('briefDetailsOfTheComplaint') as string | null;
      const commissionerateId = formData.get('commissionerateId') as string | null;
      const dcpZoneId = formData.get('dcpZoneId') as string | null;
      const municipalZoneId = formData.get('municipalZoneId') as string | null;
      const acpDivisionId = formData.get('acpDivisionId') as string | null;

      if (!natureOfComplaint || !placeOfComplaint || !nameOfTheComplainant || !briefDetailsOfTheComplaint || !commissionerateId) {
        return NextResponse.json({ error: 'Required fields are missing. Please select a commissionerate.' }, { status: 400 });
      }

      const commissionerate = await prisma.commissionerate.findUnique({
        where: { id: parseInt(commissionerateId) },
      });
      if (!commissionerate) {
        return NextResponse.json({ error: 'Invalid commissionerate selected.' }, { status: 400 });
      }

      if (dcpZoneId) {
        const dcpZone = await prisma.dCPZone.findUnique({
          where: { id: parseInt(dcpZoneId) },
        });
        if (!dcpZone) {
          return NextResponse.json({ error: 'Invalid DCP Zone selected.' }, { status: 400 });
        }
      }

      if (municipalZoneId) {
        const municipalZone = await prisma.municipalZone.findUnique({
          where: { id: parseInt(municipalZoneId) },
        });
        if (!municipalZone) {
          return NextResponse.json({ error: 'Invalid Municipal Zone selected.' }, { status: 400 });
        }
      }

      if (acpDivisionId) {
        const acpDivision = await prisma.aCPDivision.findUnique({
          where: { id: parseInt(acpDivisionId) },
        });
        if (!acpDivision) {
          return NextResponse.json({ error: 'Invalid ACP Division selected.' }, { status: 400 });
        }
      }

      const complaintIdString = `CMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const complaintUniqueId = `UNIQUE-${complaintIdString}`;

      const baseComplaint = await prisma.complaint.create({
        data: {
          complaintId: complaintIdString,
          complaintUniqueId,
          dateOfApplicationReceived: new Date(),
          natureOfComplaint,
          placeOfComplaint,
          addressOfComplaintPlace: (formData.get('addressOfComplaintPlace') as string) || null,
          nameOfTheComplainant,
          phoneOfTheComplainant,
          addressOfTheComplainant: (formData.get('addressOfTheComplainant') as string) || null,
          briefDetailsOfTheComplaint,
          detailsOfRespondent: (formData.get('detailsOfRespondent') as string) || null,
          complaintPriority: (formData.get('complaintPriority') as ComplaintPriority) || 'NORMAL',
          sourceOfComplaint: (formData.get('sourceOfComplaint') as string) || null,
          modeOfComplaint: (formData.get('modeOfComplaint') as string) || null,
          commissionerateId: commissionerateId ? parseInt(commissionerateId) : null,
          dcpZoneId: dcpZoneId ? parseInt(dcpZoneId) : null,
          municipalZoneId: municipalZoneId ? parseInt(municipalZoneId) : null,
          acpDivisionId: acpDivisionId ? parseInt(acpDivisionId) : null,
          createdById: user.id,
          finalStatus: 'PENDING',
        },
      });

      // Handle attachments (field name: "attachments")
      const attachments = formData.getAll('attachments');
      if (attachments && attachments.length > 0) {
        const uploadsDir = await ensureUploadsDir();
        const attachmentRecords: {
          complaintId: number;
          filename: string;
          url: string;
          mimeType?: string | null;
          size?: number | null;
        }[] = [];

        for (const file of attachments) {
          if (typeof file === 'string') continue;
          const blob = file as unknown as Blob;
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const originalName = (file as any).name || 'attachment';
          const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${originalName}`.replace(/[^a-zA-Z0-9.\-_]/g, '_');
          const filePath = path.join(uploadsDir, safeName);
          await fs.writeFile(filePath, buffer);

          const publicUrl = `/uploads/complaints/${safeName}`;

          attachmentRecords.push({
            complaintId: baseComplaint.id,
            filename: originalName,
            url: publicUrl,
            mimeType: (file as any).type || null,
            size: (file as any).size || null,
          });
        }

        if (attachmentRecords.length > 0) {
          await prisma.complaintAttachment.createMany({
            data: attachmentRecords,
          });
        }
      }

      const complaintWithRelations = await prisma.complaint.findUnique({
        where: { id: baseComplaint.id },
        include: {
          createdBy: true,
          commissionerate: true,
          dcpZone: true,
          municipalZone: true,
          acpDivision: true,
          attachments: true,
        },
      });

      return NextResponse.json(complaintWithRelations, { status: 201 });
    }

    // Unsupported content-type
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getStatusFilterForRole(role: Role): ComplaintStatus[] {
  switch (role) {
    case 'DCP':
      return ['PENDING'];
    case 'ACP':
      return ['UNDER_REVIEW_DCP'];
    case 'COMMISSIONER':
      return ['UNDER_REVIEW_ACP'];
    default:
      return [];
  }
}