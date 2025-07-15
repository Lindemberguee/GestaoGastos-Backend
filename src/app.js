// src/app.js

import express from 'express'
import dotenv from 'dotenv'
import expressWinston from 'express-winston'
import promBundle from 'express-prom-bundle'
import cron from 'node-cron'
import logger from './config/logger.js'

// Rotas
import authRoutes from './routes/auth.js'
import categoryRoutes from './routes/category.js'
import transactionRoutes from './routes/transaction.js'
import budgetRoutes from './routes/budget.js'
import dashboardRoutes from './routes/dashboard.js'
import recurringRoutes from './routes/recurringTransactions.js'

// Controller de recorrentes (para o cron)
import { processDueRecurring } from './controllers/recurringTransactionController.js'

// Carregar variáveis de ambiente
dotenv.config()

const app = express()

// Body parser para JSON
app.use(express.json())

// Monitoramento Prometheus em /metrics
app.use(
  promBundle({
    includeMethod: true,
    includePath: true,
    metricsPath: '/metrics',
    promClient: { collectDefaultMetrics: {} },
  })
)

// Logs estruturados (Winston)
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: '{{req.method}} {{req.url}} {{res.statusCode}} – {{res.responseTime}}ms',
  })
)

// Montagem das rotas (todas autenticadas internamente via `protect`)
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/recurring-transactions', recurringRoutes)

// Cron job: processa transações recorrentes todo dia à meia-noite
cron.schedule('0 0 * * *', async () => {
  try {
    await processDueRecurring()
    logger.info('✅ Recurring transactions processed')
  } catch (err) {
    logger.error('❌ Error processing recurring transactions:', err)
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' })
})

// Handler de erros genéricos
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({ message: 'Erro interno do servidor' })
})

export default app
