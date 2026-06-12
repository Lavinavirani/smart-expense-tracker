/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FiCheck, FiAlertTriangle, FiX } from "react-icons/fi";

const API_URL = "http://localhost:5001/api";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [submitLoading, setSubmitLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    const logoutMsg = localStorage.getItem("logoutToast");
    if (logoutMsg) {
      showToast(logoutMsg, "success");
      localStorage.removeItem("logoutToast");
    }
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Basic client-side validation
    if (!formData.email || !formData.password) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, formData);
      if (!res.data?.token) {
        throw new Error("No token returned from login");
      }
      localStorage.setItem("token", res.data.token);
      if (res.data.user?.name) {
        localStorage.setItem("userName", res.data.user.name);
      }
      localStorage.setItem("loginToast", "Login Successful ✅");
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      const errorMsg = err.response?.data?.message || "Login Failed. Please check your credentials.";
      showToast(errorMsg, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030217] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col overflow-hidden lg:flex-row">
        <aside className="relative flex min-h-[580px] flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1f0446] via-[#2a0f6b] to-[#12012f] p-8 sm:p-10 lg:p-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(177,63,255,0.2),_transparent_18%)] blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#d25cff]/15 blur-3xl" />
          <div className="relative z-10 space-y-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/10 backdrop-blur-xl">
              <span className="text-3xl">💳</span>
            </div>
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-200/80">Personal Finance</p>
              <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-6xl">
                Smart Expense Tracker
              </h1>
              <p className="max-w-md text-base leading-7 text-slate-300 sm:text-lg">
                A simple, powerful tool to track your daily expenses, set monthly category budgets, and analyze your saving habits with clarity.
              </p>
            </div>
          </div>
          <div className="relative z-10 grid gap-4 text-sm text-purple-200/80 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_60px_rgba(133,77,255,0.12)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
              <p className="font-semibold text-white">Track daily spending</p>
              <p className="mt-3 text-sm text-slate-300">Easily log every expense and income source in real-time, categorized for instant overview.</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_60px_rgba(236,72,153,0.12)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
              <p className="font-semibold text-white">Optimize your budget</p>
              <p className="mt-3 text-sm text-slate-300">Set limits by category and get warnings when spending is on track to exceed monthly targets.</p>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center bg-[#05031e] p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md overflow-hidden rounded-[40px] border border-white/10 bg-[#09061d]/90 px-8 py-10 shadow-[0_40px_120px_rgba(45,16,91,0.45)] backdrop-blur-xl sm:px-10 sm:py-12">
            <div className="mb-8 space-y-3 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-300/80">Secure sign in</p>
              <h2 className="text-4xl font-semibold tracking-tight text-white">Welcome back</h2>
              <p className="mx-auto max-w-sm text-sm leading-7 text-slate-400">
                Sign in to continue managing your expenses with powerful analytics and premium insights.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  disabled={submitLoading}
                  className="w-full rounded-3xl border border-purple-800/70 bg-[#100a2a] px-5 py-4 text-white outline-none transition duration-300 focus:border-pink-400/80 focus:ring-2 focus:ring-pink-500/20 disabled:opacity-50"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  disabled={submitLoading}
                  className="w-full rounded-3xl border border-purple-800/70 bg-[#100a2a] px-5 py-4 text-white outline-none transition duration-300 focus:border-pink-400/80 focus:ring-2 focus:ring-pink-500/20 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                    disabled={submitLoading}
                    className="h-4 w-4 rounded border-purple-500 bg-[#100a2a] text-purple-500 focus:ring-purple-400"
                  />
                  Remember me
                </label>
                <Link to="#" className="text-sm text-purple-300 transition hover:text-pink-300">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#ec4899] px-6 py-4 text-base font-semibold text-white shadow-[0_20px_50px_rgba(168,85,247,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(236,72,153,0.35)] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Don’t have an account?{' '}
              <Link to="/register" className="font-semibold text-white transition hover:text-pink-300">
                Register here
              </Link>
            </p>
          </div>
        </main>
      </div>
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border bg-[#09061d]/95 p-4 shadow-xl backdrop-blur-xl animate-slideInRight border-white/10">
          <div
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border text-white ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
            }`}
          >
            {toast.type === "success" ? <FiCheck className="h-4 w-4" /> : <FiAlertTriangle className="h-4 w-4" />}
          </div>
          <p className="text-sm font-semibold text-white pr-4">{toast.message}</p>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-slate-500 hover:text-white p-1"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
