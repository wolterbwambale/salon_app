"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  Minus,
  Plus,
  Printer,
  Search,
  Scissors,
  ShoppingBag,
  Trash2,
  UserRound,
  WalletCards,
  X,
  Receipt,
  RotateCcw,
  MoreHorizontal,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";

type PaymentMethod =
  | "CASH"
  | "MOBILE_MONEY"
  | "CARD"
  | "BANK";

type CommissionType = "PERCENTAGE" | "FIXED";

interface Customer {
  id: number;
  name: string;
  phone: string | null;
}

interface Barber {
  id: number;
  name: string;
  active: boolean;
}

interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  commissionType: CommissionType;
  commissionValue: number;
}

interface CartItem {
  key: string;
  service: Service;
  barberId: number | null;
  quantity: number;
  discount: number;
}

interface SaleResult {
  id: number;
  invoiceNumber: string;
  subtotal: number | string;
  discount: number | string;
  total: number | string;
  createdAt: string;
}

interface RecentSale extends SaleResult {
  customer: {
    name: string;
  } | null;
  cashier: {
    name: string;
  } | null;
  payments: {
    method: PaymentMethod;
  }[];
}

type ServiceFilter =
  | "ALL"
  | "HAIR"
  | "GROOMING"
  | "COLOR"
  | "OTHER";

