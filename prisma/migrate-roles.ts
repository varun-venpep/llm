/**
 * Pre-migration script: Renames legacy enum values in the database
 * so that `prisma db push` doesn't fail on dropped variants.
 *
 * Run BEFORE: npx prisma db push
 */

import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const pool = new Pool({ connectionString });

async function main() {
    const client = await pool.connect();
    try {
        console.log('🔄 Running role enum pre-migration...');

        // Rename STUDENT -> LEARNER if the old value still exists in the DB.
        // This is safe to run multiple times (idempotent).
        await client.query(`
      DO $$
      BEGIN
        -- Only attempt to rename if the old 'STUDENT' value exists
        IF EXISTS (
          SELECT 1 FROM pg_enum
          JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
          WHERE pg_type.typname = 'Role' AND pg_enum.enumlabel = 'STUDENT'
        ) THEN
          ALTER TYPE "Role" RENAME VALUE 'STUDENT' TO 'LEARNER';
          RAISE NOTICE 'Renamed STUDENT -> LEARNER';
        ELSE
          RAISE NOTICE 'STUDENT variant not found, skipping rename';
        END IF;
      END
      $$;
    `);

        console.log('✅ Role enum pre-migration complete.');
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch((e) => {
    console.error('❌ Pre-migration failed:', e);
    process.exit(1);
});
