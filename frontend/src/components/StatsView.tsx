import React from 'react';
import { LinkItem, ClickLog } from '../types';
import { BarChart3, TrendingUp, Calendar, Zap, AlertCircle } from 'lucide-react';

interface StatsViewProps {
  links: LinkItem[];
  clicks: ClickLog[];
}

export default function StatsView({ links, clicks }: StatsViewProps) {
  // Aggregate clicks by individual link
  const clickCountMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    clicks.forEach((click) => {
      map[click.linkId] = (map[click.linkId] || 0) + 1;
    });
    return map;
  }, [clicks]);

  // Total system clicks
  const totalClicksObj = clicks.length;

  // Map clicks nicely to links
  const linkStats = React.useMemo(() => {
    return links.map((link) => {
      const linkClicks = clickCountMap[link.id] || 0;
      return {
        ...link,
        clicksCount: linkClicks,
      };
    }).sort((a, b) => b.clicksCount - a.clicksCount);
  }, [links, clickCountMap]);

  // Generate simple data for a weekly timeline chart (clicks in the last 7 days)
  const last7DaysData = React.useMemo(() => {
    const data: { dateLabel: string; count: number }[] = [];
    const now = new Date();
    
    // Create place-holders for the last 7 calendar days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      data.push({ dateLabel: dateString, count: 0 });
    }

    // Accumulate actual clicks
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

  return (
    <div id="statistics-manager" className="space-y-6">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Clicks Indicator Card */}
        <div id="stat-total-clicks" className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Acessos Totais</span>
            <h4 id="count-total-clicks" className="text-3xl font-extrabold text-slate-100 mt-1 flex items-baseline gap-1.5 font-mono">
              {totalClicksObj}
              <span className="text-xs text-[#a78bfa] font-sans font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Real-time
              </span>
            </h4>
          </div>
          <div className="w-12 h-12 rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa]">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Total Links Setup */}
        <div id="stat-active-links" className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Links Criados</span>
            <h4 id="count-total-links" className="text-3xl font-extrabold text-slate-100 mt-1 font-mono">
              {links.length}
              <span className="text-xs text-slate-500 font-sans font-normal block mt-1">
                {links.filter(l => l.active).length} visíveis ao público
              </span>
            </h4>
          </div>
          <div className="w-12 h-12 rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa]">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Graphic Chart View */}
      <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#a78bfa]" />
          Cliques nos Últimos 7 Dias
        </h3>

        {/* Custom React SVG Line & Grid Graph */}
        <div id="chart-svg-container" className="h-44 w-full flex items-end justify-between pt-4 gap-2 border-b border-slate-800 pb-2">
          {last7DaysData.map((day, idx) => {
            const barHeightPercent = (day.count / maxClickOnChart) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full group">
                <div className="flex-1 w-full flex items-end justify-center relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-slate-100 text-[10px] font-mono px-1.5 py-0.5 rounded shadow-lg z-10 whitespace-nowrap">
                    {day.count} {day.count === 1 ? 'clique' : 'cliques'}
                  </div>

                  {/* Visual Bar Column */}
                  <div
                    style={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                    className={`w-4/5 sm:w-1/2 rounded-t-md transition-all duration-500 ${
                      day.count > 0
                        ? 'bg-gradient-to-t from-[#a78bfa] to-[#c4b5fd] group-hover:from-[#c4b5fd] group-hover:to-[#ddd6fe] shadow-[0_0_15px_rgba(167,139,250,0.2)]'
                        : 'bg-slate-800/45 hover:bg-slate-700/45'
                    }`}
                  ></div>
                </div>

                {/* Day label */}
                <span className="text-[10px] text-slate-500 font-mono mt-2 select-none">
                  {day.dateLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Link Statistics Break-down List */}
      <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Desempenho por Botão
        </h3>

        {linkStats.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-650">
            Crie links ativos para visualizar métricas comparativas.
          </div>
        ) : (
          <div id="rankings-list" className="space-y-4">
            {linkStats.map((link) => {
              const maxVal = Math.max(...linkStats.map(l => l.clicksCount), 1);
              const rankPercent = (link.clicksCount / maxVal) * 100;
              
              return (
                <div key={link.id} id={`rank-row-${link.id}`} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300 truncate max-w-xs">{link.title}</span>
                    <span className="font-mono text-slate-200 font-bold bg-[#061026] px-2 py-0.5 rounded border border-slate-800">
                      {link.clicksCount} {link.clicksCount === 1 ? 'clique' : 'cliques'}
                    </span>
                  </div>

                  {/* Horizontal Bar Visualizer */}
                  <div className="w-full h-2 rounded bg-slate-800/55 overflow-hidden">
                    <div
                      style={{ width: `${rankPercent}%` }}
                      className={`h-full rounded transition-all duration-500 ${
                        link.active
                          ? 'bg-[#a78bfa] shadow-[0_0_8px_rgba(167,139,250,0.5)]'
                          : 'bg-slate-600'
                      }`}
                    ></div>
                  </div>
                  
                  {/* Active status pill */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]" title={link.url}>
                      {link.url}
                    </span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-medium ${
                      link.active ? 'text-[#a78bfa] bg-[#a78bfa]/10' : 'text-slate-500 bg-[#061026]'
                    }`}>
                      {link.active ? 'Ativo' : 'Rascunho'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Real-time Clicks log feed */}
      <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-[#a78bfa]" />
          Atividades Recentes
        </h3>

        {clicks.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Nenhum clique registrado nas estatísticas ainda.</p>
        ) : (
          <div id="clicks-log-feed" className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {clicks.slice(0, 10).map((click) => {
              const clickedLink = links.find(l => l.id === click.linkId);
              const clickDate = click.timestamp?.toDate ? click.timestamp.toDate() : new Date(click.timestamp);
              
              return (
                <div key={click.id} className="text-xs flex items-center justify-between p-2 rounded bg-[#060c1c]/60 border border-slate-900">
                  <span className="text-slate-350 truncate">
                    Alguém clicou em <span className="font-semibold text-[#a78bfa]">"{clickedLink?.title || 'Link Excluído'}"</span>
                  </span>
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                    {clickDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
