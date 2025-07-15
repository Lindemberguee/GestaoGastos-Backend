// src/controllers/budgetController.js
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { z } from 'zod';
import mongoose from 'mongoose';

const budgetSchema = z.object({
  name: z.string().min(1, 'Nome do orçamento é obrigatório'),
  totalAmount: z.number().nonnegative('Valor total deve ser positivo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  startDate: z.string().refine(d => !isNaN(Date.parse(d)), { message: 'Data de início inválida' }),
  endDate: z.string().refine(d => !isNaN(Date.parse(d)), { message: 'Data de término inválida' })
});

export const listBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user._id })
      .populate('category', 'name type')
      .sort({ startDate: -1 });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBudget = async (req, res) => {
  try {
    const data = budgetSchema.parse(req.body);
    const budget = await Budget.create({
      name: data.name,
      totalAmount: data.totalAmount,
      category: data.category,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      user: req.user._id
    });
    res.status(201).json(budget);
  } catch (err) {
    const msg = err.errors
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message;
    res.status(400).json({ message: msg });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const data = budgetSchema.partial().parse(req.body);
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate)   data.endDate   = new Date(data.endDate);

    const budget = await Budget.findOneAndUpdate(
      { _id: id, user: req.user._id },
      data,
      { new: true, runValidators: true }
    ).populate('category', 'name type');

    if (!budget) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }
    res.json(budget);
  } catch (err) {
    const msg = err.errors
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message;
    res.status(400).json({ message: msg });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findOneAndDelete({ _id: id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }
    res.json({ message: 'Orçamento removido com sucesso' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBudgetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findOne({ _id: id, user: req.user._id }).populate('category', 'name');
    if (!budget) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }

    // Soma de transações concluídas na categoria e período
  const usedAgg = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        category: budget.category._id,
        status: 'completed',
        date: { $gte: budget.startDate, $lte: budget.endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalUsed: { $sum: '$amount' }
      }
    }
  ]);

    const used = usedAgg[0]?.totalUsed || 0;
    const remaining = budget.totalAmount - used;

    res.json({
      name: budget.name,
      total: budget.totalAmount,
      used,
      remaining: remaining < 0 ? 0 : remaining
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
