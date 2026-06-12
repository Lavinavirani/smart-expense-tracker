/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiActivity,
  FiBarChart2,
  FiCreditCard,
  FiDollarSign,
  FiLogOut,
  FiPieChart,
  FiAlertTriangle,
  FiEdit,
  FiTrendingUp,
  FiArrowDownRight,
  FiCalendar,
  FiCheck,
  FiX,
  FiMenu,
  FiUser,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const categories = [
  { value: "Food", label: "🍔 Food" },
  { value: "Transport", label: "🚗 Transport" },
  { value: "Shopping", label: "🛍️ Shopping" },
  { value: "Entertainment", label: "🎬 Entertainment" },
  { value: "Health", label: "🏥 Health" },
  { value: "Education", label: "📚 Education" },
  { value: "Bills", label: "⚡ Bills" },
  { value: "Other", label: "📌 Other" },
];

const categoryColors = {
  Food: "from-orange-500 to-amber-500",
  Transport: "from-blue-500 to-cyan-500",
  Shopping: "from-pink-500 to-rose-500",
  Entertainment: "from-purple-500 to-indigo-500",
  Health: "from-emerald-500 to-teal-500",
  Education: "from-cyan-500 to-sky-500",
  Bills: "from-rose-500 to-red-500",
  Other: "from-slate-500 to-gray-500",
};

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
};

