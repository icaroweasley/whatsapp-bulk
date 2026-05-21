import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import http from 'http'
import https from 'https'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'cors-bypass-proxy',
      configureServer(server) {
        server.middlewares.use('/api-proxy', (req, res) => {
          try {
            const targetUrlStr = req.headers['x-target-url'] as string;
            if (!targetUrlStr) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing x-target-url header' }));
              return;
            }

            const targetUrl = new URL(targetUrlStr + req.url);
            const isHttps = targetUrl.protocol === 'https:';
            const requestModule = isHttps ? https : http;

            const options = {
              hostname: targetUrl.hostname,
              port: targetUrl.port || (isHttps ? 443 : 80),
              path: targetUrl.pathname + targetUrl.search,
              method: req.method,
              headers: {
                ...req.headers,
                host: targetUrl.hostname, // Important to override host
              }
            };

            // Remove headers that might cause issues
            const headers = options.headers as any;
            delete headers['x-target-url'];
            delete headers['origin'];
            delete headers['referer'];
            delete headers['host'];

            const proxyReq = requestModule.request(options, (proxyRes) => {
              // Read body to intercept HTML if needed, but we can just pipe it.
              // Let's set CORS headers
              res.writeHead(proxyRes.statusCode || 500, {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': '*'
              });
              proxyRes.pipe(res);
            });

            proxyReq.on('error', (err) => {
              res.statusCode = 502;
              res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
            });

            req.pipe(proxyReq);
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal server error: ' + e.message }));
          }
        });
      }
    }
  ]
})
