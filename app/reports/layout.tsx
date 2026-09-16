import Sidebar from "@/components/sidebar";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar user={{ name: session.name, role: session.role }} />
      <main className="min-h-screen pl-64">{children}</main>
    </div>
  );
}
