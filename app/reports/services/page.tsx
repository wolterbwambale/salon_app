import {
  CircleDollarSign,
  ReceiptText,
  Scissors,
  ShoppingBag,
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
  formatDateTime,
  getReportRange,
  money,
  number,
  type ReportSearchParams,
} from "../_lib";

export const dynamic = "force-dynamic";

export default async function ServicesReportPage({
  searchParams,
}: {
  searchParams?: ReportSearchParams;
}) {
  const range = await getReportRange(searchParams);

  const [saleItems, activeServices] = await Promise.all([
    prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: {
            gte: range.start,
            lte: range.end,
          },
          status: "COMPLETED",
        },
      },
      orderBy: {
        id: "desc",
      },
      include: {
        service: true,
        barber: {
          select: {
            name: true,
          },
        },
        sale: {
          select: {
            invoiceNumber: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.service.count({
      where: {
        active: true,
      },
    }),
  ]);

  const serviceTotals = new Map<
    number,
    {
      name: string;
      quantity: number;
      sales: number;
      discount: number;
      revenue: number;
    }
  >();

  for (const item of saleItems) {
    const current = serviceTotals.get(item.serviceId) || {
      name: item.service.name,
      quantity: 0,
      sales: 0,
      discount: 0,
      revenue: 0,
    };

    current.quantity += item.quantity;
    current.sales += 1;
    current.discount += Number(item.discount);
    current.revenue += Number(item.total);
    serviceTotals.set(item.serviceId, current);
  }

  const rows = Array.from(serviceTotals.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const totalDiscount = rows.reduce((sum, row) => sum + row.discount, 0);
  const averageService = saleItems.length
    ? totalRevenue / saleItems.length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <ReportHeader
        title="Service Performance"
        description="Revenue, quantities, discounts, and recent sales by salon service."
        range={range}
      >
        <DateRangeForm range={range} resetHref="/reports/services" />
      </ReportHeader>

      <div className="space-y-6 p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Service Revenue"
            value={money(totalRevenue)}
            note="Revenue from completed service items"
            icon={<CircleDollarSign size={21} />}
            tone="green"
          />

          <MetricCard
            title="Quantity Sold"
            value={number(totalQuantity)}
            note={`${number(saleItems.length)} service line items`}
            icon={<ShoppingBag size={21} />}
            tone="slate"
          />

          <MetricCard
            title="Discounts"
            value={money(totalDiscount)}
            note="Discounts applied at service-line level"
            icon={<ReceiptText size={21} />}
            tone="amber"
          />

          <MetricCard
            title="Active Services"
            value={number(activeServices)}
            note={`Average line value is ${money(averageService)}`}
            icon={<Scissors size={21} />}
            tone="slate"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ReportSection
            title="Top Services"
            description="Revenue by service"
          >
            <BarList
              rows={rows.slice(0, 8).map((row) => ({
                label: row.name,
                value: row.revenue,
                detail: `${number(row.quantity)} sold`,
              }))}
              total={totalRevenue}
            />
          </ReportSection>

          <ReportSection
            title="Service Summary"
            description="Totals by service in the selected period"
            className="xl:col-span-2"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Line Items</th>
                    <th className="px-5 py-3">Quantity</th>
                    <th className="px-5 py-3">Discount</th>
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
                        {number(row.quantity)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {money(row.discount)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                        {money(row.revenue)}
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <EmptyTableRow
                      colSpan={5}
                      message="No service sales found for this period."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </ReportSection>
        </div>

        <ReportSection
          title="Recent Service Sales"
          description="Latest service line items posted through POS"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Barber</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Unit Price</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {saleItems.slice(0, 50).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                      {item.sale.invoiceNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {item.service.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.barber?.name || "Unassigned"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {number(item.quantity)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {money(Number(item.unitPrice))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {money(Number(item.discount))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                      {money(Number(item.total))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDateTime(item.sale.createdAt)}
                    </td>
                  </tr>
                ))}

                {saleItems.length === 0 && (
                  <EmptyTableRow
                    colSpan={8}
                    message="No service line items found for this period."
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
