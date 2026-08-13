function parseDate(date) {
  if (!date) return null;

  const [year, month, day] = String(date).split("-").map(Number);
  const parsedDate =
    Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
      ? new Date(year, month - 1, day)
      : new Date(date);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatDate(date, includeYear = true) {
  if (!date) return null;

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

const FormatDate = ({ date, endDate, className }) => {
  const start = parseDate(date);
  const end = parseDate(endDate);

  if (!start) return null;

  if (!end) {
    return <time className={className}>{formatDate(start)}</time>;
  }

  const isSameYear = start.getFullYear() === end.getFullYear();
  const startLabel = formatDate(start, !isSameYear);
  const endLabel = formatDate(end);

  return <time className={className}>{`${startLabel} to ${endLabel}`}</time>;
};

export default FormatDate;
