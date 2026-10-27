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

export function getSubmissionFolderName(submission = {}) {
  const date = submission.created_at ? new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Vienna",
  }).format(new Date(submission.created_at)) : "unknown-date";
  const lastName = submission.last_name ? slugifySubmissionPart(submission.last_name) : "last-name";
  const firstName = submission.first_name ? slugifySubmissionPart(submission.first_name) : "first-name";

  return `${date}-${lastName}-${firstName}`;
}

export function formatFileSize(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
