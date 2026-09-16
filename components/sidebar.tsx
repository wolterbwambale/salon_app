"use client";

import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Scissors,
  Settings,
  ShoppingCart,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const menu = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "POS / Sales", href: "/pos", icon: ShoppingCart },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Barbers & Staff", href: "/barbers", icon: UserRound },
  { label: "Services", href: "/services", icon: Scissors },
  { label: "Commissions", href: "/commissions", icon: CircleDollarSign },
  { label: "Expenses", href: "/expenses", icon: WalletCards },
  { label: "Inventory", href: "/inventory", icon: Package },
];

const reports = [
  { label: "Sales Reports", href: "/reports/sales", icon: BarChart3 },
  { label: "Commission Reports", href: "/reports/commissions", icon: ReceiptText },
  { label: "Expense Reports", href: "/reports/expenses", icon: ClipboardList },
  { label: "Invoices", href: "/invoices", icon: FileText },
];

export default function Sidebar({
  user,
}: {
  user: { name: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [reportsOpen, setReportsOpen] = useState(
    pathname.startsWith("/reports") || pathname === "/invoices"
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-950 text-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-950">
          <Scissors size={19} />
        </div>
        <div>
          <div className="font-bold">SALON PRO</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Management
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Main
        </div>

        <nav className="space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Reports
        </div>

        <button
          onClick={() => setReportsOpen((value) => !value)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
        >
          <span className="flex items-center gap-3">
            <BarChart3 size={18} />
            Reports
          </span>
          <ChevronDown
            size={16}
            className={`transition ${reportsOpen ? "rotate-180" : ""}`}
          />
        </button>

        {reportsOpen && (
          <nav className="mt-1 space-y-1 pl-3">
            {reports.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          System
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
        >
          <Settings size={18} />
          Settings
        </Link>

        <Link
          href="/appointments"
          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
        >
          <CalendarDays size={18} />
          Appointments
        </Link>
      </div>

      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-900 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold text-slate-950">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="text-[11px] uppercase text-slate-500">
              {user.role}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-950/50 hover:text-red-300"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
