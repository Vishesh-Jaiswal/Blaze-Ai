import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

const dataDir = path.resolve(__dirname, 'data');

/**
 * File-backed JSON DB exposed at /api/db/<key>.
 * GET → returns the contents of data/<key>.json (or `null` if missing).
 * PUT → overwrites data/<key>.json with the request body (must be valid JSON).
 *
 * The data folder is committed to git, so `git clone` on another machine
 * brings the full app state along with the code. Production builds don't
 * have a server, so the client gracefully falls back to localStorage-only.
 */
function fsDbPlugin() {
  // Ensure the data folder exists at dev-server startup.
  if (!fsSync.existsSync(dataDir)) fsSync.mkdirSync(dataDir, { recursive: true });

  const isSafeKey = (k) => /^[a-z0-9_-]+$/i.test(k);

  return {
    name: 'fs-db',
    configureServer(server) {
      server.middlewares.use('/api/db', (req, res) => {
        // Pull the key from the URL ("/users" → "users").
        const key = decodeURIComponent((req.url || '').replace(/^\//, '').split('?')[0]);
        if (!key || !isSafeKey(key)) {
          res.statusCode = 400;
          res.end('Invalid key');
          return;
        }
        const filepath = path.join(dataDir, `${key}.json`);

        if (req.method === 'GET') {
          fs.readFile(filepath, 'utf-8').then(
            (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(data || 'null');
            },
            () => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end('null');
            }
          );
          return;
        }

        if (req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              JSON.parse(body); // validate
              await fs.writeFile(filepath, body, 'utf-8');
              res.statusCode = 204;
              res.end();
            } catch (e) {
              res.statusCode = 400;
              res.end('Invalid JSON body');
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), fsDbPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
