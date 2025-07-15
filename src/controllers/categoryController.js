// src/controllers/categoryController.js
import Category from '../models/Category.js';
import { z } from 'zod';

// Schema de validação
const categorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório'),
  type: z.enum(['income', 'expense'], 'Type deve ser income ou expense')
});

export const listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id });
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const data = categorySchema.parse(req.body);
    const exists = await Category.findOne({ 
      user: req.user._id, 
      name: data.name, 
      type: data.type 
    });
    if (exists) {
      return res.status(400).json({ message: 'Categoria já existe' });
    }
    const category = await Category.create({
      ...data,
      user: req.user._id
    });
    return res.status(201).json(category);
  } catch (err) {
    const msg = err.errors 
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message;
    return res.status(400).json({ message: msg });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const data = categorySchema.partial().parse(req.body);
    const category = await Category.findOneAndUpdate(
      { _id: id, user: req.user._id },
      data,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    return res.json(category);
  } catch (err) {
    const msg = err.errors 
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message;
    return res.status(400).json({ message: msg });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findOneAndDelete({ _id: id, user: req.user._id });
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    return res.json({ message: 'Categoria removida com sucesso' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
