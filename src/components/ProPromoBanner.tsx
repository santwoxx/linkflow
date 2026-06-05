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
      className={`relative overflow-hidden bg-gradient-to-br from-[#a78bfa]/15 via-indigo-950/30 to-[#050b18] border border-[#a78bfa]/25 rounded-2xl p-6 sm:p-8 ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(167,139,250,0.1)_0%,transparent_60%)] pointer-events-none" />
      <div className="relative">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-widest mb-2">{eyebrow}</p>
            <h3 className="text-lg sm:text-xl font-black text-white mb-2">{heading}</h3>
            <p className="text-sm text-slate-400 mb-4">{subhead}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <span
                    key={b.label}
                    className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full"
                  >
                    <Icon className="w-3 h-3 text-[#a78bfa]" aria-hidden="true" />
                    {b.label}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="text-center shrink-0">
            <p className="text-[10px] text-slate-500 mb-1">A partir de</p>
            <p className="text-3xl font-black text-white">
              R$&nbsp;19,90
            </p>
            <p className="text-[10px] text-slate-400 mb-4">/mês</p>
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#a78bfa] hover:bg-[#c4b5fd] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#a78bfa]/25 cursor-pointer"
              aria-label="Assinar LinkFlow Profissional a partir de R$ 19,90 por mês"
            >
              <Briefcase className="w-4 h-4" aria-hidden="true" /> Assinar Agora
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
