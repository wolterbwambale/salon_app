"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Edit,
  Plus,
  Receipt,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

type PaymentMethod =
  | "CASH"
  | "MOBILE_MONEY"
  | "CARD"
  | "BANK";

interface Category {
  id: number;
  name: string;
  active: boolean;
}

interface Expense {
  id: number;
  categoryId: number;
  userId: number;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  category: Category;
  user: {
    id: number;
    name: string;
  };
}

interface ExpenseResponse {
  expenses: Expense[];
  categories: Category[];
  total: number;
}

interface ExpenseForm {
  categoryId: string;
  userId: string;
  description: string;
  amount: string;
  paymentMethod: PaymentMethod;
  expenseDate: string;
}

function money(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

function today() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function ExpensesPage() {
  const [data, setData] =
    useState<ExpenseResponse | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(
    null
  );

  const [form, setForm] = useState<ExpenseForm>({
    categoryId: "",
    userId: "1",
    description: "",
    amount: "",
    paymentMethod: "CASH",
    expenseDate: today(),
  });

  async function loadExpenses() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/expenses?search=${encodeURIComponent(search)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load expenses."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load expenses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadExpenses, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function openAdd() {
    setEditing(null);

    setForm({
      categoryId:
        data?.categories[0]?.id.toString() || "",
      userId: "1",
      description: "",
      amount: "",
      paymentMethod: "CASH",
      expenseDate: today(),
    });

    setError("");
    setShowModal(true);
  }

  function openEdit(expense: Expense) {
    setEditing(expense);

    setForm({
      categoryId: expense.categoryId.toString(),
      userId: expense.userId.toString(),
      description: expense.description,
      amount: String(expense.amount),
      paymentMethod: expense.paymentMethod,
      expenseDate:
        expense.expenseDate.substring(0, 10),
    });

    setError("");
    setShowModal(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.categoryId) {
      setError("Select an expense category.");
      return;
    }

    if (!form.description.trim()) {
      setError("Expense description is required.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Enter a valid expense amount.");
      return;
    }

    if (!form.userId) {
      setError("User is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/expenses", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          id: editing?.id,
          categoryId: Number(form.categoryId),
          userId: Number(form.userId),
          amount: Number(form.amount),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to save expense."
        );
      }

      setSuccess(
        editing
          ? "Expense updated successfully."
          : "Expense recorded successfully."
      );

      setShowModal(false);
      await loadExpenses();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save expense."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(expense: Expense) {
    if (
      !window.confirm(
        `Delete expense "${expense.description}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/expenses?id=${expense.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to delete expense."
        );
      }

      setSuccess("Expense deleted successfully.");
      await loadExpenses();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete expense."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex min-h-16 items-center justify-between border-b bg-white px-7">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Expenses
          </h1>
          <p className="text-xs text-slate-500">
            Record and manage salon business expenses
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={18} />
          Record Expense
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
            title="Total Expenses"
            value={money(data?.total || 0)}
            icon={<WalletCards size={20} />}
          />

          <InfoCard
            title="Expense Records"
            value={String(data?.expenses.length || 0)}
            icon={<Receipt size={20} />}
          />

          <InfoCard
            title="Categories"
            value={String(data?.categories.length || 0)}
            icon={<Receipt size={20} />}
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Expense Register
              </h2>
              <p className="text-xs text-slate-500">
                Search and manage recorded expenses
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
                placeholder="Search expenses..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

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
                      Loading expenses...
                    </td>
                  </tr>
                ) : !data?.expenses.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      No expenses found.
                    </td>
                  </tr>
                ) : (
                  data.expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-slate-600">
                        {new Date(
                          expense.expenseDate
                        ).toLocaleDateString("en-GB")}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {expense.description}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {expense.category.name}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {expense.paymentMethod.replace(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {expense.user.name}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900">
                        {money(expense.amount)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openEdit(expense)
                            }
                            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() =>
                              deleteExpense(expense)
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
                {editing
                  ? "Edit Expense"
                  : "Record Expense"}
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
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Category
                </label>

                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      categoryId:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                  <option value="">
                    Select category
                  </option>

                  {data?.categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="Describe the expense"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Amount (UGX)"
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      amount: value,
                    })
                  }
                />

                <Field
                  label="Expense Date"
                  type="date"
                  value={form.expenseDate}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      expenseDate: value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Payment Method
                </label>

                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      paymentMethod:
                        event.target
                          .value as PaymentMethod,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">
                    Mobile Money
                  </option>
                  <option value="CARD">Card</option>
                  <option value="BANK">Bank</option>
                </select>
              </div>

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
                      ? "Update Expense"
                      : "Save Expense"}
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
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
      />
    </div>
  );
}
