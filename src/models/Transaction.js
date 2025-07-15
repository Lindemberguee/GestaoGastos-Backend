// src/models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória']
  },
  amount: {
    type: Number,
    required: [true, 'Valor é obrigatório']
  },
  date: {
    type: Date,
    required: [true, 'Data é obrigatória']
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'canceled'],
    default: 'completed'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Transaction', transactionSchema);
