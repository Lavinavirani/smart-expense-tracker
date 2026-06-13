/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { generateMonthlyExpenseReport } from "../utils/pdfGenerator";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiActivity,
  FiArrowUpRight,
  FiBarChart2,
  FiCreditCard,
  FiLogOut,
  FiPieChart,
  FiPlusCircle,
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiMenu,
  FiUser,
  FiFileText,
  FiTag,
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";

const categoryOptions = ["Food", "Transportation", "Utilities", "Shopping", "Salary", "Other"];

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Lavina";
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "",
    type: "expense",
  });
  const [error, setError] = useState("");

  const totalIncome = expenses.reduce(
    (sum, item) => sum + (item.type === "income" ? Number(item.amount) || 0 : 0),
    0,
  );
  const totalExpense = expenses.reduce(
    (sum, item) => sum + (item.type === "expense" ? Number(item.amount) || 0 : 0),
    0,
  );
  const balance = totalIncome - totalExpense;

  // Group transaction details dynamically by month (last 6 months) for chart feeds
  const getLast6MonthsBuckets = () => {
    const buckets = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const yearMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.push({ key: yearMonthKey, month: label, income: 0, expense: 0, balance: 0 });
    }
    return buckets;
  };

  const dynamicTrendData = getLast6MonthsBuckets();
  expenses.forEach((item) => {
    const itemDate = new Date(item.date);
    const key = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, "0")}`;
    const bucket = dynamicTrendData.find((b) => b.key === key);
    if (bucket) {
      if (item.type === "income") {
        bucket.income += Number(item.amount) || 0;
      } else {
        bucket.expense += Number(item.amount) || 0;
      }
    }
  });

  // Calculate cumulative running balance
  let runningBal = 0;
  dynamicTrendData.forEach((bucket) => {
    runningBal += (bucket.income - bucket.expense);
    bucket.balance = runningBal;
  });

  // Calculate dynamic Y-axis domain to prevent sharp vertical drops & balance the scale
  const balances = dynamicTrendData.map((d) => d.balance);
  const minBalance = Math.min(...balances);
  const maxBalance = Math.max(...balances);
  const balanceRange = maxBalance - minBalance;
  
  // Apply padding (25% of range or at least 100) to keep the curve visually balanced
  const paddingFactor = 0.25;
  const pad = balanceRange === 0 
    ? 100 
    : Math.max(balanceRange * paddingFactor, 100);

  const yDomain = [minBalance - pad, maxBalance + pad];

  const formatYAxis = (value) => {
    const num = Number(value);
    if (isNaN(num)) return value;
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    const formatted = absNum >= 1000
      ? `${(absNum / 1000).toFixed(1).replace(/\.0$/, "")}k`
      : absNum.toString();
    return isNegative ? `-₹${formatted}` : `₹${formatted}`;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchExpenses = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Token missing. Please log in again.");
        setExpenses([]);
        return;
      }
      const response = await axios.get(`${API_URL}/expenses`, { headers });
      setExpenses(Array.isArray(response.data) ? response.data : response.data.expenses || []);
    } catch (err) {
      const message = err.response?.data?.message || "Could not load expenses.";
      if (message === "Token invalid" || message === "No token") {
        localStorage.removeItem("token");
        navigate("/");
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // On mount: ensure token exists, otherwise redirect to login.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchExpenses();

    const loginMsg = localStorage.getItem("loginToast");
    if (loginMsg) {
      showToast(loginMsg, "success");
      localStorage.removeItem("loginToast");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExpense = async (event) => {
    event.preventDefault();

    if (!expenseForm.title || !expenseForm.amount || !expenseForm.category) {
      showToast("Please fill in all transaction fields.", "error");
      return;
    }

    setSubmitLoading(true);
    setError("");
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Session expired. Please log in again.", "error");
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      await axios.post(`${API_URL}/expenses`, expenseForm, { headers });
      setExpenseForm({ title: "", amount: "", category: "", type: "expense" });
      setModalOpen(false);
      showToast("Transaction added successfully! ✅", "success");
      await fetchExpenses();
    } catch (err) {
      const message = err.response?.data?.message || "Could not add expense.";
      if (message === "Token invalid" || message === "No token") {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      showToast(message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownloadReport = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Session expired. Please log in again.", "error");
        navigate("/");
        return;
      }
      // Fetch user details, budgets, and all expenses concurrently
      const [userRes, budgetsRes, expensesRes] = await Promise.all([
        axios.get(`${API_URL}/auth/me`, { headers }),
        axios.get(`${API_URL}/budgets`, { headers }),
        axios.get(`${API_URL}/expenses`, { headers })
      ]);

      const userObj = userRes.data;
      const budgetsList = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
      const expensesList = Array.isArray(expensesRes.data) ? expensesRes.data : (expensesRes.data.expenses || []);

      generateMonthlyExpenseReport(userObj, Number(reportMonth), Number(reportYear), expensesList, budgetsList);
      showToast("Monthly PDF report downloaded successfully! 📄", "success");
      setReportModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to generate monthly report PDF.", "error");
    } finally {
      setReportLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.setItem("logoutToast", "Logged out successfully 👋");
    localStorage.removeItem("token");
    setExpenses([]);
    navigate("/", { replace: true });
  };

  const cards = [
    {
      title: "Total Balance",
      value: loading ? "Loading..." : formatCurrency(balance),
      icon: FaIndianRupeeSign,
      accent: "from-purple-500 to-pink-500",
    },
    {
      title: "Total Income",
      value: loading ? "Loading..." : formatCurrency(totalIncome),
      icon: FiArrowUpRight,
      accent: "from-cyan-400 to-blue-500",
    },
    {
      title: "Total Expenses",
      value: loading ? "Loading..." : formatCurrency(totalExpense),
      icon: FiCreditCard,
      accent: "from-pink-500 to-orange-400",
    },
    {
      title: "Transactions",
      value: loading ? "Loading..." : expenses.length.toString(),
      icon: FiBarChart2,
      accent: "from-violet-500 to-fuchsia-500",
    },
  ];

  // Nav configuration helper
  const sidebarNavItems = [
    { label: "Overview", icon: FiBarChart2, active: true, path: "/dashboard" },
    { label: "Transactions", icon: FiCreditCard, path: "/transactions" },
    { label: "Analytics", icon: FiPieChart, path: "/analytics" },
    { label: "Budget", icon: FaIndianRupeeSign, path: "/budget" },
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
    <div className="min-h-screen bg-[#050416] text-white w-full overflow-x-hidden">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
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

          <main className="space-y-6 min-w-0 w-full">
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
                  <p className="text-sm uppercase tracking-[0.35em] text-purple-300/70">Welcome back, {userName}</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white">Track your spending smarter</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                    Manage your finances with clarity, review monthly category trends, and allocate budgets effectively.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-3xl bg-[#1f0b47] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2f1a6f] hover:scale-[1.02] active:scale-[0.98]">
                  <FiLogOut className="h-5 w-5" />
                  Logout
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-3xl bg-white/5 border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FiFileText className="h-5 w-5 text-purple-400" />
                  Download Report
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FiPlusCircle className="h-5 w-5" />
                  Add Expense
                </button>
              </div>
            </header>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-[0_30px_60px_rgba(112,50,255,0.12)] animate-pulse"
                    >
                      <div className="h-14 w-14 rounded-3xl bg-slate-805 bg-purple-500/10 border border-purple-500/20" />
                      <div className="mt-6 h-4 w-24 bg-slate-800/80 rounded" />
                      <div className="mt-3 h-8 w-36 bg-slate-800/80 rounded" />
                      <div className="mt-2 h-4 w-28 bg-slate-800/80 rounded" />
                    </div>
                  ))
                ) : (
                  cards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-[0_30px_60px_rgba(112,50,255,0.12)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-[0_30px_60px_rgba(112,50,255,0.18)] cursor-pointer"
                    >
                      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br ${card.accent} text-white shadow-lg shadow-purple-500/20`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                      <p className="mt-6 text-sm uppercase tracking-[0.35em] text-purple-300/70">{card.title}</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
                      <p className="mt-2 text-sm text-slate-400">Updated 2 hours ago</p>
                    </div>
                  ))
                )}
              </div>

              <div className="min-w-0 w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#09061d]/80 p-4 sm:p-6 shadow-[0_30px_70px_rgba(94,43,255,0.16)]">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-purple-300/70">Balance trend</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Balance Overview</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-3xl bg-white/5 px-4 py-2 text-sm text-slate-300">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-400" /> Growth
                  </div>
                </div>
                <div className="h-[320px] w-full min-w-0">
                  <ResponsiveContainer width="99%" height="100%">
                    <AreaChart data={dynamicTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b86cff" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                      <XAxis dataKey="month" stroke="#a78bfa" tickLine={false} axisLine={false} dy={8} />
                      <YAxis 
                        stroke="#a78bfa" 
                        tickLine={false} 
                        axisLine={false} 
                        domain={yDomain}
                        tickFormatter={formatYAxis}
                        dx={-8}
                      />
                      <Tooltip 
                        contentStyle={{ background: "#09061d", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "16px" }}
                        formatter={(value) => [formatCurrency(value), "Balance"]}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#a855f7" strokeWidth={3} fill="url(#balanceGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="min-w-0 w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#09061d]/80 p-4 sm:p-6 shadow-[0_30px_70px_rgba(94,43,255,0.16)]">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-purple-300/70">Quick actions</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Move fast</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {["Add Expense", "Add Income", "View Analytics"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={
                          item === "Add Expense"
                            ? () => setModalOpen(true)
                            : item === "View Analytics"
                            ? () => navigate("/analytics")
                            : undefined
                        }
                        className="rounded-3xl bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-[28px] bg-[#0b0921] p-4 sm:p-5 shadow-[0_12px_30px_rgba(139,92,246,0.12)]">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm uppercase tracking-[0.35em] text-purple-300/60">This month</p>
                      <span className="rounded-3xl bg-purple-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-purple-200">On track</span>
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-3xl font-semibold text-white">{loading ? "..." : formatCurrency(balance)}</p>
                        <p className="mt-2 text-sm text-slate-400">Remaining budget</p>
                      </div>
                      <div className="rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20">
                        {loading ? "..." : `${((balance / Math.max(totalIncome, 1)) * 100).toFixed(0)}%`}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[28px] bg-[#0b0921] p-4 sm:p-5 shadow-[0_12px_30px_rgba(236,72,153,0.12)]">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm uppercase tracking-[0.35em] text-purple-300/60">Trend</p>
                      <span className="rounded-3xl bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-cyan-200">Revenue</span>
                    </div>
                    <div className="mt-5 h-40 w-full min-w-0">
                      <ResponsiveContainer width="99%" height="100%">
                        <BarChart data={dynamicTrendData}>
                          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                          <XAxis dataKey="month" stroke="#7c3aed" tickLine={false} axisLine={false} />
                          <YAxis stroke="#7c3aed" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: "#0b0b22", border: "1px solid rgba(124,58,237,0.3)" }} />
                          <Bar dataKey="income" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
                          <Bar dataKey="expense" fill="#ec4899" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#09061d]/80 p-4 sm:p-6 shadow-[0_30px_70px_rgba(94,43,255,0.16)]">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-purple-300/70">Recent activity</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Transactions</h2>
                  </div>
                  <button
                    onClick={() => navigate("/transactions")}
                    className="rounded-3xl bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    View all
                  </button>
                </div>
                <div className="overflow-x-auto rounded-[28px] border border-white/10 bg-[#08061a]">
                  <table className="min-w-full table-auto text-left">
                    <thead className="bg-[#0e0b2e]/80">
                      <tr>
                        <th className="hidden sm:table-cell px-5 py-4 text-xs uppercase tracking-[0.35em] text-slate-400">ID</th>
                        <th className="px-5 py-4 text-xs uppercase tracking-[0.35em] text-slate-400">Description</th>
                        <th className="px-5 py-4 text-xs uppercase tracking-[0.35em] text-slate-400">Amount</th>
                        <th className="px-5 py-4 text-xs uppercase tracking-[0.35em] text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i} className="border-t border-slate-800/30 animate-pulse">
                            <td className="hidden sm:table-cell px-5 py-6"><div className="h-4 w-12 bg-slate-800/60 rounded" /></td>
                            <td className="px-5 py-6"><div className="h-4 w-28 bg-slate-800/60 rounded" /></td>
                            <td className="px-5 py-6"><div className="h-4 w-16 bg-slate-800/60 rounded ml-auto" /></td>
                            <td className="px-5 py-6"><div className="h-6 w-16 bg-slate-800/60 rounded-full" /></td>
                          </tr>
                        ))
                      ) : expenses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">
                            <div className="flex flex-col items-center justify-center py-4 animate-fadeIn">
                              <span className="text-4xl mb-3 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]">📥</span>
                              <p className="text-base font-semibold text-white mb-1">No activity logged yet</p>
                              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                Add an expense or income to begin visualising your balance trend.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        expenses.map((item) => {
                          const amount = Number(item.amount) || 0;
                          const formattedAmount = `${item.type === "expense" ? "-" : "+"}${Math.abs(amount).toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                          })}`;
                          return (
                            <tr key={item._id || item.id || `${item.title}-${item.amount}`} className="border-t border-slate-800/30 hover:bg-slate-800/20 transition">
                              <td className="hidden sm:table-cell px-5 py-4 text-sm text-slate-300">{item._id?.slice(0, 8) || item.id || "—"}</td>
                              <td className="px-5 py-4 text-sm text-white">{item.title || item.category || "Transaction"}</td>
                              <td className={`px-5 py-4 text-right text-sm font-semibold ${item.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                                {formattedAmount}
                              </td>
                              <td className="px-5 py-4 text-sm">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.type === "income" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                                  {item.type === "income" ? "Income" : "Expense"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#09061d]/95 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl animate-scaleUp">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">Download PDF Report</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Monthly Report</h2>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                disabled={reportLoading}
                className="rounded-full bg-white/5 p-2.5 text-slate-400 hover:text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleDownloadReport}>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Month
                </label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(Number(e.target.value))}
                  disabled={reportLoading}
                  className="w-full bg-[#050416] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition appearance-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                     <option key={i + 1} value={i + 1} className="bg-[#09061d]">
                       {new Date(0, i).toLocaleString("default", { month: "long" })}
                     </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Year
                </label>
                <input
                  type="number"
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  disabled={reportLoading}
                  min="2020"
                  max="2100"
                  className="w-full bg-[#050416] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  disabled={reportLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {reportLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    "Download PDF"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#09061d]/95 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl animate-scaleUp">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">Add Transaction</p>
                <h2 className="mt-2 text-xl font-semibold text-white">New Transaction</h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitLoading}
                className="rounded-full bg-white/5 p-2.5 text-slate-400 hover:text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleAddExpense}>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Title
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 h-5 w-5" />
                  <input
                    name="title"
                    value={expenseForm.title}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Grocery Shop"
                    disabled={submitLoading}
                    className="w-full bg-[#050416] border border-slate-800 rounded-2xl pl-12 pr-5 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition shadow-inner disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Amount (INR)
                </label>
                <div className="relative">
                  <FaIndianRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 h-5 w-5" />
                  <input
                    name="amount"
                    type="number"
                    value={expenseForm.amount}
                    onChange={handleFormChange}
                    required
                    placeholder="0.00"
                    disabled={submitLoading}
                    className="w-full bg-[#050416] border border-slate-800 rounded-2xl pl-12 pr-5 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition shadow-inner disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Category
                </label>
                <div className="relative">
                  <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 h-5 w-5 pointer-events-none" />
                  <select
                    name="category"
                    value={expenseForm.category}
                    onChange={handleFormChange}
                    required
                    disabled={submitLoading}
                    className="w-full bg-[#050416] border border-slate-800 rounded-2xl pl-12 pr-5 py-3 text-sm text-white outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition shadow-inner disabled:opacity-50 appearance-none"
                  >
                    <option value="" className="text-slate-500">Select category</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category} className="bg-[#09061d] text-white">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Type
                </label>
                <div className="relative">
                  <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 h-5 w-5 pointer-events-none" />
                  <select
                    name="type"
                    value={expenseForm.type}
                    onChange={handleFormChange}
                    required
                    disabled={submitLoading}
                    className="w-full bg-[#050416] border border-slate-800 rounded-2xl pl-12 pr-5 py-3 text-sm text-white outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition shadow-inner disabled:opacity-50 appearance-none"
                  >
                    <option value="expense" className="bg-[#09061d] text-white">Expense</option>
                    <option value="income" className="bg-[#09061d] text-white">Income</option>
                  </select>
                </div>
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Transaction"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleUp { animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
