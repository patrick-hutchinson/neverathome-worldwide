export function getCountdownParts(deadline, now) {
  if (!deadline || !now) return null;

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return null;
  if (deadlineDate <= now) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  let remainingSeconds = Math.floor((deadlineDate - now) / 1000);

  const days = Math.floor(remainingSeconds / (24 * 60 * 60));
  remainingSeconds -= days * 24 * 60 * 60;

  const hours = Math.floor(remainingSeconds / (60 * 60));
  remainingSeconds -= hours * 60 * 60;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds - minutes * 60;

  return { days, hours, minutes, seconds };
}

export function formatCountdown(deadline, now, { compact = false } = {}) {
  const parts = getCountdownParts(deadline, now);
  if (!parts) return null;

  if (compact) {
    return `${parts.days}d${parts.hours}h${parts.minutes}m${parts.seconds}s`;
  }

  return `${parts.days}d ${parts.hours}h ${parts.minutes}m ${parts.seconds}s`;
}
