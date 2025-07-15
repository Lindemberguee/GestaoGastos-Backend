// src/controllers/recurringTransactionController.js
import RecurringTransaction from "../models/RecurringTransaction.js"
import Transaction from "../models/Transaction.js"
import Category              from "../models/Category.js";
// GET /api/recurring-transactions?type=income|expense
export const getAllRecurring = async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;
  const list = await RecurringTransaction
    .find(filter)
    .populate("category");
  return res.json(list);
};

// POST /api/recurring-transactions
export const createRecurring = async (req, res) => {
  const { description, amount, type, category, frequency, startDate, endDate } = req.body;

  // 1) valida categoria e tipo
  const cat = await Category.findOne({ _id: category, user: req.user._id });
  if (!cat) {
    return res.status(400).json({ message: "Categoria inválida" });
  }
  if (cat.type !== type) {
    return res.status(400).json({ message: "Tipo e categoria não conferem" });
  }

  // 2) cria recorrência
  const nextRun = new Date(startDate);
  const doc = await RecurringTransaction.create({
    description,
    amount,
    type,                 // ← aqui
    category,
    frequency,
    startDate,
    endDate,
    nextRun,
    user: req.user._id,
  });
  return res.status(201).json(doc);
};

// PUT /api/recurring-transactions/:id
export const updateRecurring = async (req, res) => {
  const doc = await RecurringTransaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  )
  return res.json(doc)
}

// DELETE /api/recurring-transactions/:id
export const deleteRecurring = async (req, res) => {
  await RecurringTransaction.deleteOne({ _id: req.params.id, user: req.user._id })
  return res.status(204).end()
}

// função para processar recorrentes vencidos (invocada por cron)
export const processDueRecurring = async () => {
  const now = new Date()
  const dueList = await RecurringTransaction.find({ nextRun: { $lte: now } })

  for (const item of dueList) {
    // cria transação associada
    await Transaction.create({
      description: item.description,
      amount: item.amount,
      date: item.nextRun,
      status: "pending",
      category: item.category,
      user: item.user,
    })

    // calcula próximo nextRun
    const next = new Date(item.nextRun)
    switch (item.frequency) {
      case "daily":
        next.setDate(next.getDate() + 1)
        break
      case "weekly":
        next.setDate(next.getDate() + 7)
        break
      case "biweekly":
        next.setDate(next.getDate() + 14)
        break
      case "monthly":
        next.setMonth(next.getMonth() + 1)
        break
      case "yearly":
        next.setFullYear(next.getFullYear() + 1)
        break
    }

    // se não ultrapassou endDate, atualiza próximo disparo; senão remove recorrente
    if (!item.endDate || next <= item.endDate) {
      item.nextRun = next
      await item.save()
    } else {
      await item.remove()
    }
  }
}
