import JSZip from "jszip";
import { get } from "@vercel/blob";

import { isAdminRequest } from "@/lib/submissions/adminAuth";
import { ensureSubmissionSchema, getSubmissionDatabase } from "@/lib/submissions/database";
import { getSubmissionDisplayName, getSubmissionFolderName, slugifySubmissionPart } from "@/lib/submissions/format";
import { getDestinations } from "@/lib/sanity";

export const config = {
  api: {
    responseLimit: false,
  },
};

function getSafeFileName(file = {}, fallback = "file") {
  return (file.fileName || fallback).replace(/[/:\\?%*"<>|]/g, "-");
}

async function streamToBuffer(stream) {
  const reader = stream.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
}

function formatViennaDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Vienna",
  }).format(new Date(value));
}

function formatViennaDateStamp(value) {
  if (!value) return "unknown-date";

  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Vienna",
    year: "numeric",
  }).formatToParts(new Date(value));
  const getPart = (type) => parts.find((part) => part.type === type)?.value;

  return [getPart("year"), getPart("month"), getPart("day")].filter(Boolean).join("-");
}

function getSingleSubmissionArchiveName(submission = {}) {
  const date = formatViennaDateStamp(submission.created_at);
  const lastName = submission.last_name ? slugifySubmissionPart(submission.last_name) : "last-name";
  const firstName = submission.first_name ? slugifySubmissionPart(submission.first_name) : "first-name";

  return `${date}-${lastName}-${firstName}.zip`;
}

function getDestinationNames(destinationIds = [], destinationNameMap = new Map()) {
  return destinationIds.map((destinationId) => destinationNameMap.get(destinationId) || destinationId).join(", ");
}

function createSubmissionText(submission, destinationNameMap) {
  const files = submission.files || {};

  return [
    `Submission ID: ${submission.id}`,
    `Submitted: ${formatViennaDate(submission.created_at)}`,
    `Name: ${getSubmissionDisplayName(submission)}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone_number}`,
    `Address: ${submission.street_address}, ${submission.postal_code} ${submission.city}, ${submission.country}`,
    `Website: ${submission.website || ""}`,
    `Instagram: ${submission.instagram || ""}`,
    "",
    `Preferred Destination: ${getDestinationNames(submission.preferred_destination_ids, destinationNameMap)}`,
    `Alternative Destination: ${getDestinationNames(submission.alternative_destination_ids, destinationNameMap)}`,
    `Preferred Month: ${(submission.preferred_months || []).join(", ")}`,
    "",
    "Project Proposal",
    submission.project_proposal,
    "",
    "Biography",
    submission.biography,
    "",
    "Files",
    ...Object.entries(files).map(([fieldName, file]) => `- ${fieldName}: ${file.fileName || file.pathname || ""}`),
  ].join("\n");
}

function normalizeLimit(value) {
  const parsedLimit = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedLimit)) return 25;

  return Math.min(Math.max(parsedLimit, 1), 100);
}

function normalizeOffset(value) {
  const parsedOffset = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedOffset)) return 0;

  return Math.max(parsedOffset, 0);
}

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

    const mode = request.query.mode === "new" ? "new" : "batch";
    const submissionId = typeof request.query.id === "string" ? request.query.id : null;
    const limit = normalizeLimit(request.query.limit);
    const offset = normalizeOffset(request.query.offset);
    const submissions =
      submissionId
        ? await sql`
            SELECT *
            FROM application_submissions
            WHERE id = ${submissionId}
            LIMIT 1
          `
        : mode === "new"
        ? await sql`
            SELECT *
            FROM application_submissions
            WHERE downloaded_at IS NULL
            ORDER BY created_at ASC
            LIMIT ${limit}
          `
        : await sql`
            SELECT *
            FROM application_submissions
            ORDER BY created_at ASC
            LIMIT ${limit}
            OFFSET ${offset}
          `;

    const zip = new JSZip();
    const exportedIds = [];
    const destinations = await getDestinations();
    const destinationNameMap = new Map(destinations.map((destination) => [destination._id, destination.name]));

    for (const [index, submission] of submissions.entries()) {
      exportedIds.push(submission.id);

      const folder = zip.folder(getSubmissionFolderName(submission, offset + index));
      const files = submission.files || {};

      folder.file("submission.txt", createSubmissionText(submission, destinationNameMap));

      for (const [fieldName, file] of Object.entries(files)) {
        if (!file?.pathname) continue;

        const blob = await get(file.pathname, { access: "private", useCache: false });
        if (!blob?.stream) continue;

        const fileBuffer = await streamToBuffer(blob.stream);
        folder.file(getSafeFileName(file, fieldName), fileBuffer, { binary: true });
      }
    }

    if (submissions.length === 0) {
      zip.file("no-new-submissions.txt", "There are no submissions matching this export.");
    }

    const archive = await zip.generateAsync({
      compression: "STORE",
      type: "nodebuffer",
    });

    if (exportedIds.length > 0) {
      await sql`
        UPDATE application_submissions
        SET
          downloaded_at = COALESCE(downloaded_at, now()),
          download_count = download_count + 1,
          status = CASE WHEN status = 'new' THEN 'downloaded' ELSE status END
        WHERE id = ANY(${exportedIds})
      `;
    }

    const filename =
      submissionId && submissions.length > 0
        ? getSingleSubmissionArchiveName(submissions[0])
        : mode === "new"
        ? "never-at-home-new-submissions.zip"
        : `never-at-home-submissions-${String(offset + 1).padStart(3, "0")}-${String(offset + submissions.length).padStart(
            3,
            "0",
          )}.zip`;

    response.setHeader("Content-Type", "application/zip");
    response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    response.setHeader("Content-Length", archive.length);

    return response.status(200).send(archive);
  } catch (error) {
    return response.status(500).json({ error: error.message || "Could not export submissions." });
  }
}
