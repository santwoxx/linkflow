import React, { useState } from 'react';
import { 
  ArrowLeft, Check, X, ChevronDown, ChevronUp, Link2, Sparkles, BookOpen, 
  HelpCircle, Zap, ShieldCheck, BarChart4, Palette, Users, Store, Heart, 
  Instagram, Smartphone, ArrowRight, CheckCircle2 
} from 'lucide-react';

interface SeoLandingPageProps {
  slug: string;
  onBack: () => void;
}

export default function SeoLandingPage({ slug, onBack }: SeoLandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Content configurations based on SEO slug
  const getContent = () => {
    switch (slug) {
      case 'linktree-gratis':
        return {
          title: 'Linktree Grátis: O Melhor Agrupador de Links na Bio 100% Gratuito',
          description: 'Crie seu biolink personalizado sem mensalidades. Tenha todos os recursos que as outras plataformas cobram por um preço de R$ 0,00.',
          metaTitle: 'Linktree Grátis: Agrupador de Links na Bio 100% Gratuito | LinkFlowAI',
          badge: 'Economize Agora',
          heroTitle: 'Por que pagar por um link na bio se você pode ter o melhor de graça?',
          heroSubtitle: 'No LinkFlowAI, você cria um perfil profissional completo com cliques ilimitados, personalização total de cores, feed social e catálogo de serviços sem pagar nada.',
          features: [
            {
              icon: <Palette className="w-5 h-5 text-[#a78bfa]" />,
              title: 'Personalização Avançada e Ilimitada',
              description: 'Escolha entre mais de 14 temas modernos (incluindo escuro, neon e gradientes), customize cores de botões, fontes e layouts sem nenhuma marca d\'água irritante.'
            },
            {
              icon: <Store className="w-5 h-5 text-emerald-400" />,
              title: 'Vitrine de Serviços Integrada',
              description: 'Adicione seus serviços com preço, duração e descrição. Seus clientes agendam e entram em contato direto com você pelo WhatsApp.'
            },
            {
              icon: <BarChart4 className="w-5 h-5 text-blue-400" />,
              title: 'Estatísticas e Métricas em Tempo Real',
              description: 'Acompanhe visualizações e cliques em seus links individualmente com gráficos interativos no seu painel administrativo.'
            },
            {
              icon: <Users className="w-5 h-5 text-purple-400" />,
              title: 'Feed de Comunidade Incluso',
              description: 'Publique novidades, fotos e atualizações diretamente na sua página. Funciona como uma rede social própria para engajar seus seguidores.'
            }
          ],
          faqs: [
            {
              q: 'O LinkFlowAI é realmente gratuito?',
              a: 'Sim, o LinkFlowAI é 100% gratuito. Não cobramos taxas ocultas, não limitamos o número de links e não exigimos cartão de crédito para criar seu perfil profissional.'
            },
            {
              q: 'Posso usar meu próprio número de WhatsApp para receber agendamentos?',
              a: 'Com certeza! Você configura o seu número de WhatsApp e, quando um cliente clica em agendar um serviço, ele é direcionado diretamente para iniciar a conversa com você com uma mensagem pronta.'
            },
            {
              q: 'Quantos links posso adicionar no meu perfil?',
              a: 'Não há limites! Você pode adicionar quantos links, botões, redes sociais e blocos de conteúdo desejar na sua página.'
            }
          ]
        };

      case 'alternativa-linktree':
        return {
          title: 'A Melhor Alternativa ao Linktree em Português do Brasil',
          description: 'Descubra por que milhares de criadores de conteúdo, profissionais liberais e marcas estão migrando do Linktree para o LinkFlowAI.',
          metaTitle: 'A Melhor Alternativa ao Linktree em Português | LinkFlowAI',
          badge: 'Comparativo Completo',
          heroTitle: 'Mais recursos, melhor design e zero custos mensais',
          heroSubtitle: 'Diferente do Linktree, que limita a personalização e cobra caro por recursos de negócios, o LinkFlowAI oferece tudo o que você precisa para crescer online de forma gratuita.',
          comparison: true, // will render the comparison table
          features: [
            {
              icon: <Zap className="w-5 h-5 text-amber-400" />,
              title: '100% em Português',
              description: 'Painel totalmente traduzido e suporte nativo em português para você não ter dificuldades ao configurar sua página.'
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
              title: 'Menos burocracia, mais resultados',
              description: 'Crie sua conta em 10 segundos usando o login do Google e tenha sua página no ar imediatamente.'
            }
          ],
          faqs: [
            {
              q: 'Por que o LinkFlowAI é uma alternativa melhor?',
              a: 'Porque oferecemos de graça recursos que o Linktree só libera nos planos pagos, como estatísticas de cliques detalhadas, vitrine de serviços, feed social e mais de 14 temas premium personalizáveis.'
            },
            {
              q: 'Como faço para migrar meus links?',
              a: 'Basta criar sua conta gratuita no LinkFlowAI, copiar os links que você já usa e colá-los no nosso painel intuitivo. Você configura tudo em menos de 3 minutos.'
            }
          ]
        };

      case 'como-colocar-link-na-bio':
      default:
        return {
          title: 'Como Colocar Link na Bio do Instagram, TikTok e WhatsApp',
          description: 'O guia definitivo para criar sua página de links no LinkFlowAI e inseri-la de forma profissional no topo de suas redes sociais.',
          metaTitle: 'Como Colocar Link na Bio do Instagram e TikTok (Guia) | LinkFlowAI',
          badge: 'Guia Passo a Passo',
          heroTitle: 'Aprenda a destacar seus links e aumentar suas vendas',
          heroSubtitle: 'Ter apenas um link na bio limita seu negócio. Siga este passo a passo simples e transforme seu perfil do Instagram ou TikTok em uma máquina de captação de clientes.',
          steps: [
            {
              num: '1',
              title: 'Crie sua conta gratuita no LinkFlowAI',
              description: 'Acesse o site, faça login rápido com sua conta Google e escolha seu nome de usuário exclusivo (ex: linkflowai.com.br/seu-nome).'
            },
            {
              num: '2',
              title: 'Adicione seus links e serviços',
              description: 'No painel administrativo, adicione os links para suas redes sociais, site, WhatsApp e monte seu catálogo de serviços personalizados.'
            },
            {
              num: '3',
              title: 'Escolha um tema premium',
              description: 'Selecione um dos nossos temas na aba de personalização para combinar perfeitamente com a identidade visual da sua marca.'
            },
            {
              num: '4',
              title: 'Adicione no seu Instagram ou TikTok',
              description: 'Copie o seu link exclusivo, vá em "Editar Perfil" no Instagram ou TikTok, e cole no campo "Site". Pronto! Seus seguidores agora terão acesso a tudo em um só lugar.'
            }
          ],
          faqs: [
            {
              q: 'Preciso de 10 mil seguidores para ter link na bio?',
              a: 'Não! Qualquer conta no Instagram ou TikTok (mesmo com zero seguidores) pode adicionar um link no campo "Site" ou "Link na Bio" do perfil.'
            },
            {
              q: 'Qual é o melhor link para colocar na bio?',
              a: 'O melhor é usar um agregador de links como o LinkFlowAI, pois ao invés de enviar a pessoa para apenas um local, você oferece opções de WhatsApp, serviços, portfólio e outras redes em uma única página organizada.'
            }
          ]
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-200 flex flex-col justify-between font-sans relative overflow-x-hidden">
      {/* Decorative ambient backgrounds lines */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#a78bfa]/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-[#a78bfa]/10 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-5 border-b border-slate-800/40 flex items-center justify-between sticky top-0 bg-[#050b18]/80 backdrop-blur-md z-40">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 py-1.5 px-3 hover:bg-[#a78bfa]/10 text-xs text-slate-300 hover:text-white font-semibold rounded-lg transition-all cursor-pointer"
          id="seo-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-[#a78bfa]" />
          <span>Voltar para o Início</span>
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#a78bfa] flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(167,139,250,0.3)]">
            <Link2 className="w-4 h-4 rotate-45 text-white" />
          </div>
          <span className="font-sans font-extrabold text-sm tracking-wide text-white select-none hidden sm:inline">LinkFlowAI</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-16 z-10">
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/30 text-[#a78bfa] text-[10px] font-bold uppercase tracking-wider select-none shadow-md">
            <Sparkles className="w-3 h-3 text-[#a78bfa]" />
            {content.badge}
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {content.heroTitle}
          </h1>
          
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            {content.heroSubtitle}
          </p>

          <div className="pt-4 flex justify-center">
            <a
              href="/"
              className="px-8 py-4 bg-gradient-to-r from-[#a78bfa] to-[#c4b5fd] hover:from-[#c4b5fd] hover:to-[#ddd6fe] hover:scale-[1.02] active:scale-[0.98] text-black font-extrabold text-xs rounded-xl tracking-wide font-sans shadow-[0_0_35px_rgba(167,139,250,0.35)] transition-all flex items-center gap-2 uppercase"
              id="seo-hero-cta"
            >
              Criar Meu Link Grátis
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Dynamic Comparison Table (specific for /alternativa-linktree) */}
        {content.comparison && (
          <section className="space-y-6" aria-label="Tabela Comparativa">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Tabela Comparativa Direta</h2>
              <p className="text-xs text-slate-500 mt-1">Veja por que o LinkFlowAI é a melhor escolha para sua bio</p>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0f172a]/40 backdrop-blur-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0a1128]/80">
                    <th className="p-4 font-bold text-slate-300">Recurso / Funcionalidade</th>
                    <th className="p-4 font-bold text-[#a78bfa] bg-[#a78bfa]/5">LinkFlowAI (Grátis)</th>
                    <th className="p-4 font-semibold text-slate-400">Linktree (Grátis)</th>
                    <th className="p-4 font-semibold text-slate-400">Linktree (Pro)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-4 font-semibold text-slate-200">Número de Links</td>
                    <td className="p-4 text-emerald-400 font-bold bg-[#a78bfa]/5">Ilimitado</td>
                    <td className="p-4 text-slate-300">Ilimitado</td>
                    <td className="p-4 text-slate-300">Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-200">Preço Mensal</td>
                    <td className="p-4 text-emerald-400 font-bold bg-[#a78bfa]/5">Grátis (R$ 0)</td>
                    <td className="p-4 text-slate-300">Grátis (Com limitações)</td>
                    <td className="p-4 text-slate-300">R$ 40+/mês</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-200">Temas Premium & Cores</td>
                    <td className="p-4 text-[#a78bfa] font-bold bg-[#a78bfa]/5">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Todos Grátis</span>
                    </td>
                    <td className="p-4 text-rose-400 flex items-center gap-1.5"><X className="w-4 h-4 text-rose-500" /> Limitado</td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Incluído</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-200">Vitrine & Agendamentos</td>
                    <td className="p-4 text-[#a78bfa] font-bold bg-[#a78bfa]/5">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> WhatsApp Direto</span>
                    </td>
                    <td className="p-4 text-rose-400 flex items-center gap-1.5"><X className="w-4 h-4 text-rose-500" /> Não possui</td>
                    <td className="p-4 text-rose-400 flex items-center gap-1.5"><X className="w-4 h-4 text-rose-500" /> Não possui</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-200">Feed de Posts / Fotos</td>
                    <td className="p-4 text-[#a78bfa] font-bold bg-[#a78bfa]/5">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Rede Social Ativa</span>
                    </td>
                    <td className="p-4 text-rose-400 flex items-center gap-1.5"><X className="w-4 h-4 text-rose-500" /> Não possui</td>
                    <td className="p-4 text-rose-400 flex items-center gap-1.5"><X className="w-4 h-4 text-rose-500" /> Não possui</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-200">Remover Marca d\'água</td>
                    <td className="p-4 text-[#a78bfa] font-bold bg-[#a78bfa]/5">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Grátis</span>
                    </td>
                    <td className="p-4 text-rose-400 flex items-center gap-1.5"><X className="w-4 h-4 text-rose-500" /> Obrigatória</td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Opcional</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Dynamic Step-by-Step guide (specific for /como-colocar-link-na-bio) */}
        {content.steps && (
          <section className="space-y-8" aria-label="Passo a Passo">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Como Fazer em 4 Passos Simples</h2>
              <p className="text-xs text-slate-500 mt-1">Guia rápido para configurar e publicar seus links</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.steps.map((step, idx) => (
                <div key={idx} className="bg-[#0f172a]/50 border border-slate-900 rounded-2xl p-6 relative hover:border-[#a78bfa]/20 transition-all flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/30 text-[#a78bfa] flex items-center justify-center font-bold text-sm shrink-0">
                    {step.num}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features / Benefits Grid */}
        <section className="space-y-8" aria-label="Vantagens">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Tudo o que o LinkFlowAI oferece</h2>
            <p className="text-xs text-slate-500 mt-1">Recursos essenciais para destacar sua presença online</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {content.features.map((feat, idx) => (
              <div key={idx} className="bg-[#0f172a] p-6 rounded-2xl border border-slate-900 hover:border-[#a78bfa]/10 transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-200">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Accordion FAQ Section */}
        <section className="space-y-6" aria-label="Perguntas Frequentes">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Perguntas Frequentes (FAQ)</h2>
            <p className="text-xs text-slate-500 mt-1">Esclareça suas dúvidas rápidas sobre a plataforma</p>
          </div>

          <div className="max-w-2xl w-full mx-auto space-y-3">
            {content.faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-[#0f172a]/60 border border-slate-900 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
                  aria-expanded={openFaq === idx}
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#a78bfa] shrink-0" />
                    {faq.q}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-900/60 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Card */}
        <section className="bg-gradient-to-r from-emerald-500/5 via-[#a78bfa]/10 to-purple-500/5 border border-slate-800 rounded-3xl p-8 md:p-12 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Pronto para ter seu link na bio profissional?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Junte-se a criadores e profissionais que escolheram a simplicidade, personalização e poder de vendas sem custos.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/"
              className="px-8 py-4 bg-gradient-to-r from-[#a78bfa] to-[#c4b5fd] hover:from-[#c4b5fd] hover:to-[#ddd6fe] text-black font-extrabold text-xs rounded-xl tracking-wide uppercase shadow-[0_0_30px_rgba(167,139,250,0.25)] transition-all"
              id="seo-footer-cta"
            >
              Criar Meu Perfil Grátis
            </a>
            <button
              onClick={onBack}
              className="px-6 py-4 bg-slate-950/40 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Voltar ao Início
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-900 text-center text-[10px] text-slate-600 font-medium flex flex-col sm:flex-row justify-between items-center max-w-4xl w-full mx-auto gap-3">
        <div className="flex items-center gap-4">
          <span className="text-slate-500">© 2026 LinkFlowAI do Brasil</span>
          <a href="/" className="text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2">Home</a>
        </div>
        <span className="flex items-center gap-1 text-slate-500">
          Feito com <Heart className="w-3 h-3 text-[#a78bfa] fill-[#a78bfa]" /> para conexões rápidas.
        </span>
      </footer>
    </div>
  );
}
