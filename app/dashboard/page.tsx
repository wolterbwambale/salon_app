import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileBarChart,
  Scissors,
  ShoppingBag,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

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

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [
    sales,
    expenses,
    customers,
    barbers,
    recentSales,
    allCompletedSales,
  ] = await Promise.all([
    // Today's completed sales
    prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: "COMPLETED",
      },
      select: {
        total: true,
      },
    }),

    // Today's expenses
    prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: start,
          lte: end,
        },
      },
      select: {
        amount: true,
      },
    }),

    // Customers
    prisma.customer.count(),

    // Active barbers
    prisma.barber.count({
      where: {
        active: true,
      },
    }),

    // Recent sales
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        cashier: {
          select: {
            name: true,
          },
        },
      },
    }),

    // All completed sales for basic reporting
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        cashier: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const totalSales = sales.reduce(
    (sum, item) => sum + Number(item.total),
    0
  );

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const net = totalSales - totalExpenses;

  const transactionCount = sales.length;

  const averageSale =
    transactionCount > 0
      ? totalSales / transactionCount
      : 0;

  /*
   * Basic sales by cashier.
   * This does not require additional Prisma relations.
   */
  const cashierTotals = new Map<
    string,
    {
      name: string;
      sales: number;
      amount: number;
    }
  >();

  for (const sale of allCompletedSales) {
    const cashierName =
      sale.cashier?.name || "Unknown Cashier";

    const existing = cashierTotals.get(cashierName);

    if (existing) {
      existing.sales += 1;
      existing.amount += Number(sale.total);
    } else {
      cashierTotals.set(cashierName, {
        name: cashierName,
        sales: 1,
        amount: Number(sale.total),
      });
    }
  }

  const cashierSummary = Array.from(
    cashierTotals.values()
  )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  /*
   * Simple recent-sales activity.
   */
  const todaySales = recentSales.filter((sale) => {
    const created = new Date(sale.createdAt);
    return created >= start && created <= end;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="flex min-h-16 items-center justify-between border-b bg-white px-7">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="text-xs text-slate-500">
            Overview of today&apos;s salon operations
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays size={17} />

          {formatDate(new Date())}
        </div>
      </header>

      <div className="space-y-6 p-7">
        {/* Main Statistics */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Today's Sales"
            value={money(totalSales)}
            icon={<ShoppingBag size={21} />}
            note={`${number(transactionCount)} completed transactions`}
            positive={totalSales >= 0}
          />

          <StatCard
            title="Today's Expenses"
            value={money(totalExpenses)}
            icon={<WalletCards size={21} />}
            note="Recorded business expenses"
          />

          <StatCard
            title="Net Revenue"
            value={money(net)}
            icon={<CircleDollarSign size={21} />}
            note="Sales less today's expenses"
            positive={net >= 0}
          />

          <StatCard
            title="Average Sale"
            value={money(averageSale)}
            icon={<TrendingUp size={21} />}
            note="Average completed transaction"
            positive={averageSale > 0}
          />
        </div>

        {/* Operational Statistics */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <SmallStatCard
            title="Customers"
            value={number(customers)}
            description="Customers registered"
            icon={<Users size={20} />}
          />

          <SmallStatCard
            title="Active Barbers"
            value={number(barbers)}
            description="Currently active staff"
            icon={<Scissors size={20} />}
          />

          <SmallStatCard
            title="Today's Transactions"
            value={number(transactionCount)}
            description="Completed sales today"
            icon={<CreditCard size={20} />}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* Recent Transactions */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Recent Transactions
                </h2>

                <p className="text-xs text-slate-500">
                  Latest completed sales
                </p>
              </div>

              <ShoppingBag
                size={19}
                className="text-slate-400"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      Invoice
                    </th>

                    <th className="px-5 py-3">
                      Customer
                    </th>

                    <th className="px-5 py-3">
                      Cashier
                    </th>

                    <th className="px-5 py-3">
                      Amount
                    </th>

                    <th className="px-5 py-3">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-900">
                        {sale.invoiceNumber}
                      </td>

                      <td className="px-5 py-3 text-slate-600">
                        {sale.customer?.name ||
                          "Walk-in Customer"}
                      </td>

                      <td className="px-5 py-3 text-slate-600">
                        {sale.cashier?.name ||
                          "Unknown"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-900">
                        {money(Number(sale.total))}
                      </td>

                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                        {formatTime(
                          new Date(sale.createdAt)
                        )}
                      </td>
                    </tr>
                  ))}

                  {recentSales.length === 0 && (
                    <EmptyTableRow
                      colSpan={5}
                      message="No sales recorded yet."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="text-xs text-slate-500">
                Common salon operations
              </p>
            </div>

            <div className="space-y-2 p-4">
              <QuickAction
                href="/pos"
                icon={<ShoppingBag size={18} />}
                title="Open POS"
                description="Create a new sale"
              />

              <QuickAction
                href="/customers"
                icon={<Users size={18} />}
                title="Customers"
                description="Register and manage customers"
              />

              <QuickAction
                href="/barbers"
                icon={<Scissors size={18} />}
                title="Manage Barbers"
                description="Staff and commissions"
              />

              <QuickAction
                href="/services"
                icon={<ClipboardList size={18} />}
                title="Services"
                description="Manage salon services"
              />

              <QuickAction
                href="/expenses"
                icon={<WalletCards size={18} />}
                title="Record Expense"
                description="Add a business expense"
              />

              <QuickAction
                href="/reports"
                icon={<FileBarChart size={18} />}
                title="View Reports"
                description="Sales and financial reports"
              />
            </div>
          </section>
        </div>

        {/* Reporting */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Cashier Performance */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Cashier Performance
                </h2>

                <p className="text-xs text-slate-500">
                  Completed sales by cashier
                </p>
              </div>

              <BarChart3
                size={19}
                className="text-slate-400"
              />
            </div>

            <div className="p-5">
              {cashierSummary.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  No completed sales available.
                </div>
              ) : (
                <div className="space-y-4">
                  {cashierSummary.map((cashier) => (
                    <div
                      key={cashier.name}
                      className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {cashier.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {number(cashier.sales)} sale
                          {cashier.sales === 1
                            ? ""
                            : "s"}
                        </p>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        {money(cashier.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Today's Summary */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Today&apos;s Summary
                </h2>

                <p className="text-xs text-slate-500">
                  Current business position
                </p>
              </div>

              <CircleDollarSign
                size={19}
                className="text-slate-400"
              />
            </div>

            <div className="space-y-4 p-5">
              <SummaryRow
                label="Gross Sales"
                value={money(totalSales)}
              />

              <SummaryRow
                label="Operating Expenses"
                value={money(totalExpenses)}
              />

              <div className="border-t border-slate-200 pt-4">
                <SummaryRow
                  label="Net Revenue"
                  value={money(net)}
                  strong
                  positive={net >= 0}
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Transactions
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {number(transactionCount)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Average transaction
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {money(averageSale)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Report Links */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Reports &amp; Management
            </h2>

            <p className="text-xs text-slate-500">
              Access detailed operational and financial reports
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <ReportCard
              href="/reports/sales"
              icon={<ShoppingBag size={20} />}
              title="Sales Report"
              description="Daily, weekly and monthly sales"
            />

            <ReportCard
              href="/reports/expenses"
              icon={<WalletCards size={20} />}
              title="Expense Report"
              description="Track business expenses"
            />

            <ReportCard
              href="/reports/commissions"
              icon={<Scissors size={20} />}
              title="Commission Report"
              description="Barber earnings and commissions"
            />

            <ReportCard
              href="/reports/customers"
              icon={<Users size={20} />}
              title="Customer Report"
              description="Customer activity and history"
            />
          </div>
        </section>

        {/* Today's Activity */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">
                Today&apos;s Activity
              </h2>

              <p className="text-xs text-slate-500">
                Sales completed today
              </p>
            </div>

            <CalendarDays
              size={19}
              className="text-slate-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">
                    Invoice
                  </th>

                  <th className="px-5 py-3">
                    Customer
                  </th>

                  <th className="px-5 py-3">
                    Cashier
                  </th>

                  <th className="px-5 py-3">
                    Amount
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {todaySales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {sale.invoiceNumber}
                    </td>

                    <td className="px-5 py-3 text-slate-600">
                      {sale.customer?.name ||
                        "Walk-in Customer"}
                    </td>

                    <td className="px-5 py-3 text-slate-600">
                      {sale.cashier?.name ||
                        "Unknown"}
                    </td>

                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {money(Number(sale.total))}
                    </td>

                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}

                {todaySales.length === 0 && (
                  <EmptyTableRow
                    colSpan={5}
                    message="No transactions have been completed today."
                  />
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  icon,
  note,
  positive,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  note: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
        {positive !== undefined &&
          (positive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          ))}

        {note}
      </div>
    </div>
  );
}

function SmallStatCard({
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
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
          {icon}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-slate-400 hover:bg-slate-50"
    >
      <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-900">
          {title}
        </div>

        <div className="text-xs text-slate-500">
          {description}
        </div>
      </div>
    </a>
  );
}

function ReportCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
        {icon}
      </div>

      <h3 className="text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </a>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  positive,
}: {
  label: string;
  value: string;
  strong?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "text-sm font-bold text-slate-900"
            : "text-sm text-slate-600"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? positive
              ? "text-base font-bold text-green-700"
              : "text-base font-bold text-red-600"
            : "text-sm font-semibold text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

function EmptyTableRow({
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

