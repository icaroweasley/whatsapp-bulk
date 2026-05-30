import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charlie_key_2026';

const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' 
});

app.use(cors());
app.use(express.json());

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req: any, res: any, next: any) => {
  authenticateToken(req, res, () => {
    if (req.user.username !== 'karu') return res.status(403).json({ error: 'Acesso negado. Apenas karu.' });
    next();
  });
};

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(400).json({ error: 'Usuário ou senha inválidos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Usuário ou senha inválidos' });
    }

    const instancesArray = user.instances.split(',').map(s => s.trim()).filter(Boolean);

    const token = jwt.sign(
      { id: user.id, username: user.username, instances: instancesArray },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, instances: instancesArray, planStatus: user.planStatus, customPrice: user.customPrice, planExpiresAt: user.planExpiresAt, mpCustomerId: user.mpCustomerId } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Preencha usuário e senha' });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        instances: `${username}_instance`,
        planStatus: 'inactive'
      }
    });

    const instancesArray = [user.instances];
    const token = jwt.sign(
      { id: user.id, username: user.username, instances: instancesArray, planStatus: user.planStatus },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user.id, username: user.username, instances: instancesArray, planStatus: user.planStatus, customPrice: user.customPrice } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Admin: Get Users
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, instances: true, createdAt: true, planStatus: true, planExpiresAt: true, customPrice: true, mpCustomerId: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Admin: Create User
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { username, password, instances } = req.body; // instances is expected to be a comma-separated string
    
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
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

    res.json({ message: 'Usuário criado com sucesso!', user: { id: user.id, username: user.username, instances: user.instances } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Admin: Update User
app.put('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, instances, planStatus, planExpiresAt, customPrice } = req.body;
    
    const data: any = { username, instances };
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

    res.json({ message: 'Usuário atualizado!', user: { id: user.id, username: user.username, instances: user.instances, planStatus: user.planStatus, planExpiresAt: user.planExpiresAt, customPrice: user.customPrice } });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Admin: Delete User
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({ error: 'Senha de confirmação necessária' });
    }

    const adminUser = await prisma.user.findUnique({ where: { username: 'karu' } });
    if (!adminUser) {
      return res.status(404).json({ error: 'Administrador não encontrado' });
    }

    const isValid = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Senha de administrador incorreta!' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Usuário excluído com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});


// Get User's Lists
app.get('/api/lists', authenticateToken, async (req: any, res: any) => {
  try {
    const lists = await prisma.savedList.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    const formattedLists = lists.map(list => ({
      ...list,
      contacts: JSON.parse(list.contacts)
    }));

    res.json(formattedLists);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar listas' });
  }
});

// Create/Update List
app.post('/api/lists', authenticateToken, async (req: any, res: any) => {
  try {
    const { id, name, contacts } = req.body;
    const userId = req.user.id;

    let savedList;
    if (id) {
      const existingList = await prisma.savedList.findUnique({ where: { id } });
      if (existingList?.userId !== userId) {
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

    res.json({ ...savedList, contacts: JSON.parse(savedList.contacts) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar lista' });
  }
});

// Delete List
app.delete('/api/lists/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingList = await prisma.savedList.findUnique({ where: { id } });
    if (!existingList) return res.status(404).json({ error: 'Lista não encontrada' });
    if (existingList.userId !== userId) return res.status(403).json({ error: 'Acesso negado' });

    await prisma.savedList.delete({ where: { id } });
    res.json({ message: 'Lista deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar lista' });
  }
});

// Get Current User Info
app.get('/api/auth/me', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    // Auto-deactivate if plan is expired
    if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date() && user.planStatus === 'active') {
      await prisma.user.update({ where: { id: user.id }, data: { planStatus: 'inactive' } });
      user.planStatus = 'inactive';
    }

    const instancesArray = (user.instances || '').split(',').map(s => s.trim()).filter(Boolean);
    res.json({ user: { id: user.id, username: user.username, instances: instancesArray, planStatus: user.planStatus, customPrice: user.customPrice, planExpiresAt: user.planExpiresAt, mpCustomerId: user.mpCustomerId } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Mercado Pago: Checkout
app.post('/api/payments/checkout', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const preference = new Preference(mpClient);
    
    // Configura a URL de redirecionamento (substitua pela sua URL em produção)
    let baseUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    
    // Mercado Pago exige HTTPS para back_urls. Se for localhost, mockamos.
    if (baseUrl.includes('localhost')) {
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
        external_reference: user.id, // O ID do usuário para sabermos quem pagou no webhook
        back_urls: {
          success: `${baseUrl}/?payment=success`,
          failure: `${baseUrl}/?payment=failure`,
          pending: `${baseUrl}/?payment=pending`,
        },
        auto_return: 'approved',
      }
    });

    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error('Erro no checkout MP:', error);
    res.status(500).json({ error: 'Erro ao gerar pagamento' });
  }
});

// Mercado Pago: Webhook
app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const { action, data } = req.body;
    
    // O MercadoPago envia várias notificações. A que importa é payment.created ou payment.updated
    // Em Produção, você faria uma busca (fetch) pelo ID do pagamento usando a API do MP para garantir
    // que o status é realmente 'approved'. Para simplificar, vou assumir um fluxo básico onde
    // se o pagamento chegou e o status no JSON for 'approved', nós ativamos.
    // Idealmente você valida isso!
    
    if (req.body.type === 'payment' || req.query.topic === 'payment') {
      const paymentId = req.body?.data?.id || req.query.id;
      
      // Buscar os detalhes reais do pagamento (Obrigatório por segurança)
      const fetchResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
      });
      
      const paymentData = await fetchResponse.json();

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference;
        
        if (userId) {
          // Aprova a assinatura por 30 dias
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
          console.log(`[Webhook] Assinatura ativada para o usuário ${userId}`);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no Webhook MP:', error);
    res.status(500).send('Erro interno');
  }
});

