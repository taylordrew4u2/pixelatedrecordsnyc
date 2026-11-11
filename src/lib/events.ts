import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { Event, SiteContent } from "./types";

export function dateKey(date: Date | string, zone = "America/New_York") {
  return formatInTimeZone(date, zone, "yyyy-MM-dd");
}
export function shiftDay(key: string, days: number) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function localBoundary(key: string, time: string, zone: string) {
  const intended = `${key}T${time}`;
  let date = fromZonedTime(intended, zone);
  // Spring-forward gaps advance to the first real local minute, never an earlier hour.
  for (
    let i = 0;
    i < 180 && formatInTimeZone(date, zone, "yyyy-MM-dd'T'HH:mm:ss") < intended;
    i++
  )
    date = new Date(date.getTime() + 60_000);
  return date;
}
export function nightWindow(now: Date, zone: string, cutoff: number) {
  const today = dateKey(now, zone);
  const hour = Number(formatInTimeZone(now, zone, "H"));
  const key = hour < cutoff ? shiftDay(today, -1) : today;
  const time = `${String(cutoff).padStart(2, "0")}:00:00`;
  return {
    key,
    start: localBoundary(key, time, zone),
    end: localBoundary(shiftDay(key, 1), time, zone),
  };
}
export function eventEnd(event: Event) {
  const end = Date.parse(event.end);
  return Number.isFinite(end)
    ? end
    : Date.parse(event.start) + 4 * 60 * 60 * 1000;
}
export function publicEvents(content: SiteContent) {
  return content.events
    .filter(
      (event) => event.published && Number.isFinite(Date.parse(event.start)),
    )
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}
export function tonightEvents(content: SiteContent, now: Date) {
  const window = nightWindow(
    now,
    content.eventSettings.timeZone,
    content.eventSettings.nightCutoff,
  );
  return publicEvents(content).filter(
    (event) =>
      Date.parse(event.start) < window.end.getTime() &&
      eventEnd(event) > Math.max(window.start.getTime(), now.getTime()),
  );
}
export function upcomingEvents(content: SiteContent, now: Date) {
  const tonight = new Set(tonightEvents(content, now).map((event) => event.id));
  return publicEvents(content).filter(
    (event) => eventEnd(event) > now.getTime() && !tonight.has(event.id),
  );
}
export function eventTime(value: string, zone: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  return formatInTimeZone(value, zone, "h:mm a").replace(":00", "");
}
export function eventDate(value: string, zone: string, format = "EEE, MMM d") {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  return formatInTimeZone(value, zone, format);
}
export function calendarCells(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from(
    { length: first.getUTCDay() },
    () => null,
  );
  for (let day = 1; day <= days; day++)
    cells.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  while (cells.length % 7) cells.push(null);
  return cells;
}
