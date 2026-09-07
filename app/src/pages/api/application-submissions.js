import { applicationDeclarations, applicationTextareaFields, applicationUploadFields } from "@/lib/applicationFormConfig";
import { ensureSubmissionSchema, getSubmissionDatabase } from "@/lib/submissions/database";

const requiredTextFields = [
  "firstName",
  "lastName",
  "email",
  "phoneNumber",
  "streetAddress",
  "postalCode",
  "city",
  "country",
  "projectProposal",
  "biography",
];

const uploadFieldMap = new Map(applicationUploadFields.map((field) => [field.name, field]));
const textareaFieldMap = new Map(applicationTextareaFields.map((field) => [field.name, field]));

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value) {
  return Array.isArray(value) ? value.map(normalizeString).filter(Boolean) : [];
}

function validateUploadedFile(field, file) {
  if (!file?.url || !file?.pathname || !file?.contentType || !Number.isFinite(file?.size)) {
    return `${field.label} is missing upload metadata.`;
  }

  if (field.maxBytes && file.size > field.maxBytes) {
    return `${field.label} is too large.`;
  }

  if (field.allowedContentTypes?.length && !field.allowedContentTypes.includes(file.contentType)) {
    return `${field.label} has the wrong file type.`;
  }

  return null;
}

function getValidationErrors(body = {}) {
  const errors = {};

  requiredTextFields.forEach((fieldName) => {
    if (!normalizeString(body[fieldName])) {
      errors[fieldName] = "Required";
    }
  });

  applicationTextareaFields.forEach((field) => {
    const value = normalizeString(body[field.name]);

    if (field.maxLength && value.length > field.maxLength) {
      errors[field.name] = `Max ${field.maxLength} characters`;
    }
  });

  if (normalizeStringArray(body.preferredDestinations).length === 0) {
    errors.preferredDestinations = "Required";
  }

  if (normalizeStringArray(body.months).length === 0) {
    errors.months = "Required";
  }

  const acceptedDeclarations = normalizeStringArray(body.declarations);
  if (!applicationDeclarations.every((declaration) => acceptedDeclarations.includes(declaration))) {
    errors.declarations = "Required";
  }

  applicationUploadFields.forEach((field) => {
    const file = body.files?.[field.name];
    const fileError = validateUploadedFile(field, file);

    if (fileError) {
      errors[field.name] = fileError;
    }
  });

  return errors;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const body = request.body || {};
  const errors = getValidationErrors(body);

  if (Object.keys(errors).length > 0) {
    return response.status(400).json({ error: "Validation failed.", errors });
  }

  try {
    const sql = getSubmissionDatabase();
    await ensureSubmissionSchema(sql);

    const submissionId = normalizeString(body.submissionId) || crypto.randomUUID();
    const files = {};

    applicationUploadFields.forEach((field) => {
      const file = body.files[field.name];
      files[field.name] = {
        contentType: file.contentType,
        downloadUrl: file.downloadUrl || null,
        fileName: file.fileName || null,
        pathname: file.pathname,
        size: file.size,
        url: file.url,
      };
    });

    await sql`
      INSERT INTO application_submissions (
        id,
        first_name,
        last_name,
        email,
        phone_number,
        street_address,
        postal_code,
        city,
        country,
        website,
        instagram,
        preferred_destination_ids,
        alternative_destination_ids,
        preferred_months,
        project_proposal,
        biography,
        declarations,
        files
      )
      VALUES (
        ${submissionId},
        ${normalizeString(body.firstName)},
        ${normalizeString(body.lastName)},
        ${normalizeString(body.email)},
        ${normalizeString(body.phoneNumber)},
        ${normalizeString(body.streetAddress)},
        ${normalizeString(body.postalCode)},
        ${normalizeString(body.city)},
        ${normalizeString(body.country)},
        ${normalizeString(body.website) || null},
        ${normalizeString(body.instagram) || null},
        ${JSON.stringify(normalizeStringArray(body.preferredDestinations))}::jsonb,
        ${JSON.stringify(normalizeStringArray(body.alternativeDestinations))}::jsonb,
        ${JSON.stringify(normalizeStringArray(body.months))}::jsonb,
        ${normalizeString(body.projectProposal)},
        ${normalizeString(body.biography)},
        ${JSON.stringify(normalizeStringArray(body.declarations))}::jsonb,
        ${JSON.stringify(files)}::jsonb
      )
    `;

    return response.status(200).json({ ok: true, submissionId });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Submission failed." });
  }
}
