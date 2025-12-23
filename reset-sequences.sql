SELECT setval('"Commissionerate_id_seq"', (SELECT COALESCE(MAX(id), 0) + 1 FROM "Commissionerate"));
SELECT setval('"DCPZone_id_seq"', (SELECT COALESCE(MAX(id), 0) + 1 FROM "DCPZone"));
SELECT setval('"MunicipalZone_id_seq"', (SELECT COALESCE(MAX(id), 0) + 1 FROM "MunicipalZone"));
SELECT setval('"ACPDivision_id_seq"', (SELECT COALESCE(MAX(id), 0) + 1 FROM "ACPDivision"));