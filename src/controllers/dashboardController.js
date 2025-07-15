// src/controllers/dashboardController.js
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Budget from '../models/Budget.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ message: 'Query params year e month são obrigatórios' });
    }

    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1; // JS months: 0-11
    const start = new Date(y, m, 1);
    const end   = new Date(y, m, new Date(y, m + 1, 0).getDate(), 23, 59, 59);

    // 1) Total balance (todas as receitas - todas as despesas, completed)
    const [incAll] = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      { $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
      }},
      { $unwind: '$category' },
      { $match: { 'category.type': 'income', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const [expAll] = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      { $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
      }},
      { $unwind: '$category' },
      { $match: { 'category.type': 'expense', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalIncomeAll  = incAll?.total || 0;
    const totalExpenseAll = expAll?.total || 0;
    const totalBalance    = totalIncomeAll - totalExpenseAll;

    // 2) Period: receitas e despesas no mês/ano filtrado
    const [incPeriod] = await Transaction.aggregate([
      { $match: {
          user: req.user._id,
          status: 'completed',
          date: { $gte: start, $lte: end }
      }},
      { $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
      }},
      { $unwind: '$category' },
      { $match: { 'category.type': 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const [expPeriod] = await Transaction.aggregate([
      { $match: {
          user: req.user._id,
          status: 'completed',
          date: { $gte: start, $lte: end }
      }},
      { $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
      }},
      { $unwind: '$category' },
      { $match: { 'category.type': 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const periodIncome   = incPeriod?.total || 0;
    const periodExpenses = expPeriod?.total || 0;
    const netPeriodSavings = periodIncome - periodExpenses;

    // 3) Despesas por categoria no período
    const expensesByCategory = await Transaction.aggregate([
      { $match: {
          user: req.user._id,
          status: 'completed',
          date: { $gte: start, $lte: end }
      }},
      { $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
      }},
      { $unwind: '$category' },
      { $match: { 'category.type': 'expense' } },
      { $group: {
          _id: '$category.name',
          total: { $sum: '$amount' }
      }},
      { $project: { _id: 0, category: '$_id', total: 1 } }
    ]);

    // 4) Status dos orçamentos ativos no período
    const budgets = await Budget.find({
      user: req.user._id,
      startDate: { $lte: end },
      endDate:   { $gte: start }
    }).populate('category', 'name');

    const budgetsStatus = await Promise.all(budgets.map(async b => {
      const [usedAgg] = await Transaction.aggregate([
        { $match: {
            user: req.user._id,
            category: b.category._id,
            status: 'completed',
            date: { $gte: b.startDate, $lte: b.endDate }
        }},
        { $group: { _id: null, totalUsed: { $sum: '$amount' } } }
      ]);
      const used = usedAgg?.totalUsed || 0;
      const remaining = Math.max(b.totalAmount - used, 0);
      return {
        name: b.name,
        total: b.totalAmount,
        used,
        remaining
      };
    }));

    return res.json({
      totalBalance,
      periodIncome,
      periodExpenses,
      netPeriodSavings,
      expensesByCategory,
      budgetsStatus
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao gerar dashboard' });
  }
};
