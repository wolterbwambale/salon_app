import {
  CheckCircle2,
  CircleDollarSign,
  ReceiptText,
  Scissors,
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
  formatDateTime,
  getReportRange,
  money,
  number,
  type ReportSearchParams,
} from "../_lib";

export const dynamic = "force-dynamic";

export default async function CommissionsReportPage({
  searchParams,
}: {
  searchParams?: ReportSearchParams;
}) {
  const range = await getReportRange(searchParams);

  const commissions = await prisma.commission.findMany({
    where: {
      saleItem: {
        sale: {
          createdAt: {
            gte: range.start,
            lte: range.end,
          },
          status: "COMPLETED",
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    include: {
      barber: {
        select: {
          name: true,
        },
      },
      saleItem: {
        include: {
          service: {
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
      },
    },
  });

  const total = commissions.reduce(
    (sum, commission) => sum + Number(commission.amount),
    0
  );
  const pending = commissions
    .filter((commission) => commission.status === "PENDING")
    .reduce((sum, commission) => sum + Number(commission.amount), 0);
  const paid = commissions
    .filter((commission) => commission.status === "PAID")
    .reduce((sum, commission) => sum + Number(commission.amount), 0);

  const barberTotals = new Map<
    string,
    {
      amount: number;
      count: number;
    }
  >();

  for (const commission of commissions) {
    const current = barberTotals.get(commission.barber.name) || {
      amount: 0,
      count: 0,
    };
    current.amount += Number(commission.amount);
    current.count += 1;
    barberTotals.set(commission.barber.name, current);
  }

  const barberRows = Array.from(barberTotals.entries())
    .map(([label, value]) => ({
      label,
      value: value.amount,
      detail: `${number(value.count)} commission${
        value.count === 1 ? "" : "s"
      }`,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen bg-slate-50">
      <ReportHeader
        title="Commission Report"
        description="Barber commission totals, statuses, and service-level commission history."
        range={range}
      >
        <DateRangeForm range={range} resetHref="/reports/commissions" />
      </ReportHeader>

      <div className="space-y-6 p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Commission"
            value={money(total)}
            note={`${number(commissions.length)} commission records`}
            icon={<CircleDollarSign size={21} />}
            tone="green"
          />

          <MetricCard
            title="Pending"
            value={money(pending)}
            note="Commission awaiting payout"
            icon={<ReceiptText size={21} />}
            tone="amber"
          />

          <MetricCard
            title="Paid"
            value={money(paid)}
            note="Commission already marked as paid"
            icon={<CheckCircle2 size={21} />}
            tone="green"
          />

          <MetricCard
            title="Barbers"
            value={number(barberRows.length)}
            note="Barbers with commission activity"
            icon={<Scissors size={21} />}
            tone="slate"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ReportSection
            title="Commission by Barber"
            description="Total generated commission"
          >
            <BarList rows={barberRows} total={total} />
          </ReportSection>

          <ReportSection
            title="Commission Register"
            description="Detailed commission records"
            className="xl:col-span-2"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Barber</th>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Rule</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                        {commission.saleItem.sale.invoiceNumber}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {commission.barber.name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {commission.saleItem.service.name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {commission.type === "PERCENTAGE"
                          ? `${Number(commission.value)}%`
                          : money(Number(commission.value))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                        {money(Number(commission.amount))}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill
                          tone={
                            commission.status === "PAID"
                              ? "green"
                              : commission.status === "CANCELLED"
                                ? "red"
                                : "amber"
                          }
                        >
                          {enumLabel(commission.status)}
                        </StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatDateTime(
                          commission.saleItem.sale.createdAt
                        )}
                      </td>
                    </tr>
                  ))}

                  {commissions.length === 0 && (
                    <EmptyTableRow
                      colSpan={7}
                      message="No commission records found for this period."
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
