export function getDateValue(date) {
  if (!date) return null;
  if (typeof date === "object") return date.value || null;

  return date;
}

function getDatePrecision(date) {
  if (!date || typeof date !== "object") return "day";

  return date.precision || "day";
}

function parseDate(date) {
  const value = getDateValue(date);
  if (!value) return null;

  const [year, month, day] = String(value).split("-").map(Number);
  const parsedDate =
    Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
      ? new Date(year, month - 1, day)
      : new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getDateParts(date) {
  return {
    day: date.getDate(),
    month: date.toLocaleDateString("en-US", { month: "long" }),
    year: date.getFullYear(),
  };
}

function formatDate(date, precision = "day", includeYear = true) {
  if (!date) return null;

  const parts = getDateParts(date);

  if (precision === "year") return String(parts.year);
  if (precision === "month") return includeYear ? `${parts.month} ${parts.year}` : parts.month;

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

const FormatDate = ({ date, endDate, className }) => {
  const start = parseDate(date);
  const end = parseDate(endDate);
  const startPrecision = getDatePrecision(date);
  const endPrecision = getDatePrecision(endDate);

  if (!start) return null;

  if (!end) {
    return <time className={className}>{formatDate(start, startPrecision)}</time>;
  }

  const isSameYear = start.getFullYear() === end.getFullYear();
  const startLabel = formatDate(start, startPrecision, !isSameYear);
  const endLabel = formatDate(end, endPrecision);

  return <time className={className}>{`${startLabel} to ${endLabel}`}</time>;
};

export default FormatDate;
