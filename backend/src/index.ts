import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { healthRouter } from './routes/health.js';
import { geminiRouter } from './routes/gemini.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const corsOrigin = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || '*';

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(morgan('short'));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});

app.use('/api', limiter);

app.use('/api/health', healthRouter);
app.use('/api/gemini', geminiRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: 'LinkFlow API - Use /api/health ou /api/gemini/generate',
    docs: 'https://linkflow-neon.vercel.app/',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LinkFlow Backend rodando na porta ${PORT}`);
});

export default app;
