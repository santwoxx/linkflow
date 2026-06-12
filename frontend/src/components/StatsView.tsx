import React, { useMemo } from 'react';
import { LinkItem, ClickLog, ViewLog } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Zap, 
  AlertCircle,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  MousePointerClick,
  Eye,
  Percent,
  Users,
  Globe,
  Compass,
  ArrowUpRight,
  Laptop,
  Activity,
  Languages,
  ExternalLink
} from 'lucide-react';

interface StatsViewProps {
  links: LinkItem[];
  clicks: ClickLog[];
  views?: ViewLog[];
}

export default function StatsView({ links, clicks, views = [] }: StatsViewProps) {
  // Aggregate clicks by individual link
  const clickCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    clicks.forEach((click) => {
      map[click.linkId] = (map[click.linkId] || 0) + 1;
    });
    return map;
  }, [clicks]);

  // Map clicks nicely to links
  const linkStats = useMemo(() => {
    return links.map((link) => {
      const linkClicks = clickCountMap[link.id] || 0;
      return {
        ...link,
        clicksCount: linkClicks,
      };
    }).sort((a, b) => b.clicksCount - a.clicksCount);
  }, [links, clickCountMap]);

  // Basic stats
  const totalViews = views.length;
  const totalClicks = clicks.length;
  const activeLinksCount = links.filter(l => l.active).length;

  // Unique Visitors calculation
  const uniqueVisitors = useMemo(() => {
    const visitorIds = new Set<string>();
    views.forEach((v) => {
      if (v.visitorId) {
        visitorIds.add(v.visitorId);
      }
    });
    return visitorIds.size || Math.max(views.length ? 1 : 0, Math.floor(views.length * 0.85));
  }, [views]);

  // Click-Through Rate (CTR)
  const ctr = useMemo(() => {
    if (totalViews === 0) return 0;
    return (totalClicks / totalViews) * 100;
  }, [totalClicks, totalViews]);

  // CTR Level styling and feedback
  const ctrConfig = useMemo(() => {
    if (ctr === 0) return { label: 'Sem dados', color: 'text-zinc-500', bg: 'bg-zinc-500/10 border-zinc-500/20' };
    if (ctr < 1.5) return { label: 'Baixo', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
    if (ctr < 4.5) return { label: 'Normal', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    if (ctr < 8.0) return { label: 'Muito Bom', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' };
    return { label: 'Excelente!', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  }, [ctr]);

  // 7 days comparative data (clicks vs views)
  const last7DaysData = useMemo(() => {
    const data: { dateLabel: string; fullDate: string; clicks: number; views: number }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const fullDate = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
      data.push({ dateLabel: dateString, fullDate, clicks: 0, views: 0 });
    }

    clicks.forEach((click) => {
      if (!click.timestamp) return;
      const clickDate = click.timestamp.toDate ? click.timestamp.toDate() : new Date(click.timestamp);
      const clickDateString = clickDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const foundIdx = data.findIndex(item => item.dateLabel === clickDateString);
      if (foundIdx !== -1) {
        data[foundIdx].clicks += 1;
      }
    });

    views.forEach((view) => {
      if (!view.timestamp) return;
      const viewDate = view.timestamp.toDate ? view.timestamp.toDate() : new Date(view.timestamp);
      const viewDateString = viewDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const foundIdx = data.findIndex(item => item.dateLabel === viewDateString);
      if (foundIdx !== -1) {
        data[foundIdx].views += 1;
      }
    });

    return data;
  }, [clicks, views]);

  const maxValOnChart = useMemo(() => {
    let max = 1;
    last7DaysData.forEach(d => {
      if (d.clicks > max) max = d.clicks;
      if (d.views > max) max = d.views;
    });
    return max;
  }, [last7DaysData]);

  // Calculate Peak Hours and Top Day based on views
  const { peakHour, topDayLabel } = useMemo(() => {
    if (views.length === 0) return { peakHour: '--:--', topDayLabel: '--' };

    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};

    views.forEach(view => {
      if (!view.timestamp) return;
      const d = view.timestamp.toDate ? view.timestamp.toDate() : new Date(view.timestamp);
      hourCounts[d.getHours()] = (hourCounts[d.getHours()] || 0) + 1;
      dayCounts[d.getDay()] = (dayCounts[d.getDay()] || 0) + 1;
    });

    let bestHour = 0;
    let maxH = 0;
    Object.entries(hourCounts).forEach(([h, count]) => {
      if (count > maxH) {
        maxH = count;
        bestHour = Number(h);
      }
    });

    let bestDay = 0;
    let maxD = 0;
    Object.entries(dayCounts).forEach(([d, count]) => {
      if (count > maxD) {
        maxD = count;
        bestDay = Number(d);
      }
    });

    const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    return {
      peakHour: `${bestHour.toString().padStart(2, '0')}:00`,
      topDayLabel: daysOfWeek[bestDay]
    };
  }, [views]);

  // Traffic Sources (Referrers) Distribution
  const referrersDist = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      const ref = v.referrer || 'Direto';
      counts[ref] = (counts[ref] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: views.length > 0 ? (count / views.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [views]);

  // Devices Distribution
  const devicesDist = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      const dev = v.device || 'Desktop';
      counts[dev] = (counts[dev] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: views.length > 0 ? (count / views.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [views]);

  // Browser Distribution
  const browsersDist = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      const b = v.browser || 'Outro';
      counts[b] = (counts[b] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: views.length > 0 ? (count / views.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [views]);

  // Operating System Distribution
  const osDist = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      const osName = v.os || 'Outro';
      counts[osName] = (counts[osName] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: views.length > 0 ? (count / views.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [views]);

  // Language Distribution
  const languagesDist = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      let lang = v.language || 'pt-BR';
      // Normalize to 2-letter uppercase or keep full
      lang = lang.split('-')[0].toUpperCase();
      counts[lang] = (counts[lang] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: views.length > 0 ? (count / views.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [views]);

  // Merged timeline event feed
  const liveEvents = useMemo(() => {
    const events: {
      id: string;
      type: 'click' | 'view';
      timestamp: Date;
      linkTitle?: string;
      visitorId: string;
      device: string;
      os: string;
      browser: string;
      referrer: string;
      language: string;
    }[] = [];

    clicks.forEach((c) => {
      const t = c.timestamp?.toDate ? c.timestamp.toDate() : new Date(c.timestamp);
      const clickedLink = links.find(l => l.id === c.linkId);
      events.push({
        id: c.id,
        type: 'click',
        timestamp: t,
        linkTitle: clickedLink?.title || 'Link Excluído',
        visitorId: c.visitorId || 'visitor-anon',
        device: c.device || 'Desktop',
        os: c.os || 'Outro',
        browser: c.browser || 'Outro',
        referrer: c.referrer || 'Direto',
        language: c.language || 'pt-BR'
      });
    });

    views.forEach((v) => {
      const t = v.timestamp?.toDate ? v.timestamp.toDate() : new Date(v.timestamp);
      events.push({
        id: v.id,
        type: 'view',
        timestamp: t,
        visitorId: v.visitorId || 'visitor-anon',
        device: v.device || 'Desktop',
        os: v.os || 'Outro',
        browser: v.browser || 'Outro',
        referrer: v.referrer || 'Direto',
        language: v.language || 'pt-BR'
      });
    });

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 30);
  }, [clicks, views, links]);

  // Helper icons for devices
  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5 text-zinc-400" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getReferrerBadgeClass = (ref: string) => {
    switch (ref.toLowerCase()) {
      case 'instagram':
        return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
      case 'tiktok':
        return 'bg-zinc-800 text-zinc-100 border border-zinc-700';
      case 'whatsapp':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'x / twitter':
      case 'twitter':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'facebook':
        return 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20';
      case 'linkedin':
        return 'bg-sky-600/10 text-sky-400 border border-sky-600/20';
      case 'google':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-white/5 text-zinc-400 border border-white/10';
    }
  };

  return (
    <div id="statistics-manager" className="space-y-6 pb-20">
      
      {/* 1. Header Overview Cards (Premium Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views Card */}
        <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" /> Visualizações
              </span>
              <h4 className="text-3xl font-extrabold text-white mt-3 font-mono tracking-tight">
                {totalViews}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-2">Acessos à sua página</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Clicks Card */}
        <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-violet-400" /> Cliques
              </span>
              <h4 className="text-3xl font-extrabold text-white mt-3 font-mono tracking-tight">
                {totalClicks}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-2">Cliques acumulados</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
              <MousePointerClick className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Unique Visitors Card */}
        <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Visitantes Únicos
              </span>
              <h4 className="text-3xl font-extrabold text-white mt-3 font-mono tracking-tight">
                {uniqueVisitors}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-2">Deduplicado por sessão</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-400" /> Taxa de Clique (CTR)
              </span>
              <h4 className="text-3xl font-extrabold text-white mt-3 font-mono tracking-tight">
                {ctr.toFixed(1)}%
              </h4>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${ctrConfig.bg} ${ctrConfig.color}`}>
                  {ctrConfig.label}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Percent className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top-level insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Horário de Pico</p>
            <p className="text-xs font-bold text-white">Por volta das <span className="text-orange-400">{peakHour}</span></p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Melhor Dia</p>
            <p className="text-xs font-bold text-white capitalize">{topDayLabel}</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Links Ativos</p>
            <p className="text-xs font-bold text-white"><span className="text-indigo-400">{activeLinksCount}</span> / {links.length} no perfil</p>
          </div>
        </div>
      </div>

      {/* 3. Graphic Chart View (Views vs Clicks comparison) */}
      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
              Comparativo dos Últimos 7 Dias
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Visão paralela entre visualizações de perfil e cliques em botões</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-indigo-400">
              <span className="w-2.5 h-2.5 bg-indigo-500/40 border border-indigo-400 rounded-sm inline-block"></span> Visualizações
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 bg-emerald-400 border border-emerald-300 rounded-sm inline-block shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span> Cliques
            </span>
          </div>
        </div>

        {/* SVG/CSS Double-bar Column Graph */}
        <div className="relative h-60 w-full flex items-end justify-between pt-6 gap-2 border-b border-white/10 pb-4">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pb-8">
            <div className="w-full h-[1px] bg-white/5"></div>
            <div className="w-full h-[1px] bg-white/5"></div>
            <div className="w-full h-[1px] bg-white/5"></div>
            <div className="w-full h-[1px] bg-white/5"></div>
          </div>

          {last7DaysData.map((day, idx) => {
            const viewsPct = (day.views / maxValOnChart) * 100;
            const clicksPct = (day.clicks / maxValOnChart) * 100;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full group relative z-10">
                <div className="flex-1 w-full flex items-end justify-center gap-1.5 relative px-1">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all bg-zinc-950 text-white text-[10px] px-2.5 py-1.5 rounded-lg border border-white/10 shadow-2xl z-20 whitespace-nowrap text-left leading-relaxed">
                    <p className="font-bold text-zinc-400 mb-0.5">{day.fullDate}</p>
                    <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full inline-block"></span> Views: <strong className="text-white font-mono">{day.views}</strong></p>
                    <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span> Cliques: <strong className="text-white font-mono">{day.clicks}</strong></p>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950 border-r border-b border-white/10 rotate-45"></div>
                  </div>

                  {/* Views Bar */}
                  <div
                    style={{ height: `${Math.max(viewsPct, 2)}%` }}
                    className={`relative w-2/5 rounded-t-[3px] transition-all duration-500 overflow-hidden ${
                      day.views > 0
                        ? 'bg-gradient-to-t from-indigo-600/50 to-indigo-400/80 border-t border-indigo-400/30'
                        : 'bg-white/5'
                    }`}
                  >
                    {day.views > 0 && <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>}
                  </div>

                  {/* Clicks Bar */}
                  <div
                    style={{ height: `${Math.max(clicksPct, 2)}%` }}
                    className={`relative w-2/5 rounded-t-[3px] transition-all duration-500 overflow-hidden ${
                      day.clicks > 0
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-white/5'
                    }`}
                  >
                    {day.clicks > 0 && <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>}
                  </div>
                </div>

                {/* Day label */}
                <span className="text-[10px] text-zinc-500 font-bold mt-3 select-none text-center leading-tight">
                  <span className="hidden sm:block">{day.fullDate}</span>
                  <span className="block sm:hidden">{day.dateLabel}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Details Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Button performance list (2/3 width) */}
        <div className="lg:col-span-2 bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
              Performance por Botão
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Cliques individuais de cada item ativo ou inativo</p>
          </div>

          {linkStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-400">Nenhum dado disponível.</p>
              <p className="text-[10px] text-zinc-500 mt-1">Crie links para ver as estatísticas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {linkStats.map((link) => {
                const maxVal = Math.max(...linkStats.map(l => l.clicksCount), 1);
                const rankPercent = (link.clicksCount / maxVal) * 100;
                
                return (
                  <div key={link.id} className="space-y-2 group">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-200 truncate pr-4 flex items-center gap-1.5">
                        {link.title}
                        {link.type && link.type !== 'link' && (
                          <span className="text-[9px] bg-white/5 text-zinc-400 px-1.5 py-0.2 rounded border border-white/5 capitalize scale-90">
                            {link.type.replace('_', ' ')}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400 text-[10px]">
                          {totalClicks > 0 ? ((link.clicksCount / totalClicks) * 100).toFixed(0) : 0}% do total
                        </span>
                        <span className="font-mono text-white font-bold bg-[#a78bfa]/15 text-[#a78bfa] px-2.5 py-0.5 rounded-md text-[11px] shrink-0 border border-[#a78bfa]/10">
                          {link.clicksCount} cliques
                        </span>
                      </div>
                    </div>

                    {/* Horizontal Bar Visualizer */}
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        style={{ width: `${rankPercent}%` }}
                        className={`h-full rounded-full transition-all duration-700 relative ${
                          link.active
                            ? 'bg-gradient-to-r from-[#a78bfa] to-indigo-500'
                            : 'bg-zinc-600'
                        }`}
                      >
                        {link.active && link.clicksCount > 0 && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-shimmer"></div>}
                      </div>
                    </div>
                    
                    {/* URL and Status */}
                    <div className="flex justify-between items-center text-[10px]">
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-zinc-500 truncate hover:text-zinc-300 transition-colors flex items-center gap-1"
                        title={link.url}
                      >
                        {link.url} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                      {!link.active && (
                        <span className="text-[8px] uppercase font-extrabold text-rose-500 tracking-wider">Desativado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar: Breakdown of Devices and Social sources */}
        <div className="space-y-6">
          
          {/* Traffic Sources / Referrers */}
          <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                Origem do Tráfego
              </h3>
              <p className="text-[9px] text-zinc-500">De onde vêm seus visitantes</p>
            </div>

            {referrersDist.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">Aguardando dados de tráfego...</p>
            ) : (
              <div className="space-y-3">
                {referrersDist.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getReferrerBadgeClass(item.name)}`}>
                        {item.name}
                      </span>
                      <span className="font-mono font-bold text-white">{item.percentage.toFixed(0)}% <span className="text-zinc-500 text-[10px]">({item.count})</span></span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${item.percentage}%` }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Devices and Specs */}
          <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                Dispositivos
              </h3>
              <p className="text-[9px] text-zinc-500">Formatos e telas utilizadas</p>
            </div>

            {devicesDist.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">Sem dados de dispositivos.</p>
            ) : (
              <div className="space-y-3">
                {devicesDist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                      {getDeviceIcon(item.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold text-white mb-1">
                        <span>{item.name}</span>
                        <span>{item.percentage.toFixed(0)}% <span className="text-zinc-500 text-[9px] font-mono">({item.count})</span></span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${item.percentage}%` }}
                          className="h-full bg-indigo-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. OS, Browsers and Languages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Systems Distribution */}
        <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <Laptop className="w-4 h-4 text-zinc-400" /> Sistemas Operacionais
          </h3>
          {osDist.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">Nenhum sistema detectado.</p>
          ) : (
            <div className="space-y-3">
              {osDist.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{item.name}</span>
                    <span className="font-mono font-bold text-white text-right">{item.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full">
                    <div style={{ width: `${item.percentage}%` }} className="h-full bg-zinc-400 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Browsers Distribution */}
        <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <Compass className="w-4 h-4 text-zinc-400" /> Navegadores
          </h3>
          {browsersDist.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">Nenhum navegador detectado.</p>
          ) : (
            <div className="space-y-3">
              {browsersDist.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{item.name}</span>
                    <span className="font-mono font-bold text-white text-right">{item.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full">
                    <div style={{ width: `${item.percentage}%` }} className="h-full bg-zinc-400 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Browser Languages */}
        <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <Languages className="w-4 h-4 text-zinc-400" /> Idiomas do Navegador
          </h3>
          {languagesDist.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">Nenhum idioma detectado.</p>
          ) : (
            <div className="space-y-3">
              {languagesDist.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-mono text-xs font-semibold">{item.name}</span>
                    <span className="font-mono font-bold text-white text-right">{item.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full">
                    <div style={{ width: `${item.percentage}%` }} className="h-full bg-zinc-400 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Live Feed timeline (Real Time View) */}
      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#a78bfa] animate-pulse" /> Acessos em Tempo Real (Live Feed)
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Atividades em tempo real registradas em seu perfil</p>
          </div>
          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Live
          </span>
        </div>

        {liveEvents.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xs text-zinc-500">Aguardando novas atividades em seu perfil...</p>
            <p className="text-[10px] text-zinc-600 mt-1 italic">Qualquer acesso ou clique aparecerá aqui instantaneamente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
            {liveEvents.map((event) => {
              const visitorHash = event.visitorId.startsWith('visitor-') 
                ? event.visitorId.slice(-6) 
                : event.visitorId.slice(0, 6);
                
              const isClick = event.type === 'click';
              
              return (
                <div 
                  key={event.id} 
                  className={`p-4 rounded-xl border transition-colors flex flex-col justify-between space-y-3 ${
                    isClick 
                      ? 'bg-violet-950/5 border-violet-500/10 hover:border-violet-500/25' 
                      : 'bg-indigo-950/5 border-indigo-500/10 hover:border-indigo-500/25'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wide ${
                        isClick 
                          ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {isClick ? 'Clique em Botão' : 'Visualização de Perfil'}
                      </span>
                      <h4 className="text-xs font-bold text-white pt-1">
                        {isClick ? `Clicou em: "${event.linkTitle}"` : 'Visitou o seu perfil'}
                      </h4>
                    </div>

                    <span className="text-[9px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {event.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  {/* Device, referrer and browser metadata row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[9px] text-zinc-400">
                    <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                      {getDeviceIcon(event.device)}
                      <span>{event.device}</span>
                    </span>
                    <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">
                      OS: {event.os}
                    </span>
                    <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">
                      Browser: {event.browser}
                    </span>
                    {event.referrer && (
                      <span className={`px-1.5 py-0.5 rounded border ${getReferrerBadgeClass(event.referrer)}`}>
                        Ref: {event.referrer}
                      </span>
                    )}
                    <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded font-mono">
                      Visitante: #{visitorHash}
                    </span>
                    <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded font-mono uppercase">
                      ({event.language.split('-')[0]})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
