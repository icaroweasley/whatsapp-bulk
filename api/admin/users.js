import { prisma } from '../../lib/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charlie_key_2026';

const authenticateAdmin = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.username !== 'karu') return null;
    return decoded;
  } catch(e) {
    return null;
  }
};

export default async function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-target-url',
  };

  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).end();
  }

  const admin = authenticateAdmin(req);
  if (!admin) {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(403).json({ error: 'Acesso negado. Apenas karu.' });
  }

  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, username: true, instances: true, createdAt: true, planStatus: true, planExpiresAt: true, customPrice: true, mpCustomerId: true }
      });
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(200).json(users);
    } catch (error) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { username, password, instances } = req.body;
      
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
        return res.status(400).json({ error: 'Usuário já existe' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          instances
        }
      });

      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(200).json({ message: 'Usuário criado com sucesso!', user: { id: user.id, username: user.username, instances: user.instances } });
    } catch (error) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(500).json({ error: 'Erro no servidor' });
    }
  }

  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
  return res.status(405).json({ error: 'Method not allowed' });
}
