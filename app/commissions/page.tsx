"use client";

import {
  CheckCircle2,
  Clock3,
  DollarSign,
  Filter,
  RefreshCw,
  Scissors,
  Search,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type CommissionStatus =
  | "PENDING"
  | "PAID"
  | "CANCELLED";

type CommissionType =
  | "PERCENTAGE"
  | "FIXED";

type Barber = {
  id: number;
  name: string;
  phone?: string | null;
  active: boolean;
};

type Commission = {
  id: number;
  type: CommissionType;
  value: number;
  amount: number;
  status: CommissionStatus;
  paidAt: string | null;

  barber: {
    id: number;
    name: string;
    phone?: string | null;
    active: boolean;
  };

  saleItem: {
    id: number;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;

    service: {
      id: number;
      name: string;
      commissionType: CommissionType;
      commissionValue: number;
    };

    sale: {
      id: number;
      invoiceNumber: string;
      createdAt: string;
      total: number;
      status: string;

      customer: {
        id: number;
        name: string;
        phone?: string | null;
      } | null;

      cashier: {
        id: number;
        name: string;
      };
    };
  };
};

type Summary = {
  total: number;
  pending: number;
  paid: number;
  cancelled: number;
  count: number;
};

function money(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat("en-UG").format(value);
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDefaultFromDate() {
  const date = new Date();
  date.setDate(1);

  return date.toISOString().split("T")[0];
}

function getDefaultToDate() {
  return new Date().toISOString().split("T")[0];
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<
    Commission[]
  >([]);

  const [barbers, setBarbers] = useState<Barber[]>([]);

  const [summary, setSummary] = useState<Summary>({
    total: 0,
    pending: 0,
    paid: 0,
    cancelled: 0,
    count: 0,
  });

  const [from, setFrom] = useState(
    getDefaultFromDate()
  );

  const [to, setTo] = useState(
    getDefaultToDate()
  );

  const [barberId, setBarberId] = useState("");

  const [status, setStatus] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [updatingId, setUpdatingId] = useState<number | null>(
    null
  );

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const loadBarbers = useCallback(async () => {
    try {
      const response = await fetch("/api/barbers");

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setBarbers(
        Array.isArray(data)
          ? data
          : data.barbers || []
      );
    } catch (error) {
      console.error("BARBERS_LOAD_ERROR", error);
    }
  }, []);

  const loadCommissions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (from) {
        params.set("from", from);
      }

      if (to) {
        params.set("to", to);
      }

      if (barberId) {
        params.set("barberId", barberId);
      }

      if (status) {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/commissions?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load commissions."
        );
      }

      setCommissions(data.commissions || []);

      setSummary(
        data.summary || {
          total: 0,
          pending: 0,
          paid: 0,
          cancelled: 0,
          count: 0,
        }
      );
    } catch (error) {
      console.error("COMMISSIONS_LOAD_ERROR", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load commissions."
      );
    } finally {
      setLoading(false);
    }
  }, [from, to, barberId, status]);

  useEffect(() => {
    loadBarbers();
  }, [loadBarbers]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  async function updateCommission(
    id: number,
    newStatus: CommissionStatus
  ) {
    setUpdatingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/commissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update commission."
        );
      }

      setSuccess(data.message);

      await loadCommissions();
    } catch (error) {
      console.error(
        "COMMISSION_UPDATE_ERROR",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update commission."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function resetFilters() {
    setFrom(getDefaultFromDate());
    setTo(getDefaultToDate());
    setBarberId("");
    setStatus("");
    setSearch("");
  }

  const filteredCommissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return commissions;
    }

    return commissions.filter((commission) => {
      const invoice =
        commission.saleItem.sale.invoiceNumber.toLowerCase();

      const barber =
        commission.barber.name.toLowerCase();

      const service =
        commission.saleItem.service.name.toLowerCase();

      const customer =
        commission.saleItem.sale.customer?.name
          ?.toLowerCase() || "";

      return (
        invoice.includes(query) ||
        barber.includes(query) ||
        service.includes(query) ||
        customer.includes(query)
      );
    });
  }, [commissions, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-7">
        <div>
          <div className="flex items-center gap-2">
            <Scissors
              size={19}
              className="text-slate-700"
            />

            <h1 className="text-lg font-bold text-slate-900">
              Commissions
            </h1>
          </div>

          <p className="mt-0.5 text-xs text-slate-500">
            Manage barber earnings and commission payments
          </p>
        </div>

        <button
          type="button"
          onClick={loadCommissions}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </header>

      <div className="space-y-6 p-6 lg:p-7">
        {/* Alerts */}
        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-800"
            >
              <XCircle size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-green-500 hover:text-green-800"
            >
              <XCircle size={17} />
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Commission"
            value={money(summary.total)}
            description={`${number(summary.count)} records`}
            icon={<DollarSign size={20} />}
          />

          <SummaryCard
            title="Pending"
            value={money(summary.pending)}
            description="Awaiting payment"
            icon={<Clock3 size={20} />}
          />

          <SummaryCard
            title="Paid"
            value={money(summary.paid)}
            description="Commission already paid"
            icon={<CheckCircle2 size={20} />}
          />

          <SummaryCard
            title="Cancelled"
            value={money(summary.cancelled)}
            description="Cancelled commissions"
            icon={<XCircle size={20} />}
          />
        </div>

        {/* Filters */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <Filter
              size={18}
              className="text-slate-500"
            />

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Commission Filters
              </h2>

              <p className="text-xs text-slate-500">
                Filter commission records by period, barber and status
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                From
              </label>

              <input
                type="date"
                value={from}
                onChange={(event) =>
                  setFrom(event.target.value)
                }
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                To
              </label>

              <input
                type="date"
                value={to}
                onChange={(event) =>
                  setTo(event.target.value)
                }
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Barber
              </label>

              <select
                value={barberId}
                onChange={(event) =>
                  setBarberId(event.target.value)
                }
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">
                  All barbers
                </option>

                {barbers.map((barber) => (
                  <option
                    key={barber.id}
                    value={barber.id}
                  >
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">
                  All statuses
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="PAID">
                  Paid
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Search
              </label>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Invoice, barber..."
                  className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 px-5 py-3">
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
            >
              Reset filters
            </button>
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Commission Records
              </h2>

              <p className="text-xs text-slate-500">
                {number(filteredCommissions.length)} records displayed
              </p>
            </div>

            <Scissors
              size={19}
              className="text-slate-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3">
                    Invoice
                  </th>

                  <th className="px-5 py-3">
                    Barber
                  </th>

                  <th className="px-5 py-3">
                    Service
                  </th>

                  <th className="px-5 py-3">
                    Customer
                  </th>

                  <th className="px-5 py-3">
                    Sale
                  </th>

                  <th className="px-5 py-3">
                    Commission
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <LoadingRows />
                ) : filteredCommissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <Scissors
                          size={21}
                          className="text-slate-400"
                        />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No commissions found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try changing your filters or complete a sale with a barber.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map(
                    (commission) => (
                      <CommissionRow
                        key={commission.id}
                        commission={commission}
                        updating={
                          updatingId === commission.id
                        }
                        onUpdate={
                          updateCommission
                        }
                      />
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function CommissionRow({
  commission,
  updating,
  onUpdate,
}: {
  commission: Commission;
  updating: boolean;
  onUpdate: (
    id: number,
    status: CommissionStatus
  ) => void;
}) {
  const sale = commission.saleItem.sale;
  const service = commission.saleItem.service;

  return (
    <tr className="transition hover:bg-slate-50">
      <td className="whitespace-nowrap px-5 py-4">
        <p className="font-medium text-slate-900">
          {formatDate(sale.createdAt)}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {formatDateTime(sale.createdAt).split(", ")[1]}
        </p>
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        <p className="font-semibold text-slate-900">
          {sale.invoiceNumber}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          Cashier: {sale.cashier.name}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="font-semibold text-slate-900">
          {commission.barber.name}
        </p>

        {commission.barber.phone && (
          <p className="mt-0.5 text-xs text-slate-400">
            {commission.barber.phone}
          </p>
        )}
      </td>

      <td className="px-5 py-4">
        <p className="font-semibold text-slate-900">
          {service.name}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          {commission.saleItem.quantity} ×{" "}
          {money(commission.saleItem.unitPrice)}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm text-slate-700">
          {sale.customer?.name ||
            "Walk-in Customer"}
        </p>

        {sale.customer?.phone && (
          <p className="mt-0.5 text-xs text-slate-400">
            {sale.customer.phone}
          </p>
        )}
      </td>

      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
        {money(commission.saleItem.total)}
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        <p className="font-bold text-slate-900">
          {money(commission.amount)}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {commission.type === "PERCENTAGE"
            ? `${commission.value}%`
            : money(commission.value)}
        </p>
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          status={commission.status}
        />

        {commission.paidAt && (
          <p className="mt-1 text-xs text-slate-400">
            Paid {formatDate(commission.paidAt)}
          </p>
        )}
      </td>

      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          {commission.status === "PENDING" && (
            <>
              <button
                type="button"
                disabled={updating}
                onClick={() =>
                  onUpdate(
                    commission.id,
                    "PAID"
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={14} />

                {updating
                  ? "Updating..."
                  : "Mark Paid"}
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() =>
                  onUpdate(
                    commission.id,
                    "CANCELLED"
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle size={14} />

                Cancel
              </button>
            </>
          )}

          {commission.status === "PAID" && (
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                onUpdate(
                  commission.id,
                  "PENDING"
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Return to Pending
            </button>
          )}

          {commission.status === "CANCELLED" && (
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                onUpdate(
                  commission.id,
                  "PENDING"
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Restore
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({
  status,
}: {
  status: CommissionStatus;
}) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 size={13} />
        Paid
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <XCircle size={13} />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Clock3 size={13} />
      Pending
    </span>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <tr key={index}>
            {Array.from({ length: 9 }).map(
              (_, cell) => (
                <td
                  key={cell}
                  className="px-5 py-5"
                >
                  <div className="h-4 animate-pulse rounded bg-slate-100" />
                </td>
              )
            )}
          </tr>
        )
      )}
    </>
  );
}