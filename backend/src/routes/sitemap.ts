import { Router, Request, Response } from 'express';
import admin from '../firebase-admin.js';

export const sitemapRouter = Router();

const BASE_URL = 'https://linkflowai.com.br';
const TODAY = new Date().toISOString().split('T')[0];

// Static high-priority pages
const STATIC_PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/servicos', priority: '0.9', changefreq: 'daily' },
  { loc: '/linktree-gratis', priority: '0.9', changefreq: 'weekly' },
  { loc: '/alternativa-linktree', priority: '0.9', changefreq: 'weekly' },
  { loc: '/como-colocar-link-na-bio', priority: '0.8', changefreq: 'weekly' },
  { loc: '/plataforma-freelancer', priority: '0.8', changefreq: 'weekly' },
  { loc: '/contratar-freelancer', priority: '0.8', changefreq: 'weekly' },
];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sitemap.xml
// Dynamic sitemap listing all public (non-banned) user profiles
// ─────────────────────────────────────────────────────────────────────────────
sitemapRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const db = admin.firestore();

    // Fetch all non-banned users with a username
    const snap = await db.collection('users')
      .where('banned', '!=', true)
      .select('username', 'updatedAt', 'verifiedProfessional', 'serviceEnabled')
      .limit(5000)
      .get();

    const userUrls: string[] = [];

    snap.forEach(doc => {
      const data = doc.data();
      if (!data.username) return;

      const slug = data.username.toLowerCase().trim();
      if (!slug || slug.length < 2) return;

      // Determine last mod date
      let lastmod = TODAY;
      if (data.updatedAt?.toDate) {
        lastmod = data.updatedAt.toDate().toISOString().split('T')[0];
      }

      // Pro/verified profiles get higher priority
      const isPro = data.verifiedProfessional && data.serviceEnabled;
      const priority = isPro ? '0.9' : '0.7';
      const changefreq = isPro ? 'daily' : 'weekly';

      userUrls.push(`  <url>
    <loc>${BASE_URL}/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`);
    });

    // Build static page entries
    const staticEntries = STATIC_PAGES.map(p => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

${staticEntries}

${userUrls.join('\n')}

</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=43200, stale-while-revalidate=86400'); // 12h cache
    res.status(200).send(xml);

  } catch (err) {
    console.error('[Sitemap] Erro ao gerar sitemap:', err);
    // Fallback to static sitemap on error
    res.status(500).send('Sitemap generation failed');
  }
});
