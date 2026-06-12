/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiActivity,
  FiArrowUpRight,
  FiBarChart2,
  FiCreditCard,
  FiDollarSign,
  FiLogOut,
  FiPieChart,
  FiSearch,
  FiTrash2,
  FiX,
  FiArrowDownRight,
  FiTrendingUp,
  FiCheck,
  FiAlertTriangle,
  FiMenu,
  FiUser,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'income' | 'expense'

  // Deletion Modal, Sidebar and Toast state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

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
        setError("Token missing. Please log in again.");
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
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const confirmDelete = (id) => {
    setTransactionToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    setDeleteModalOpen(false);
    setError("");
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Token missing. Please log in again.", "error");
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      await axios.delete(`${API_URL}/expenses/${transactionToDelete}`, { headers });
      // update local state
      setTransactions((prev) => prev.filter((item) => (item._id || item.id) !== transactionToDelete));
      showToast("Transaction deleted successfully.", "success");
    } catch (err) {
      const message = err.response?.data?.message || "Could not delete transaction.";
      showToast(message, "error");
    } finally {
      setTransactionToDelete(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setTransactions([]);
    navigate("/", { replace: true });
  };

  // On mount: check auth token and load data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time client-side filter & search logic
  const filteredTransactions = transactions.filter((item) => {
    const title = (item.title || "").toLowerCase();
    const category = (item.category || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = title.includes(query) || category.includes(query);
    const matchesType = filterType === "all" ? true : item.type === filterType;
    return matchesSearch && matchesType;
  });

  // Calculate statistics based on filtered results
  const totalIncome = filteredTransactions.reduce(
    (sum, item) => sum + (item.type === "income" ? Number(item.amount) || 0 : 0),
    0,
  );
  const totalExpense = filteredTransactions.reduce(
    (sum, item) => sum + (item.type === "expense" ? Number(item.amount) || 0 : 0),
    0,
  );
  const netBalance = totalIncome - totalExpense;

  const stats = [
    {
      title: "Net Flow",
      value: loading ? "..." : formatCurrency(netBalance),
      icon: FiTrendingUp,
      color: netBalance >= 0 ? "from-emerald-500 to-teal-600" : "from-rose-500 to-pink-600",
      shadow: "shadow-purple-500/10",
    },
    {
      title: "Filtered Income",
      value: loading ? "..." : formatCurrency(totalIncome),
      icon: FiArrowUpRight,
      color: "from-cyan-400 to-blue-500",
      shadow: "shadow-cyan-500/10",
    },
    {
      title: "Filtered Expenses",
      value: loading ? "..." : formatCurrency(totalExpense),
      icon: FiArrowDownRight,
      color: "from-pink-500 to-orange-400",
      shadow: "shadow-pink-500/10",
    },
    {
      title: "Results Count",
      value: loading ? "..." : filteredTransactions.length.toString(),
      icon: FiCreditCard,
      color: "from-violet-500 to-fuchsia-500",
      shadow: "shadow-violet-500/10",
    },
  ];

  // Nav configuration helper
  const sidebarNavItems = [
    { label: "Overview", icon: FiBarChart2, path: "/dashboard" },
    { label: "Transactions", icon: FiCreditCard, active: true, path: "/transactions" },
    { label: "Analytics", icon: FiPieChart, path: "/analytics" },
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
                  <p className="text-sm uppercase tracking-[0.35em] text-purple-300/70">Transaction Manager</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white">Transactions History</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                    Search, filter, and review details of all transactions in your smart tracker.
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

            {/* Statistics Row */}
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className={`rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-lg ${stat.shadow} transition duration-300 hover:-translate-y-1`}
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-sm uppercase tracking-[0.35em] text-purple-300/70">{stat.title}</p>
                  <p className="mt-2.5 text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </section>

            {/* Filter and Search Section */}
            <section className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-[0_30px_70px_rgba(94,43,255,0.16)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                
                {/* Search Field */}
                <div className="relative flex-grow max-w-md">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/80 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by title or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#050416] border border-slate-800 rounded-3xl pl-12 pr-5 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "income", label: "Incomes" },
                    { id: "expense", label: "Expenses" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterType(tab.id)}
                      className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${
                        filterType === tab.id
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20"
                          : "bg-white/5 text-slate-300 border border-white/5 hover:border-purple-500/40 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

              </div>

              {/* Error display */}
              {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

              {/* Transactions Table / Empty State */}
              {transactions.length === 0 && !loading ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[#08061a]/60 p-12 text-center shadow-[0_30px_70px_rgba(94,43,255,0.08)] backdrop-blur-xl animate-fadeIn">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-4xl mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                    💳
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No transactions recorded</h3>
                  <p className="max-w-md text-sm text-slate-400 leading-6 mb-6">
                    Start adding your income and expenses on the dashboard to track your cash flow and unlock detailed financial planning.
                  </p>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-[#08061a]">
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto text-left">
                      <thead className="bg-[#0e0b2e]/80">
                        <tr>
                          <th className="px-6 py-4 text-xs uppercase tracking-[0.35em] text-slate-400">Date</th>
                          <th className="px-6 py-4 text-xs uppercase tracking-[0.35em] text-slate-400">Title</th>
                          <th className="px-6 py-4 text-xs uppercase tracking-[0.35em] text-slate-400">Category</th>
                          <th className="px-6 py-4 text-xs uppercase tracking-[0.35em] text-slate-400">Type</th>
                          <th className="px-6 py-4 text-xs uppercase tracking-[0.35em] text-slate-400 text-right">Amount</th>
                          <th className="px-6 py-4 text-xs uppercase tracking-[0.35em] text-slate-400 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-t border-slate-800/30 animate-pulse">
                              <td className="px-6 py-5"><div className="h-4 w-20 bg-slate-800/60 rounded" /></td>
                              <td className="px-6 py-5"><div className="h-4 w-36 bg-slate-800/60 rounded" /></td>
                              <td className="px-6 py-5"><div className="h-6 w-20 bg-slate-800/60 rounded-full" /></td>
                              <td className="px-6 py-5"><div className="h-6 w-16 bg-slate-800/60 rounded-full" /></td>
                              <td className="px-6 py-5"><div className="h-4 w-16 bg-slate-800/60 rounded ml-auto" /></td>
                              <td className="px-6 py-5 flex justify-center"><div className="h-9 w-9 bg-slate-800/60 rounded-xl" /></td>
                            </tr>
                          ))
                        ) : filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                              <div className="flex flex-col items-center justify-center py-6 animate-fadeIn">
                                <span className="text-5xl mb-4 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">🔍</span>
                                <p className="text-lg font-medium text-white mb-2">No matching transactions</p>
                                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                                  Try refining your search query or switching your filter tabs.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                        filteredTransactions.map((item) => {
                          const amount = Number(item.amount) || 0;
                          const formattedAmount = `${item.type === "expense" ? "-" : "+"}${formatCurrency(Math.abs(amount))}`;
                          const id = item._id || item.id || `${item.title}-${item.amount}`;
                          
                          return (
                            <tr key={id} className="border-t border-slate-800/30 hover:bg-slate-800/20 transition">
                              <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                                {formatDate(item.date)}
                              </td>
                              <td className="px-6 py-4 text-sm text-white font-medium">
                                <div>
                                  <p>{item.title || "Transaction"}</p>
                                  {item.note && <p className="text-xs text-slate-500 mt-1">{item.note}</p>}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-300">
                                <span className="inline-flex rounded-2xl bg-white/5 border border-white/10 px-3 py-1 text-xs">
                                  {item.category || "Other"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    item.type === "income"
                                      ? "bg-emerald-500/15 text-emerald-300"
                                      : "bg-amber-500/15 text-amber-300"
                                  }`}
                                >
                                  {item.type === "income" ? "Income" : "Expense"}
                                </span>
                              </td>
                              <td className={`px-6 py-4 text-right text-sm font-semibold whitespace-nowrap ${
                                item.type === "income" ? "text-emerald-400" : "text-rose-400"
                              }`}>
                                {formattedAmount}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => confirmDelete(item._id || item.id)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition duration-200"
                                  title="Delete Transaction"
                                >
                                  <FiTrash2 className="h-4.5 w-4.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </section>
          </main>
        </div>
      </div>
      {/* Custom Deletion Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#09061d]/95 p-8 shadow-[0_40px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl animate-scaleUp">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-6">
                <FiAlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Confirm Deletion</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Are you sure you want to permanently delete this transaction? This action is irreversible.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setTransactionToDelete(null);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:-translate-y-0.5"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Floating Toast Alert */}
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

      {/* Inline styles for custom modal/toast animations */}
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
        .animate-scaleUp { animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
