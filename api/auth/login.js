import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charlie_key_2026';

export default async function handler(req, res) {
  // CORS setup
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-target-url',
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

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    // In case the password wasn't hashed previously (during sqlite phase) we can check plain text as fallback
    // But since we wiped sqlite, we only have new hashed passwords in Supabase!
    if (!isValidPassword && password !== user.password) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username, planStatus: user.planStatus }, JWT_SECRET, {
      expiresIn: '7d',
    });

    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        instances: user.instances,
        planStatus: user.planStatus
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
