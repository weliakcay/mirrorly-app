import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

const readJsonBody = async (req: any) => {
  if (req.body && typeof req.body !== 'string') return req.body;

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

// Vercel'in dosya tabanli routing davranisini taklit eden generic dev API middleware.
// /api/foo/bar isteklerini api/foo/bar.js dosyasinin default export'una yonlendirir.
// Bu sayede ayni handler kodunun hem lokal dev hem Vercel uretiminde calismasi saglanir.
const devApiPlugin = () => ({
  name: 'mirrorly-dev-api',
  configureServer(server: any) {
    server.middlewares.use('/api', async (req: any, res: any, next: any) => {
      const urlPath = (req.url || '/').split('?')[0];
      // /api dahili olarak path'in /api kisminin atildigi (sadece sonrasi)
      const relativePath = urlPath.replace(/^\/+/, '').replace(/\.js$/, '') || 'index';
      const apiFile = path.resolve(process.cwd(), 'api', `${relativePath}.js`);

      if (!fs.existsSync(apiFile)) {
        next();
        return;
      }

      try {
        // mtime query string ile module cache bypass: dev sirasinda dosya degistiginde yeni hali yuklenir
        const stat = fs.statSync(apiFile);
        const moduleUrl = `${pathToFileURL(apiFile).href}?t=${stat.mtimeMs}`;
        const mod = await import(moduleUrl);
        const handler = mod.default || mod.handler;

        if (typeof handler !== 'function') {
          throw new Error(`api/${relativePath}.js default export bir async fonksiyon olmali.`);
        }

        // Vercel-benzeri req.body parse (sadece body'li metodlarda)
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          try {
            req.body = await readJsonBody(req);
          } catch {
            // body parse hatasi handler'a JSON parse hatasi olarak yansir
          }
        }

        // Vercel-benzeri res.status / res.json yardimcilari
        if (typeof res.status !== 'function') {
          res.status = (code: number) => {
            res.statusCode = code;
            return res;
          };
        }
        if (typeof res.json !== 'function') {
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
        }

        await handler(req, res);
      } catch (error: any) {
        console.error('[vite api middleware]', relativePath, error?.message || error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: false,
              message: error?.message || 'Local API hatasi olustu.',
            })
          );
        }
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), devApiPlugin()],
  };
});
