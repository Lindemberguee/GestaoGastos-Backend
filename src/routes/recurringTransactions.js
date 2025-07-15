// src/routes/recurringTransactions.js
import express from "express";
import {
  getAllRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
} from "../controllers/recurringTransactionController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();
router.use(protect);

router
  .route("/")
  .get(getAllRecurring)    // agora aceita ?type=income|expense
  .post(createRecurring);  

router
  .route("/:id")
  .put(updateRecurring)    // body pode ter type
  .delete(deleteRecurring);

export default router;
