// src/config/logger.js
import winston from 'winston';

const { combine, timestamp, json } = winston.format;

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.Console(),
    // você pode adicionar transportes para arquivo:
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ]
});

export default logger;
