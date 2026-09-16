"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Edit,
  FileText,
  Plus,
  Search,
  Scissors,
  Trash2,
  X,
} from "lucide-react";

type CommissionType = "PERCENTAGE" | "FIXED";

interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  commissionType: CommissionType;
  commissionValue: number;
  salesCount: number;
}

interface ServiceForm {
  name: string;
  description: string;
  price: string;
  active: boolean;
  commissionType: CommissionType;
  commissionValue: string;
}

function money(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const [form, setForm] = useState<ServiceForm>({
    name: "",
    description: "",
    price: "",
    active: true,
    commissionType: "PERCENTAGE",
    commissionValue: "0",
  });

  async function loadServices() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/services?search=${encodeURIComponent(search)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load services."
        );
      }

      setServices(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load services."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadServices, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function openAdd() {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "",
      active: true,
      commissionType: "PERCENTAGE",
      commissionValue: "0",
    });
    setError("");
    setShowModal(true);
  }

  function openEdit(service: Service) {
    setEditing(service);

    setForm({
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      active: service.active,
      commissionType: service.commissionType,
      commissionValue: String(service.commissionValue),
    });

    setError("");
    setShowModal(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Service name is required.");
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      setError("Enter a valid service price.");
      return;
    }

    if (
      form.commissionType === "PERCENTAGE" &&
      Number(form.commissionValue) > 100
    ) {
      setError("Percentage commission cannot exceed 100%.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/services", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          id: editing?.id,
          price: Number(form.price),
          commissionValue: Number(
            form.commissionValue || 0
          ),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save service."
        );
      }

      setSuccess(
        editing
          ? "Service updated successfully."
          : "Service added successfully."
      );

      setShowModal(false);
      await loadServices();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save service."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteService(service: Service) {
    if (
      !window.confirm(
        `Delete ${service.name}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/services?id=${service.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete service."
        );
      }

      setSuccess("Service deleted successfully.");
      await loadServices();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete service."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex min-h-16 items-center justify-between border-b bg-white px-7">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Services
          </h1>
          <p className="text-xs text-slate-500">
            Manage salon services, prices and commissions
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={18} />
          Add Service
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            title="Total Services"
            value={services.length.toString()}
            icon={<Scissors size={20} />}
          />

          <InfoCard
            title="Active Services"
            value={services
              .filter((service) => service.active)
              .length.toString()}
            icon={<FileText size={20} />}
          />

          <InfoCard
            title="Service Sales"
            value={services
              .reduce(
                (sum, service) =>
                  sum + service.salesCount,
                0
              )
              .toString()}
            icon={<Scissors size={20} />}
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Service Register
              </h2>
              <p className="text-xs text-slate-500">
                Services available at the salon
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
                placeholder="Search service..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Commission</th>
                  <th className="px-5 py-3">Sales</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Loading services...
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      No services found.
                    </td>
                  </tr>
                ) : (
                  services.map((service) => (
                    <tr
                      key={service.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {service.name}
                        </p>

                        {service.description && (
                          <p className="mt-0.5 max-w-md text-xs text-slate-500">
                            {service.description}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900">
                        {money(service.price)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-700">
                          {service.commissionType ===
                          "PERCENTAGE"
                            ? `${service.commissionValue}%`
                            : money(
                                service.commissionValue
                              )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {service.salesCount}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            service.active
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {service.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openEdit(service)
                            }
                            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() =>
                              deleteService(service)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-bold">
                {editing
                  ? "Edit Service"
                  : "Add Service"}
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
              <Field
                label="Service Name"
                value={form.name}
                onChange={(value) =>
                  setForm({ ...form, name: value })
                }
                placeholder="e.g. Haircut"
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Optional description"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                />
              </div>

              <Field
                label="Price (UGX)"
                type="number"
                min="0"
                value={form.price}
                onChange={(value) =>
                  setForm({ ...form, price: value })
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Commission Type
                  </label>

                  <select
                    value={form.commissionType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        commissionType:
                          event.target
                            .value as CommissionType,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                  >
                    <option value="PERCENTAGE">
                      Percentage
                    </option>
                    <option value="FIXED">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <Field
                  label={
                    form.commissionType ===
                    "PERCENTAGE"
                      ? "Commission (%)"
                      : "Commission (UGX)"
                  }
                  type="number"
                  min="0"
                  value={form.commissionValue}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      commissionValue: value,
                    })
                  }
                />
              </div>

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
                <span className="text-sm font-medium">
                  Service is active
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
                      ? "Update Service"
                      : "Save Service"}
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
          <p className="mt-1 text-xl font-bold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
      />
    </div>
  );
}

