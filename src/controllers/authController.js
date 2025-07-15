// src/controllers/authController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Schemas de validação
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido'),
  dateOfBirth: z.string().optional(),  // ISO string; depois converter em Date
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const generateToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    // Converter dateOfBirth, se fornecido
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);

    const exists = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }]
    });
    if (exists) {
      return res
        .status(400)
        .json({ message: 'Email ou telefone já cadastrado' });
    }

    const user = await User.create(data);
    return res.status(201).json({
      id:        user._id,
      name:      user.name,
      email:     user.email,
      phone:     user.phone,
      dateOfBirth: user.dateOfBirth,
      role:      user.role,
      token:     generateToken(user._id)
    });
  } catch (err) {
    const message = err.errors?.map(e => e.message).join(', ') || err.message;
    return res.status(400).json({ message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Atualiza lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return res.json({
      id:        user._id,
      name:      user.name,
      email:     user.email,
      phone:     user.phone,
      role:      user.role,
      lastLogin: user.lastLogin,
      token:     generateToken(user._id)
    });
  } catch (err) {
    return res.status(400).json({ message: err.errors?.message || err.message });
  }
};
