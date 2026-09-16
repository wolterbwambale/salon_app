import {
  ClipboardList,
  ReceiptText,
  TrendingDown,
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

export default async function ExpensesReportPage({
  searchParams,
}: {
  searchParams?: ReportSearchParams;
}) {
  const range = await getReportRange(searchParams);

  const expenses = await prisma.expense.findMany({
    where: {
      expenseDate: {
        gte: range.start,
        lte: range.end,
      },
    },
    orderBy: {
      expenseDate: "desc",
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );
  const average = expenses.length ? total / expenses.length : 0;

  const categoryTotals = new Map<
    string,
    {
      amount: number;
      count: number;
    }
  >();
  const methodTotals = new Map<
    string,
    {
      amount: number;
      count: number;
    }
  >();

  for (const expense of expenses) {
    const category = categoryTotals.get(expense.category.name) || {
      amount: 0,
      count: 0,
    };
    category.amount += Number(expense.amount);
    category.count += 1;
    categoryTotals.set(expense.category.name, category);

    const method = methodTotals.get(expense.paymentMethod) || {
      amount: 0,
      count: 0,
    };
    method.amount += Number(expense.amount);
    method.count += 1;
    methodTotals.set(expense.paymentMethod, method);
  }

  const categoryRows = Array.from(categoryTotals.entries())
    .map(([label, value]) => ({
      label,
      value: value.amount,
      detail: `${number(value.count)} expense${
        value.count === 1 ? "" : "s"
      }`,
    }))
    .sort((a, b) => b.value - a.value);

  const methodRows = Array.from(methodTotals.entries())
    .map(([label, value]) => ({
      label: enumLabel(label),
      value: value.amount,
      detail: `${number(value.count)} expense${
        value.count === 1 ? "" : "s"
      }`,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen bg-slate-50">
      <ReportHeader
        title="Expense Report"
        description="Expense records, spend by category, payment method, and recording user."
        range={range}
      >
        <DateRangeForm range={range} resetHref="/reports/expenses" />
      </ReportHeader>

      <div className="space-y-6 p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Expenses"
            value={money(total)}
            note="Total operating spend in the selected period"
            icon={<WalletCards size={21} />}
            tone="red"
          />

          <MetricCard
            title="Records"
            value={number(expenses.length)}
            note="Expense entries posted"
            icon={<ReceiptText size={21} />}
            tone="slate"
          />

          <MetricCard
            title="Categories"
            value={number(categoryRows.length)}
            note="Expense categories used"
            icon={<ClipboardList size={21} />}
            tone="slate"
          />

          <MetricCard
            title="Average Expense"
            value={money(average)}
            note="Average amount per expense record"
            icon={<TrendingDown size={21} />}
            tone="amber"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ReportSection
            title="Spend by Category"
            description="Expense totals by category"
          >
            <BarList rows={categoryRows} total={total} />
          </ReportSection>

          <ReportSection
            title="Spend by Payment Method"
            description="Expense totals by payment method"
          >
            <BarList rows={methodRows} total={total} />
          </ReportSection>
        </div>

        <ReportSection
          title="Expense Register"
          description="Detailed operating expense records"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Recorded By</th>
                  <th className="px-5 py-3">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDateTime(expense.expenseDate)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {expense.description}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {expense.category.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {enumLabel(expense.paymentMethod)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {expense.user.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                      {money(Number(expense.amount))}
                    </td>
                  </tr>
                ))}

                {expenses.length === 0 && (
                  <EmptyTableRow
                    colSpan={6}
                    message="No expenses found for this period."
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
