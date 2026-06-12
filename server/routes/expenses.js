const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
router.get('/', auth, async (req, res) => {
  try { const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 }); res.json(expenses); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});
router.post('/', auth, async (req, res) => {
  try { const expense = new Expense({ ...req.body, user: req.user.id }); await expense.save(); res.json(expense); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});
router.delete('/:id', auth, async (req, res) => {
  try { await Expense.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});
router.get('/analytics', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id });
    const categoryTotals = {};
    let totalIncome = 0, totalExpense = 0;
    expenses.forEach(e => {
      if (e.type === 'income') totalIncome += e.amount;
      else { totalExpense += e.amount; categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount; }
    });
    res.json({ totalIncome, totalExpense, balance: totalIncome - totalExpense, categoryTotals });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});
module.exports = router;