// Proxy: Evolution API
app.all('/api-proxy/*', async (req: any, res: any) => {
  const targetUrlStr = req.headers['x-target-url'];
  if (!targetUrlStr) {
    return res.status(400).json({ error: 'Missing x-target-url header. O painel precisa enviar a URL da API.' });
  }

  const pathPart = req.originalUrl.replace('/api-proxy', '') || '/';
  const isSendingMessage = pathPart.includes('/message/sendText') || pathPart.includes('/message/sendMedia');
  let userId = null;

  if (isSendingMessage) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token de autorização não fornecido para disparo.' });
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.planStatus !== 'active') {
        return res.status(403).json({ error: 'Assinatura inativa. Pague o plano para fazer disparos.' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const usage = await prisma.dailyUsage.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        update: {},
        create: { userId: user.id, date: today, messageCount: 0 }
      });

      if (usage.messageCount >= 1000) {
        return res.status(403).json({ error: 'Limite diário de 1.000 mensagens atingido.' });
      }
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
  }

  try {
    const targetUrl = new URL(targetUrlStr + pathPart);
    const fetchHeaders: any = { ...req.headers };
    
    delete fetchHeaders['x-target-url'];
    delete fetchHeaders.host;
    delete fetchHeaders.origin;
    delete fetchHeaders.referer;
    delete fetchHeaders['connection'];
    delete fetchHeaders['content-length'];
    delete fetchHeaders['accept-encoding'];

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
       if (req.body && Object.keys(req.body).length > 0) {
           body = JSON.stringify(req.body);
           fetchHeaders['content-type'] = 'application/json';
       } else if (req.body) {
           body = req.body;
       }
    }

    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: fetchHeaders,
      body: body
    });

    const data = await response.text();

    if (isSendingMessage && response.ok && userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.dailyUsage.update({
        where: { userId_date: { userId, date: today } },
        data: { messageCount: { increment: 1 } }
      });
    }

    if (response.headers.get('content-type')) {
      res.setHeader('content-type', response.headers.get('content-type'));
    }

    return res.status(response.status).send(data);
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: `Proxy Error: ${error.message}` });
  }
});

// Serve static files from the React app
import path from 'path';
import { fileURLToPath } from 'url';

// In TypeScript with ES Modules (if applicable) or CommonJS:
// Fallback if __dirname is not available:
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(new URL(import.meta.url).pathname);

app.use(express.static(path.join(dirname, '../dist')));

// SPA Fallback: Any route not matching API should serve index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
