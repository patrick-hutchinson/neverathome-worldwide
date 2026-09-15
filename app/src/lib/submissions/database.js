import { neon } from "@neondatabase/serverless";

let hasEnsuredSchema = false;

export function getSubmissionDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  return neon(databaseUrl);
}

export async function ensureSubmissionSchema(sql) {
  if (hasEnsuredSchema) return;

  await sql`
    CREATE TABLE IF NOT EXISTS application_submissions (
      id text PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      first_name text NOT NULL,
      last_name text NOT NULL,
      email text NOT NULL,
      phone_number text NOT NULL,
      street_address text NOT NULL,
      postal_code text NOT NULL,
      city text NOT NULL,
      country text NOT NULL,
      website text,
      instagram text,
      preferred_destination_ids jsonb NOT NULL,
      alternative_destination_ids jsonb NOT NULL,
      preferred_months jsonb NOT NULL,
      project_proposal text NOT NULL,
      biography text NOT NULL,
      declarations jsonb NOT NULL,
      files jsonb NOT NULL,
      downloaded_at timestamptz,
      download_count integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'new'
    )
  `;

  await sql`
    ALTER TABLE application_submissions
    ADD COLUMN IF NOT EXISTS downloaded_at timestamptz
  `;

  await sql`
    ALTER TABLE application_submissions
    ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0
  `;

  hasEnsuredSchema = true;
}
