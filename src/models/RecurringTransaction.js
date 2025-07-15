// src/models/RecurringTransaction.js
import mongoose from "mongoose";

const RecurringTransactionSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    amount:      { type: Number, required: true },
    type:        { 
      type: String, 
      enum: ["income", "expense"], 
      required: true 
    },                                      // ← novo campo
    category:    { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    status:      {
      type: String,
      enum: ["pending", "completed", "canceled"],
      default: "pending",
    },
    frequency:   {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly", "yearly"],
      required: true,
    },
    startDate:   { type: Date, required: true },
    endDate:     { type: Date },
    nextRun:     { type: Date, required: true },
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.RecurringTransaction ||
  mongoose.model("RecurringTransaction", RecurringTransactionSchema);
