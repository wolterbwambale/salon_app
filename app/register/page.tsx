"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Scissors,
  Loader2,
  ShieldCheck,
} from "lucide-react";

type UserRole = "CASHIER" | "FINANCE" | "MANAGER" | "ADMIN";

interface RegisterForm {
  name: string;
  email: string;
  role: UserRole | "";
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.role ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (form.name.trim().length < 2) {
      setError("Please enter a valid full name.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create account.");
        return;
      }

      setMessage(
        "Account created successfully. Redirecting to login..."
      );

      setForm({
        name: "",
        email: "",
        role: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error("REGISTER_FORM_ERROR", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 px-6 py-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white">
              <Scissors className="h-7 w-7 text-slate-900" />
            </div>

            <h1 className="text-2xl font-bold text-white">
              Create Account
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Register a new salon system user
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5"
          >
            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Success */}
            {message && (
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {message}
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>

              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  autoComplete="name"
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                User Role
              </label>

              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    Select user role
                  </option>

                  <option value="CASHIER">
                    Cashier
                  </option>

                  <option value="FINANCE">
                    Finance
                  </option>

                  <option value="MANAGER">
                    Manager
                  </option>

                  <option value="ADMIN">
                    Administrator
                  </option>
                </select>

                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <p className="mt-1.5 text-xs text-slate-400">
                Select the level of access for this user.
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 disabled:cursor-not-allowed"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-xs text-slate-400">
                Use at least 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 disabled:cursor-not-allowed"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                disabled={loading}
                className="font-semibold text-slate-900 hover:underline disabled:cursor-not-allowed"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Salon Management System
        </p>
      </div>
    </main>
  );
}

