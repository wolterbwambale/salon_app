import {
  Banknote,
  CreditCard,
  ReceiptText,
  WalletCards,
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

export default async function PaymentsReportPage({
  searchParams,
}: {
  searchParams?: ReportSearchParams;
}) {
  const range = await getReportRange(searchParams);

  const payments = await prisma.payment.findMany({
    where: {
      paidAt: {
        gte: range.start,
        lte: range.end,
      },
    },
    orderBy: {
      paidAt: "desc",
    },
    include: {
      sale: {
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
      },
    },
  });

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );
  const averagePayment = payments.length ? totalPaid / payments.length : 0;
  const paidCount = payments.filter(
    (payment) => payment.status === "PAID"
  ).length;

  const methodTotals = new Map<
    string,
    {
      amount: number;
      count: number;
    }
  >();

  const statusTotals = new Map<
    string,
    {
      amount: number;
      count: number;
    }
  >();

  for (const payment of payments) {
    const method = methodTotals.get(payment.method) || {
      amount: 0,
      count: 0,
    };
    method.amount += Number(payment.amount);
    method.count += 1;
    methodTotals.set(payment.method, method);

    const status = statusTotals.get(payment.status) || {
      amount: 0,
      count: 0,
    };
    status.amount += Number(payment.amount);
    status.count += 1;
    statusTotals.set(payment.status, status);
  }

  const methodRows = Array.from(methodTotals.entries())
    .map(([label, value]) => ({
      label: enumLabel(label),
      value: value.amount,
      detail: `${number(value.count)} payment${
        value.count === 1 ? "" : "s"
      }`,
    }))
    .sort((a, b) => b.value - a.value);

  const statusRows = Array.from(statusTotals.entries())
    .map(([label, value]) => ({
      label: enumLabel(label),
      value: value.amount,
      detail: `${number(value.count)} record${
        value.count === 1 ? "" : "s"
      }`,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen bg-slate-50">
      <ReportHeader
        title="Payments Report"
        description="Payment methods, status totals, transaction references, and cashier collection history."
        range={range}
      >
        <DateRangeForm range={range} resetHref="/reports/payments" />
      </ReportHeader>

      <div className="space-y-6 p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Collected"
            value={money(totalPaid)}
            note={`${number(payments.length)} payment records`}
            icon={<Banknote size={21} />}
            tone="green"
          />

          <MetricCard
            title="Paid Records"
            value={number(paidCount)}
            note="Payments marked as paid"
            icon={<ReceiptText size={21} />}
            tone="green"
          />

          <MetricCard
            title="Payment Methods"
            value={number(methodRows.length)}
            note="Methods used during this period"
            icon={<WalletCards size={21} />}
            tone="slate"
          />

          <MetricCard
            title="Average Payment"
            value={money(averagePayment)}
            note="Average collected amount per record"
            icon={<CreditCard size={21} />}
            tone="slate"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ReportSection
            title="Collection by Method"
            description="How customers paid during the selected period"
          >
            <BarList rows={methodRows} total={totalPaid} />
          </ReportSection>

          <ReportSection
            title="Collection by Status"
            description="Payment status totals"
          >
            <BarList rows={statusRows} total={totalPaid} />
          </ReportSection>
        </div>

        <ReportSection
          title="Payment Register"
          description="Detailed payment records with sale and reference details"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Cashier</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Paid At</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                      {payment.sale.invoiceNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {payment.sale.customer?.name || "Walk-in Customer"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {payment.sale.cashier.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                      {enumLabel(payment.method)}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {payment.reference || "None"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                      {money(Number(payment.amount))}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill
                        tone={
                          payment.status === "PAID"
                            ? "green"
                            : payment.status === "REFUNDED"
                              ? "red"
                              : "amber"
                        }
                      >
                        {enumLabel(payment.status)}
                      </StatusPill>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDateTime(payment.paidAt)}
                    </td>
                  </tr>
                ))}

                {payments.length === 0 && (
                  <EmptyTableRow
                    colSpan={8}
                    message="No payment records found for this period."
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
