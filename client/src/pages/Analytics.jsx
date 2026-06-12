/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  FiActivity,
  FiBarChart2,
  FiCreditCard,
  FiDollarSign,
  FiLogOut,
  FiPieChart,
  FiTrendingUp,
  FiArrowDownRight,
  FiAlertCircle,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiMenu,
  FiUser,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const categoryColors = {
  Food: "#f97316",         // Orange
  Transport: "#3b82f6",    // Blue
  Shopping: "#ec4899",     // Pink
  Entertainment: "#a855f7",// Purple
  Health: "#10b981",       // Emerald
  Education: "#06b6d4",    // Cyan
  Bills: "#f43f5e",        // Rose
  Other: "#64748b",        // Slate
};

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#09061d]/90 p-4 shadow-xl backdrop-blur-xl">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
        {payload.map((p, index) => (
          <p key={index} className="text-sm font-bold" style={{ color: p.color || p.payload.fill }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Session expired. Please log in again.", "error");
        setTransactions([]);
        navigate("/");
        return;
      }
      const response = await axios.get(`${API_URL}/expenses`, { headers });
      setTransactions(Array.isArray(response.data) ? response.data : response.data.expenses || []);
    } catch (err) {
      const message = err.response?.data?.message || "Could not load transactions.";
      if (message === "Token invalid" || message === "No token") {
        localStorage.removeItem("token");
        navigate("/");
      }
      showToast(message, "error");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.setItem("logoutToast", "Logged out successfully 👋");
    localStorage.removeItem("token");
    setTransactions([]);
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- DYNAMIC CALCULATIONS ---

  // 1. Core aggregates
  const totalSpent = transactions.reduce(
    (sum, t) => sum + (t.type === "expense" ? Number(t.amount) || 0 : 0),
    0,
  );

  const totalIncome = transactions.reduce(
    (sum, t) => sum + (t.type === "income" ? Number(t.amount) || 0 : 0),
    0,
  );

  const netSavings = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Largest Purchase
  const largestPurchase = transactions.reduce(
    (max, t) => (t.type === "expense" && Number(t.amount) > max ? Number(t.amount) : max),
    0,
  );

  // Average Daily Expense
  const oldestDate = transactions.reduce((oldest, t) => {
    const d = new Date(t.date);
    return d < oldest ? d : oldest;
  }, new Date());
  const diffTime = Math.abs(new Date() - oldestDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  const averageDailyExpense = totalSpent / diffDays;

  // 2. Pie Chart - Category Breakdown (Expenses only)
  const categoryTotals = {};
  transactions.forEach((t) => {
    if (t.type === "expense") {
      const cat = t.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(t.amount) || 0);
    }
  });

  const pieData = Object.keys(categoryTotals).map((name) => ({
    name,
    value: Math.round(categoryTotals[name]),
    fill: categoryColors[name] || categoryColors.Other,
  }));

  // 3. Monthly Trends - Last 6 Months (Income vs Expense comparison)
  const getLast6MonthsBuckets = () => {
    const buckets = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const yearMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.push({ key: yearMonthKey, label, income: 0, expense: 0 });
    }
    return buckets;
  };

  const monthlyTrend = getLast6MonthsBuckets();
  transactions.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyTrend.find((b) => b.key === key);
    if (bucket) {
      if (t.type === "income") {
        bucket.income += Number(t.amount) || 0;
      } else {
        bucket.expense += Number(t.amount) || 0;
      }
    }
  });

  // 4. Savings Insights Cards
  let topCategory = "";
  let maxCategoryAmount = 0;
  Object.keys(categoryTotals).forEach((cat) => {
    if (categoryTotals[cat] > maxCategoryAmount) {
      maxCategoryAmount = categoryTotals[cat];
      topCategory = cat;
    }
  });

  const insights = [
    {
      title: "Savings Rate Status",
      desc:
        savingsRate >= 20
          ? `Excellent savings rate! You saved ${savingsRate.toFixed(1)}% of your earnings. You are building wealth fast.`
          : savingsRate > 0
          ? `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for 20% by minimizing discretionary expenditures.`
          : `You had a negative savings rate of ${savingsRate.toFixed(1)}%. Expenses exceeded your income. Check your ledger.`,
      icon: savingsRate >= 0 ? "📈" : "⚠️",
      bgColor: savingsRate >= 20 ? "from-emerald-500/10 to-teal-500/10" : "from-rose-500/10 to-pink-500/10",
      borderColor: savingsRate >= 20 ? "border-emerald-500/20" : "border-rose-500/20",
    },
    {
      title: "Top Spent Category",
      desc: topCategory
        ? `Your highest expenditure is on ${topCategory} (${formatCurrency(maxCategoryAmount)}). Setting a monthly category limit will maximize your net flow.`
        : "No expense transactions recorded yet to extract category breakdown advice.",
      icon: "💡",
      bgColor: "from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      title: "Strategic Action Plan",
      desc:
        savingsRate < 20 && topCategory
          ? `Recommendation: Reduce your ${topCategory} cost by 10% next month. This will keep an extra ${formatCurrency(
              maxCategoryAmount * 0.1,
            )} in your balance.`
          : "Tip: Establish automatic savings vault transfers on payday to maintain a healthy financial buffer.",
      icon: "🎯",
      bgColor: "from-cyan-500/10 to-blue-500/10",
      borderColor: "border-cyan-500/20",
    },
  ];

  const statCards = [
    {
      title: "Total Spent",
      value: loading ? "..." : formatCurrency(totalSpent),
      color: "from-rose-500 to-pink-600",
      shadow: "shadow-rose-500/10",
      icon: FiArrowDownRight,
    },
    {
      title: "Average Daily",
      value: loading ? "..." : formatCurrency(averageDailyExpense),
      color: "from-blue-500 to-cyan-600",
      shadow: "shadow-cyan-500/10",
      icon: FiActivity,
    },
    {
      title: "Largest Purchase",
      value: loading ? "..." : formatCurrency(largestPurchase),
      color: "from-orange-500 to-red-600",
      shadow: "shadow-orange-500/10",
      icon: FiDollarSign,
    },
    {
      title: "Savings Rate",
      value: loading ? "..." : `${savingsRate.toFixed(1)}%`,
      color: savingsRate >= 20 ? "from-emerald-500 to-teal-600" : "from-violet-500 to-fuchsia-500",
      shadow: "shadow-emerald-500/10",
      icon: FiTrendingUp,
    },
  ];

  // Nav configuration helper
  const sidebarNavItems = [
    { label: "Overview", icon: FiBarChart2, path: "/dashboard" },
    { label: "Transactions", icon: FiCreditCard, path: "/transactions" },
    { label: "Analytics", icon: FiPieChart, active: true, path: "/analytics" },
    { label: "Budget", icon: FiDollarSign, path: "/budget" },
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

          {/* Main Analytics Content */}
          <main className="space-y-6">
            
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
                  <p className="text-sm uppercase tracking-[0.35em] text-purple-300/70">Analytics & Trends</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white">Financial Insights</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                    Comprehensive insights and trends calculated in real-time from your expense ledger.
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-3xl bg-[#1f0b47] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2f1a6f] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FiLogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </header>

            {/* Error state */}
            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-400">
                <FiAlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {transactions.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center rounded-[32px] border border-white/10 bg-[#09061d]/80 p-12 text-center shadow-[0_30px_70px_rgba(94,43,255,0.16)] backdrop-blur-xl animate-fadeIn">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-4xl mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                  📊
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Start adding transactions to unlock insights</h3>
                <p className="max-w-md text-sm text-slate-400 leading-6 mb-8">
                  Log your daily expense and income records on the dashboard to view details of your cash flow trends, saving rates, and category statistics.
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* Metrics Overview Cards */}
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
                statCards.map((card) => (
                  <div
                    key={card.title}
                    className={`rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-lg ${card.shadow} transition duration-300 hover:-translate-y-1 hover:border-purple-500/20`}
                  >
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-sm uppercase tracking-[0.35em] text-purple-300/70">{card.title}</p>
                    <p className="mt-2.5 text-2xl font-bold text-white">{card.value}</p>
                  </div>
                ))
              )}
            </section>

            {/* Charts Row 1: Pie and Bar */}
            <section className="grid gap-6 lg:grid-cols-2">
              
              {/* Pie Chart: Spending Breakdown */}
              <div className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-[0_30px_70px_rgba(94,43,255,0.16)] backdrop-blur-xl">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">Category distribution</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Expense Breakdown</h2>
                     <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-72">
                  {loading ? (
                    <div className="flex items-center justify-center h-72 animate-pulse w-full">
                      <div className="relative w-44 h-44 rounded-full border-8 border-slate-800/40 bg-transparent flex items-center justify-center">
                        <div className="h-24 w-24 bg-slate-800/40 rounded-full" />
                      </div>
                    </div>
                  ) : pieData.length === 0 ? (
                    <p className="text-sm text-slate-400">No expense data found.</p>
                  ) : (
                    <>
                      <div className="relative w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<CustomChartTooltip />} />
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={800}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Total Spent</p>
                        </div>
                      </div>

                      {/* Legend Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs w-full sm:w-auto">
                        {pieData.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                            <span className="text-slate-300 truncate max-w-[90px]">{entry.name}</span>
                            <span className="font-semibold text-white ml-auto">
                              {((entry.value / Math.max(totalSpent, 1)) * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bar Chart: Monthly Expenses */}
              <div className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-[0_30px_70px_rgba(94,43,255,0.16)] backdrop-blur-xl">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">6-Month historical</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Monthly Expense Trend</h2>
                </div>
                <div className="h-72">
                  {loading ? (
                    <div className="flex items-end justify-between h-72 w-full animate-pulse px-6 py-4">
                      <div className="h-16 w-8 bg-slate-800/40 rounded-t-lg" />
                      <div className="h-24 w-8 bg-slate-800/40 rounded-t-lg" />
                      <div className="h-36 w-8 bg-slate-800/40 rounded-t-lg" />
                      <div className="h-28 w-8 bg-slate-800/40 rounded-t-lg" />
                      <div className="h-44 w-8 bg-slate-800/40 rounded-t-lg" />
                      <div className="h-32 w-8 bg-slate-800/40 rounded-t-lg" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(148,163,184,0.06)" vertical={false} />
                        <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[8, 8, 0, 0]} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>             </div>

            </section>

            {/* Area Chart: Income vs Expense Comparison */}
            <section className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-[0_30px_70px_rgba(94,43,255,0.16)] backdrop-blur-xl">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">Budget performance</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Income vs Expenses Analysis</h2>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#10b981]" />
                    <span className="text-slate-300">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#f43f5e]" />
                    <span className="text-slate-300">Expenses</span>
                  </div>
                </div>
              </div>

              <div className="h-80">
                {loading ? (
                  <div className="h-80 w-full animate-pulse flex flex-col justify-between py-6">
                    <div className="flex items-end justify-between h-64 border-b border-l border-slate-800/20 px-6">
                      <div className="h-12 w-8 bg-slate-800/40 rounded-t" />
                      <div className="h-32 w-8 bg-slate-800/40 rounded-t" />
                      <div className="h-24 w-8 bg-slate-800/40 rounded-t" />
                      <div className="h-48 w-8 bg-slate-800/40 rounded-t" />
                      <div className="h-36 w-8 bg-slate-800/40 rounded-t" />
                    </div>
                    <div className="flex justify-between px-6">
                      <div className="h-3 w-10 bg-slate-800/40 rounded" />
                      <div className="h-3 w-10 bg-slate-800/40 rounded" />
                      <div className="h-3 w-10 bg-slate-800/40 rounded" />
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(148,163,184,0.06)" vertical={false} />
                      <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area type="monotone" name="Income" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" animationDuration={800} />
                      <Area type="monotone" name="Expenses" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fill="url(#expenseGrad)" animationDuration={800} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Dynamic Savings Insights Section */}
            <section className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-[0_30px_70px_rgba(94,43,255,0.16)]">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">Wealth health checks</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Smart Savings Insights</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-[24px] border border-white/5 bg-[#09061d]/40 p-6 animate-pulse">
                      <div className="h-10 w-10 bg-slate-800/60 rounded mb-4" />
                      <div className="h-5 w-32 bg-slate-800/60 rounded mb-2" />
                      <div className="h-12 w-full bg-slate-800/30 rounded" />
                    </div>
                  ))
                ) : (
                  insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`rounded-[24px] border ${insight.borderColor} bg-gradient-to-br ${insight.bgColor} p-6 shadow-md transition duration-300 hover:scale-[1.02] hover:-translate-y-0.5`}
                    >
                      <div className="text-4xl mb-4">{insight.icon}</div>
                      <h3 className="text-md font-bold text-white mb-2">{insight.title}</h3>
                      <p className="text-sm leading-6 text-slate-300">{insight.desc}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

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
