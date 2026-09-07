export function getSubmissionDisplayName(submission = {}) {
  return [submission.first_name, submission.last_name].filter(Boolean).join(" ").trim() || submission.id;
}

export function slugifySubmissionPart(value = "") {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "submission"
  );
}

export function getSubmissionFolderName(submission = {}, index = 0) {
  const prefix = String(index + 1).padStart(3, "0");
  const name = slugifySubmissionPart(getSubmissionDisplayName(submission));

  return `${prefix}-${name}`;
}

export function formatFileSize(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
