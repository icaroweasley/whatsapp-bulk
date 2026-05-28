import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charlie_key_2026';

const authenticateToken = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  
  try {
    return jwt.verify(token, JWT_SECRET);
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

  const user = authenticateToken(req);
  if (!user) {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (req.method === 'GET') {
    try {
      const lists = await prisma.savedList.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      
      const formattedLists = lists.map(list => ({
        ...list,
        contacts: JSON.parse(list.contacts)
      }));

      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(200).json(formattedLists);
    } catch (error) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(500).json({ error: 'Erro ao buscar listas' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { id, name, contacts } = req.body;
      const userId = user.id;

      let savedList;
      if (id) {
        const existingList = await prisma.savedList.findUnique({ where: { id } });
        if (existingList?.userId !== userId) {
          Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
          return res.status(403).json({ error: 'Acesso negado a esta lista' });
        }

        savedList = await prisma.savedList.update({
          where: { id },
          data: { name, contacts: JSON.stringify(contacts) }
        });
      } else {
        savedList = await prisma.savedList.create({
          data: {
            name,
            contacts: JSON.stringify(contacts),
            userId
          }
        });
      }

      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(200).json({ ...savedList, contacts: JSON.parse(savedList.contacts) });
    } catch (error) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(500).json({ error: 'Erro ao salvar lista' });
    }
  }

  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
  return res.status(405).json({ error: 'Method not allowed' });
}
