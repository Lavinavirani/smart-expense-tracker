const mongoose = require('mongoose');
const ExpenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ['Food','Transport','Shopping','Entertainment','Health','Education','Bills','Other'], required: true },
  type: { type: String, enum: ['income','expense'], required: true },
  date: { type: Date, default: Date.now },
  note: { type: String }
});
module.exports = mongoose.model('Expense', ExpenseSchema);
