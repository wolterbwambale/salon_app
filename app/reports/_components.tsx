import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  money,
  number,
  percent,
  share,
  type ReportRange,
} from "./_lib";

export function ReportHeader({
  title,
  description,
  range,
  children,
}: {
  title: string;
  description: string;
  range?: ReportRange;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 bg-white px-7 py-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Reports
          </p>

          <h1 className="mt-1 text-xl font-bold text-slate-950">
            {title}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        {range && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            <CalendarDays size={15} />
            {range.label}
          </div>
        )}
      </div>

      {children}
    </header>
  );
}

export function DateRangeForm({
  range,
  resetHref,
}: {
  range: ReportRange;
  resetHref: string;
}) {
  return (
    <form className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-end">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          <span className="mb-1.5 block">From</span>
          <input
            type="date"
            name="from"
            defaultValue={range.fromInput}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-900"
          />
        </label>

        <label className="text-xs font-semibold text-slate-600">
          <span className="mb-1.5 block">To</span>
          <input
            type="date"
            name="to"
            defaultValue={range.toInput}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-900"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
          <Search size={16} />
          Apply
        </button>

        <Link
          href={resetHref}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          <RotateCcw size={16} />
          Reset
        </Link>
      </div>
    </form>
  );
}

export function MetricCard({
  title,
  value,
  note,
  icon,
  tone = "slate",
}: {
  title: string;
  value: string;
  note: string;
  icon: ReactNode;
  tone?: "slate" | "green" | "red" | "amber";
}) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-black text-slate-950">
            {value}
          </p>
        </div>

        <div className={`rounded-lg p-2.5 ${toneClass}`}>{icon}</div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">{note}</p>
    </div>
  );
}

export function ReportSection({
  title,
  description,
  action,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-bold text-slate-950">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

export function EmptyTableRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-12 text-center text-sm text-slate-400"
      >
        {message}
      </td>
    </tr>
  );
}

export function StatusPill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "red" | "amber";
}) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function BarList({
  rows,
  total,
  valueKind = "money",
}: {
  rows: {
    label: string;
    value: number;
    detail?: string;
  }[];
  total: number;
  valueKind?: "money" | "number" | "percent";
}) {
  const formatValue =
    valueKind === "money"
      ? money
      : valueKind === "percent"
        ? percent
        : number;

  return (
    <div className="space-y-4 p-5">
      {rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          No records found for this period.
        </div>
      ) : (
        rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {row.label}
                </p>

                {row.detail && (
                  <p className="text-xs text-slate-500">{row.detail}</p>
                )}
              </div>

              <span className="text-sm font-black text-slate-950">
                {formatValue(row.value)}
              </span>
            </div>

            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900"
                style={{
                  width: `${share(row.value, total)}%`,
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function ReportLinkCard({
  href,
  title,
  description,
  value,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700 transition group-hover:bg-slate-950 group-hover:text-white">
          {icon}
        </div>

        <ArrowRight
          size={17}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
        />
      </div>

      <h2 className="mt-4 font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
      <p className="mt-4 text-lg font-black text-slate-950">{value}</p>
    </Link>
  );
}
