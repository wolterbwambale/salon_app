import {
  ReceiptText,
  ShoppingBag,
  UserRound,
  Users,
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

export default async function CustomersReportPage({
  searchParams,
}: {
  searchParams?: ReportSearchParams;
}) {
  const range = await getReportRange(searchParams);

  const [customers, walkInSales, newCustomers] = await Promise.all([
    prisma.customer.findMany({
      include: {
        sales: {
          where: {
            createdAt: {
              gte: range.start,
              lte: range.end,
            },
            status: "COMPLETED",
          },
          select: {
            total: true,
            createdAt: true,
            invoiceNumber: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.sale.aggregate({
      where: {
        customerId: null,
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
        status: "COMPLETED",
      },
      _count: {
        _all: true,
      },
      _sum: {
        total: true,
      },
    }),
    prisma.customer.count({
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
  ]);

  const customerRows = customers
    .map((customer) => {
      const totalSpent = customer.sales.reduce(
        (sum, sale) => sum + Number(sale.total),
        0
      );
      const lastSale = customer.sales[0]?.createdAt;

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        sales: customer.sales.length,
        totalSpent,
        lastSale,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const customerRevenue = customerRows.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );
  const walkInRevenue = Number(walkInSales._sum.total ?? 0);
  const totalRevenue = customerRevenue + walkInRevenue;
  const payingCustomers = customerRows.filter(
    (customer) => customer.sales > 0
  );

  const topRows = customerRows
    .filter((customer) => customer.totalSpent > 0)
    .slice(0, 8)
    .map((customer) => ({
      label: customer.name,
      value: customer.totalSpent,
      detail: `${number(customer.sales)} visit${
        customer.sales === 1 ? "" : "s"
      }`,
    }));

  return (
    <div className="min-h-screen bg-slate-50">
      <ReportHeader
        title="Customer Report"
        description="Customer visits, spend, walk-in sales, and registration activity."
        range={range}
      >
        <DateRangeForm range={range} resetHref="/reports/customers" />
      </ReportHeader>

      <div className="space-y-6 p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Customer Revenue"
            value={money(customerRevenue)}
            note="Sales attached to registered customers"
            icon={<Users size={21} />}
            tone="green"
          />

          <MetricCard
            title="Walk-in Revenue"
            value={money(walkInRevenue)}
            note={`${number(walkInSales._count._all)} walk-in sales`}
            icon={<ShoppingBag size={21} />}
            tone="slate"
          />

          <MetricCard
            title="Paying Customers"
            value={number(payingCustomers.length)}
            note={`${number(customers.length)} total registered customers`}
            icon={<UserRound size={21} />}
            tone="slate"
          />

          <MetricCard
            title="New Customers"
            value={number(newCustomers)}
            note="Customers registered during this period"
            icon={<ReceiptText size={21} />}
            tone="green"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ReportSection
            title="Top Customers"
            description="Highest customer spend in the selected period"
          >
            <BarList rows={topRows} total={totalRevenue} />
          </ReportSection>

          <ReportSection
            title="Customer Register"
            description="Registered customer performance"
            className="xl:col-span-2"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Visits</th>
                    <th className="px-5 py-3">Total Spent</th>
                    <th className="px-5 py-3">Last Sale</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {customerRows.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {customer.name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {customer.phone || customer.email || "No contact"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {number(customer.sales)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                        {money(customer.totalSpent)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {customer.lastSale
                          ? formatDateTime(customer.lastSale)
                          : "No sale in range"}
                      </td>
                    </tr>
                  ))}

                  {customerRows.length === 0 && (
                    <EmptyTableRow
                      colSpan={5}
                      message="No customers have been registered yet."
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
