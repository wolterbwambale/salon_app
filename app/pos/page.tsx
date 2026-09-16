"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Minus,
  Plus,
  Search,
  Scissors,
  ShoppingCart,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

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

function money(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function POSPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [customerId, setCustomerId] =
    useState<string>("");

  const [cashierId, setCashierId] =
    useState<string>("1");

  const [saleDiscount, setSaleDiscount] =
    useState<string>("0");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH");

  const [paymentReference, setPaymentReference] =
    useState("");

  const [serviceSearch, setServiceSearch] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const filteredServices = useMemo(() => {
    const query = serviceSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return services.filter(
        (service) => service.active
      );
    }

    return services.filter(
      (service) =>
        service.active &&
        service.name.toLowerCase().includes(query)
    );
  }, [services, serviceSearch]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          item.service.price * item.quantity -
          item.discount,
        0
      ),
    [cart]
  );

  const discount = Math.max(
    0,
    Number(saleDiscount) || 0
  );

  const total = Math.max(
    0,
    subtotal - discount
  );

  function addService(service: Service) {
    setError("");

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

  async function completeSale() {
    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError(
        "Add at least one service to the cart."
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
          data.message || "Unable to complete sale."
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">
          Loading POS...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex min-h-16 items-center justify-between border-b bg-white px-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Point of Sale
          </h1>
          <p className="text-xs text-slate-500">
            Create a new salon transaction
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
          <ShoppingCart size={17} />
          {cart.length} item
          {cart.length === 1 ? "" : "s"}
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-[1fr_440px]">
        <main className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Services
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select services to add to the sale
                  </p>
                </div>

                <div className="relative w-full md:w-72">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={serviceSearch}
                    onChange={(event) =>
                      setServiceSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search services..."
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() =>
                    addService(service)
                  }
                  className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-900 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Scissors size={19} />
                    </div>

                    <Plus
                      size={18}
                      className="text-slate-400 group-hover:text-slate-900"
                    />
                  </div>

                  <h3 className="mt-3 font-bold text-slate-900">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {service.description}
                    </p>
                  )}

                  <p className="mt-3 text-base font-bold text-slate-900">
                    {money(service.price)}
                  </p>
                </button>
              ))}

              {filteredServices.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-slate-400">
                  No active services found.
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="border-l bg-white">
          <div className="flex h-full flex-col">
            <div className="border-b px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Current Sale
              </h2>
              <p className="text-xs text-slate-500">
                Customer and payment details
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-5 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </label>

                  <div className="relative">
                    <UserRound
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      value={customerId}
                      onChange={(event) =>
                        setCustomerId(
                          event.target.value
                        )
                      }
                      className="w-full appearance-none rounded-lg border border-slate-300 py-2.5 pl-9 pr-9 text-sm"
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
                            ? ` — ${customer.phone}`
                            : ""}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {cart.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
                    <ShoppingCart
                      size={28}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-500">
                      Cart is empty
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Select a service to begin
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.service.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {money(
                              item.service.price
                            )}{" "}
                            each
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            removeItem(item.key)
                          }
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Barber
                        </label>

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
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                        >
                          <option value="">
                            No Barber / None
                          </option>

                          {barbers.map((barber) => (
                            <option
                              key={barber.id}
                              value={barber.id}
                            >
                              {barber.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            Quantity
                          </label>

                          <div className="flex items-center rounded-lg border border-slate-300">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.key,
                                  -1
                                )
                              }
                              className="p-2 text-slate-500 hover:bg-slate-100"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="flex-1 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.key,
                                  1
                                )
                              }
                              className="p-2 text-slate-500 hover:bg-slate-100"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            Item Discount
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(event) =>
                              updateItemDiscount(
                                item.key,
                                event.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex justify-between border-t pt-3">
                        <span className="text-xs text-slate-500">
                          Item total
                        </span>

                        <span className="text-sm font-bold text-slate-900">
                          {money(
                            Math.max(
                              0,
                              item.service.price *
                                item.quantity -
                                item.discount
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t bg-slate-50 p-5">
              <div className="space-y-2">
                <SummaryRow
                  label="Subtotal"
                  value={money(subtotal)}
                />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600">
                    Sale Discount
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
                    className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-sm"
                  />
                </div>

                <div className="border-t pt-3">
                  <SummaryRow
                    label="TOTAL"
                    value={money(total)}
                    strong
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Method
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <PaymentButton
                    active={paymentMethod === "CASH"}
                    onClick={() =>
                      setPaymentMethod("CASH")
                    }
                    icon={<WalletCards size={16} />}
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
                    icon={<CreditCard size={16} />}
                    label="Mobile Money"
                  />

                  <PaymentButton
                    active={paymentMethod === "CARD"}
                    onClick={() =>
                      setPaymentMethod("CARD")
                    }
                    icon={<CreditCard size={16} />}
                    label="Card"
                  />

                  <PaymentButton
                    active={paymentMethod === "BANK"}
                    onClick={() =>
                      setPaymentMethod("BANK")
                    }
                    icon={<WalletCards size={16} />}
                    label="Bank"
                  />
                </div>
              </div>

              {paymentMethod !== "CASH" && (
                <div className="mt-3">
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">
                    Payment Reference
                  </label>

                  <input
                    value={paymentReference}
                    onChange={(event) =>
                      setPaymentReference(
                        event.target.value
                      )
                    }
                    placeholder="Optional reference"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>
              )}

              <button
                onClick={completeSale}
                disabled={
                  saving || cart.length === 0
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={19} />

                {saving
                  ? "Processing Sale..."
                  : `Complete Sale • ${money(total)}`}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Sale Completed
              </h2>

              <button
                onClick={() =>
                  setCompletedSale(null)
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircle2 size={30} />
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Payment Successful
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Invoice {completedSale.invoiceNumber}
              </p>

              <p className="mt-5 text-3xl font-bold text-slate-900">
                {money(
                  Number(completedSale.total)
                )}
              </p>

              <button
                onClick={() =>
                  setCompletedSale(null)
                }
                className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
            ? "text-base font-bold text-slate-900"
            : "text-sm text-slate-600"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-lg font-bold text-slate-900"
            : "text-sm font-semibold text-slate-900"
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
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

