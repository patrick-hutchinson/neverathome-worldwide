import { useEffect, useState } from "react";

import { formatCountdown, getCountdownParts } from "@/lib/countdown";

function formatMaxCountdown(deadline, now) {
  const parts = getCountdownParts(deadline, now);
  if (!parts) return null;

  const dayWidth = Math.max(String(parts.days).length, 1);

  return `${"0".repeat(dayWidth)}d23h59m59s`;
}

const removeSeconds = (countdown) => countdown?.replace(/\s*\d+s$/, "");

function useCountdown(deadline) {
  const [now, setNow] = useState(() => (deadline ? new Date() : null));

  useEffect(() => {
    if (!deadline) {
      setNow(null);
      return undefined;
    }

    setNow(new Date());

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [deadline]);

  if (!deadline || !now) {
    return {
      countdown: null,
      maxCountdown: null,
    };
  }

  return {
    countdown: formatCountdown(deadline, now),
    maxCountdown: formatMaxCountdown(deadline, now),
  };
}

export function CountdownText({ className, deadline, hideSeconds = false }) {
  const { countdown } = useCountdown(deadline);
  const displayCountdown = hideSeconds ? removeSeconds(countdown) : countdown;

  return displayCountdown ? <span className={className}>{displayCountdown}</span> : null;
}

export function CountdownSlot({ className, deadline, ghostClassName, slotClassName }) {
  const { countdown, maxCountdown } = useCountdown(deadline);

  return countdown ? (
    <span className={slotClassName}>
      <span className={className}>{countdown}</span>
      <span className={ghostClassName} aria-hidden="true">
        {maxCountdown}
      </span>
    </span>
  ) : null;
}
