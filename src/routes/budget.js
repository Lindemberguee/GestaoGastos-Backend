// src/routes/budget.js
import express from 'express';
import {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus
} from '../controllers/budgetController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);
router.get('/',         listBudgets);      // GET    /api/budgets
router.post('/',        createBudget);     // POST   /api/budgets
router.put('/:id',      updateBudget);     // PUT    /api/budgets/:id
router.delete('/:id',   deleteBudget);     // DELETE /api/budgets/:id
router.get('/:id/status', getBudgetStatus);// GET    /api/budgets/:id/status

export default router;
