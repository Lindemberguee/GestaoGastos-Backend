// src/routes/dashboard.js
import express from 'express';
import { protect } from '../middlewares/auth.js';
import { getDashboardSummary } from '../controllers/dashboardController.js';

const router = express.Router();
router.use(protect);

// rota de debug
router.get('/ping', (req, res) => {
  res.json({ ok: true });
});

router.get('/summary', getDashboardSummary);  // GET /api/dashboard/summary?year=YYYY&month=MM

export default router;
