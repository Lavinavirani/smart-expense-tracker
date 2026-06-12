import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FiCheck, FiAlertTriangle, FiX } from "react-icons/fi";

const API_URL = "http://localhost:5001/api";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [submitLoading, setSubmitLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, formData);
      if (!res.data?.token) {
        throw new Error("No token returned from registration");
      }
      localStorage.setItem("token", res.data.token);
      if (res.data.user?.name) {
        localStorage.setItem("userName", res.data.user.name);
      }
      localStorage.setItem("loginToast", "Welcome! Account created successfully 🎉");
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      const message = err.response?.data?.message || err.message || "Registration failed.";
      showToast(message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05041f] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-10 lg:flex-row lg:items-center lg:gap-12">
        <section className="relative flex-1 overflow-hidden rounded-[40px] bg-gradient-to-br from-[#120338] via-[#240b62] to-[#12022f] p-10 shadow-[0_40px_120px_rgba(86,30,210,0.28)] sm:p-12 lg:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(179,53,255,0.22),_transparent_30%)] blur-3xl" />
          <div className="absolute -right-24 top-24 h-64 w-64 rounded-full bg-[#e74cff]/20 blur-3xl" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.45em] text-purple-200/70">Personal Finance</p>
              <h1 className="max-w-2xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
                Smart Expense Tracker
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                A simple, powerful tool to track your daily expenses, set monthly category budgets, and analyze your saving habits with clarity.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_60px_rgba(183,63,255,0.12)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
                <p className="font-semibold text-white">Track daily spending</p>
                <p className="mt-2 text-sm text-slate-300">Easily log every expense and income source in real-time, categorized for instant overview.</p>
              </div>
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_60px_rgba(236,72,153,0.12)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
                <p className="font-semibold text-white">Optimize your budget</p>
                <p className="mt-2 text-sm text-slate-300">Set limits by category and get warnings when spending is on track to exceed monthly targets.</p>
              </div>
            </div>
          </div>
        </section>

        <main className="flex-1">
          <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(82,36,187,0.25)] backdrop-blur-xl sm:p-10">
            <div className="mb-8 space-y-3 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-300/80">Create your account</p>
              <h2 className="text-4xl font-semibold text-white">Join Smart Expense</h2>
              <p className="mx-auto max-w-sm text-sm leading-7 text-slate-400">
                Start tracking your spending and take control of your financial future today.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Full Name</label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                  disabled={submitLoading}
                  className="w-full rounded-[28px] border border-purple-800/70 bg-[#0f0a29] px-5 py-4 text-white outline-none transition duration-300 focus:border-pink-400/80 focus:ring-2 focus:ring-pink-500/20 disabled:opacity-50"
                />
              </div>

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
                  className="w-full rounded-[28px] border border-purple-800/70 bg-[#0f0a29] px-5 py-4 text-white outline-none transition duration-300 focus:border-pink-400/80 focus:ring-2 focus:ring-pink-500/20 disabled:opacity-50"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  disabled={submitLoading}
                  className="w-full rounded-[28px] border border-purple-800/70 bg-[#0f0a29] px-5 py-4 text-white outline-none transition duration-300 focus:border-pink-400/80 focus:ring-2 focus:ring-pink-500/20 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="inline-flex w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#ec4899] px-6 py-4 text-base font-semibold text-white shadow-[0_20px_60px_rgba(236,72,153,0.3)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(148,50,255,0.28)] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/" className="font-semibold text-white transition hover:text-pink-300">
                Login
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
