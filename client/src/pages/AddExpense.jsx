import { FiArrowLeft, FiDollarSign, FiCalendar, FiFileText } from "react-icons/fi";
import { useState } from "react";

function AddExpense() {
  const [formData, setFormData] = useState({
    amount: "",
    category: "food",
    date: "",
    paymentMethod: "credit_card",
    description: "",
  });

  const categories = [
    { value: "food", label: "🍔 Food & Dining" },
    { value: "transportation", label: "🚗 Transportation" },
    { value: "entertainment", label: "🎬 Entertainment" },
    { value: "utilities", label: "⚡ Utilities" },
    { value: "shopping", label: "🛍️ Shopping" },
    { value: "health", label: "🏥 Health & Fitness" },
    { value: "education", label: "📚 Education" },
    { value: "travel", label: "✈️ Travel" },
    { value: "other", label: "📌 Other" },
  ];

  const paymentMethods = [
    { value: "credit_card", label: "💳 Credit Card" },
    { value: "debit_card", label: "💰 Debit Card" },
    { value: "cash", label: "💵 Cash" },
    { value: "bank_transfer", label: "🏦 Bank Transfer" },
    { value: "wallet", label: "👝 Digital Wallet" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Expense added:", formData);
  };

  return (
    <div className="min-h-screen bg-[#0f082f] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition mb-6">
            <FiArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-4xl font-bold mb-2">Add New Expense</h1>
          <p className="text-slate-400">Track your spending with detailed expense information</p>
        </div>

        {/* Form Card */}
        <div className="relative bg-slate-900/40 border border-slate-800/50 rounded-3xl p-8 shadow-2xl shadow-violet-900/20 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 opacity-0 rounded-3xl" />
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
            {/* Amount Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Expense Amount *
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-400" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-2xl pl-12 pr-6 py-4 text-lg font-semibold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition"
                />
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-700/50 rounded-2xl px-6 py-4 text-slate-100 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition appearance-none cursor-pointer"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Date *
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-400" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-2xl pl-12 pr-6 py-4 text-slate-100 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition cursor-pointer"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Payment Method *
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-700/50 rounded-2xl px-6 py-4 text-slate-100 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition appearance-none cursor-pointer"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Description (Optional)
              </label>
              <div className="relative">
                <FiFileText className="absolute left-4 top-4 h-5 w-5 text-violet-400" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add notes about this expense..."
                  rows="5"
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-2xl pl-12 pr-6 py-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition resize-none"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Expense</p>
                  <p className="text-2xl font-bold text-violet-300">
                    ${formData.amount || "0.00"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 mb-1">Category</p>
                  <p className="text-lg font-semibold text-slate-200">
                    {categories.find(c => c.value === formData.category)?.label || "Select"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                className="flex-1 px-6 py-4 rounded-2xl border border-slate-700/50 text-slate-300 font-semibold hover:bg-slate-800/30 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold shadow-lg shadow-fuchsia-500/30 hover:-translate-y-0.5 hover:shadow-fuchsia-500/50 transition"
              >
                Add Expense
              </button>
            </div>
          </form>
        </div>

        {/* Helpful Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: "💡", title: "Tip", desc: "Be specific with descriptions to track patterns" },
            { icon: "📊", title: "Track", desc: "All expenses are logged to your dashboard" },
            { icon: "🎯", title: "Budget", desc: "Compare against your monthly budget limit" },
          ].map((tip, index) => (
            <div key={index} className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-xl">
              <p className="text-2xl mb-2">{tip.icon}</p>
              <p className="text-sm font-semibold text-slate-300">{tip.title}</p>
              <p className="text-xs text-slate-500 mt-1">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AddExpense;
