"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import type { UserSession } from "@/lib/types";

const DEMO_USERS = [
  { username: "abhishek.soni", password: "demo123", role: "doctor", label: "Dr. Abhishek Soni — Doctor" },
  { username: "swati", password: "demo123", role: "nurse", label: "Swati — Nurse" },
  { username: "billing.ravi", password: "demo123", role: "billing_executive", label: "Ravi Menon — Billing Executive" },
  { username: "tech.anand", password: "demo123", role: "technician", label: "Anand Rao — Technician" },
  { username: "admin.sys", password: "demo123", role: "admin", label: "System Admin — Admin" },
];

const ROLE_COLORS: Record<string, string> = {
  doctor: "bg-blue-100 text-blue-800 border-blue-200",
  nurse: "bg-teal-100 text-teal-800 border-teal-200",
  billing_executive: "bg-purple-100 text-purple-800 border-purple-200",
  technician: "bg-amber-100 text-amber-800 border-amber-200",
  admin: "bg-red-100 text-red-800 border-red-200",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(u?: string, p?: string) {
    const user = u ?? username;
    const pass = p ?? password;
    if (!user || !pass) {
      setError("Please enter username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await login(user, pass);
      const session: UserSession = {
        token: data.token,
        username: data.username,
        display_name: data.display_name,
        role: data.role,
        collections: data.collections,
      };
      sessionStorage.setItem("medibot_session", JSON.stringify(session));
      router.push("/chat");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-4 shadow-lg">
            M
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MediBot</h1>
          <p className="text-slate-500 text-sm mt-1">MediAssist Health Network — Internal AI Assistant</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-6">Sign in to continue</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g. abhishek.soni"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2.5 text-sm font-medium transition"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Demo Users */}
          <div className="mt-6">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Demo accounts (password: demo123)
            </p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.username}
                  onClick={() => {
                    fillDemo(u.username, u.password);
                    handleLogin(u.username, u.password);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition text-left group"
                >
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
                  >
                    {u.role}
                  </span>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 truncate">
                    {u.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
