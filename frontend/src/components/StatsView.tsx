import React, { useMemo, useState } from 'react';
import { LinkItem, ClickLog, ViewLog, Lead, ResumeData } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
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
  ArrowUp,
  ArrowDown,
  Laptop,
  Activity,
  Languages,
  ExternalLink,
  MessageSquare,
  Send,
  Edit3,
  Phone,
  User,
  Sparkles,
  Download,
  CheckCircle,
  XCircle,
  FileText,
  Filter
} from 'lucide-react';

interface StatsViewProps {
  links: LinkItem[];
  clicks: ClickLog[];
  views?: ViewLog[];
  leads?: Lead[];
  resumes?: ResumeData[];
}

export default function StatsView({ links, clicks, views = [], leads = [], resumes = [] }: StatsViewProps) {
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('7d');

  // Custom WhatsApp message template (persisted to localStorage)
  const LS_KEY = 'linkflow_lead_msg_template';
  const loadTemplate = (): string => {
    try { return localStorage.getItem(LS_KEY) || ''; } catch { return ''; }
  };
  const [messageTemplate, setMessageTemplate] = useState(loadTemplate);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  React.useEffect(() => {
    try {
      if (messageTemplate) localStorage.setItem(LS_KEY, messageTemplate);
      else localStorage.removeItem(LS_KEY);
    } catch {}
  }, [messageTemplate]);

  const getPeriodStart = () => {
    if (period === 'all') return new Date(0);
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  };

  const getPrevPeriodStart = () => {
    if (period === 'all') return new Date(0);
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);
  };

  const inRange = (ts: any, start: Date, end: Date) => {
    if (!ts) return false;
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d >= start && d <= end;
  };

  const periodEnd = new Date();

  const filteredClicks = useMemo(() => {
    const start = getPeriodStart();
    return clicks.filter(c => inRange(c.timestamp, start, periodEnd));
  }, [clicks, period]);

  const filteredViews = useMemo(() => {
    const start = getPeriodStart();
    return views.filter(v => inRange(v.timestamp, start, periodEnd));
  }, [views, period]);

  const filteredLeads = useMemo(() => {
    const start = getPeriodStart();
    return leads.filter(l => inRange(l.createdAt, start, periodEnd));
  }, [leads, period]);

  // Trend calc: compare current period vs previous equivalent period
  const trend = useMemo(() => {
    const currentStart = getPeriodStart();
    const prevStart = getPrevPeriodStart();
    const prevEnd = currentStart;

    const curViews = views.filter(v => inRange(v.timestamp, currentStart, periodEnd)).length;
    const prevViews = views.filter(v => inRange(v.timestamp, prevStart, prevEnd)).length;
    const curClicks = clicks.filter(c => inRange(c.timestamp, currentStart, periodEnd)).length;
    const prevClicks = clicks.filter(c => inRange(c.timestamp, prevStart, prevEnd)).length;
    const curLeads = leads.filter(l => inRange(l.createdAt, currentStart, periodEnd)).length;
    const prevLeads = leads.filter(l => inRange(l.createdAt, prevStart, prevEnd)).length;

    const viewsChange = prevViews > 0 ? ((curViews - prevViews) / prevViews) * 100 : curViews > 0 ? 100 : 0;
    const clicksChange = prevClicks > 0 ? ((curClicks - prevClicks) / prevClicks) * 100 : curClicks > 0 ? 100 : 0;
    const leadsChange = prevLeads > 0 ? ((curLeads - prevLeads) / prevLeads) * 100 : curLeads > 0 ? 100 : 0;

    return { viewsChange, clicksChange, leadsChange };
  }, [views, clicks, leads, period]);

  const [editingStatusLeadId, setEditingStatusLeadId] = useState<string | null>(null);

  // Aggregate clicks by individual link
  const clickCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredClicks.forEach((click) => {
      if (click.linkId) {
        map[click.linkId] = (map[click.linkId] || 0) + 1;
      }
    });
    return map;
  }, [filteredClicks]);

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
  const totalViews = filteredViews.length;
  const totalClicks = filteredClicks.length;
  const activeLinksCount = links.filter(l => l.active).length;

  // Unique Visitors calculation
  const uniqueVisitors = useMemo(() => {
    const visitorIds = new Set<string>();
    filteredViews.forEach((v) => {
      if (v.visitorId) {
        visitorIds.add(v.visitorId);
      }
    });
    return visitorIds.size || Math.max(filteredViews.length ? 1 : 0, Math.floor(filteredViews.length * 0.85));
  }, [filteredViews]);

  // Click-Through Rate (CTR)
  const ctr = useMemo(() => {
    if (totalViews === 0) return 0;
    return (totalClicks / totalViews) * 100;
  }, [totalClicks, totalViews]);

  // Conversion funnel
  const funnel = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const viewsToLeads = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;
    const clicksToLeads = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
    return { totalLeads, viewsToLeads, clicksToLeads };
  }, [totalViews, totalClicks, filteredLeads]);

  // CTR Level styling and feedback (High Premium Design)
  const ctrConfig = useMemo(() => {
    if (ctr === 0) return { label: 'Sem dados', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20 shadow-[0_0_15px_rgba(148,163,184,0.05)]' };
    if (ctr < 1.5) return { label: 'Baixo', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]' };
    if (ctr < 4.5) return { label: 'Normal', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]' };
    if (ctr < 8.0) return { label: 'Muito Bom', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.05)]' };
    return { label: 'Excelente!', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' };
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
    // Set a neat step threshold
    return Math.ceil(max * 1.15);
  }, [last7DaysData]);

  // Calculate Peak Hours and Top Day based on views
  const { peakHour, topDayLabel } = useMemo(() => {
    if (filteredViews.length === 0) return { peakHour: '--:--', topDayLabel: '--' };

    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};

    filteredViews.forEach(view => {
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
  }, [filteredViews]);

  // Traffic Sources (Referrers) Distribution
  const referrersDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredViews.forEach((v) => {
      const ref = v.referrer || 'Direto';
      counts[ref] = (counts[ref] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: filteredViews.length > 0 ? (count / filteredViews.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredViews]);

  // Devices Distribution
  const devicesDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredViews.forEach((v) => {
      const dev = v.device || 'Desktop';
      counts[dev] = (counts[dev] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: filteredViews.length > 0 ? (count / filteredViews.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredViews]);

  // Browser Distribution
  const browsersDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredViews.forEach((v) => {
      const b = v.browser || 'Outro';
      counts[b] = (counts[b] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: filteredViews.length > 0 ? (count / filteredViews.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredViews]);

  // Operating System Distribution
  const osDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredViews.forEach((v) => {
      const osName = v.os || 'Outro';
      counts[osName] = (counts[osName] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: filteredViews.length > 0 ? (count / filteredViews.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredViews]);

  // Language Distribution
  const languagesDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredViews.forEach((v) => {
      let lang = v.language || 'pt-BR';
      lang = lang.split('-')[0].toUpperCase();
      counts[lang] = (counts[lang] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: filteredViews.length > 0 ? (count / filteredViews.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [filteredViews]);

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

    filteredClicks.forEach((c) => {
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

    filteredViews.forEach((v) => {
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} id="statistics-manager" className="space-y-6 pb-20">
      
      {/* Period Selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 glass bg-[#090d16]/50 border border-white/[0.06] rounded-2xl p-1">
          {(['7d', '30d', '90d', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer scale-on-click ${
                period === p
                  ? 'bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/30 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === '90d' ? '90 dias' : 'Todo período'}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-zinc-500 font-mono bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 rounded-xl">
          {filteredViews.length + filteredClicks.length} eventos no período
        </div>
      </div>
      
      {/* 1. Header Overview Cards (Premium Glassmorphic Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views Card */}
        <div className="bg-[#090d16]/70 backdrop-blur-md p-3 sm:p-5 rounded-3xl border border-white/[0.06] shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex justify-between items-start">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Eye className="w-3.5 h-3.5 text-indigo-400" /> Visualizações
              </span>
              <div>
                <h4 className="text-3xl font-extrabold text-white font-mono tracking-tight group-hover:text-indigo-300 transition-colors">
                  {totalViews}
                </h4>
                <p className="text-[10px] text-zinc-500 mt-1">Visitas gerais ao perfil</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {period !== 'all' && (
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend.viewsChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trend.viewsChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(trend.viewsChange).toFixed(0)}%
                </span>
              )}
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/25 group-hover:border-indigo-500/40 transition-all duration-300 shadow-inner">
                <Eye className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Clicks Card */}
        <div className="bg-[#090d16]/70 backdrop-blur-md p-3 sm:p-5 rounded-3xl border border-white/[0.06] shadow-xl relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all duration-500 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex justify-between items-start">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <MousePointerClick className="w-3.5 h-3.5 text-violet-400" /> Cliques
              </span>
              <div>
                <h4 className="text-3xl font-extrabold text-white font-mono tracking-tight group-hover:text-violet-300 transition-colors">
                  {totalClicks}
                </h4>
                <p className="text-[10px] text-zinc-500 mt-1">Cliques em botões</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {period !== 'all' && (
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend.clicksChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trend.clicksChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(trend.clicksChange).toFixed(0)}%
                </span>
              )}
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:bg-violet-500/25 group-hover:border-violet-500/40 transition-all duration-300 shadow-inner">
                <MousePointerClick className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Unique Visitors Card */}
        <div className="bg-[#090d16]/70 backdrop-blur-md p-3 sm:p-5 rounded-3xl border border-white/[0.06] shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex justify-between items-start">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Visitantes
              </span>
              <div>
                <h4 className="text-3xl font-extrabold text-white font-mono tracking-tight group-hover:text-blue-300 transition-colors">
                  {uniqueVisitors}
                </h4>
                <p className="text-[10px] text-zinc-500 mt-1">Visitantes únicos</p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/25 group-hover:border-blue-500/40 transition-all duration-300 shadow-inner">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-[#090d16]/70 backdrop-blur-md p-3 sm:p-5 rounded-3xl border border-white/[0.06] shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex justify-between items-start">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Percent className="w-3.5 h-3.5 text-emerald-400" /> Taxa CTR
              </span>
              <div>
                <h4 className="text-3xl font-extrabold text-white font-mono tracking-tight group-hover:text-emerald-300 transition-colors">
                  {ctr.toFixed(1)}%
                </h4>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border tracking-wider uppercase ${ctrConfig.bg} ${ctrConfig.color}`}>
                    {ctrConfig.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/25 group-hover:border-emerald-500/40 transition-all duration-300 shadow-inner">
              <Percent className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top-level insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#090d16]/50 backdrop-blur-md p-4 rounded-2xl border border-white/[0.05] card-lift glow-border flex items-center gap-3.5 hover:border-white/10 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-4.5 h-4.5 text-orange-400" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Horário de Pico</p>
            <p className="text-xs font-extrabold text-white mt-0.5">Por volta das <span className="text-orange-400">{peakHour}</span></p>
          </div>
        </div>

        <div className="bg-[#090d16]/50 backdrop-blur-md p-4 rounded-2xl border border-white/[0.05] card-lift glow-border flex items-center gap-3.5 hover:border-white/10 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Melhor Dia de Acesso</p>
            <p className="text-xs font-extrabold text-white capitalize mt-0.5">{topDayLabel}</p>
          </div>
        </div>

        <div className="bg-[#090d16]/50 backdrop-blur-md p-4 rounded-2xl border border-white/[0.05] card-lift glow-border flex items-center gap-3.5 hover:border-white/10 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Links Ativos</p>
            <p className="text-xs font-extrabold text-white mt-0.5"><span className="text-indigo-400">{activeLinksCount}</span> / {links.length} no perfil</p>
          </div>
        </div>
      </div>

      {/* 3. Graphic Chart View (Views vs Clicks comparison) */}
      <div className="bg-[#090d16]/70 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] shadow-xl space-y-6 relative overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Comparativo de Acessos (Últimos 7 Dias)
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">Interação entre visualizações de página e cliques em blocos</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold bg-white/[0.02] border border-white/[0.05] px-3.5 py-1.5 rounded-full select-none">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 bg-indigo-500/30 border border-indigo-400/50 rounded-sm inline-block shadow-[0_0_8px_rgba(99,102,241,0.15)]" />
              Visualizações
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 bg-emerald-500/30 border border-emerald-400/50 rounded-sm inline-block shadow-[0_0_8px_rgba(16,185,129,0.15)]" />
              Cliques
            </span>
          </div>
        </div>

        {/* SVG/CSS Double-bar Column Graph */}
        <div className="relative h-60 w-full flex items-end justify-between pt-6 pl-0 sm:pl-8 pr-2 pb-4">
          
          {/* Y-axis Label Scale (Left side) */}
          <div className="absolute left-0 top-6 bottom-10 hidden sm:flex flex-col justify-between text-[9px] font-mono text-zinc-500 select-none pointer-events-none text-right w-6 pr-2">
            <span>{maxValOnChart}</span>
            <span>{Math.round(maxValOnChart * 0.75)}</span>
            <span>{Math.round(maxValOnChart * 0.5)}</span>
            <span>{Math.round(maxValOnChart * 0.25)}</span>
            <span>0</span>
          </div>

          {/* Background Grid Lines */}
          <div className="absolute left-0 sm:left-8 right-2 top-6 bottom-10 pointer-events-none flex flex-col justify-between">
            <div className="w-full h-[1px] bg-white/[0.04]" />
            <div className="w-full h-[1px] bg-white/[0.04]" />
            <div className="w-full h-[1px] bg-white/[0.04]" />
            <div className="w-full h-[1px] bg-white/[0.04]" />
            <div className="w-full h-[1px] bg-white/[0.08]" />
          </div>

          {/* Graph Columns */}
          <div className="flex-1 h-full flex items-end justify-between gap-3 sm:gap-4 z-10 relative min-w-[280px]">
            {last7DaysData.map((day, idx) => {
              const viewsPct = maxValOnChart > 0 ? (day.views / maxValOnChart) * 100 : 0;
              const clicksPct = maxValOnChart > 0 ? (day.clicks / maxValOnChart) * 100 : 0;
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full group relative">
                  <div className="flex-1 w-full flex items-end justify-center gap-1 sm:gap-2 relative px-0.5">
                    
                    {/* Tooltip on hover */}
                    <div className="absolute -top-14 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200 bg-[#0c1220]/95 text-white text-[10px] p-2.5 rounded-2xl border border-white/10 shadow-2xl z-30 whitespace-nowrap text-left leading-relaxed">
                      <p className="font-extrabold text-zinc-300 border-b border-white/10 pb-1 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                        <Calendar className="w-3 h-3 text-indigo-400" /> {day.fullDate}
                      </p>
                      <p className="flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                        Views: <strong className="text-white font-mono">{day.views}</strong>
                      </p>
                      <p className="flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                        Cliques: <strong className="text-white font-mono">{day.clicks}</strong>
                      </p>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0c1220] border-r border-b border-white/10 rotate-45" />
                    </div>

                    {/* Views Bar (Indigo Rounded Column) */}
                    <div
                      style={{ height: `${Math.max(viewsPct, 2.5)}%` }}
                      className={`relative w-2/5 rounded-t-full transition-all duration-700 ${
                        day.views > 0
                          ? 'bg-gradient-to-t from-indigo-600/40 via-indigo-500/70 to-indigo-400 border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:scale-x-105'
                          : 'bg-white/[0.03]'
                      }`}
                    >
                      {day.views > 0 && <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full" />}
                    </div>

                    {/* Clicks Bar (Emerald Rounded Column) */}
                    <div
                      style={{ height: `${Math.max(clicksPct, 2.5)}%` }}
                      className={`relative w-2/5 rounded-t-full transition-all duration-700 ${
                        day.clicks > 0
                          ? 'bg-gradient-to-t from-emerald-600/40 via-emerald-500 to-emerald-300 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-x-105'
                          : 'bg-white/[0.03]'
                      }`}
                    >
                      {day.clicks > 0 && <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />}
                    </div>
                  </div>

                  {/* Day Label (X-Axis) */}
                  <span className="text-[9px] text-zinc-500 font-bold mt-3.5 select-none text-center leading-tight">
                    <span className="hidden sm:block">{day.fullDate}</span>
                    <span className="block sm:hidden">{day.dateLabel}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Details Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Left: Button performance list (2/3 width) */}
        <div className="lg:col-span-2 bg-[#090d16]/70 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                Performance por Botão
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">Estatísticas individuais por bloco configurado</p>
            </div>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 border border-indigo-500/20 rounded-md font-bold uppercase tracking-wider">Ordenado</span>
          </div>

          {linkStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3.5 border border-white/5 shadow-inner">
                <BarChart3 className="w-5 h-5 text-zinc-500 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-zinc-400">Nenhum bloco ou link disponível</p>
              <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">Crie botões ou blocos de conteúdo no construtor para monitorar cliques.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {linkStats.map((link, idx) => {
                const maxVal = Math.max(...linkStats.map(l => l.clicksCount), 1);
                const rankPercent = (link.clicksCount / maxVal) * 100;
                
                return (
                  <div key={link.id} className="space-y-2 group bg-white/[0.01] hover:bg-white/[0.02] p-3 rounded-2xl border border-white/[0.02] hover:border-white/[0.05] transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <div className="font-bold text-zinc-200 truncate pr-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono text-zinc-400 flex items-center justify-center font-bold">
                          #{idx + 1}
                        </span>
                        <span className="truncate group-hover:text-white transition-colors">{link.title}</span>
                        {link.type && link.type !== 'link' && (
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 capitalize font-extrabold tracking-wide scale-90 origin-left">
                            {link.type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono text-zinc-500 text-[10px] hidden sm:inline-block">
                          {totalClicks > 0 ? ((link.clicksCount / totalClicks) * 100).toFixed(0) : 0}%
                        </span>
                        <span className="font-mono text-white font-extrabold bg-[#a78bfa]/15 text-[#a78bfa] px-2.5 py-0.5 rounded-lg text-[10px] border border-[#a78bfa]/10 shadow-[0_2px_8px_rgba(167,139,250,0.08)]">
                          {link.clicksCount} clicks
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar with Shimmer Animation */}
                    <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden p-[1px] border border-white/[0.03]">
                      <div
                        style={{ width: `${rankPercent}%` }}
                        className={`h-full rounded-full transition-all duration-1000 relative ${
                          link.active
                            ? 'bg-gradient-to-r from-indigo-600 via-[#a78bfa] to-emerald-400'
                            : 'bg-zinc-700'
                        }`}
                      >
                        {link.active && link.clicksCount > 0 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-shimmer" />
                        )}
                      </div>
                    </div>
                    
                    {/* URL and Status Row */}
                    <div className="flex justify-between items-center text-[10px]">
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-zinc-500 truncate hover:text-zinc-300 transition-colors flex items-center gap-1 max-w-[80%] font-medium"
                        title={link.url}
                      >
                        <span className="truncate">{link.url}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                      {!link.active ? (
                        <span className="text-[8px] uppercase font-extrabold text-rose-500 tracking-wider">Inativo</span>
                      ) : (
                        <span className="text-[8px] uppercase font-bold text-emerald-500/80 tracking-wider">Ativo</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar: Traffic Sources & Devices */}
        <div className="space-y-6">
          
          {/* Traffic Sources / Referrers */}
          <div className="bg-[#090d16]/70 backdrop-blur-md p-5 rounded-3xl border border-white/[0.06] shadow-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                Origem do Tráfego
              </h3>
              <p className="text-[9px] text-zinc-500 mt-0.5">Canais de referência de entrada</p>
            </div>

            {referrersDist.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-6 h-6 text-zinc-600 mx-auto animate-pulse mb-2" />
                <p className="text-[10px] text-zinc-500 italic">Aguardando novos dados...</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {referrersDist.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase border ${getReferrerBadgeClass(item.name)}`}>
                        {item.name}
                      </span>
                      <span className="font-mono font-extrabold text-white text-[11px]">
                        {item.percentage.toFixed(0)}% 
                        <span className="text-zinc-500 text-[9px] font-normal ml-1">({item.count})</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden p-[1px]">
                      <div 
                        style={{ width: `${item.percentage}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.4)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Devices Distribution */}
          <div className="bg-[#090d16]/70 backdrop-blur-md p-5 rounded-3xl border border-white/[0.06] shadow-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                Dispositivos
              </h3>
              <p className="text-[9px] text-zinc-500 mt-0.5">Resoluções e formatos utilizados</p>
            </div>

            {devicesDist.length === 0 ? (
              <div className="text-center py-8">
                <Smartphone className="w-6 h-6 text-zinc-600 mx-auto animate-pulse mb-2" />
                <p className="text-[10px] text-zinc-500 italic">Sem registros de tela</p>
              </div>
            ) : (
              <div className="space-y-4">
                {devicesDist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/[0.01] border border-white/[0.03] p-2 rounded-2xl hover:bg-white/[0.02] transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-zinc-300">
                      {getDeviceIcon(item.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs font-bold text-white mb-1.5">
                        <span className="capitalize">{item.name}</span>
                        <span className="font-mono text-[11px]">
                          {item.percentage.toFixed(0)}% 
                          <span className="text-zinc-500 text-[9px] font-normal ml-1">({item.count})</span>
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${item.percentage}%` }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
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
        <div className="bg-[#090d16]/70 backdrop-blur-md p-5 rounded-3xl border border-white/[0.06] shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <Laptop className="w-4 h-4 text-violet-400" /> Sistemas Operacionais
          </h3>
          {osDist.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center italic">Nenhum SO detectado</p>
          ) : (
            <div className="space-y-3.5">
              {osDist.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">{item.name}</span>
                    <span className="font-mono font-extrabold text-white text-[11px]">{item.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div style={{ width: `${item.percentage}%` }} className="h-full bg-violet-400 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Browsers Distribution */}
        <div className="bg-[#090d16]/70 backdrop-blur-md p-5 rounded-3xl border border-white/[0.06] shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-400" /> Navegadores
          </h3>
          {browsersDist.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center italic">Nenhum navegador detectado</p>
          ) : (
            <div className="space-y-3.5">
              {browsersDist.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">{item.name}</span>
                    <span className="font-mono font-extrabold text-white text-[11px]">{item.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div style={{ width: `${item.percentage}%` }} className="h-full bg-blue-400 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Browser Languages */}
        <div className="bg-[#090d16]/70 backdrop-blur-md p-5 rounded-3xl border border-white/[0.06] shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <Languages className="w-4 h-4 text-emerald-400" /> Idiomas do Navegador
          </h3>
          {languagesDist.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center italic">Nenhum idioma detectado</p>
          ) : (
            <div className="space-y-3.5">
              {languagesDist.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-mono font-bold">{item.name}</span>
                    <span className="font-mono font-extrabold text-white text-[11px]">{item.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div style={{ width: `${item.percentage}%` }} className="h-full bg-emerald-400 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Live Feed timeline (Real Time Command Center) */}
      <div className="bg-[#090d16]/70 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#a78bfa] animate-pulse" /> Acessos em Tempo Real
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">Histórico instantâneo de conexões e interações</p>
          </div>
          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full text-emerald-400 font-extrabold flex items-center gap-1.5 select-none shadow-[0_0_12px_rgba(16,185,129,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            LIVE RADAR
          </span>
        </div>

        {liveEvents.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.01] rounded-2xl border border-white/[0.02]">
            <p className="text-xs text-zinc-500">Aguardando novos eventos e visitas de usuários...</p>
            <p className="text-[10px] text-zinc-600 mt-1.5 italic">Os dados de visitantes e cliques de botões serão sincronizados aqui na velocidade da rede.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {liveEvents.map((event) => {
              const visitorHash = event.visitorId.startsWith('visitor-') 
                ? event.visitorId.slice(-6) 
                : event.visitorId.slice(0, 6);
                
              const isClick = event.type === 'click';
              
              return (
                <div 
                  key={event.id} 
                  className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3.5 hover:-translate-y-0.5 ${
                    isClick 
                      ? 'bg-violet-950/10 border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-950/15' 
                      : 'bg-indigo-950/10 border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-950/15'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1.5 min-w-0">
                      <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                        isClick 
                          ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {isClick ? 'Clique em Link' : 'Visita ao Perfil'}
                      </span>
                      <h4 className="text-xs font-bold text-white pt-1 truncate max-w-[220px]">
                        {isClick ? `Clicou: "${event.linkTitle}"` : 'Visitou seu perfil'}
                      </h4>
                    </div>

                    <span className="text-[9px] font-mono font-bold text-zinc-500 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      {event.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  {/* Device, referrer and browser metadata row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[8.5px] text-zinc-400 font-medium select-none">
                    <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      {getDeviceIcon(event.device)}
                      <span className="capitalize">{event.device}</span>
                    </span>
                    <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-md">
                      OS: {event.os}
                    </span>
                    <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-md">
                      {event.browser}
                    </span>
                    {event.referrer && (
                      <span className={`px-1.5 py-0.5 rounded-md border ${getReferrerBadgeClass(event.referrer)}`}>
                        Ref: {event.referrer}
                      </span>
                    )}
                    <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-md font-mono text-zinc-500">
                      ID: #{visitorHash}
                    </span>
                    <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-md font-mono uppercase text-zinc-500">
                      {event.language.split('-')[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONVERSION FUNNEL */}
      {(totalViews > 0 || funnel.totalLeads > 0) && (
        <div className="bg-[#090d16]/70 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Funil de Conversão</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Da visita ao lead — acompanhe suas taxas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Views stage */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-center space-y-2 card-lift glow-border">
              <Eye className="w-6 h-6 text-indigo-400 mx-auto" />
              <p className="text-2xl font-extrabold text-white font-mono">{totalViews}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Visitas</p>
              <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Clicks stage */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-center space-y-2 card-lift glow-border">
              <MousePointerClick className="w-6 h-6 text-violet-400 mx-auto" />
              <p className="text-2xl font-extrabold text-white font-mono">{totalClicks}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Cliques</p>
              <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${totalViews > 0 ? (totalClicks / totalViews) * 100 : 0}%` }} />
              </div>
              <span className="text-[9px] text-zinc-500">{totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0}% de conversão</span>
            </div>

            {/* Leads stage */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-center space-y-2 card-lift glow-border">
              <Sparkles className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-2xl font-extrabold text-white font-mono">{funnel.totalLeads}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Leads</p>
              <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${totalViews > 0 ? (funnel.totalLeads / totalViews) * 100 : 0}%` }} />
              </div>
              <span className="text-[9px] text-zinc-500">{funnel.viewsToLeads.toFixed(1)}% visita→lead</span>
            </div>
          </div>
        </div>
      )}

      {/* RESUMES SECTION */}
      {resumes.length > 0 && (
        <div className="bg-[#090d16]/70 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Currículos Recebidos</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">{resumes.length} candidato{resumes.length !== 1 ? 's' : ''} se candidatou{resumes.length !== 1 ? 'ram' : ''}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 text-[10px] uppercase tracking-wider border-b border-white/5">
                  <th className="pb-3 pr-3 font-semibold">Nome</th>
                  <th className="pb-3 pr-3 font-semibold">Email</th>
                  <th className="pb-3 pr-3 font-semibold">Telefone</th>
                  <th className="pb-3 pr-3 font-semibold">Data</th>
                  <th className="pb-3 font-semibold">Arquivo</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((r) => {
                  const ts = r.createdAt?.toDate ? r.createdAt.toDate() : new Date();
                  const formattedDate = ts.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  return (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="py-3 pr-3 text-zinc-200 font-medium">{r.candidateName}</td>
                      <td className="py-3 pr-3 text-zinc-300">{r.candidateEmail}</td>
                      <td className="py-3 pr-3 text-zinc-300">{r.candidatePhone || '--'}</td>
                      <td className="py-3 pr-3 text-zinc-400 text-[10px]">{formattedDate}</td>
                      <td className="py-3">
                        {r.resumeFileName ? (
                          <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {r.resumeFileName}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[10px]">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEADS SECTION */}
      <div className="w-full bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Leads Capturados</h3>
              <p className="text-[10px] text-zinc-400">{leads.length} visitante{leads.length !== 1 ? 's' : ''} autorizou{leads.length !== 1 ? 'ram' : ''} o compartilhamento</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTemplateEditor(!showTemplateEditor)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-[10px] transition-all cursor-pointer scale-on-click ${
                showTemplateEditor
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'
                  : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Personalizar mensagem do WhatsApp"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Mensagem
            </button>
            {leads.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const csvRows = [['Nome', 'Telefone', 'Status', 'Data']];
                  leads.forEach(l => {
                    const ts = l.createdAt?.toDate ? l.createdAt.toDate() : new Date();
                    csvRows.push([l.visitorName, l.visitorPhone, l.status || 'new', ts.toLocaleDateString('pt-BR')]);
                  });
                  const csv = csvRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `leads-linkflow-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 font-bold text-[10px] transition-all cursor-pointer scale-on-click"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar CSV
              </button>
            )}
          </div>
        </div>

          {showTemplateEditor && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/60 border border-zinc-700/50 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Modelo de Mensagem WhatsApp
                </h4>
                <span className="text-[9px] text-zinc-600 font-mono">
                  Use {'{nome}'} {'{telefone}'} como variáveis
                </span>
              </div>
              <textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Olá {nome}! Vi que você visitou meu perfil...&#10;&#10;Pode me ajudar com mais informações?"
                rows={4}
                className="w-full bg-black/40 text-[11px] text-zinc-200 p-3 rounded-xl border border-zinc-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none resize-none placeholder-zinc-600"
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-zinc-600">
                  {messageTemplate
                    ? '✓ Mensagem personalizada salva automaticamente'
                    : 'Deixe vazio para usar a mensagem padrão'}
                </p>
                <button
                  type="button"
                  onClick={() => { setMessageTemplate(''); setShowTemplateEditor(false); }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer scale-on-click"
                >
                  Restaurar padrão
                </button>
              </div>
            </motion.div>
          )}

          {leads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-500 text-[10px] uppercase tracking-wider border-b border-white/5">
                    <th className="pb-3 pr-3 font-semibold">Nome</th>
                    <th className="pb-3 pr-3 font-semibold">Telefone</th>
                    <th className="pb-3 pr-3 font-semibold">Status</th>
                    <th className="pb-3 pr-3 font-semibold">Data</th>
                    <th className="pb-3 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const ts = lead.createdAt?.toDate ? lead.createdAt.toDate() : new Date();
                    const formattedDate = ts.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const formattedTime = ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    const composeMessage = (lead: Lead) => {
                      if (messageTemplate) {
                        return messageTemplate
                          .replace(/\{nome\}/g, lead.visitorName)
                          .replace(/\{telefone\}/g, lead.visitorPhone);
                      }
                      return `Olá ${lead.visitorName}! Tudo bem? 👋\n\nVi que você visitou meu perfil no LinkFlowAI e autorizou o compartilhamento de dados. Gostaria de saber se posso ajudar com mais informações sobre meus serviços!\n\nAgradeço o contato!`;
                    };

                    const handleWhatsApp = () => {
                      const phone = lead.visitorPhone.replace(/\D/g, '');
                      const msg = editingLeadId === lead.id ? editMessage : composeMessage(lead);
                      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                      window.open(url, '_blank');
                    };

                    const handleStatusChange = async (newStatus: 'new' | 'contacted' | 'converted') => {
                      if (lead.profileOwnerId) {
                        try {
                          await updateDoc(doc(db, 'users', lead.profileOwnerId, 'leads', lead.id), { status: newStatus, updatedAt: serverTimestamp() });
                        } catch (err) {
                          console.error('Erro ao atualizar status do lead:', err);
                        }
                      }
                    };

                    const statusColors: Record<string, string> = {
                      new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                      contacted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      converted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    };

                    const statusLabels: Record<string, string> = {
                      new: 'Novo',
                      contacted: 'Contatado',
                      converted: 'Convertido',
                    };

                    return (
                      <tr key={lead.id} className="border-b border-white/5">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="text-zinc-200 font-medium">{lead.visitorName}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="text-zinc-300">{lead.visitorPhone}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setEditingStatusLeadId(editingStatusLeadId === lead.id ? null : lead.id)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider cursor-pointer scale-on-click ${statusColors[lead.status || 'new'] || statusColors.new}`}
                            >
                              {statusLabels[lead.status || 'new']}
                            </button>
                            {editingStatusLeadId === lead.id && (
                              <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-2xl z-30 min-w-[130px]">
                                {(['new', 'contacted', 'converted'] as const).map(s => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => { handleStatusChange(s); setEditingStatusLeadId(null); }}
                                    className={`w-full text-left px-3 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2 ${
                                      (lead.status || 'new') === s ? 'text-white bg-white/10' : 'text-zinc-400'
                                    }`}
                                  >
                                    {s === 'new' && <XCircle className="w-3 h-3 text-blue-400" />}
                                    {s === 'contacted' && <Send className="w-3 h-3 text-amber-400" />}
                                    {s === 'converted' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                                    {statusLabels[s]}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="text-zinc-400 text-[10px]">{formattedDate} às {formattedTime}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (editingLeadId === lead.id) {
                                  setEditingLeadId(null);
                                } else {
                                  setEditingLeadId(lead.id);
                                  setEditMessage(composeMessage(lead));
                                }
                              }}
                              className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer scale-on-click"
                              title="Editar mensagem"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleWhatsApp}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 font-bold text-[10px] transition-all cursor-pointer scale-on-click"
                              title="Enviar WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              WhatsApp
                            </button>
                          </div>
                          {editingLeadId === lead.id && (
                            <div className="mt-2 text-left">
                              <textarea
                                value={editMessage}
                                onChange={(e) => setEditMessage(e.target.value)}
                                rows={4}
                                className="w-full bg-zinc-900 text-[11px] text-zinc-200 p-3 rounded-xl border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all outline-none resize-none"
                              />
                              <div className="flex justify-end mt-1.5 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingLeadId(null)}
                                  className="px-3 py-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer scale-on-click"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={handleWhatsApp}
                                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all cursor-pointer scale-on-click"
                                >
                                  <Send className="w-3 h-3" />
                                  Enviar
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[11px] text-zinc-600">Nenhum lead capturado ainda.<br/>Compartilhe seu perfil público para começar a receber leads.</p>
            </div>
          )}
      </div>

    </motion.div>
  );
}
