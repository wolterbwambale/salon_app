"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Edit,
  Mail,
  Phone,
  Plus,
  Scissors,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

interface Barber {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  salesCount: number;
  commissionCount: number;
  pendingCommission: number;
  paidCommission: number;
}

interface BarberForm {
  name: string;
  phone: string;
  email: string;
  active: boolean;
}

function money(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);

  const [form, setForm] = useState<BarberForm>({
    name: "",
    phone: "",
    email: "",
    active: true,
  });

  async function loadBarbers() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/barbers?search=${encodeURIComponent(search)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load barbers.");
      }

      setBarbers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load barbers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadBarbers, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function openAdd() {
    setEditing(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      active: true,
    });
    setError("");
    setShowModal(true);
  }

  function openEdit(barber: Barber) {
    setEditing(barber);
    setForm({
      name: barber.name,
      phone: barber.phone || "",
      email: barber.email || "",
      active: barber.active,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Barber name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/barbers", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editing
            ? { ...form, id: editing.id }
            : form
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save barber."
        );
      }

      setSuccess(
        editing
          ? "Barber updated successfully."
          : "Barber added successfully."
      );

      setShowModal(false);
      await loadBarbers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save barber."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteBarber(barber: Barber) {
    if (
      !window.confirm(
        `Delete ${barber.name}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/barbers?id=${barber.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete barber."
        );
      }

      setSuccess("Barber deleted successfully.");
      await loadBarbers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete barber."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex min-h-16 items-center justify-between border-b bg-white px-7">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Barbers
          </h1>
          <p className="text-xs text-slate-500">
            Manage salon staff and commission activity
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={18} />
          Add Barber
        </button>
      </header>

      <div className="space-y-5 p-7">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <InfoCard
            title="Total Barbers"
            value={barbers.length.toString()}
            icon={<Scissors size={20} />}
          />

          <InfoCard
            title="Active"
            value={barbers.filter((b) => b.active).length.toString()}
            icon={<UserRound size={20} />}
          />

          <InfoCard
            title="Pending Commission"
            value={money(
              barbers.reduce(
                (sum, barber) =>
                  sum + barber.pendingCommission,
                0
              )
            )}
            icon={<Scissors size={20} />}
          />

          <InfoCard
            title="Paid Commission"
            value={money(
              barbers.reduce(
                (sum, barber) =>
                  sum + barber.paidCommission,
                0
              )
            )}
            icon={<Scissors size={20} />}
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Barber Register
              </h2>
              <p className="text-xs text-slate-500">
                Staff and commission overview
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search barber..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Barber</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Sales</th>
                  <th className="px-5 py-3">Pending</th>
                  <th className="px-5 py-3">Paid</th>
                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Loading barbers...
                    </td>
                  </tr>
                ) : barbers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      No barbers found.
                    </td>
                  </tr>
                ) : (
                  barbers.map((barber) => (
                    <tr
                      key={barber.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                            <Scissors size={17} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {barber.name}
                            </p>
                            {barber.email && (
                              <p className="text-xs text-slate-500">
                                {barber.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {barber.phone || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            barber.active
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {barber.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {barber.salesCount}
                      </td>

                      <td className="px-5 py-4 font-semibold text-amber-700">
                        {money(barber.pendingCommission)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-green-700">
                        {money(barber.paidCommission)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(barber)}
                            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() =>
                              deleteBarber(barber)
                            }
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-bold">
                {editing ? "Edit Barber" : "Add Barber"}
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-5"
            >
              <Input
                label="Full Name"
                value={form.name}
                onChange={(value) =>
                  setForm({ ...form, name: value })
                }
                icon={<UserRound size={17} />}
              />

              <Input
                label="Phone"
                value={form.phone}
                onChange={(value) =>
                  setForm({ ...form, phone: value })
                }
                icon={<Phone size={17} />}
              />

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  setForm({ ...form, email: value })
                }
                icon={<Mail size={17} />}
              />

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      active: event.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-slate-700">
                  Barber is active
                </span>
              </label>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border px-4 py-2.5 text-sm"
                >
                  Cancel
                </button>

                <button
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Update Barber"
                      : "Save Barber"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-slate-100 p-3">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-xl font-bold">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-900"
        />
      </div>
    </div>
  );
}

