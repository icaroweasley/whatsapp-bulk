import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charlie_key_2026';

export default async function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-target-url',
  };

  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const { instanceName } = req.body;
    
    if (!instanceName) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(400).json({ error: 'instanceName é obrigatório.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Retirar a instância
    const currentInstances = user.instances ? user.instances.split(',').map(i => i.trim()).filter(Boolean) : [];
    
    // Se a instância não pertence a ele, não precisa fazer nada (já não estava lá ou tenta deletar a de outro)
    if (!currentInstances.includes(instanceName)) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(200).json({ success: true, message: 'Instância não encontrada no usuário.' });
    }

    const newInstancesArray = currentInstances.filter(i => i !== instanceName);
    const newInstancesStr = newInstancesArray.join(',');

    await prisma.user.update({
      where: { id: userId },
      data: { instances: newInstancesStr }
    });

    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).json({ success: true, message: 'Instância removida com sucesso do banco de dados.' });

  } catch (error) {
    console.error('Remove Instance DB Error:', error);
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
