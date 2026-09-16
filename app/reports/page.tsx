import {
  BarChart3,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  Scissors,
  ShoppingBag,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  DateRangeForm,
  EmptyTableRow,
  MetricCard,
  ReportHeader,
  ReportLinkCard,
  ReportSection,
  StatusPill,
} from "./_components";
import {
  enumLabel,
  formatDateTime,
  getReportRange,
  money,
  number,
  type ReportSearchParams,
} from "./_lib";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: ReportSearchParams;
}) {
  const range = await getReportRange(searchParams);

  const saleWhere = {
    createdAt: {
      gte: range.start,
      lte: range.end,
    },
    status: "COMPLETED" as const,
  };

  const [
    sales,
    expenses,
    commissions,
    customers,
    activeServices,
    paymentsByMethod,
    recentSales,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: saleWhere,
      _count: {
        _all: true,
      },
      _sum: {
        subtotal: true,
        discount: true,
        total: true,
      },
    }),
    prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: range.start,
          lte: range.end,
        },
      },
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.commission.aggregate({
      where: {
        saleItem: {
          sale: saleWhere,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.customer.count(),
    prisma.service.count({
      where: {
        active: true,
      },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      where: {
        paidAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.sale.findMany({
      where: saleWhere,
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
  ]);

  const totalSales = Number(sales._sum.total ?? 0);
  const totalExpenses = Number(expenses._sum.amount ?? 0);
  const commissionTotal = Number(commissions._sum.amount ?? 0);
  const netProfit = totalSales - totalExpenses - commissionTotal;
  const saleCount = sales._count._all;
  const averageSale = saleCount ? totalSales / saleCount : 0;

  const primaryPayment = paymentsByMethod
    .map((payment) => ({
      method: payment.method,
      amount: Number(payment._sum.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount)[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <ReportHeader
        title="Reports Overview"
        description="A complete reporting command center for sales, payments, operations, and profit."
        range={range}
      >
        <DateRangeForm range={range} resetHref="/reports" />
      </ReportHeader>

      <div className="space-y-6 p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Revenue"
            value={money(totalSales)}
            note={`${number(saleCount)} completed sales in this period`}
            icon={<ShoppingBag size={21} />}
            tone="green"
          />

          <MetricCard
            title="Expenses"
            value={money(totalExpenses)}
            note={`${number(expenses._count._all)} expense records posted`}
            icon={<WalletCards size={21} />}
            tone="red"
          />

          <MetricCard
            title="Commissions"
            value={money(commissionTotal)}
            note="Staff commission generated from completed services"
            icon={<Scissors size={21} />}
            tone="amber"
          />

          <MetricCard
            title="Net Profit"
            value={money(netProfit)}
            note={`Average sale value is ${money(averageSale)}`}
            icon={<TrendingUp size={21} />}
            tone={netProfit >= 0 ? "green" : "red"}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
          <ReportLinkCard
            href="/reports/sales"
            title="Sales Report"
            description="Invoices, discounts, cashiers, customers, and transaction history."
            value={money(totalSales)}
            icon={<BarChart3 size={20} />}
          />

          <ReportLinkCard
            href="/reports/payments"
            title="Payments Report"
            description="Payment methods, references, statuses, and paid totals."
            value={
              primaryPayment
                ? enumLabel(primaryPayment.method)
                : "No payments"
            }
            icon={<CreditCard size={20} />}
          />

          <ReportLinkCard
            href="/reports/profit-loss"
            title="Profit & Loss"
            description="Revenue less expenses and generated staff commissions."
            value={money(netProfit)}
            icon={<CircleDollarSign size={20} />}
          />

          <ReportLinkCard
            href="/reports/services"
            title="Service Performance"
            description="Revenue and quantity sold by salon service."
            value={`${number(activeServices)} active`}
            icon={<ReceiptText size={20} />}
          />

          <ReportLinkCard
            href="/reports/expenses"
            title="Expense Report"
            description="Spend by category, user, payment method, and record."
            value={money(totalExpenses)}
            icon={<WalletCards size={20} />}
          />

          <ReportLinkCard
            href="/reports/customers"
            title="Customer Report"
            description="Registered customers, visits, spend, and recent activity."
            value={number(customers)}
            icon={<Users size={20} />}
          />

          <ReportLinkCard
            href="/reports/commissions"
            title="Commission Report"
            description="Barber earnings, pending commissions, and paid totals."
            value={money(commissionTotal)}
            icon={<Scissors size={20} />}
          />

          <ReportLinkCard
            href="/reports/cashier"
            title="Cashier Report"
            description="Sales totals, average ticket, and performance by cashier."
            value={number(saleCount)}
            icon={<UserRound size={20} />}
          />
        </div>

        <ReportSection
          title="Recent Sales"
          description="Latest completed transactions in the selected period"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Cashier</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {sale.customer?.name || "Walk-in Customer"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {sale.cashier.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                      {money(Number(sale.total))}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill tone="green">Completed</StatusPill>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDateTime(sale.createdAt)}
                    </td>
                  </tr>
                ))}

                {recentSales.length === 0 && (
                  <EmptyTableRow
                    colSpan={6}
                    message="No completed sales found for this period."
                  />
                )}
              </tbody>
            </table>
          </div>
        </ReportSection>
      </div>
    </div>
  );
}
