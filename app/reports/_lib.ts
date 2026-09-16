export type ReportSearchParams = Promise<{
  from?: string | string[];
  to?: string | string[];
}>;

export interface ReportRange {
  start: Date;
  end: Date;
  fromInput: string;
  toInput: string;
  label: string;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toInputDate(date: Date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function parseStart(value: string | undefined) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEnd(value: string | undefined) {
  if (!value) return null;

  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getReportRange(
  searchParams?: ReportSearchParams
): Promise<ReportRange> {
  const params = searchParams ? await searchParams : {};
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  defaultStart.setHours(0, 0, 0, 0);

  const defaultEnd = new Date(now);
  defaultEnd.setHours(23, 59, 59, 999);

  const start = parseStart(firstValue(params.from)) ?? defaultStart;
  const end = parseEnd(firstValue(params.to)) ?? defaultEnd;

  const safeEnd = end < start ? defaultEnd : end;

  return {
    start,
    end: safeEnd,
    fromInput: toInputDate(start),
    toInput: toInputDate(safeEnd),
    label: `${formatDate(start)} - ${formatDate(safeEnd)}`,
  };
}

export function money(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function number(value: number) {
  return new Intl.NumberFormat("en-UG").format(value || 0);
}

export function percent(value: number) {
  return `${new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 1,
  }).format(value || 0)}%`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function enumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function share(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}
