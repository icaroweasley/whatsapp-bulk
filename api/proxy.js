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
  
  try {
    const targetUrl = new URL(targetUrlStr + pathPart);

    // Copiamos os headers da requisição original
    const fetchHeaders = { ...req.headers };
    
    // Removemos headers que podem conflitar com a requisição do Vercel para a Evolution API
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
    return res.status(500).json({ error: 'Internal Proxy Error', details: error.message });
  }
}
