import 'dotenv/config'
import { defineConfig } from 'prisma/config';

// Provide a safe fallback for build-time when DATABASE_URL is not set.
// This uses a local sqlite file so Prisma client generation and Next.js
// prerendering do not fail during docker image builds.
const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./dev.db';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: DATABASE_URL,
    },
});