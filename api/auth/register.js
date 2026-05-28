import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charlie_key_2026';

export default async function handler(req, res) {
  // CORS setup
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(400).json({ error: 'Preencha usuário e senha.' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(400).json({ error: 'Usuário já existe.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with a default instance string
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        instances: `${username}_instance`,
        planStatus: 'inactive', // Default is inactive until payment
      }
    });

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username, planStatus: user.planStatus }, JWT_SECRET, {
      expiresIn: '7d',
    });

    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        instances: user.instances,
        planStatus: user.planStatus
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
