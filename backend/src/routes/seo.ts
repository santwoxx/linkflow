import { Router, Request, Response } from 'express';
import admin from '../firebase-admin.js';

export const seoRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Helper: escape HTML entities
// ─────────────────────────────────────────────────────────────────────────────
function esc(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: detect crawler bots
// ─────────────────────────────────────────────────────────────────────────────
function isBot(userAgent: string): boolean {
  return /bot|crawl|slurp|spider|mediapartners|googlebot|bingbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|slack|discord|applebot|yandex|duckduck|semrush|ahrefs|moz|screaming|lighthouse/i.test(userAgent);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build rich HTML page for a user profile
// ─────────────────────────────────────────────────────────────────────────────
function buildProfileHTML(profile: any, links: any[]): string {
  const name = esc(profile.displayName || profile.username || '');
  const username = esc(profile.username || '');
  const bio = esc(profile.bio || `Confira os links de ${name} no LinkFlowAI`);
  const avatar = esc(profile.profilePicUrl || 'https://linkflowai.com.br/og-image.png');
  const profileUrl = `https://linkflowai.com.br/${username}`;

  // Professional / business context
  const isPro = profile.verifiedProfessional && profile.serviceEnabled;

  // WA FORT special case
  const isWafort = ['wafort', 'wafort24h', 'wafort-seguranca', 'wafort_seguranca'].includes(username);

  let title = `${name} (@${username}) | LinkFlowAI`;
  let desc = bio;
  let keywords = `${name}, ${username}, linkflowai, link na bio`;

  // Custom overrides for known businesses
  if (isWafort) {
    title = 'WA FORT | Segurança Inteligente Premium & Monitoramento 24h – Itabuna BA';
    desc = 'WA FORT: Referência em Segurança Inteligente, Portaria Remota e Monitoramento 24h no Sul e Sudoeste Baiano. Tecnologia de elite protegendo seu patrimônio.';
    keywords = 'WA FORT, wafort, wafort24h, portaria remota, monitoramento 24h, segurança eletrônica, Itabuna, Bahia, linkflowai';
  } else if (isPro && profile.profession) {
    const prof = esc(profile.profession);
    title = `${name} – ${prof} | LinkFlowAI`;
    desc = bio || `${name} é ${prof}. Veja os serviços, portfólio e contatos no LinkFlowAI.`;
    keywords = `${name}, ${username}, ${prof}, freelancer, profissional, linkflowai`;
  }

  // Build visible link list for crawlers
  const activeLinks = links
    .filter((l: any) => l.active)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, 12);

  const linksHtml = activeLinks.map((l: any) => {
    if (!l.title || !l.url) return '';
    const linkTitle = esc(l.title);
    const linkUrl = esc(l.url);
    const emoji = l.iconEmoji ? esc(l.iconEmoji) : '🔗';
    return `<li><a href="${linkUrl}" rel="noopener noreferrer">${emoji} ${linkTitle}</a></li>`;
  }).filter(Boolean).join('\n');

  // Skills / tags for professional profiles
  const skillsHtml = (profile.skills || []).slice(0, 8).map((s: string) =>
    `<span class="tag">${esc(s)}</span>`
  ).join('');

  // LocalBusiness JSON-LD for WA FORT
  const wafortSchema = isWafort ? JSON.stringify([{
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${profileUrl}#business`,
    'name': 'WA FORT – Segurança Inteligente',
    'alternateName': ['Wafort', 'WA FORT Segurança Eletrônica'],
    'description': desc,
    'url': profileUrl,
    'sameAs': ['https://www.instagram.com/wafort24h', 'https://wafort.com.br'],
    'image': avatar,
    'telephone': '+55-73-3215-3907',
    'openingHours': 'Mo-Su 00:00-23:59',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Av. Juca Leão, 232 - Centro Comercial',
      'addressLocality': 'Itabuna',
      'addressRegion': 'BA',
      'postalCode': '45600-770',
      'addressCountry': 'BR'
    },
    'geo': { '@type': 'GeoCoordinates', 'latitude': -14.7929, 'longitude': -39.2794 },
    'aggregateRating': { '@type': 'AggregateRating', 'ratingValue': '4.8', 'reviewCount': '3618', 'bestRating': '5' }
  }, {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'LinkFlowAI', 'item': 'https://linkflowai.com.br/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'WA FORT', 'item': profileUrl }
    ]
  }]) : '';

  // Generic Person/Organization JSON-LD
  const genericSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': isPro ? 'ProfilePage' : 'ProfilePage',
    'name': title,
    'description': desc,
    'url': profileUrl,
    'mainEntity': {
      '@type': isPro ? 'Organization' : 'Person',
      'name': profile.displayName || username,
      'alternateName': username,
      'description': profile.bio || '',
      'image': profile.profilePicUrl || '',
      'url': profileUrl,
      ...(profile.profession ? { 'jobTitle': profile.profession } : {}),
      ...(profile.skills?.length ? { 'knowsAbout': profile.skills } : {}),
    }
  });

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}"/>
  <meta name="keywords" content="${esc(keywords)}"/>
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"/>
  <meta name="author" content="${name}"/>
  ${isWafort ? `
  <meta name="geo.region" content="BR-BA"/>
  <meta name="geo.placename" content="Itabuna, Bahia"/>
  <meta name="geo.position" content="-14.7929;-39.2794"/>
  <meta name="ICBM" content="-14.7929, -39.2794"/>
  ` : ''}
  <meta property="og:type" content="profile"/>
  <meta property="og:url" content="${profileUrl}"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(desc)}"/>
  <meta property="og:image" content="${avatar}"/>
  <meta property="og:locale" content="pt_BR"/>
  <meta property="og:site_name" content="LinkFlowAI"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(desc)}"/>
  <meta name="twitter:image" content="${avatar}"/>
  <link rel="canonical" href="${profileUrl}"/>
  <link rel="manifest" href="/manifest.json"/>
  ${isWafort ? `<script type="application/ld+json">${wafortSchema}</script>` : `<script type="application/ld+json">${genericSchema}</script>`}
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#050b18;color:#e2e8f0;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:3rem 1rem}
    .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:1.5rem;padding:2rem;max-width:440px;width:100%;text-align:center;margin-bottom:1rem}
    .avatar{width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.15);margin:0 auto 1rem;display:block}
    .avatar-fallback{width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#10b981,#6366f1);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:#fff;margin:0 auto 1rem}
    h1{font-size:1.4rem;font-weight:800;color:#fff;margin-bottom:.25rem}
    .username{font-size:.78rem;color:#64748b;font-family:monospace;margin-bottom:.75rem}
    .badge{display:inline-flex;align-items:center;gap:.3rem;background:#1e293b;border:1px solid rgba(255,255,255,0.1);padding:.2rem .7rem;border-radius:999px;font-size:.68rem;color:#94a3b8;margin-bottom:1rem;text-transform:uppercase;letter-spacing:.06em}
    .bio{font-size:.88rem;color:#94a3b8;line-height:1.65;margin-bottom:1.25rem;white-space:pre-wrap}
    .tags{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;margin-bottom:1.25rem}
    .tag{background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.25);color:#a5b4fc;font-size:.7rem;padding:.2rem .6rem;border-radius:.5rem}
    .links-title{font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:#475569;margin-bottom:.75rem}
    ul{list-style:none;display:flex;flex-direction:column;gap:.5rem;width:100%}
    ul a{display:block;padding:.75rem 1rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:.875rem;color:#cbd5e1;font-size:.85rem;text-decoration:none;transition:all .2s;text-align:left}
    ul a:hover{background:rgba(255,255,255,0.08);color:#fff}
    .footer{margin-top:1.5rem;font-size:.7rem;color:#1e293b;text-align:center}
    .footer a{color:#334155;text-decoration:none}
    .powered{display:inline-flex;align-items:center;gap:.3rem;margin-top:.4rem;font-size:.68rem;color:#334155}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">✅ Perfil verificado no LinkFlowAI</div>
    ${profile.profilePicUrl
      ? `<img class="avatar" src="${avatar}" alt="Foto de ${name}" loading="eager"/>`
      : `<div class="avatar-fallback">${name.charAt(0).toUpperCase()}</div>`}
    <h1>${name}</h1>
    <p class="username">@${username}</p>
    ${isPro && profile.profession ? `<p class="badge">💼 ${esc(profile.profession)}</p>` : ''}
    ${bio ? `<p class="bio">${bio}</p>` : ''}
    ${skillsHtml ? `<div class="tags">${skillsHtml}</div>` : ''}
    ${activeLinks.length > 0 ? `
      <p class="links-title">Links</p>
      <ul>${linksHtml}</ul>
    ` : ''}
  </div>
  <p class="footer">
    <a href="https://linkflowai.com.br">LinkFlowAI</a> · A plataforma de links do Brasil
    <br/>
    <span class="powered">Crie seu perfil gratuito em linkflowai.com.br</span>
  </p>

  <!-- Bots see this HTML. Browsers get the full React SPA. -->
  <script>
    var ua = navigator.userAgent.toLowerCase();
    var bot = /bot|crawl|slurp|spider|mediapartners|facebookexternalhit|twitterbot|linkedinbot/.test(ua);
    if (!bot) { window.location.replace('${profileUrl}'); }
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/seo/:username
// Returns pre-rendered HTML for Googlebot / social crawlers
// ─────────────────────────────────────────────────────────────────────────────
seoRouter.get('/:username', async (req: Request, res: Response) => {
  const { username } = req.params;
  const ua = req.headers['user-agent'] || '';

  // Sanitize
  const slug = username.toLowerCase().trim().replace(/[^a-z0-9_\-.]/g, '');
  if (!slug || slug.length < 2 || slug.length > 40) {
    return res.status(400).send('Invalid username');
  }

  try {
    const db = admin.firestore();

    // Fetch user profile
    const usersSnap = await db.collection('users')
      .where('username', '==', slug)
      .limit(1)
      .get();

    if (usersSnap.empty) {
      return res.status(404).send('Profile not found');
    }

    const profile = usersSnap.docs[0].data();

    // If banned, return minimal response
    if (profile.banned) {
      return res.status(403).send('Profile unavailable');
    }

    // Fetch active links
    const linksSnap = await db.collection('users').doc(profile.uid).collection('links')
      .where('active', '==', true)
      .orderBy('order', 'asc')
      .limit(15)
      .get();

    const links = linksSnap.docs.map(d => d.data());

    const html = buildProfileHTML(profile, links);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=86400');
    res.setHeader('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1');
    res.status(200).send(html);

  } catch (err) {
    console.error(`[SEO] Erro ao servir perfil ${slug}:`, err);
    res.status(500).send('Server error');
  }
});
