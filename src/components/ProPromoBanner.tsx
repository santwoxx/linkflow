import React from 'react';
import { Briefcase, MessageCircle, Shield, TrendingUp, Zap } from 'lucide-react';
import { getProCheckoutUrl, type CheckoutSource } from '../utils/proCheckout';

interface ProPromoBannerProps {
  eyebrow?: string;
  heading?: string;
  subhead?: string;
  source?: CheckoutSource;
  className?: string;
}

const BENEFITS = [
  { icon: Shield, label: 'Perfil Verificado' },
  { icon: Zap, label: 'Destaque na busca' },
  { icon: MessageCircle, label: 'WhatsApp direto' },
  { icon: TrendingUp, label: 'Portfólio' },
] as const;

export default function ProPromoBanner({
  eyebrow = 'LinkFlow Profissional',
  heading = 'Divulgue seus serviços aqui',
  subhead = 'Assine o plano e apareça para milhares de visitantes. Contato direto via WhatsApp.',
  source = 'pro_promo_banner',
  className = '',
}: ProPromoBannerProps) {
  const checkoutUrl = getProCheckoutUrl(source);

  return (
    <section
      aria-label="Assinar LinkFlow Profissional"
      className={`relative overflow-hidden bg-gradient-to-br from-[#a78bfa]/15 via-indigo-950/30 to-[#050b18] border border-[#a78bfa]/25 rounded-2xl p-5 sm:p-7 ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(167,139,250,0.1)_0%,transparent_60%)] pointer-events-none" />
      <div className="relative space-y-4 sm:space-y-5">
        {/* Header: eyebrow + heading + subhead */}
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-widest mb-1.5">{eyebrow}</p>
          <h3 className="text-base sm:text-lg font-black text-white mb-1.5 leading-tight">{heading}</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{subhead}</p>
        </div>

        {/* Benefits: 2-col grid on narrow, single row on sm+ */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <span
                key={b.label}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1.5 rounded-full whitespace-nowrap"
              >
                <Icon className="w-3 h-3 text-[#a78bfa] shrink-0" aria-hidden="true" />
                {b.label}
              </span>
            );
          })}
        </div>

        {/* Pricing + CTA — horizontal footer block, no more "staircase" */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#a78bfa]/15">
          <div className="min-w-0">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold leading-none">A partir de</p>
            <p className="mt-1 leading-none">
              <span className="text-2xl font-black text-white">R$&nbsp;19</span>
              <span className="text-base font-black text-white">,90</span>
              <span className="text-[10px] text-slate-400 font-bold ml-1">/mês</span>
            </p>
          </div>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#a78bfa] hover:bg-[#c4b5fd] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-[#a78bfa]/25 cursor-pointer"
            aria-label="Assinar LinkFlow Profissional a partir de R$ 19,90 por mês"
          >
            <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" /> Assinar
          </a>
        </div>
      </div>
    </section>
  );
}
