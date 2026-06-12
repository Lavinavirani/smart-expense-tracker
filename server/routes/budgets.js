const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');
router.get('/', auth, async (req, res) => {
  try { const budgets = await Budget.find({ user: req.user.id }); res.json(budgets); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;
    let budget = await Budget.findOne({ user: req.user.id, category, month, year });
    if (budget) { budget.limit = limit; await budget.save(); }
    else { budget = new Budget({ user: req.user.id, category, limit, month, year }); await budget.save(); }
    res.json(budget);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});
module.exports = router;
