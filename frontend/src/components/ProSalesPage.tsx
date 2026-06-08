import React from 'react';
import {
  Star, Zap, Shield, TrendingUp, MessageCircle, Globe, Search,
  CheckCircle, Briefcase, ChevronRight
} from 'lucide-react';
import ProPromoBanner from './ProPromoBanner';
import { getProCheckoutUrl } from '../utils/proCheckout';

const CHECKOUT_URL = getProCheckoutUrl('pro_sales');

const BENEFITS = [
  { icon: <Shield className="w-5 h-5" />, title: 'Perfil Verificado', desc: 'Selo oficial de profissional verificado pelo LinkFlowAI.', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  { icon: <Globe className="w-5 h-5" />, title: 'Página Profissional', desc: 'Sua própria página de divulgação com bio, skills e portfólio.', color: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10 border-[#a78bfa]/20' },
  { icon: <Search className="w-5 h-5" />, title: 'Busca de Profissionais', desc: 'Apareça na vitrine pública de profissionais verificados.', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { icon: <Briefcase className="w-5 h-5" />, title: 'Portfólio', desc: 'Adicione link para seu portfólio, site ou trabalhos anteriores.', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  { icon: <MessageCircle className="w-5 h-5" />, title: 'WhatsApp Direto', desc: 'Clientes entram em contato direto com você pelo WhatsApp.', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Destaque na Busca', desc: 'Profissionais verificados aparecem primeiro nos resultados.', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
];

const STEPS = [
  { num: '01', title: 'Assine o plano', desc: 'Clique em "Assinar Agora" e finalize o pagamento no Mercado Pago.', icon: <Zap className="w-5 h-5 text-[#a78bfa]" /> },
  { num: '02', title: 'Entre em contato', desc: 'Após o pagamento, entre em contato com nosso administrador pelo WhatsApp para enviar seus dados.', icon: <MessageCircle className="w-5 h-5 text-[#a78bfa]" /> },
  { num: '03', title: 'Seja aprovado', desc: 'O administrador analisa seu perfil e libera o acesso. Você preenche seu perfil e começa a receber contatos!', icon: <CheckCircle className="w-5 h-5 text-[#a78bfa]" /> },
];

const FAQ = [
  { q: 'Preciso ter uma conta no LinkFlowAI?', a: 'Sim! Você precisa ter uma conta ativa no LinkFlowAI para assinar o plano profissional.' },
  { q: 'Como funciona o pagamento?', a: 'O pagamento é feito diretamente no Mercado Pago, de forma segura. O plano é mensal e pode ser cancelado a qualquer momento.' },
  { q: 'Em quanto tempo meu perfil é aprovado?', a: 'Após o pagamento e contato com o administrador, a aprovação acontece em até 48 horas úteis.' },
  { q: 'O LinkFlowAI intermedia as negociações?', a: 'Não. O LinkFlowAI é apenas uma plataforma de divulgação. Toda a negociação e contratação acontece diretamente entre você e o cliente via WhatsApp.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. Você pode cancelar a assinatura a qualquer momento pelo Mercado Pago. Ao cancelar, seu perfil é desativado ao fim do período pago.' },
];

export default function ProSalesPage() {
  return (
    <div className="min-h-screen bg-[#050b18] text-slate-100">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.18)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px]" />

        <div className="relative max-w-3xl mx-auto px-4 py-12 sm:py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#a78bfa] bg-[#a78bfa]/10 border border-[#a78bfa]/25 px-4 py-2 rounded-full mb-6">
            <Star className="w-3 h-3 fill-[#a78bfa]" /> LinkFlowAI Profissional
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
            Transforme seu LinkFlowAI em uma{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] to-indigo-400">
              máquina de gerar clientes
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Divulgue seus serviços para milhares de visitantes e receba contatos diretamente pelo WhatsApp. Sem intermediários, sem taxas sobre vendas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-4 bg-gradient-to-r from-[#a78bfa] to-indigo-500 hover:from-[#c4b5fd] hover:to-indigo-400 text-white font-black text-sm sm:text-base rounded-xl transition-all shadow-xl shadow-[#a78bfa]/25 cursor-pointer group whitespace-nowrap"
            >
              <span className="sm:hidden">Assinar — R$ 19,90</span>
              <span className="hidden sm:inline">Assinar Agora — R$ 19,90/mês</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="?view=servicos"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Ver profissionais <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Pagamento seguro via Mercado Pago — cancele quando quiser
          </div>
        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">O que está incluso</h2>
          <p className="text-slate-400 text-sm">Tudo que você precisa para divulgar seus serviços profissionalmente.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map((b, i) => (
            <div key={i} className="bg-[#0a1128] border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 transition-all">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${b.color} ${b.bg}`}>
                {b.icon}
              </div>
              <h3 className="font-bold text-sm text-white mb-1">{b.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="max-w-md mx-auto px-4 py-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#a78bfa]/15 via-[#0a1128] to-indigo-950/30 border border-[#a78bfa]/30 rounded-2xl p-8 text-center shadow-2xl shadow-[#a78bfa]/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.1)_0%,transparent_70%)] pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-widest mb-3">LinkFlowAI Profissional</p>
            <div className="flex items-start justify-center gap-1 mb-1">
              <span className="text-xl font-bold text-slate-300 mt-2">R$</span>
              <span className="text-6xl font-black text-white">19</span>
              <span className="text-2xl font-black text-white mt-3">,90</span>
            </div>
            <p className="text-sm text-slate-400 mb-6">/mês · cancele quando quiser</p>

            <div className="space-y-2 mb-6 text-left">
              {BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  {b.title}
                </div>
              ))}
            </div>

            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-[#a78bfa] hover:bg-[#c4b5fd] text-white font-black text-base rounded-xl transition-all shadow-lg shadow-[#a78bfa]/25 cursor-pointer"
            >
              Assinar Agora
            </a>
            <p className="text-[10px] text-slate-500 mt-3">Pagamento via Mercado Pago · Seguro e rápido</p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Como funciona</h2>
          <p className="text-slate-400 text-sm">3 passos simples para começar a receber clientes.</p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-5 bg-[#0a1128] border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 transition-all">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center">
                {step.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Passo {step.num}</p>
                <h3 className="font-bold text-white text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-2xl mx-auto px-4 py-8 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Perguntas frequentes</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((faq, i) => (
            <details key={i} className="group bg-[#0a1128] border border-slate-800/60 rounded-xl overflow-hidden hover:border-slate-700 transition-all cursor-pointer">
              <summary className="flex items-center justify-between p-4 text-sm font-semibold text-slate-200 list-none cursor-pointer select-none">
                {faq.q}
                <ChevronRight className="w-4 h-4 text-slate-500 group-open:rotate-90 transition-transform shrink-0 ml-2" />
              </summary>
              <div className="px-4 pb-4">
                <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── (shared ProPromoBanner) */}
      <section className="max-w-xl mx-auto px-4 pb-16">
        <ProPromoBanner
          eyebrow="Pronto para crescer?"
          heading="Comece hoje a receber clientes"
          subhead="Apareça para milhares de visitantes e receba contatos diretamente pelo WhatsApp."
          source="pro_sales"
        />
        <p className="text-[10px] text-slate-600 mt-4 leading-relaxed max-w-sm mx-auto text-center">
          O LinkFlowAI atua exclusivamente como plataforma de divulgação. Toda negociação, contratação e pagamento é realizada diretamente entre as partes — o LinkFlowAI não intermedia transações.
        </p>
      </section>
    </div>
  );
}
