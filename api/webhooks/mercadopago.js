import { prisma } from '../../lib/prisma.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (req.body.type === 'payment' || req.query.topic === 'payment') {
      const paymentId = req.body?.data?.id || req.query.id;
      
      const fetchResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
      });
      
      const paymentData = await fetchResponse.json();

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference;
        
        if (userId) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await prisma.user.update({
            where: { id: userId },
            data: { 
              planStatus: 'active',
              planExpiresAt: expiresAt,
              mpCustomerId: paymentData.payer?.id?.toString()
            }
          });
          console.log(`[Webhook Vercel] Assinatura ativada para o usuário ${userId}`);
        }
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).send('Erro interno');
  }
}
