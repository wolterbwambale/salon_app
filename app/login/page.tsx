"use client";

import { FormEvent, useState } from "react";
import { Scissors, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@salon.local");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-xl">
            <Scissors size={30} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Salon Management
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sales, barbers, commissions and business reports
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-white p-7 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter your account details to continue.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <label className="mt-6 block text-sm font-semibold text-slate-700">
            Email
          </label>
          <div className="relative mt-2">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              placeholder="admin@salon.local"
              required
            />
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Password
          </label>
          <div className="relative mt-2">
            <LockKeyhole
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-11 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-lg bg-slate-950 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <strong>Demo account</strong>
            <br />
            admin@salon.local / Admin@123
          </div>
        </form>
      </div>
    </main>
  );
}
