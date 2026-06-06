import React, { useMemo } from 'react';
import { LinkItem, ClickLog } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Zap, 
  AlertCircle,
  Clock,
  Smartphone,
  Monitor,
  MousePointerClick
} from 'lucide-react';

interface StatsViewProps {
  links: LinkItem[];
  clicks: ClickLog[];
}

export default function StatsView({ links, clicks }: StatsViewProps) {
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

  // Calculate stats
  const totalClicksObj = clicks.length;
  const activeLinksCount = links.filter(l => l.active).length;

  // Last 7 days chart
  const last7DaysData = useMemo(() => {
    const data: { dateLabel: string; count: number; fullDate: string }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const fullDate = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
      data.push({ dateLabel: dateString, fullDate, count: 0 });
    }

    clicks.forEach((click) => {
      if (!click.timestamp) return;
      const clickDate = click.timestamp.toDate ? click.timestamp.toDate() : new Date(click.timestamp);
      const clickDateString = clickDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const foundIdx = data.findIndex(item => item.dateLabel === clickDateString);
      if (foundIdx !== -1) {
        data[foundIdx].count += 1;
      }
    });

    return data;
  }, [clicks]);

  const maxClickOnChart = Math.max(...last7DaysData.map(d => d.count), 1);

  // Calculate Peak Hours and Top Day
  const { peakHour, topDayLabel } = useMemo(() => {
    if (clicks.length === 0) return { peakHour: '--:--', topDayLabel: '--' };

    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};

    clicks.forEach(click => {
      if (!click.timestamp) return;
      const d = click.timestamp.toDate ? click.timestamp.toDate() : new Date(click.timestamp);
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
  }, [clicks]);

  return (
    <div id="statistics-manager" className="space-y-6 pb-20">
      {/* 1. Header Overview Cards (Premium Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Clicks Indicator Card */}
        <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/10 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#a78bfa]" /> Acessos Totais
              </span>
              <h4 className="text-4xl font-extrabold text-white mt-3 font-mono tracking-tight">
                {totalClicksObj}
              </h4>
              <p className="text-xs text-emerald-400 font-semibold mt-2 flex items-center gap-1 bg-emerald-400/10 inline-flex px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" /> Em tempo real
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa] group-hover:scale-110 transition-transform">
              <MousePointerClick className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Links Setup */}
        <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" /> Seus Links
              </span>
              <h4 className="text-4xl font-extrabold text-white mt-3 font-mono tracking-tight">
                {links.length}
              </h4>
              <p className="text-xs text-zinc-500 font-medium mt-2 bg-white/5 inline-flex px-2 py-1 rounded-full">
                {activeLinksCount} ativos visíveis
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Intelligent Metrics Cards (Peak Time & Top Day) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-0.5">Horário de Pico</p>
            <p className="text-sm font-bold text-white">Por volta das <span className="text-orange-400">{peakHour}</span></p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-0.5">Melhor Dia</p>
            <p className="text-sm font-bold text-white capitalize">{topDayLabel}</p>
          </div>
        </div>
      </div>

      {/* 3. Graphic Chart View (Premium) */}
      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 space-y-6">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center justify-between">
          <span>Cliques nos Últimos 7 Dias</span>
          <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-zinc-400">Total: {clicks.length}</span>
        </h3>

        {/* Custom Premium React SVG Line & Grid Graph */}
        <div className="relative h-56 w-full flex items-end justify-between pt-6 gap-2 border-b border-white/10 pb-4">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pb-8">
            <div className="w-full h-[1px] bg-white/5"></div>
            <div className="w-full h-[1px] bg-white/5"></div>
            <div className="w-full h-[1px] bg-white/5"></div>
            <div className="w-full h-[1px] bg-white/5"></div>
          </div>

          {last7DaysData.map((day, idx) => {
            const barHeightPercent = (day.count / maxClickOnChart) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full group relative z-10">
                <div className="flex-1 w-full flex items-end justify-center relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all bg-white text-black text-[11px] font-bold px-2 py-1 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] z-20 whitespace-nowrap">
                    {day.count} acessos
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                  </div>

                  {/* Visual Bar Column */}
                  <div
                    style={{ height: `${Math.max(barHeightPercent, 2)}%` }}
                    className={`relative w-2/3 sm:w-1/2 rounded-t-md transition-all duration-500 overflow-hidden ${
                      day.count > 0
                        ? 'bg-gradient-to-t from-[#a78bfa] to-[#d8b4fe] shadow-[0_0_20px_rgba(167,139,250,0.4)]'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {/* Glossy overlay */}
                    {day.count > 0 && <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>}
                  </div>
                </div>

                {/* Day label */}
                <span className="text-[10px] text-zinc-500 font-medium mt-3 select-none text-center leading-tight">
                  <span className="hidden sm:block">{day.fullDate}</span>
                  <span className="block sm:hidden">{day.dateLabel}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 4. Link Statistics Break-down List (Top 2/3 width) */}
        <div className="md:col-span-2 bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 space-y-6">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
            Desempenho por Botão
          </h3>

          {linkStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-400">Nenhum dado disponível.</p>
              <p className="text-[10px] text-zinc-500 mt-1">Crie links para ver as estatísticas.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {linkStats.map((link) => {
                const maxVal = Math.max(...linkStats.map(l => l.clicksCount), 1);
                const rankPercent = (link.clicksCount / maxVal) * 100;
                
                return (
                  <div key={link.id} className="space-y-2 group">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-zinc-200 truncate pr-4">{link.title}</span>
                      <span className="font-mono text-white font-bold bg-[#a78bfa]/20 text-[#a78bfa] px-2.5 py-0.5 rounded-md text-xs shrink-0">
                        {link.clicksCount} clicks
                      </span>
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
                        {link.active && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-shimmer"></div>}
                      </div>
                    </div>
                    
                    {/* URL and Status */}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 truncate" title={link.url}>
                        {link.url}
                      </span>
                      {!link.active && (
                        <span className="text-[9px] uppercase font-bold text-rose-500">Desativado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Right Sidebar: Devices Placeholder & Recent Activity */}
        <div className="space-y-6">
          {/* Devices Fake Card */}
          <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4">
              Dispositivos
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm font-bold text-white mb-1">
                  <span>Mobile</span>
                  <span>72%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[72%] h-full bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm font-bold text-white mb-1">
                  <span>Desktop</span>
                  <span>28%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[28%] h-full bg-purple-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-zinc-600 mt-4 text-center italic">*Dados demonstrativos de tráfego</p>
          </div>

          {/* Real-time Timeline */}
          <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#a78bfa]" /> Live Feed
            </h3>

            {clicks.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Aguardando novos cliques...</p>
            ) : (
              <div className="relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {clicks.slice(0, 15).map((click, index) => {
                  const clickedLink = links.find(l => l.id === click.linkId);
                  const clickDate = click.timestamp?.toDate ? click.timestamp.toDate() : new Date(click.timestamp);
                  
                  return (
                    <div key={click.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#0a0a0a] bg-[#a78bfa] text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white/5 p-3 rounded-xl border border-white/5 group-hover:border-[#a78bfa]/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-xs truncate mr-2" title={clickedLink?.title}>
                            {clickedLink?.title || 'Link Excluído'}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                            {clickDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400">Novo clique registrado</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
