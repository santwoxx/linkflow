import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ProfessionalProfile } from '../types';
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
}

export default function ProfessionalProfilePage({ username, onBack }: ProfessionalProfilePageProps) {
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
        if (snap.empty) {
          setNotFound(true);
        } else {
          setPro(snap.docs[0].data() as ProfessionalProfile);
        }
      } catch (err) {
        console.error('Erro ao buscar perfil profissional:', err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [username]);

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

  const waLink = `https://wa.me/${pro.whatsapp.replace(/\D/g, '')}?text=Olá! Vi seu perfil no LinkFlow e gostaria de saber mais sobre seus serviços.`;

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-100 pb-20">

      {/* Hero / Cover */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-br from-[#a78bfa]/25 via-indigo-950/60 to-[#050b18] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.2)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:30px_30px]" />
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-black/40 hover:bg-black/60 border border-slate-700/60 px-3 py-2 rounded-xl backdrop-blur-sm transition-all cursor-pointer z-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-16 relative">
        {/* Profile Card */}
        <div className="bg-[#0a1128] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">

          {/* Avatar + Basic Info */}
          <div className="p-6">
            <div className="flex items-end justify-between mb-4">
              <div className="p-1 bg-[#0a1128] rounded-full ring-4 ring-[#a78bfa]/30 -mt-12 relative z-10">
                {pro.profilePicUrl ? (
                  <img src={pro.profilePicUrl} alt={pro.displayName} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#a78bfa] to-indigo-600 flex items-center justify-center text-white font-black text-3xl">
                    {pro.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              {/* Verified Badge */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25 px-3 py-1.5 rounded-full mb-1">
                <Star className="w-3 h-3 fill-amber-400" /> Profissional Verificado LinkFlow
              </div>
            </div>

            <h1 className="text-xl font-black text-white">{pro.displayName}</h1>
            <p className="text-[#a78bfa] font-semibold text-sm mt-0.5">{pro.profession}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">{CAT_ICONS[pro.category] || '⚡'}</span>
                {pro.category}
              </span>
              {pro.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {pro.city}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-800/60 mx-6" />

          {/* Bio */}
          {pro.bio && (
            <div className="px-6 py-5">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sobre</h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{pro.bio}</p>
            </div>
          )}

          {/* Skills */}
          {pro.skills?.length > 0 && (
            <>
              <div className="h-px bg-slate-800/60 mx-6" />
              <div className="px-6 py-5">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Especialidades</h2>
                <div className="flex flex-wrap gap-2">
                  {pro.skills.map((skill, i) => (
                    <span key={i} className="text-xs font-semibold bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 px-3 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Links */}
          {(pro.portfolio || pro.instagram) && (
            <>
              <div className="h-px bg-slate-800/60 mx-6" />
              <div className="px-6 py-5 space-y-2">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Links</h2>
                {pro.portfolio && (
                  <a
                    href={pro.portfolio.startsWith('http') ? pro.portfolio : `https://${pro.portfolio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl transition-all cursor-pointer group"
                  >
                    <Globe className="w-4 h-4 text-slate-500 group-hover:text-[#a78bfa] transition-colors shrink-0" />
                    <span className="truncate">{pro.portfolio}</span>
                    <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400 ml-auto shrink-0" />
                  </a>
                )}
                {pro.instagram && (
                  <a
                    href={`https://instagram.com/${pro.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl transition-all cursor-pointer group"
                  >
                    <Instagram className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors shrink-0" />
                    <span className="truncate">@{pro.instagram.replace('@', '')}</span>
                    <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400 ml-auto shrink-0" />
                  </a>
                )}
              </div>
            </>
          )}

          {/* CTA WhatsApp */}
          <div className="px-6 pb-6 pt-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/40 cursor-pointer group"
            >
              <MessageCircle className="w-5 h-5" />
              Entrar em contato via WhatsApp
              <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Legal */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-[10px] text-slate-600">
          <ShieldCheck className="w-3 h-3" />
          <span>O LinkFlow apenas divulga este profissional. A negociação e contratação são de responsabilidade das partes.</span>
        </div>
      </div>
    </div>
  );
}
