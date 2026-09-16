import {
  CircleDollarSign,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  BarList,
  DateRangeForm,
  EmptyTableRow,
  MetricCard,
  ReportHeader,
  ReportSection,
  StatusPill,
} from "../_components";
import {
  enumLabel,
  formatDate,
  formatDateTime,
  getReportRange,
  money,
  number,
  type ReportSearchParams,
} from "../_lib";

export const dynamic = "force-dynamic";

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams?: ReportSearchParams;
}) {
  const range = await getReportRange(searchParams);

  const where = {
    createdAt: {
      gte: range.start,
      lte: range.end,
    },
    status: "COMPLETED" as const,
  };

  const sales = await prisma.sale.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
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
      payments: {
        select: {
          method: true,
          amount: true,
        },
      },
      items: {
        select: {
          quantity: true,
        },
      },
    },
  });

  const totalSales = sales.reduce(
    (sum, sale) => sum + Number(sale.total),
    0
  );
  const subtotal = sales.reduce(
    (sum, sale) => sum + Number(sale.subtotal),
    0
  );
  const discount = sales.reduce(
    (sum, sale) => sum + Number(sale.discount),
    0
  );
  const itemCount = sales.reduce(
    (sum, sale) =>
      sum +
      sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const averageSale = sales.length ? totalSales / sales.length : 0;

  const dailyTotals = new Map<string, number>();
  for (const sale of sales) {
    const key = formatDate(sale.createdAt);
    dailyTotals.set(key, (dailyTotals.get(key) || 0) + Number(sale.total));
  }

  const dailyRows = Array.from(dailyTotals.entries()).map(
    ([label, value]) => ({
      label,
      value,
      detail: "Completed sales",
    })
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <ReportHeader
        title="Sales Report"
        description="Completed sale invoices, discounts, cashier activity, and transaction totals."
        range={range}
      >
        <DateRangeForm range={range} resetHref="/reports/sales" />
      </ReportHeader>

      <div className="space-y-6 p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Gross Sales"
            value={money(subtotal)}
            note="Before transaction-level discounts"
            icon={<ReceiptText size={21} />}
            tone="slate"
          />

          <MetricCard
            title="Net Sales"
            value={money(totalSales)}
            note={`${number(sales.length)} completed transactions`}
            icon={<ShoppingBag size={21} />}
            tone="green"
          />

          <MetricCard
            title="Discounts"
            value={money(discount)}
            note="Total discounts applied to completed sales"
            icon={<CircleDollarSign size={21} />}
            tone="amber"
          />

          <MetricCard
            title="Average Sale"
            value={money(averageSale)}
            note={`${number(itemCount)} service items sold`}
            icon={<TrendingUp size={21} />}
            tone="green"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ReportSection
            title="Sales by Day"
            description="Daily revenue in the selected range"
          >
            <BarList rows={dailyRows} total={totalSales} />
          </ReportSection>

          <ReportSection
            title="Transaction Register"
            description="Every completed sale in this period"
            className="xl:col-span-2"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Cashier</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Discount</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sales.map((sale) => (
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
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {number(
                          sale.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {sale.payments
                          .map((payment) => enumLabel(payment.method))
                          .join(", ") || "No payment"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {money(Number(sale.discount))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                        {money(Number(sale.total))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatDateTime(sale.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill tone="green">Completed</StatusPill>
                      </td>
                    </tr>
                  ))}

                  {sales.length === 0 && (
                    <EmptyTableRow
                      colSpan={9}
                      message="No completed sales found for this period."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </ReportSection>
        </div>
      </div>
    </div>
  );
}