const serviceFilters: {
  id: ServiceFilter;
  label: string;
}[] = [
  { id: "ALL", label: "All Services" },
  { id: "HAIR", label: "Hair" },
  { id: "GROOMING", label: "Grooming" },
  { id: "COLOR", label: "Color & Care" },
  { id: "OTHER", label: "Other" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function paymentMethodLabel(value: PaymentMethod) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function classifyService(service: Service): ServiceFilter {
  const text = `${service.name} ${service.description || ""}`.toLowerCase();

  if (
    text.includes("color") ||
    text.includes("colour") ||
    text.includes("dye") ||
    text.includes("wash") ||
    text.includes("treat")
  ) {
    return "COLOR";
  }

  if (
    text.includes("beard") ||
    text.includes("shav") ||
    text.includes("trim")
  ) {
    return "GROOMING";
  }

  if (
    text.includes("hair") ||
    text.includes("cut") ||
    text.includes("style")
  ) {
    return "HAIR";
  }

  return "OTHER";
}

export default function POSPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [cashierId] = useState("1");
  const [draftNumber] = useState(() =>
    `DRAFT-${Math.floor(100000 + Math.random() * 900000)}`
  );

  const [saleDiscount, setSaleDiscount] = useState("0");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH");

  const [paymentReference, setPaymentReference] =
    useState("");

  const [serviceSearch, setServiceSearch] =
    useState("");
  const [serviceFilter, setServiceFilter] =
    useState<ServiceFilter>("ALL");
  const [clock, setClock] = useState(() => new Date());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recentSalesOpen, setRecentSalesOpen] =
    useState(false);
  const [recentSalesLoading, setRecentSalesLoading] =
    useState(false);
  const [recentSales, setRecentSales] = useState<
    RecentSale[]
  >([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [completedSale, setCompletedSale] =
    useState<SaleResult | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [
          servicesResponse,
          customersResponse,
          barbersResponse,
        ] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/customers"),
          fetch("/api/barbers"),
        ]);

        const servicesData =
          await servicesResponse.json();

        const customersData =
          await customersResponse.json();

        const barbersData =
          await barbersResponse.json();

        if (!servicesResponse.ok) {
          throw new Error(
            servicesData.message ||
              "Unable to load services."
          );
        }

        if (!customersResponse.ok) {
          throw new Error(
            customersData.message ||
              "Unable to load customers."
          );
        }

        if (!barbersResponse.ok) {
          throw new Error(
            barbersData.message ||
              "Unable to load barbers."
          );
        }

        setServices(servicesData);
        setCustomers(customersData);

        setBarbers(
          barbersData.filter(
            (barber: Barber) => barber.active
          )
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load POS data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(
      () => setClock(new Date()),
      30000
    );

    return () => window.clearInterval(timer);
  }, []);

  const filteredServices = useMemo(() => {
    const query = serviceSearch
      .trim()
      .toLowerCase();

    return services.filter((service) => {
      if (!service.active) return false;

      if (
        serviceFilter !== "ALL" &&
        classifyService(service) !== serviceFilter
      ) {
        return false;
      }

      if (!query) return true;

      return (
        service.name.toLowerCase().includes(query) ||
        service.description
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [services, serviceSearch, serviceFilter]);

  const activeServices = useMemo(
    () => services.filter((service) => service.active),
    [services]
  );

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          item.service.price * item.quantity -
            item.discount
        ),
      0
    );
  }, [cart]);

  const discount = Math.max(
    0,
    Number(saleDiscount) || 0
  );

  const total = Math.max(
    0,
    subtotal - discount
  );

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  function addService(service: Service) {
    setError("");
    setSuccess("");

    setCart((current) => {
      const existing = current.find(
        (item) =>
          item.service.id === service.id
      );

      if (existing) {
        return current.map((item) =>
          item.key === existing.key
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          key: `${service.id}-${Date.now()}`,
          service,
          barberId: null,
          quantity: 1,
          discount: 0,
        },
      ];
    });
  }

  function removeItem(key: string) {
    setCart((current) =>
      current.filter((item) => item.key !== key)
    );
  }

  function updateQuantity(
    key: string,
    amount: number
  ) {
    setCart((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              quantity: Math.max(
                1,
                item.quantity + amount
              ),
            }
          : item
      )
    );
  }

  function updateBarber(
    key: string,
    barberId: string
  ) {
    setCart((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              barberId: barberId
                ? Number(barberId)
                : null,
            }
          : item
      )
    );
  }

  function updateItemDiscount(
    key: string,
    value: string
  ) {
    setCart((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              discount: Math.max(
                0,
                Number(value) || 0
              ),
            }
          : item
      )
    );
  }

  function clearCart() {
    setCart([]);
    setSaleDiscount("0");
    setCustomerId("");
    setPaymentReference("");
    setPaymentMethod("CASH");
    setError("");
    setSuccess("");
  }

  async function openRecentSales() {
    setRecentSalesOpen(true);

    if (recentSales.length > 0) return;

    try {
      setRecentSalesLoading(true);

      const response = await fetch("/api/pos");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load recent sales."
        );
      }

      setRecentSales(data.slice(0, 20));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recent sales."
      );
    } finally {
      setRecentSalesLoading(false);
    }
  }

  async function completeSale() {
    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError(
        "Add at least one service to the transaction."
      );
      return;
    }

    if (!cashierId) {
      setError("Cashier is required.");
      return;
    }

    if (discount > subtotal) {
      setError(
        "Sale discount cannot exceed the subtotal."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/pos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId
            ? Number(customerId)
            : null,

          cashierId: Number(cashierId),

          discount,

          paymentMethod,

          paymentReference:
            paymentReference.trim() || undefined,

          items: cart.map((item) => ({
            serviceId: item.service.id,
            barberId: item.barberId,
            quantity: item.quantity,
            discount: item.discount,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to complete sale."
        );
      }

      setCompletedSale(data.sale);

      setSuccess(
        `Sale ${data.sale.invoiceNumber} completed successfully.`
      );

      setCart([]);
      setCustomerId("");
      setSaleDiscount("0");
      setPaymentReference("");
      setPaymentMethod("CASH");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete sale."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          Loading Point of Sale...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* =========================================================
          ERP TOP BAR
      ========================================================= */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex h-[68px] items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <ShoppingBag size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold">
                  Point of Sale
                </h1>

                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Live
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Sales Register
              </p>
            </div>

            <div className="hidden h-8 w-px bg-slate-200 md:block" />

            <div className="hidden items-center gap-6 md:flex">
              <HeaderMetric
                label="Items"
                value={String(itemCount)}
              />

              <HeaderMetric
                label="Services"
                value={String(cart.length)}
              />

              <HeaderMetric
                label="Terminal"
                value="POS-01"
              />

              <HeaderMetric
                label="Clock"
                value={new Intl.DateTimeFormat("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(clock)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 lg:flex"
              title="Dashboard"
            >
              <LayoutDashboard size={17} />
            </Link>

            <button
              onClick={openRecentSales}
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 md:flex"
            >
              <Receipt size={15} />
              Recent Sales
            </button>

            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={15} />
              <span className="hidden sm:block">
                Clear
              </span>
            </button>

            <button
              onClick={openRecentSales}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              title="Recent sales"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          WORKSPACE
      ========================================================= */}
      <div className="grid min-h-[calc(100vh-68px)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_470px]">
        {/* =======================================================
            SERVICES
        ======================================================= */}
        <main className="min-w-0 p-4 lg:p-6">
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>

              <button
                onClick={() => setError("")}
                className="rounded-md p-1 hover:bg-red-100"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}

          {/* Page heading */}
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Services
                </h2>

                <span className="rounded-md bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">
                  {filteredServices.length}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Select a service to add it to the current
                transaction.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-[360px]">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={serviceSearch}
                onChange={(event) =>
                  setServiceSearch(event.target.value)
                }
                placeholder="Search services..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none shadow-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />

              <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
                /
              </div>
            </div>
          </div>

          {/* =====================================================
              QUICK FILTER BAR
          ===================================================== */}
          <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
            {serviceFilters.map((filter) => (
              <FilterButton
                key={filter.id}
                active={serviceFilter === filter.id}
                onClick={() => setServiceFilter(filter.id)}
              >
                {filter.label}
              </FilterButton>
            ))}
          </div>

          {/* =====================================================
              SERVICE GRID
          ===================================================== */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold">
                  Service Catalogue
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Click any service to add it
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="hidden sm:block">
                  {filteredServices.length} of {activeServices.length} available
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {filteredServices.map((service) => {
                const cartItem = cart.find(
                  (item) =>
                    item.service.id === service.id
                );

                return (
                  <button
                    key={service.id}
                    onClick={() =>
                      addService(service)
                    }
                    className="group relative min-h-[155px] rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md active:translate-y-0"
                  >
                    {cartItem && (
                      <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white">
                        {cartItem.quantity}
                      </span>
                    )}

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                      <Scissors size={18} />
                    </div>

                    <div className="mt-4">
                      <h4 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-slate-900">
                        {service.name}
                      </h4>

                      {service.description ? (
                        <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                          {service.description}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-slate-400">
                          Service
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          Price
                        </p>

                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {money(service.price)}
                        </p>
                      </div>

                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white">
                        <Plus size={15} />
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredServices.length === 0 && (
                <div className="col-span-full flex min-h-[320px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Search size={22} />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    No services found
                  </p>

                  <p className="mt-1 max-w-xs text-xs text-slate-400">
                    Try another search term or clear
                    the search field.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* =======================================================
            TRANSACTION PANEL
        ======================================================= */}
        <aside className="border-t border-slate-200 bg-white xl:border-l xl:border-t-0">
          <div className="flex h-full min-h-[700px] flex-col">
            {/* Transaction Header */}
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Current Transaction
                  </p>

                  <h2 className="mt-1 text-base font-bold">
                    New Sale
                  </h2>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Open
                  </div>
                </div>
              </div>

              {/* Transaction info */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoBox
                  label="Terminal"
                  value="POS-01"
                />

                <InfoBox
                  label="Sale"
                  value={draftNumber}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <InfoBox
                  label="Cashier"
                  value={`User #${cashierId}`}
                />

                <InfoBox
                  label="Date"
                  value={new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "short",
                  }).format(clock)}
                />
              </div>
            </div>

            {/* Customer */}
            <div className="border-b border-slate-100 px-5 py-4">
              <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <UserRound size={13} />
                Customer
              </label>

              <div className="relative">
                <select
                  value={customerId}
                  onChange={(event) =>
                    setCustomerId(
                      event.target.value
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm font-medium outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  <option value="">
                    Walk-in Customer
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                      {customer.phone
                        ? ` - ${customer.phone}`
                        : ""}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* Cart */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      Items
                    </span>

                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      {itemCount}
                    </span>
                  </div>

                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 p-4">
                {cart.length === 0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
                      <ShoppingBag size={23} />
                    </div>

                    <p className="mt-4 text-sm font-bold text-slate-600">
                      No items yet
                    </p>

                    <p className="mt-1 max-w-[230px] text-xs leading-5 text-slate-400">
                      Select services from the catalogue
                      to start this transaction.
                    </p>
                  </div>
                ) : (
                  cart.map((item, index) => {
                    const itemTotal = Math.max(
                      0,
                      item.service.price *
                        item.quantity -
                        item.discount
                    );

                    return (
                      <div
                        key={item.key}
                        className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">
                                  {item.service.name}
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  {money(
                                    item.service.price
                                  )}{" "}
                                  x {item.quantity}
                                </p>
                              </div>

                              <button
                                onClick={() =>
                                  removeItem(
                                    item.key
                                  )
                                }
                                className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* Barber */}
                            <div className="relative mt-3">
                              <select
                                value={
                                  item.barberId || ""
                                }
                                onChange={(event) =>
                                  updateBarber(
                                    item.key,
                                    event.target.value
                                  )
                                }
                                className="h-8 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 pr-7 text-[11px] font-medium text-slate-600 outline-none focus:border-slate-400"
                              >
                                <option value="">
                                  No Barber Assigned
                                </option>

                                {barbers.map(
                                  (barber) => (
                                    <option
                                      key={
                                        barber.id
                                      }
                                      value={
                                        barber.id
                                      }
                                    >
                                      {barber.name}
                                    </option>
                                  )
                                )}
                              </select>

                              <ChevronDown
                                size={13}
                                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                              />
                            </div>

                            {/* Controls */}
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.key,
                                      -1
                                    )
                                  }
                                  className="flex h-full w-8 items-center justify-center text-slate-500 hover:bg-slate-100"
                                >
                                  <Minus
                                    size={13}
                                  />
                                </button>

                                <span className="w-8 text-center text-xs font-bold">
                                  {item.quantity}
                                </span>

                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.key,
                                      1
                                    )
                                  }
                                  className="flex h-full w-8 items-center justify-center text-slate-500 hover:bg-slate-100"
                                >
                                  <Plus
                                    size={13}
                                  />
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    item.discount
                                  }
                                  onChange={(event) =>
                                    updateItemDiscount(
                                      item.key,
                                      event.target
                                        .value
                                    )
                                  }
                                  className="h-8 w-24 rounded-lg border border-slate-200 bg-white px-2 text-right text-[11px] outline-none focus:border-slate-400"
                                  placeholder="Discount"
                                />

                                <div className="min-w-[95px] text-right">
                                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                    Total
                                  </p>

                                  <p className="text-sm font-bold text-slate-900">
                                    {money(
                                      itemTotal
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* =================================================
                CHECKOUT
            ================================================= */}
            <div className="border-t border-slate-200 bg-slate-50">
              <div className="space-y-2 px-5 pt-4">
                <SummaryRow
                  label="Subtotal"
                  value={money(subtotal)}
                />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-slate-500">
                    Sale Discount
                  </span>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                      UGX
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={saleDiscount}
                      onChange={(event) =>
                        setSaleDiscount(
                          event.target.value
                        )
                      }
                      className="h-8 w-32 rounded-lg border border-slate-200 bg-white pl-10 pr-2 text-right text-xs font-semibold outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="my-3 border-t border-slate-200" />

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Amount Due
                    </p>

                    <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                      {money(total)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white px-3 py-2 text-right shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Items
                    </p>

                    <p className="text-sm font-bold">
                      {itemCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment methods */}
              <div className="px-5 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Payment Method
                  </label>

                  <span className="text-[10px] text-slate-400">
                    Select one
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <PaymentButton
                    active={
                      paymentMethod === "CASH"
                    }
                    onClick={() =>
                      setPaymentMethod("CASH")
                    }
                    icon={
                      <Banknote size={17} />
                    }
                    label="Cash"
                  />

                  <PaymentButton
                    active={
                      paymentMethod ===
                      "MOBILE_MONEY"
                    }
                    onClick={() =>
                      setPaymentMethod(
                        "MOBILE_MONEY"
                      )
                    }
                    icon={
                      <WalletCards size={17} />
                    }
                    label="Mobile"
                  />

                  <PaymentButton
                    active={
                      paymentMethod === "CARD"
                    }
                    onClick={() =>
                      setPaymentMethod("CARD")
                    }
                    icon={
                      <CreditCard size={17} />
                    }
                    label="Card"
                  />

                  <PaymentButton
                    active={
                      paymentMethod === "BANK"
                    }
                    onClick={() =>
                      setPaymentMethod("BANK")
                    }
                    icon={
                      <CircleDollarSign
                        size={17}
                      />
                    }
                    label="Bank"
                  />
                </div>
              </div>

              {/* Reference */}
              {paymentMethod !== "CASH" && (
                <div className="px-5 pt-3">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Payment Reference
                  </label>

                  <input
                    value={paymentReference}
                    onChange={(event) =>
                      setPaymentReference(
                        event.target.value
                      )
                    }
                    placeholder="Enter transaction reference"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              )}

              {/* Complete */}
              <div className="p-5">
                <button
                  onClick={completeSale}
                  disabled={
                    saving || cart.length === 0
                  }
                  className="flex h-14 w-full items-center justify-between rounded-xl bg-slate-950 px-5 text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      <Check size={17} />
                    </span>

                    <span className="text-sm font-bold">
                      {saving
                        ? "Processing..."
                        : "Complete Sale"}
                    </span>
                  </span>

                  <span className="text-sm font-black">
                    {money(total)}
                  </span>
                </button>

                <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText size={11} />
                    Invoice generated automatically
                  </span>

                  <span>|</span>

                  <span>POS-01</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* =========================================================
          SALE SUCCESS MODAL
      ========================================================= */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                  Transaction Complete
                </p>

                <h2 className="mt-1 text-base font-bold">
                  Sale Successfully Posted
                </h2>
              </div>

              <button
                onClick={() =>
                  setCompletedSale(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={34} />
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                Payment Successful
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Transaction has been posted successfully.
              </p>

              <div className="mx-auto mt-6 max-w-xs rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Invoice
                  </span>

                  <span className="text-xs font-bold text-slate-900">
                    {completedSale.invoiceNumber}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-xs text-slate-400">
                    Total Paid
                  </span>

                  <span className="text-lg font-black text-slate-950">
                    {money(
                      Number(
                        completedSale.total
                      )
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    setCompletedSale(null)
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <ShoppingBag size={16} />
                  New Sale
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white hover:bg-slate-800"
                >
                  <Printer size={16} />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {recentSalesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Register History
                </p>

                <h2 className="mt-1 text-base font-bold text-slate-950">
                  Recent Sales
                </h2>
              </div>

              <button
                onClick={() => setRecentSalesOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto">
              {recentSalesLoading ? (
                <div className="flex min-h-[280px] items-center justify-center gap-3 text-sm text-slate-500">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                  Loading recent sales...
                </div>
              ) : recentSales.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Receipt size={22} />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-700">
                    No recent sales
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                    Completed POS transactions will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="grid gap-3 px-5 py-4 hover:bg-slate-50 md:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">
                            {sale.invoiceNumber}
                          </p>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">
                            Paid
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <UserRound size={13} />
                            {sale.customer?.name || "Walk-in Customer"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock3 size={13} />
                            {dateTime(sale.createdAt)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CalendarDays size={13} />
                            {sale.payments
                              .map((payment) =>
                                paymentMethodLabel(payment.method)
                              )
                              .join(", ") || "No payment"}
                          </span>
                        </div>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-lg font-black text-slate-950">
                          {money(Number(sale.total))}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Cashier: {sale.cashier?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===============================================================
   COMPONENTS
================================================================ */

function HeaderMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-xs font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "text-sm font-bold text-slate-900"
            : "text-xs font-medium text-slate-500"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-base font-black text-slate-950"
            : "text-xs font-bold text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function PaymentButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border py-2.5 transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {icon}

      <span className="truncate text-[10px] font-bold">
        {label}
      </span>
    </button>
  );
}
