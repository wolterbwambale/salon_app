import {
  CreditCard,
  ReceiptText,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  BarList,
  DateRangeForm,
  EmptyTableRow,
  MetricCard,
  ReportHeader,
  ReportSection,
} from "../_components";
import {
  enumLabel,
  formatDateTime,
  getReportRange,
  money,
  number,
  type ReportSearchParams,
} from "../_lib";

export const dynamic = "force-dynamic";

export default async function CashierReportPage({
  searchParams,
}: {
  searchParams?: ReportSearchParams;
}) {
  const range = await getReportRange(searchParams);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: range.start,
        lte: range.end,
      },
      status: "COMPLETED",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      cashier: {
        select: {
          id: true,
          name: true,
        },
      },
      customer: {
        select: {
          name: true,
        },
      },
      items: {
        select: {
          quantity: true,
        },
      },
      payments: {
        select: {
          method: true,
        },
      },
    },
  });

  const cashierTotals = new Map<
    number,
    {
      name: string;
      sales: number;
      items: number;
      discounts: number;
      revenue: number;
    }
  >();

  for (const sale of sales) {
    const current = cashierTotals.get(sale.cashier.id) || {
      name: sale.cashier.name,
      sales: 0,
      items: 0,
      discounts: 0,
      revenue: 0,
    };

    current.sales += 1;
    current.items += sale.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    current.discounts += Number(sale.discount);
    current.revenue += Number(sale.total);
    cashierTotals.set(sale.cashier.id, current);
  }

  const rows = Array.from(cashierTotals.values()).sort(
    (a, b) => b.revenue - a.revenue
  );
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalItems = rows.reduce((sum, row) => sum + row.items, 0);
  const totalDiscounts = rows.reduce((sum, row) => sum + row.discounts, 0);
  const averageSale = sales.length ? totalRevenue / sales.length : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <ReportHeader
        title="Cashier Report"
        description="Cashier revenue, sales count, average ticket, discounts, and recent transaction activity."
        range={range}
      >
        <DateRangeForm range={range} resetHref="/reports/cashier" />
      </ReportHeader>

      <div className="space-y-6 p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Cashier Revenue"
            value={money(totalRevenue)}
            note={`${number(sales.length)} completed transactions`}
            icon={<ShoppingBag size={21} />}
            tone="green"
          />

          <MetricCard
            title="Active Cashiers"
            value={number(rows.length)}
            note="Cashiers with completed sales"
            icon={<UserRound size={21} />}
            tone="slate"
          />

          <MetricCard
            title="Average Sale"
            value={money(averageSale)}
            note={`${number(totalItems)} service items sold`}
            icon={<ReceiptText size={21} />}
            tone="green"
          />

          <MetricCard
            title="Discounts"
            value={money(totalDiscounts)}
            note="Discounts issued by cashiers"
            icon={<CreditCard size={21} />}
            tone="amber"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ReportSection
            title="Revenue by Cashier"
            description="Completed sale totals"
          >
            <BarList
              rows={rows.map((row) => ({
                label: row.name,
                value: row.revenue,
                detail: `${number(row.sales)} sale${
                  row.sales === 1 ? "" : "s"
                }`,
              }))}
              total={totalRevenue}
            />
          </ReportSection>

          <ReportSection
            title="Cashier Summary"
            description="Sales, service item counts, discounts, and averages"
            className="xl:col-span-2"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Cashier</th>
                    <th className="px-5 py-3">Sales</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Discounts</th>
                    <th className="px-5 py-3">Average</th>
                    <th className="px-5 py-3">Revenue</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.name} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {row.name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {number(row.sales)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {number(row.items)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {money(row.discounts)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {money(row.sales ? row.revenue / row.sales : 0)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                        {money(row.revenue)}
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <EmptyTableRow
                      colSpan={6}
                      message="No cashier sales found for this period."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </ReportSection>
        </div>

        <ReportSection
          title="Recent Cashier Transactions"
          description="Completed sales in the selected period"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Cashier</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sales.slice(0, 80).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {sale.cashier.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {sale.customer?.name || "Walk-in Customer"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
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
                    <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                      {money(Number(sale.total))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDateTime(sale.createdAt)}
                    </td>
                  </tr>
                ))}

                {sales.length === 0 && (
                  <EmptyTableRow
                    colSpan={7}
                    message="No cashier transactions found for this period."
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
