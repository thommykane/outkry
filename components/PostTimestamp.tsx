"use client";

/**
 * Renders a post date/time in the user's local timezone (browser locale).
 * Use for category rows and post page so times are always in the viewer's timezone.
 */
export default function PostTimestamp({
  date,
  style,
}: {
  date: string | Date;
  style?: React.CSSProperties;
}) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;

  const dateStr = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <time dateTime={d.toISOString()} style={{ fontSize: "0.75rem", color: "var(--gold-dim)", ...style }}>
      {dateStr} at {timeStr}
    </time>
  );
}
