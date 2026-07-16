import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { healthRouter } from './routes/health.js';
import { geminiRouter } from './routes/gemini.js';
import { sendResumeRouter } from './routes/send-resume.js';
import { seoRouter } from './routes/seo.js';
import { sitemapRouter } from './routes/sitemap.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const corsOrigin = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || '*';

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
// Gzip nas respostas (páginas SEO em HTML e JSON da API ficam ~70% menores)
app.use(compression());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(morgan('short'));
app.use(express.json({ limit: '5mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});

// More permissive limit for SEO bot crawlers (they hit many URLs)
const seoLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 req/min per IP (Google crawls ~60/min)
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate-limit known good bots
    const ua = req.headers['user-agent'] || '';
    return /googlebot|bingbot|applebot|facebookexternalhit|twitterbot/i.test(ua);
  },
  message: { error: 'Limite de rastreamento atingido.' },
});

app.use('/api', limiter);

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/gemini', geminiRouter);
app.use('/api/send-resume', sendResumeRouter);

// ── SEO routes (no /api prefix, served at root-level paths) ─────────────────

// Dynamic sitemap listing all users → GET /sitemap.xml
app.use('/sitemap.xml', seoLimiter, sitemapRouter);

// Pre-rendered profile pages for crawlers → GET /seo/:username
app.use('/seo', seoLimiter, seoRouter);

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: 'LinkFlowAI API - Use /api/health, /api/gemini/generate, /sitemap.xml ou /seo/:username',
    docs: 'https://linkflowai.com.br/',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LinkFlowAI Backend rodando na porta ${PORT}`);
  console.log(`  → SEO profiles: /seo/:username`);
  console.log(`  → Dynamic sitemap: /sitemap.xml`);
});

export default app;
