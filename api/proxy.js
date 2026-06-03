import { prisma } from './lib/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charlie_key_2026';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    // Desabilita o suporte a response limit para evitar problemas com grandes payloads
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  // Configuração de CORS para permitir requisições do frontend da Vercel
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  // Se for uma requisição preflight (OPTIONS), apenas retornamos OK com os headers
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).end();
  }

  const targetUrlStr = req.headers['x-target-url'];
  if (!targetUrlStr) {
    return res.status(400).json({ error: 'Missing x-target-url header. O painel precisa enviar a URL da API.' });
  }

  // Removemos o '/api-proxy' da URL original para descobrir o endpoint final (ex: /chat/sendText/...)
  const pathPart = req.url.replace('/api-proxy', '') || '/';
  
  // --- VERIFICAÇÃO DE COTA E SEGURANÇA (SaaS) ---
  const isSendingMessage = pathPart.includes('/message/sendText') || pathPart.includes('/message/sendMedia');
  let userId = null;

  // Enforce JWT validation for ALL requests to ensure instance ownership, 
  // except maybe very generic ones. We will check auth if authorization header is present.
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(401).json({ error: 'Token de autorização não fornecido para disparo.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.planStatus !== 'active') {
        Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
        return res.status(403).json({ error: 'Assinatura inativa. Pague o plano para fazer disparos.' });
      }

      // Check instance ownership for ALL requests that target a specific instance
      const instancesArray = user.instances ? user.instances.split(',').map(s => s.trim()).filter(Boolean) : [];
      const parts = pathPart.split('/').filter(Boolean);
      // Evolution API pattern: /category/action/instanceName
      if (parts.length >= 2 && parts[0] !== 'instance' || (parts[0] === 'instance' && !['fetchInstances', 'create'].includes(parts[1]))) {
        const requestedInstance = parts[parts.length - 1].split('?')[0]; // Get the last part, remove query strings
        if (requestedInstance && !instancesArray.includes(requestedInstance)) {
          Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
          return res.status(403).json({ error: `Acesso negado. A instância '${requestedInstance}' não pertence à sua conta.` });
        }
      }

      // Checa a cota diária
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Zera as horas para pegar apenas o dia

      const usage = await prisma.dailyUsage.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: today
          }
        },
        update: {},
        create: {
          userId: user.id,
          date: today,
          messageCount: 0
        }
      });

      if (usage.messageCount >= 1000) {
        Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
        return res.status(403).json({ error: 'Limite diário de 1.000 mensagens atingido.' });
      }

    } catch (e) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(401).json({ error: 'Token inválido.' });
    }
  }
  // ----------------------------------
  
  try {
    const targetUrl = new URL(targetUrlStr + pathPart);

    // Copiamos os headers da requisição original
    const fetchHeaders = { ...req.headers };
    
    // Removemos headers que podem conflitar com a requisição
    delete fetchHeaders['x-target-url'];
    delete fetchHeaders.host;
    delete fetchHeaders.origin;
    delete fetchHeaders.referer;
    delete fetchHeaders['x-forwarded-for'];
    delete fetchHeaders['x-forwarded-host'];
    delete fetchHeaders['x-forwarded-proto'];
    delete fetchHeaders['x-vercel-id'];
    delete fetchHeaders['x-vercel-ip-country'];
    delete fetchHeaders['connection'];
    delete fetchHeaders['content-length'];
    delete fetchHeaders['accept-encoding'];

    // Vercel faz o parse automático do body se for JSON, então precisamos voltar para string
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
       if (req.body && typeof req.body === 'object') {
           body = JSON.stringify(req.body);
           fetchHeaders['content-type'] = 'application/json';
       } else {
           body = req.body;
       }
    }

    // Faz o redirecionamento (proxy) de fato
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: fetchHeaders,
      body: body
    });

    // Pega a resposta como texto bruto
    const data = await response.text();

    // Se o envio foi sucesso, incrementa a cota
    if (isSendingMessage && response.ok && userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await prisma.dailyUsage.update({
        where: {
          userId_date: {
            userId: userId,
            date: today
          }
        },
        data: {
          messageCount: { increment: 1 }
        }
      });
    }

    // Injeta os headers de CORS na resposta final
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    
    // Copia o Content-Type original se existir
    if (response.headers.get('content-type')) {
      res.setHeader('content-type', response.headers.get('content-type'));
    }

    return res.status(response.status).send(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(500).json({ 
      error: `Proxy Error: ${error.message} (Target: ${targetUrlStr || 'unknown'})`, 
      details: error.stack 
    });
  }
}
