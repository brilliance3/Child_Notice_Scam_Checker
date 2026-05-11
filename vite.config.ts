// Vite 빌드 설정과 로컬 개발 시 /api/analyze 프록시 미들웨어를 정의한다
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage } from 'node:http';
import { defineConfig, loadEnv } from 'vite';
import { runAnalyze } from './lib/server/runAnalyze.ts';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'local-api-analyze',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url ?? '';
          if (url.startsWith('/api/analyze') && req.method === 'POST') {
            try {
              const raw = await readBody(req);
              const env = loadEnv(mode, process.cwd(), '');
              const key = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
              const parsed = JSON.parse(raw || '{}') as { message?: unknown };
              const message =
                typeof parsed.message === 'string' ? parsed.message.trim() : '';
              if (!message) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ error: 'message 필드에 분석할 문자를 입력해주세요.' }));
                return;
              }
              const result = await runAnalyze(message, key);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(result));
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: '분석 중 오류가 발생했습니다.' }));
            }
            return;
          }
          next();
        });
      },
    },
  ],
}));
