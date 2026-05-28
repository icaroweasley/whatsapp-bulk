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
    'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
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

  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { username, password, instances, planStatus, planExpiresAt, customPrice } = req.body;
      
      const data = { username, instances };
      if (password) {
        data.password = await bcrypt.hash(password, 10);
      }
      if (planStatus !== undefined) data.planStatus = planStatus;
      if (planExpiresAt !== undefined) data.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
      if (customPrice !== undefined) data.customPrice = customPrice ? parseFloat(customPrice) : null;

      const user = await prisma.user.update({
        where: { id },
        data
      });

      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(200).json({ message: 'Usuário atualizado!', user: { id: user.id, username: user.username, instances: user.instances, planStatus: user.planStatus, planExpiresAt: user.planExpiresAt, customPrice: user.customPrice } });
    } catch (error) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { adminPassword } = req.body;

      if (!adminPassword) {
        Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
        return res.status(400).json({ error: 'Senha de confirmação necessária' });
      }

      const adminUser = await prisma.user.findUnique({ where: { username: 'karu' } });
      if (!adminUser) {
        Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
        return res.status(404).json({ error: 'Administrador não encontrado' });
      }

      const isValid = await bcrypt.compare(adminPassword, adminUser.password);
      if (!isValid) {
        Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
        return res.status(401).json({ error: 'Senha de administrador incorreta!' });
      }

      await prisma.user.delete({ where: { id } });
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(200).json({ message: 'Usuário excluído com sucesso!' });
    } catch (error) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
  }

  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
  return res.status(405).json({ error: 'Method not allowed' });
}
