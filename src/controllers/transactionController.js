// src/controllers/transactionController.js
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import { z } from 'zod';

const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().nonnegative('Valor deve ser positivo'),
  date: z.string().refine(d => !isNaN(Date.parse(d)), { message: 'Data inválida' }),
  category: z.string().min(1, 'Categoria é obrigatória'),
  status: z.enum(['completed', 'pending', 'canceled']).optional()
});

export const listTransactions = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const filter = { user: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }
    if (category) {
      filter.category = category;
    }

    const transactions = await Transaction.find(filter)
      .populate('category', 'name type')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const data = transactionSchema.parse(req.body);
    // Verifica se a categoria pertence ao usuário
    const cat = await Category.findOne({ _id: data.category, user: req.user._id });
    if (!cat) {
      return res.status(400).json({ message: 'Categoria inválida' });
    }

    const transaction = await Transaction.create({
      description: data.description,
      amount: data.amount,
      date: new Date(data.date),
      status: data.status || 'completed',
      category: data.category,
      user: req.user._id
    });

    res.status(201).json(transaction);
  } catch (err) {
    const msg = err.errors
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message;
    res.status(400).json({ message: msg });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const data = transactionSchema.partial().parse(req.body);

    if (data.category) {
      const cat = await Category.findOne({ _id: data.category, user: req.user._id });
      if (!cat) {
        return res.status(400).json({ message: 'Categoria inválida' });
      }
    }

    if (data.date) data.date = new Date(data.date);

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, user: req.user._id },
      data,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }

    res.json(transaction);
  } catch (err) {
    const msg = err.errors
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message;
    res.status(400).json({ message: msg });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOneAndDelete({ _id: id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    res.json({ message: 'Transação removida com sucesso' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
