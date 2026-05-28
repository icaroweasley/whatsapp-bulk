import { prisma } from '../../lib/prisma.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charlie_key_2026';
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' });

export default async function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-target-url',
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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const preference = new Preference(mpClient);
    
    let baseUrl = process.env.VITE_FRONTEND_URL || 'https://' + req.headers.host;
    
    // Fallback if host somehow resolves to localhost without https
    if (baseUrl.includes('localhost') && baseUrl.startsWith('http://')) {
      baseUrl = 'https://google.com';
    }

    const price = user.customPrice !== null ? user.customPrice : 100.00;

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'plano_mensal',
            title: 'Assinatura Mensal - Evolution Broadcast',
            quantity: 1,
            unit_price: price,
            currency_id: 'BRL',
          }
        ],
        external_reference: user.id,
        back_urls: {
          success: `${baseUrl}/?payment=success`,
          failure: `${baseUrl}/?payment=failure`,
          pending: `${baseUrl}/?payment=pending`,
        },
        auto_return: 'approved',
      }
    });

    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).json({ init_point: result.init_point });
  } catch (error) {
    console.error('Checkout MP Error:', error);
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(500).json({ error: 'Erro ao gerar pagamento' });
  }
}
