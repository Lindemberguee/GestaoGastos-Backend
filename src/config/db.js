// src/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error(`🚨 Erro ao conectar no DB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