export default function Budget() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Year/Month selector for budget review
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Budget configuration form state
  const [form, setForm] = useState({
    category: "",
    limit: "",
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Session expired. Please log in again.", "error");
        navigate("/");
        return;
      }

      // Fetch expenses & budgets concurrently
      const [budgetsRes, expensesRes] = await Promise.all([
        axios.get(`${API_URL}/budgets`, { headers }),
        axios.get(`${API_URL}/expenses`, { headers }),
      ]);

      setBudgets(Array.isArray(budgetsRes.data) ? budgetsRes.data : []);
      setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : expensesRes.data.expenses || []);
    } catch (err) {
      const message = err.response?.data?.message || "Could not load data.";
      if (message === "Token invalid" || message === "No token") {
        localStorage.removeItem("token");
        navigate("/");
      }
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!form.category || !form.limit) {
      showToast("Please fill out all fields.", "error");
      return;
    }

    setSubmitLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Session expired. Please log in again.", "error");
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      const budgetData = {
        category: form.category,
        limit: Number(form.limit),
        month: Number(form.month),
        year: Number(form.year),
      };

      const response = await axios.post(`${API_URL}/budgets`, budgetData, { headers });
      
      // Update local budget list
      setBudgets((prev) => {
        const existingIndex = prev.findIndex(
          (b) =>
            b.category === response.data.category &&
            b.month === response.data.month &&
            b.year === response.data.year
        );
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = response.data;
          return updated;
        }
        return [...prev, response.data];
      });

      showToast(`Successfully configured budget for ${form.category}! ✅`, "success");
      setForm((prev) => ({ ...prev, limit: "" })); // Clear limit field
    } catch (err) {
      showToast(err.response?.data?.message || "Could not save budget.", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.setItem("logoutToast", "Logged out successfully 👋");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- DERIVE BUDGET METRICS ---

  // Filter budgets for the selected year and month
  const monthlyBudgets = budgets.filter(
    (b) => b.month === Number(selectedMonth) && b.year === Number(selectedYear)
  );

  // Filter expenses (only 'expense' type) for the selected year and month
  const monthlyExpenses = expenses.filter((e) => {
    if (e.type !== "expense") return false;
    const expDate = new Date(e.date);
    return (
      expDate.getMonth() + 1 === Number(selectedMonth) &&
      expDate.getFullYear() === Number(selectedYear)
    );
  });

  // Calculate actual spending aggregated by category
  const expenseByCategory = {};
  monthlyExpenses.forEach((e) => {
    const cat = e.category;
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (Number(e.amount) || 0);
  });

  // Compile combined budget list (for all predefined categories)
  const budgetList = categories.map((cat) => {
    const budgetObj = monthlyBudgets.find((b) => b.category === cat.value);
    const limit = budgetObj ? budgetObj.limit : 0;
    const spent = expenseByCategory[cat.value] || 0;
    const remaining = limit > 0 ? limit - spent : 0;
    const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const isExceeded = limit > 0 && spent > limit;

    return {
      category: cat.value,
      label: cat.label,
      limit,
      spent,
      remaining,
      percent,
      isExceeded,
      hasBudget: !!budgetObj,
    };
  });

  // Calculate high-level metrics
  const totalBudgetLimit = monthlyBudgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0);
  const totalMonthlySpent = monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalRemaining = totalBudgetLimit > 0 ? totalBudgetLimit - totalMonthlySpent : 0;
  const totalExceededCategories = budgetList.filter((b) => b.isExceeded).length;

  const headerStats = [
    {
      title: "Monthly Limit",
      value: loading ? "..." : formatCurrency(totalBudgetLimit),
      icon: FiDollarSign,
      color: "from-purple-500 to-pink-500",
      shadow: "shadow-purple-500/10",
    },
    {
      title: "Total Spent",
      value: loading ? "..." : formatCurrency(totalMonthlySpent),
      icon: FiArrowDownRight,
      color: "from-pink-500 to-orange-400",
      shadow: "shadow-pink-500/10",
    },
    {
      title: "Remaining Balance",
      value: loading ? "..." : formatCurrency(totalRemaining),
      icon: FiTrendingUp,
      color: totalRemaining >= 0 ? "from-emerald-500 to-teal-500" : "from-rose-500 to-pink-500",
      shadow: totalRemaining >= 0 ? "shadow-emerald-500/10" : "shadow-rose-500/10",
    },
    {
      title: "Limits Exceeded",
      value: loading ? "..." : totalExceededCategories.toString(),
      icon: FiAlertTriangle,
      color: totalExceededCategories > 0 ? "from-red-500 to-rose-600 animate-pulse" : "from-slate-500 to-slate-600",
      shadow: "shadow-red-500/10",
    },
  ];

  // Nav configuration helper
  const sidebarNavItems = [
    { label: "Overview", icon: FiBarChart2, path: "/dashboard" },
    { label: "Transactions", icon: FiCreditCard, path: "/transactions" },
    { label: "Analytics", icon: FiPieChart, path: "/analytics" },
    { label: "Budget", icon: FiDollarSign, active: true, path: "/budget" },
    { label: "Profile", icon: FiUser, path: "/profile" },
  ];

  const sidebarContent = (
    <>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-purple-300/60">Ledger</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Smart Expense</h2>
        </div>
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20">
          <FiActivity className="h-6 w-6" />
        </div>
      </div>

      <nav className="space-y-4">
        {sidebarNavItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              setSidebarOpen(false);
              navigate(item.path);
            }}
            className={`flex w-full items-center gap-3 rounded-3xl border px-4 py-3 text-left transition duration-300 ${
              item.active
                ? "border-purple-500/40 bg-purple-500/10 text-white shadow-[0_15px_40px_rgba(139,92,246,0.16)]"
                : "border-white/5 bg-white/5 text-slate-300 hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-10 rounded-[28px] border border-purple-500/20 bg-gradient-to-br from-[#1b0838] to-[#12031f] p-5 shadow-[0_30px_60px_rgba(139,92,246,0.12)]">
        <p className="text-sm uppercase tracking-[0.35em] text-purple-300/70">Budgeting Tip</p>
        <h3 className="mt-4 text-xl font-semibold text-white">50/30/20 Rule</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">Allocate 50% of income to Needs, 30% to Wants, and 20% to Savings or paying off debt.</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#050416] text-white">
      <div className="mx-auto max-w-screen-2xl px-6 py-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          
          {/* Desktop Sidebar */}
          <aside className="hidden xl:block rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-[0_30px_80px_rgba(112,49,255,0.12)] backdrop-blur-xl">
            {sidebarContent}
          </aside>

          {/* Mobile Sidebar Slide-over drawer */}
          <div
            className={`fixed inset-0 z-50 transition-opacity duration-300 xl:hidden ${
              sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Backdrop blur overlay */}
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            
            {/* Drawer */}
            <aside
              className={`absolute top-0 bottom-0 left-0 w-[280px] bg-[#09061d] p-6 border-r border-white/10 transition-transform duration-300 transform ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              {sidebarContent}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition"
              >
                <FiX className="h-5 w-5" />
              </button>
            </aside>
          </div>

          {/* Main Content */}
          <main className="space-y-6 min-w-0 w-full">
            
            {/* Header */}
            <header className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-[#09061d]/80 px-6 py-5 shadow-[0_30px_70px_rgba(94,43,255,0.16)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile hamburger menu toggle */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="xl:hidden p-2.5 rounded-2xl bg-white/5 text-purple-300 border border-white/10 transition hover:bg-white/10"
                >
                  <FiMenu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-purple-300/70">Financial Control</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white">Budget Planner</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                    Set limits by category and track real-time monthly budget metrics to prevent overspending.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Year/Month Selector */}
                <div className="flex items-center gap-2 bg-[#050416] border border-slate-800 rounded-3xl px-4 py-2 text-sm">
                  <FiCalendar className="text-purple-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent text-white outline-none cursor-pointer pr-1"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-16 bg-transparent text-white text-center outline-none border-l border-slate-800 ml-1"
                    min="2020"
                    max="2100"
                  />
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-3xl bg-[#1f0b47] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2f1a6f] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FiLogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </header>



            {/* Overview Stats */}
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-lg animate-pulse">
                    <div className="h-12 w-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl" />
                    <div className="mt-5 h-4 w-20 bg-slate-800/60 rounded" />
                    <div className="mt-2.5 h-7 w-28 bg-slate-800/60 rounded" />
                  </div>
                ))
              ) : (
                headerStats.map((stat) => (
                  <div
                    key={stat.title}
                    className={`rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-lg ${stat.shadow} transition duration-300 hover:-translate-y-1 hover:border-purple-500/20`}
                  >
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-sm uppercase tracking-[0.35em] text-purple-300/70">{stat.title}</p>
                    <p className="mt-2.5 text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))
              )}
            </section>

            {/* Layout Column: Form on one side, budget cards on the other */}
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              
              {/* Category Budget Cards */}
              <section className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-[0_30px_70px_rgba(94,43,255,0.16)] backdrop-blur-xl space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">Category Limits</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Monthly Budgets</h2>
                </div>

                {monthlyBudgets.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-purple-500/20 bg-purple-500/[0.02] p-8 text-center animate-fadeIn">
                    <span className="text-4xl mb-3 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">🛡️</span>
                    <h3 className="text-base font-semibold text-white mb-1">No budgets configured yet</h3>
                    <p className="max-w-xs text-xs text-slate-400 leading-5">
                      Use the form on the right or click any edit icon below to configure your monthly targets.
                    </p>
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-[28px] border border-white/5 bg-[#050416]/50 p-5 animate-pulse">
                        <div className="flex justify-between items-center mb-4">
                          <div className="h-5 w-24 bg-slate-800/60 rounded" />
                          <div className="h-8 w-8 bg-slate-800/60 rounded-lg" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div>
                            <div className="h-3 w-10 bg-slate-800/60 rounded mb-1" />
                            <div className="h-5 w-16 bg-slate-800/60 rounded" />
                          </div>
                          <div>
                            <div className="h-3 w-10 bg-slate-800/60 rounded mb-1" />
                            <div className="h-5 w-16 bg-slate-800/60 rounded ml-auto" />
                          </div>
                        </div>
                        <div className="h-2.5 w-full bg-slate-950 rounded-full mb-2" />
                        <div className="flex justify-between">
                          <div className="h-3 w-12 bg-slate-800/60 rounded" />
                          <div className="h-3 w-12 bg-slate-800/60 rounded" />
                        </div>
                      </div>
                    ))
                  ) : (
                    budgetList.map((item) => {
                    const gradient = categoryColors[item.category] || categoryColors.Other;
                    return (
                      <div
                        key={item.category}
                        className={`relative rounded-[28px] border bg-[#050416]/50 p-5 transition duration-300 ${
                          item.isExceeded
                            ? "border-rose-500/30 bg-rose-500/[0.02] shadow-[0_10px_30px_rgba(244,63,94,0.08)]"
                            : "border-white/5 hover:border-purple-500/20"
                        }`}
                      >
                        {/* Exceeded glows badge */}
                        {item.isExceeded && (
                          <div className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-300">
                            Exceeded
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-md font-semibold text-white">{item.label}</span>
                          <button
                            onClick={() =>
                              setForm({
                                category: item.category,
                                limit: item.limit || "",
                                month: selectedMonth,
                                year: selectedYear,
                              })
                            }
                            className="text-slate-500 hover:text-purple-400 p-1.5 rounded-lg hover:bg-white/5 transition"
                            title="Edit Budget"
                          >
                            <FiEdit className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        {/* Financial figures */}
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">Spent</p>
                            <p className="text-md font-bold text-slate-100">{formatCurrency(item.spent)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">Limit</p>
                            <p className="text-md font-bold text-purple-300">
                              {item.hasBudget ? formatCurrency(item.limit) : "No limit"}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {item.hasBudget ? (
                          <div className="space-y-2">
                            <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                                  item.isExceeded ? "from-rose-500 to-red-600" : gradient
                                }`}
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-400">{item.percent.toFixed(0)}% spent</span>
                              <span
                                className={
                                  item.remaining >= 0 ? "text-emerald-400" : "text-rose-400"
                                }
                              >
                                {item.remaining >= 0
                                  ? `${formatCurrency(item.remaining)} left`
                                  : `${formatCurrency(Math.abs(item.remaining))} over`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic mt-3 pt-2 border-t border-slate-800/40">
                            Budget limit not configured. Click edit icon to configure.
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                </div>
              </section>

              {/* Category Budget Manager Form */}
              <section className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-[0_30px_70px_rgba(94,43,255,0.16)] h-fit">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">Limits Manager</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Set Budget Limit</h2>
                </div>

                <form onSubmit={handleSaveBudget} className="mt-6 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      required
                      className="w-full rounded-2xl border border-slate-800 bg-[#050416] px-4 py-3 text-white outline-none focus:border-purple-500/70 transition"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Monthly Limit (USD)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={form.limit}
                      onChange={(e) => setForm((prev) => ({ ...prev, limit: e.target.value }))}
                      required
                      min="1"
                      className="w-full rounded-2xl border border-slate-800 bg-[#050416] px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500/70 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Month
                      </label>
                      <select
                        value={form.month}
                        onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
                        className="w-full rounded-2xl border border-slate-800 bg-[#050416] px-4 py-3 text-white outline-none focus:border-purple-500/70 transition"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString("default", { month: "short" })}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Year
                      </label>
                      <input
                        type="number"
                        value={form.year}
                        onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
                        required
                        min="2020"
                        max="2100"
                        className="w-full rounded-2xl border border-slate-800 bg-[#050416] px-4 py-3 text-white outline-none focus:border-purple-500/70 transition text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 shadow-lg shadow-purple-500/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {submitLoading ? "Saving..." : "Save Budget"}
                  </button>
                </form>
              </section>

            </div>
          </main>
        </div>
      </div>
      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
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
    </div>
  );
}
