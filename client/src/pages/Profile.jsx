/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiActivity,
  FiBarChart2,
  FiCreditCard,
  FiLogOut,
  FiPieChart,
  FiUser,
  FiX,
  FiMenu,
  FiCheck,
  FiAlertTriangle,
  FiKey,
  FiMail,
  FiCalendar,
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function Profile() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({ name: "", email: "", createdAt: "" });
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
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

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Session expired. Please log in again.", "error");
        navigate("/");
        return;
      }
      const response = await axios.get(`${API_URL}/auth/me`, { headers });
      setUser(response.data);
      setProfileForm({ name: response.data.name, email: response.data.email });
    } catch (err) {
      const message = err.response?.data?.message || "Could not retrieve user info.";
      if (message === "Token invalid" || message === "No token") {
        localStorage.removeItem("token");
        navigate("/");
      }
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    setProfileLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Session expired. Please log in again.", "error");
        navigate("/");
        return;
      }
      const res = await axios.put(`${API_URL}/auth/profile`, profileForm, { headers });
      setUser(res.data);
      localStorage.setItem("userName", res.data.name);
      showToast("Profile updated successfully! ✅", "success");
    } catch (err) {
      const message = err.response?.data?.message || "Could not update profile.";
      showToast(message, "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast("Please fill in all fields.", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }

    setPasswordLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Session expired. Please log in again.", "error");
        navigate("/");
        return;
      }
      await axios.put(
        `${API_URL}/auth/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers }
      );
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password updated successfully! ✅", "success");
    } catch (err) {
      const message = err.response?.data?.message || "Could not change password.";
      showToast(message, "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.setItem("logoutToast", "Logged out successfully 👋");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  // Nav configuration helper
  const sidebarNavItems = [
    { label: "Overview", icon: FiBarChart2, path: "/dashboard" },
    { label: "Transactions", icon: FiCreditCard, path: "/transactions" },
    { label: "Analytics", icon: FiPieChart, path: "/analytics" },
    { label: "Budget", icon: FaIndianRupeeSign, path: "/budget" },
    { label: "Profile", icon: FiUser, active: true, path: "/profile" },
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
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Allocate 50% of income to Needs, 30% to Wants, and 20% to Savings or paying off debt.
        </p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#050416] text-white w-full overflow-x-hidden">
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

          {/* Main profile layout content */}
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
                  <p className="text-sm uppercase tracking-[0.35em] text-purple-300/70">Personal Settings</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white">Profile Settings</h1>
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

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-[32px] border border-white/10 bg-[#09061d]/80 shadow-lg backdrop-blur-xl">
                <p className="text-sm text-purple-300/80 animate-pulse uppercase tracking-[0.25em]">Loading your details...</p>
              </div>
            ) : (
              <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
                
                {/* Left Forms: Settings & Password Change */}
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Account Settings Form Card */}
                  <div className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-lg">
                    <div className="mb-6 border-b border-slate-800/40 pb-4">
                      <h2 className="text-xl font-semibold text-white">Update Personal Details</h2>
                      <p className="mt-1 text-sm text-slate-400">Keep your tracking information up to date.</p>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 h-5 w-5" />
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                            required
                            className="w-full bg-[#050416] border border-slate-800 rounded-2xl pl-12 pr-5 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 h-5 w-5" />
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                            required
                            className="w-full bg-[#050416] border border-slate-800 rounded-2xl pl-12 pr-5 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {profileLoading ? "Updating..." : "Save Changes"}
                      </button>
                    </form>
                  </div>

                  {/* Password Change Form Card */}
                  <div className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-lg">
                    <div className="mb-6 border-b border-slate-800/40 pb-4">
                      <h2 className="text-xl font-semibold text-white">Change Account Password</h2>
                      <p className="mt-1 text-sm text-slate-400">Regularly update password configurations to maintain ledger security.</p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 h-5 w-5" />
                          <input
                            type="password"
                            placeholder="Enter current password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                            required
                            className="w-full bg-[#050416] border border-slate-800 rounded-2xl pl-12 pr-5 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 h-5 w-5" />
                          <input
                            type="password"
                            placeholder="Must be at least 6 characters"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                            required
                            className="w-full bg-[#050416] border border-slate-800 rounded-2xl pl-12 pr-5 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 h-5 w-5" />
                          <input
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                            className="w-full bg-[#050416] border border-slate-800 rounded-2xl pl-12 pr-5 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {passwordLoading ? "Saving..." : "Change Password"}
                      </button>
                    </form>
                  </div>

                </div>

                {/* Right: Account Summary Profile Card */}
                <div className="space-y-6 animate-fadeIn lg:mt-0 mt-6 h-fit">
                  <div className="rounded-[32px] border border-white/10 bg-[#09061d]/80 p-6 shadow-lg text-center relative overflow-hidden">
                    {/* Glowing aesthetic backdrop lights */}
                    <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[#b86cff]/10 blur-3xl" />
                    <div className="pointer-events-none absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-[#ec4899]/10 blur-3xl" />

                    <div className="relative flex flex-col items-center py-6">
                      {/* Avatar Placeholder */}
                      <div className="relative mb-5 p-1 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 shadow-xl shadow-purple-500/10">
                        <div className="h-24 w-24 rounded-full bg-[#050416] flex items-center justify-center text-4xl text-purple-300 font-bold border border-white/5">
                          {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-white truncate max-w-full">{user.name}</h3>
                      <p className="text-sm text-slate-400 mt-1 truncate max-w-full">{user.email}</p>

                      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-300">
                        Active Tracker Account
                      </div>

                      <div className="w-full mt-8 pt-6 border-t border-slate-800/40 text-left space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <FiCalendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Member Since</p>
                            <p className="text-sm font-semibold text-slate-200 mt-0.5">{formatDate(user.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <FiActivity className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Account Status</p>
                            <p className="text-sm font-semibold text-emerald-400 mt-0.5">Verified</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </section>
            )}

          </main>
        </div>
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
    </div>
  );
}
