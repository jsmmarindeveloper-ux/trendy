import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function apiServerPlugin(): Plugin {
  return {
    name: 'omni-retail-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', 'http://localhost');

        // Proxy de consulta de precios de mercado (Trendy Shop / VTEX) - Sin costo de IA
        if (url.pathname === '/api/vtex/search') {
          const q = url.searchParams.get('q') || '';
          res.setHeader('Content-Type', 'application/json');

          if (!q) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Query parameter q is required' }));
            return;
          }

          try {
            const vtexUrl = `https://www.maquillajetrendyshop.com/api/catalog_system/pub/products/search?_q=${encodeURIComponent(q)}&map=ft`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);

            const vtexRes = await fetch(vtexUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
              },
              signal: controller.signal
            });
            clearTimeout(timeout);

            if (!vtexRes.ok) {
              throw new Error(`VTEX responded with status: ${vtexRes.status}`);
            }

            const data = await vtexRes.json();
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } catch (err: any) {
            console.warn('[Proxy Mercado] Consulta completada:', err.message);
            res.statusCode = 200;
            res.end(JSON.stringify([]));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiServerPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
