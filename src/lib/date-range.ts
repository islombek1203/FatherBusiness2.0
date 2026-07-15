// The business operates in a single timezone (Uzbekistan; UTC+5 year-round,
// no DST), so "today" / "this month" for dashboard/report boundaries always
// means Tashkent-local calendar days, regardless of the server's own
// timezone or where a browser client happens to be.
const BUSINESS_TIMEZONE = "Asia/Tashkent";
const BUSINESS_UTC_OFFSET = "+05:00";

function tashkentDateString(date: Date): string {
  // en-CA formats as YYYY-MM-DD, letting Intl (not manual offset math) do
  // the timezone-correct calendar-day resolution.
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).format(date);
}

export function getBusinessDayRange(reference: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(`${tashkentDateString(reference)}T00:00:00${BUSINESS_UTC_OFFSET}`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function getBusinessMonthRange(reference: Date = new Date()): { start: Date; end: Date } {
  const [year, month] = tashkentDateString(reference).split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(`${year}-${pad(month)}-01T00:00:00${BUSINESS_UTC_OFFSET}`);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = new Date(`${nextYear}-${pad(nextMonth)}-01T00:00:00${BUSINESS_UTC_OFFSET}`);
  return { start, end };
}
