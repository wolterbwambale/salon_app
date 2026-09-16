import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Scissors,
  WalletCards,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  BarList,
  DateRangeForm,
  MetricCard,
  ReportHeader,
  ReportSection,
} from "../_components";
import {
  enumLabel,
  getReportRange,
  money,
  number,
  type ReportSearchParams,
} from "../_lib";

export const dynamic = "force-dynamic";

export default async function ProfitLossReportPage({
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
    expensesByCategory,
    expensesByPayment,
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
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        expenseDate: {
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
    prisma.expense.groupBy({
      by: ["paymentMethod"],
      where: {
        expenseDate: {
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
  ]);

  const categories = await prisma.expenseCategory.findMany({
    where: {
      id: {
        in: expensesByCategory.map((row) => row.categoryId),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const categoryName = new Map(
    categories.map((category) => [category.id, category.name])
  );

  const grossSales = Number(sales._sum.subtotal ?? 0);
  const discounts = Number(sales._sum.discount ?? 0);
  const netSales = Number(sales._sum.total ?? 0);
  const operatingExpenses = Number(expenses._sum.amount ?? 0);
  const commissionCost = Number(commissions._sum.amount ?? 0);
  const netProfit = netSales - operatingExpenses - commissionCost;
  const margin = netSales ? (netProfit / netSales) * 100 : 0;

  const categoryRows = expensesByCategory
    .map((row) => ({
      label: categoryName.get(row.categoryId) || "Uncategorized",
      value: Number(row._sum.amount ?? 0),
      detail: `${number(row._count._all)} expense${
        row._count._all === 1 ? "" : "s"
      }`,
    }))
    .sort((a, b) => b.value - a.value);

  const paymentRows = expensesByPayment
    .map((row) => ({
      label: enumLabel(row.paymentMethod),
      value: Number(row._sum.amount ?? 0),
      detail: `${number(row._count._all)} expense${
        row._count._all === 1 ? "" : "s"
      }`,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen bg-slate-50">
      <ReportHeader
        title="Profit & Loss"
        description="Revenue, discounts, expenses, commission cost, and estimated profit for the selected period."
        range={range}
      >
        <DateRangeForm range={range} resetHref="/reports/profit-loss" />
      </ReportHeader>

      <div className="space-y-6 p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Net Sales"
            value={money(netSales)}
            note={`${number(sales._count._all)} completed transactions`}
            icon={<CircleDollarSign size={21} />}
            tone="green"
          />

          <MetricCard
            title="Operating Expenses"
            value={money(operatingExpenses)}
            note={`${number(expenses._count._all)} expense records`}
            icon={<WalletCards size={21} />}
            tone="red"
          />

          <MetricCard
            title="Commission Cost"
            value={money(commissionCost)}
            note="Generated barber commissions"
            icon={<Scissors size={21} />}
            tone="amber"
          />

          <MetricCard
            title="Net Profit"
            value={money(netProfit)}
            note={`${margin.toFixed(1)}% profit margin`}
            icon={
              netProfit >= 0 ? (
                <ArrowUpRight size={21} />
              ) : (
                <ArrowDownRight size={21} />
              )
            }
            tone={netProfit >= 0 ? "green" : "red"}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ReportSection
            title="Statement"
            description="Profit and loss summary"
          >
            <div className="space-y-4 p-5">
              <StatementRow label="Gross Sales" value={money(grossSales)} />
              <StatementRow label="Discounts" value={`-${money(discounts)}`} />
              <StatementRow label="Net Sales" value={money(netSales)} strong />
              <StatementRow
                label="Operating Expenses"
                value={`-${money(operatingExpenses)}`}
              />
              <StatementRow
                label="Commission Cost"
                value={`-${money(commissionCost)}`}
              />

              <div className="border-t border-slate-200 pt-4">
                <StatementRow
                  label="Estimated Net Profit"
                  value={money(netProfit)}
                  strong
                  positive={netProfit >= 0}
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <StatementRow
                  label="Profit Margin"
                  value={`${margin.toFixed(1)}%`}
                  positive={margin >= 0}
                />
              </div>
            </div>
          </ReportSection>

          <ReportSection
            title="Expenses by Category"
            description="Operating spend distribution"
          >
            <BarList
              rows={categoryRows}
              total={operatingExpenses}
            />
          </ReportSection>

          <ReportSection
            title="Expenses by Payment"
            description="How expenses were paid"
          >
            <BarList rows={paymentRows} total={operatingExpenses} />
          </ReportSection>
        </div>

        <ReportSection
          title="Operating Position"
          description="Core financial values used for this report"
        >
          <div className="grid grid-cols-1 gap-0 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            <PositionBlock
              title="Income"
              rows={[
                ["Gross sales", money(grossSales)],
                ["Discounts", money(discounts)],
                ["Net sales", money(netSales)],
              ]}
            />

            <PositionBlock
              title="Costs"
              rows={[
                ["Expenses", money(operatingExpenses)],
                ["Commissions", money(commissionCost)],
                ["Net profit", money(netProfit)],
              ]}
            />
          </div>
        </ReportSection>
      </div>
    </div>
  );
}

function StatementRow({
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
            ? "text-sm font-bold text-slate-950"
            : "text-sm text-slate-600"
        }
      >
        {label}
      </span>

      <span
        className={
          positive === undefined
            ? strong
              ? "text-base font-black text-slate-950"
              : "text-sm font-semibold text-slate-800"
            : positive
              ? "text-base font-black text-emerald-700"
              : "text-base font-black text-red-600"
        }
      >
        {value}
      </span>
    </div>
  );
}

function PositionBlock({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="p-5">
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-bold text-slate-900">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
