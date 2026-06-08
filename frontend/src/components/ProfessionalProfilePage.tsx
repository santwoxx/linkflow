import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ProfessionalProfile, UserProfile } from '../types';
import {
  ArrowLeft, Star, MapPin, MessageCircle, Instagram, Globe,
  Briefcase, Loader2, ShieldCheck, ExternalLink, ChevronRight
} from 'lucide-react';

// Category icons map
const CAT_ICONS: Record<string, string> = {
  'Programação': '💻', 'Design': '🎨', 'Marketing': '📈',
  'Tráfego Pago': '🎯', 'Inteligência Artificial': '🤖',
  'Consultoria': '💼', 'Vídeo e Edição': '🎬',
  'Social Media': '📱', 'Copywriting': '✍️', 'Outros': '⚡',
};

interface ProfessionalProfilePageProps {
  username: string;
  onBack: () => void;
  currentUserProfile?: UserProfile | null;
}

export default function ProfessionalProfilePage({ username, onBack, currentUserProfile }: ProfessionalProfilePageProps) {
  const [pro, setPro] = useState<ProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setNotFound(false);
      try {
        const q = query(
          collection(db, 'professional_profiles'),
          where('username', '==', username),
          where('verified', '==', true),
          limit(1)
        );
        const snap = await getDocs(q);
        let loadedPro: ProfessionalProfile | null = null;
        if (snap.empty) {
          if (username === 'nails_camilebezerra') {
            loadedPro = {
              uid: 'camile-bezerra-123',
              username: 'nails_camilebezerra',
              displayName: 'Camile Bezerra',
              profilePicUrl: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&auto=format&fit=crop&q=80',
              profession: 'Nails Designer',
              category: 'Outros',
              bio: 'Especialista em Alongamentos de Unha, Blindagem e Nail Art Delicadas ✨🌸',
              whatsapp: '73981177122',
              instagram: 'nails_camilebezerra',
              city: 'Itabuna BA',
              skills: ['Gel', 'Nail Art', 'Manicure', 'Blindagem', 'Cutilagem'],
              verified: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          } else if (username === 'natanmarinho.dev') {
            loadedPro = {
              uid: 'natan-marinho-ceo-123',
              username: 'natanmarinho.dev',
              displayName: 'Natan Marinho',
              profilePicUrl: 'https://i.ibb.co/YFV7fWfd/IMG-0259.jpg',
              profession: 'CEO & Founder do LinkFlowAI',
              category: 'Programação',
              bio: 'CEO & Founder do LinkFlowAI 🚀 Desenvolvedor Fullstack | Especialista em criar ecossistemas digitais de alta performance e conexões sem fricção.',
              whatsapp: '5581999999999',
              instagram: 'natanmarinho.dev',
              city: 'Recife PE',
              skills: ['React', 'Node.js', 'Firebase', 'TypeScript', 'SaaS', 'UI/UX'],
              verified: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          } else {
            setNotFound(true);
          }
        } else {
          loadedPro = snap.docs[0].data() as ProfessionalProfile;
        }

        if (loadedPro) {
          if (currentUserProfile && currentUserProfile.username === loadedPro.username) {
            loadedPro = {
              ...loadedPro,
              displayName: currentUserProfile.displayName || loadedPro.displayName,
              profilePicUrl: currentUserProfile.profilePicUrl || loadedPro.profilePicUrl,
              bio: currentUserProfile.bio || loadedPro.bio,
            };
          }
          setPro(loadedPro);
        }
      } catch (err) {
        console.error('Erro ao buscar perfil profissional:', err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [username, currentUserProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050b18] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#a78bfa] animate-spin" />
        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Carregando perfil...</p>
      </div>
    );
  }

  if (notFound || !pro) {
    return (
      <div className="min-h-screen bg-[#050b18] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-slate-600" />
        </div>
        <h2 className="text-slate-300 font-bold">Perfil não encontrado</h2>
        <p className="text-slate-500 text-sm max-w-xs">Este profissional não está disponível ou ainda não foi verificado.</p>
        <button onClick={onBack} className="mt-2 flex items-center gap-1.5 text-[#a78bfa] hover:text-[#c4b5fd] font-semibold text-sm transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Voltar à busca
        </button>
      </div>
    );
  }

  const waLink = `https://wa.me/${pro.whatsapp.replace(/\D/g, '')}?text=Olá! Vi seu perfil no LinkFlowAI e gostaria de saber mais sobre seus serviços.`;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-24 font-sans selection:bg-[#a78bfa]/30 selection:text-white">
      {/* 1. Hero Cover Premium */}
      <div className="relative h-[250px] sm:h-[300px] w-full bg-[#0a0f25] overflow-hidden">
        {/* Dynamic mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/20 via-[#0a0f25] to-[#4f46e5]/20 opacity-80" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#a78bfa]/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#4f46e5]/10 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />
        
        {/* Grid Pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
        
        {/* Navbar inside Hero */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-20">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-white bg-black/30 hover:bg-black/50 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-lg hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </div>

      {/* 2. Main Profile Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 -mt-24 sm:-mt-32">
        {/* Profile Card Main */}
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-10 mb-8 relative">
          
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start text-center sm:text-left">
            
            {/* Avatar Container - No overflow hidden on parent ensures it pops out if needed, but here we keep it inside beautifully */}
            <div className="relative shrink-0 -mt-16 sm:-mt-20">
              <div className="p-1.5 bg-[#0f172a] rounded-[2.5rem] shadow-2xl relative z-10 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#a78bfa] to-indigo-500 rounded-[2.5rem] opacity-50 blur-md group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                {pro.profilePicUrl ? (
                  <img src={pro.profilePicUrl} alt={pro.displayName} className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.2rem] object-cover border border-white/10 relative z-10" />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.2rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-5xl font-black text-white relative z-10">
                    {pro.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                {/* Verified floating badge */}
                <div className="absolute -bottom-3 -right-3 bg-[#0f172a] p-1.5 rounded-full z-20">
                  <div className="bg-emerald-500 text-white rounded-full p-2 shadow-[0_0_15px_rgba(16,185,129,0.5)]" title="Profissional Verificado">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Header Info */}
            <div className="flex-1 w-full pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    {pro.displayName}
                  </h1>
                  <p className="text-lg sm:text-xl font-bold text-[#a78bfa] mt-1">
                    {pro.profession}
                  </p>
                </div>
                
                {/* Rating Badge */}
                {typeof pro.rating === 'number' && (pro.ratingCount ?? 0) > 0 && (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl backdrop-blur-md self-center sm:self-start">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-extrabold text-amber-400">{pro.rating.toFixed(1)} <span className="opacity-70 font-medium text-xs">({pro.ratingCount} avaliações)</span></span>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-300">
                  <span className="text-base">{CAT_ICONS[pro.category] || '⚡'}</span>
                  {pro.category}
                </span>
                {pro.city && (
                  <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400">
                    <MapPin className="w-4 h-4" /> {pro.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Body content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Col (Bio & Skills) */}
            <div className="lg:col-span-2 space-y-8">
              {pro.bio && (
                <section>
                  <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Sobre o profissional
                  </h2>
                  <p className="text-base text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                    {pro.bio}
                  </p>
                </section>
              )}

              {pro.skills?.length > 0 && (
                <section>
                  <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Especialidades</h2>
                  <div className="flex flex-wrap gap-2.5">
                    {pro.skills.map((skill, i) => (
                      <span key={i} className="text-sm font-bold bg-[#a78bfa]/10 text-[#c4b5fd] border border-[#a78bfa]/20 px-4 py-2 rounded-xl">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Col (Sidebar Links) */}
            <div className="space-y-6">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Redes e Links</h2>
              
              <div className="flex flex-col gap-3">
                {pro.portfolio && (
                  <a
                    href={pro.portfolio.startsWith('http') ? pro.portfolio : `https://${pro.portfolio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="p-2.5 bg-slate-800 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                      <Globe className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Portfólio</p>
                      <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white">{pro.portfolio.replace(/^https?:\/\//, '')}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
                  </a>
                )}

                {pro.instagram && (
                  <a
                    href={`https://instagram.com/${pro.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="p-2.5 bg-slate-800 rounded-xl group-hover:bg-rose-500/20 transition-colors">
                      <Instagram className="w-5 h-5 text-slate-400 group-hover:text-rose-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Instagram</p>
                      <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white">@{pro.instagram.replace('@', '')}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Floating Bar */}
        <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-[#10b981]/30 rounded-2xl p-2 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] sticky bottom-6 z-50">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 py-4 sm:py-5 bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-base sm:text-lg rounded-xl transition-all shadow-xl shadow-emerald-900/40 cursor-pointer group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <MessageCircle className="w-6 h-6 relative z-10" />
            <span className="relative z-10">Entrar em contato via WhatsApp</span>
            <ChevronRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform relative z-10" />
          </a>
        </div>

        {/* Legal Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 bg-black/20 p-4 rounded-2xl border border-white/5">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-center">O LinkFlowAI funciona como vitrine. A negociação e contratação são de inteira responsabilidade das partes.</span>
        </div>

      </div>
    </div>
  );
}
