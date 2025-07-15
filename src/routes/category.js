// src/routes/category.js
import express from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);              // todas as rotas abaixo são protegidas
router.get('/', listCategories);  // GET  /api/categories
router.post('/', createCategory); // POST /api/categories
router.put('/:id', updateCategory);   // PUT /api/categories/:id
router.delete('/:id', deleteCategory);// DELETE /api/categories/:id

export default router;
