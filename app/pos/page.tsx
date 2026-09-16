import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export default async function POSPage() {
  await requireSession();

  const [services, barbers, customers] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.barber.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <header className="flex h-16 items-center justify-between border-b bg-white px-7">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-bold">POS / Sales</h1>
            <p className="text-xs text-slate-500">
              Customer → Barber → Service → Payment
            </p>
          </div>
        </div>
      </header>

      <div className="p-7">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-slate-950 p-2.5 text-white">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="font-bold">POS foundation is ready</h2>
              <p className="text-sm text-slate-500">
                The database already supports sales, payments and barber
                commissions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <Info title="Services" value={services.length} />
            <Info title="Active Barbers" value={barbers.length} />
            <Info title="Customers" value={customers.length} />
          </div>

          <div className="mt-7 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
            The next build step is the live POS screen where selecting a
            service and barber automatically calculates the commission and
            creates the invoice/payment records.
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
    </div>
  );
}
