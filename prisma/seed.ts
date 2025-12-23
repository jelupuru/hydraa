import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedJurisdictionData() {
  try {
    // Create Commissionerates
    const mumbaiComm = await prisma.commissionerate.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Mumbai Police Commissionerate',
        code: 'MUMBAI_COMM'
      }
    });

    const puneComm = await prisma.commissionerate.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Pune Police Commissionerate',
        code: 'PUNE_COMM'
      }
    });

    // Create DCP Zones
    await prisma.dCPZone.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Zone I',
        code: 'ZONE_I',
        commissionerateId: 1
      }
    });

    await prisma.dCPZone.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Zone II',
        code: 'ZONE_II',
        commissionerateId: 1
      }
    });

    await prisma.dCPZone.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'Pune Zone',
        code: 'PUNE_ZONE',
        commissionerateId: 2
      }
    });

    // Create Municipal Zones
    await prisma.municipalZone.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Andheri',
        code: 'ANDHERI',
        dcpZoneId: 1
      }
    });

    await prisma.municipalZone.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Bandra',
        code: 'BANDRA',
        dcpZoneId: 1
      }
    });

    await prisma.municipalZone.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'Koregaon Park',
        code: 'KOREGAON_PARK',
        dcpZoneId: 3
      }
    });

    // Create ACP Divisions
    await prisma.aCPDivision.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Andheri East',
        code: 'ANDHERI_EAST',
        municipalZoneId: 1
      }
    });

    await prisma.aCPDivision.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Andheri West',
        code: 'ANDHERI_WEST',
        municipalZoneId: 1
      }
    });

    await prisma.aCPDivision.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'Bandra East',
        code: 'BANDRA_EAST',
        municipalZoneId: 2
      }
    });

    console.log('Jurisdiction data seeded successfully!');

    // Reset sequences to avoid autoincrement conflicts
    await prisma.$executeRaw`SELECT setval('"Commissionerate_id_seq"', (SELECT MAX(id) FROM "Commissionerate"))`;
    await prisma.$executeRaw`SELECT setval('"DCPZone_id_seq"', (SELECT MAX(id) FROM "DCPZone"))`;
    await prisma.$executeRaw`SELECT setval('"MunicipalZone_id_seq"', (SELECT MAX(id) FROM "MunicipalZone"))`;
    await prisma.$executeRaw`SELECT setval('"ACPDivision_id_seq"', (SELECT MAX(id) FROM "ACPDivision"))`;

  } catch (error) {
    console.error('Error seeding jurisdiction data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedJurisdictionData();