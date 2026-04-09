import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleTryOnRequest } from './server/tryOnService';

const readJsonBody = async (req: any) => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const devApiPlugin = () => ({
  name: 'mirrorly-dev-api',
  configureServer(server: any) {
    server.middlewares.use('/api/try-on', async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') {
        next();
        return;
      }

      try {
        const payload = await readJsonBody(req);
        const response = await handleTryOnRequest(payload);
        res.statusCode = response.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response.body));
      } catch (error: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: false,
            imageUrl: '',
            message: error?.message || 'Local API hatası oluştu.',
          })
        );
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
