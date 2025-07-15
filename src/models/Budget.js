// src/models/Budget.js
import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do orçamento é obrigatório']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Valor total é obrigatório']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Data de início é obrigatória']
  },
  endDate: {
    type: Date,
    required: [true, 'Data de término é obrigatória']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Budget', budgetSchema);
