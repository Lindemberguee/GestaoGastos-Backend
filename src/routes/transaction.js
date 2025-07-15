// src/routes/transaction.js
import express from 'express';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactionController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);
router.get('/',    listTransactions);     // GET    /api/transactions?startDate=&endDate=&category=
router.post('/',   createTransaction);   // POST   /api/transactions
router.put('/:id', updateTransaction);   // PUT    /api/transactions/:id
router.delete('/:id', deleteTransaction);// DELETE /api/transactions/:id

export default router;
