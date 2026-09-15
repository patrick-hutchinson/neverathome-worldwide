import { isAdminRequest } from "@/lib/submissions/adminAuth";
import { ensureSubmissionSchema, getSubmissionDatabase } from "@/lib/submissions/database";

export default async function handler(request, response) {
  if (!isAdminRequest(request)) {
    return response.status(401).json({ error: "Unauthorized." });
  }

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const sql = getSubmissionDatabase();
    await ensureSubmissionSchema(sql);

    const submissions = await sql`
      SELECT
        id,
        created_at,
        first_name,
        last_name,
        email,
        preferred_destination_ids,
        alternative_destination_ids,
        preferred_months,
        files,
        downloaded_at,
        download_count,
        status
      FROM application_submissions
      ORDER BY created_at DESC
    `;

    return response.status(200).json({ submissions });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Could not load submissions." });
  }
}
