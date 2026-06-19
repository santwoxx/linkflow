import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, ProfessionalProfile, PRO_CATEGORIES, MP_CHECKOUT_URL } from '../types';
import {
  Briefcase, Save, Loader2, CheckCircle, Clock, Star, MapPin,
  MessageCircle, Instagram, Globe, X, Plus, AlertCircle, ArrowRight,
  Shield, Zap, Upload, RefreshCw
} from 'lucide-react';
import { compressImage } from '../utils/image';

const AVATAR_TEMPLATES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
];

interface ProfessionalDashboardProps {
  userProfile: UserProfile;
  onProfileUpdate?: (updated: UserProfile) => void;
}

export default function ProfessionalDashboard({ userProfile, onProfileUpdate }: ProfessionalDashboardProps) {
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Form fields
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [profilePicUrl, setProfilePicUrl] = useState(userProfile.profilePicUrl || '');
  const [profession, setProfession] = useState('');
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [customDomain, setCustomDomain] = useState(userProfile.customDomain || '');

  const isApproved = userProfile.verifiedProfessional && userProfile.serviceEnabled;
  const isPending = proProfile?.pendingApproval && !proProfile?.verified;

  useEffect(() => {
    const fetchPro = async () => {
      setIsLoading(true);
      try {
        const ref = doc(db, 'professional_profiles', userProfile.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as ProfessionalProfile;
          setProProfile(data);
          setProfession(data.profession || '');
          setCategory(data.category || '');
          setBio(data.bio || '');
          setCity(data.city || '');
          setWhatsapp(data.whatsapp || '');
          setInstagram(data.instagram || '');
          setPortfolio(data.portfolio || '');
          setSkills(data.skills || []);
          setDisplayName(data.displayName || userProfile.displayName || '');
          setProfilePicUrl(data.profilePicUrl || userProfile.profilePicUrl || '');
          setCustomDomain(data.customDomain || userProfile.customDomain || '');
        } else {
          setDisplayName(userProfile.displayName || '');
          setProfilePicUrl(userProfile.profilePicUrl || '');
          setCustomDomain(userProfile.customDomain || '');
        }
      } catch (err) {
        console.error('Erro ao carregar perfil profissional:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPro();
  }, [userProfile.uid, userProfile.displayName, userProfile.profilePicUrl, userProfile.customDomain]);

  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (!s || skills.includes(s) || skills.length >= 10) return;
    setSkills(prev => [...prev, s]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setSaveError('Nome de Exibição é obrigatório.');
      return;
    }
    if (!profession.trim() || !category || !whatsapp.trim() || !city.trim()) {
      setSaveError('Preencha pelo menos: Profissão, Categoria, Cidade e WhatsApp.');
      return;
    }
    setSaveError('');
    setIsSaving(true);
    try {
      const ref = doc(db, 'professional_profiles', userProfile.uid);
      const finalDomain = isApproved ? customDomain.trim().toLowerCase() : '';
      const data: Partial<ProfessionalProfile> = {
        uid: userProfile.uid,
        username: userProfile.username,
        displayName: displayName.trim(),
        profilePicUrl: profilePicUrl.trim(),
        profession: profession.trim(),
        category,
        bio: bio.trim(),
        city: city.trim(),
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim(),
        portfolio: portfolio.trim(),
        skills,
        verified: isApproved || false,
        pendingApproval: !isApproved,
        customDomain: finalDomain,
        updatedAt: serverTimestamp(),
      };

      if (!proProfile) {
        // First time — create document with createdAt
        await setDoc(ref, { ...data, createdAt: serverTimestamp() });
        setProProfile({ ...data, createdAt: new Date(), updatedAt: new Date() } as ProfessionalProfile);
      } else {
        await updateDoc(ref, data);
        setProProfile(prev => prev ? { ...prev, ...data } : null);
      }

      // Sync user profile updates to 'users' collection too
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        profilePicUrl: profilePicUrl.trim(),
        customDomain: finalDomain,
        updatedAt: serverTimestamp()
      });

      if (onProfileUpdate) {
        onProfileUpdate({
          ...userProfile,
          displayName: displayName.trim(),
          profilePicUrl: profilePicUrl.trim(),
          customDomain: finalDomain,
          updatedAt: new Date()
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar perfil profissional:', err);
      setSaveError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.span className="w-6 h-6 border-2 border-[#a78bfa]/30 border-t-[#a78bfa] rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  // Not approved and no profile yet → show sales/info screen
  if (!isApproved && !proProfile) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-2xl">
        {/* Upsell Card */}
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl group card-lift glow-border">
          <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/10 via-transparent to-indigo-900/10 pointer-events-none" />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-500" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#a78bfa]/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#a78bfa]/30 transition-colors duration-500" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#a78bfa]/20 to-indigo-500/20 border border-white/10 flex items-center justify-center shadow-inner">
                <Star className="w-6 h-6 text-[#a78bfa]" />
              </div>
              <div>
                <h2 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 text-base">LinkFlowAI Profissional</h2>
                <p className="text-[11px] text-slate-400 font-medium">Divulgue seus serviços na plataforma</p>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
              Transforme seu perfil em uma <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] to-indigo-400">máquina de gerar clientes</span>
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Assine o plano e tenha seu perfil profissional verificado na plataforma. Clientes encontram você diretamente e entram em contato pelo WhatsApp.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                { icon: <Shield className="w-4 h-4 text-[#a78bfa]" />, label: 'Perfil Verificado' },
                { icon: <Globe className="w-4 h-4 text-[#a78bfa]" />, label: 'Página Profissional' },
                { icon: <MessageCircle className="w-4 h-4 text-[#a78bfa]" />, label: 'WhatsApp Direto' },
                { icon: <Zap className="w-4 h-4 text-[#a78bfa]" />, label: 'Destaque na busca' },
              ].map((b, i) => (
                <div key={i}                 className="flex items-center gap-2.5 text-xs text-slate-200 bg-black/20 p-2.5 rounded-xl border border-white/5 card-lift glow-border">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  {b.label}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div>
                <p className="text-3xl font-black text-white tracking-tight">R$ 19,90<span className="text-sm font-normal text-slate-400 tracking-normal">/mês</span></p>
              </div>
              <a
                href={MP_CHECKOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative overflow-hidden flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#a78bfa] to-indigo-600 hover:from-[#9061f9] hover:to-indigo-500 text-white font-bold text-sm rounded-2xl transition-all shadow-[0_0_20px_rgba(167,139,250,0.3)] cursor-pointer group/btn scale-on-click"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center gap-2">
                  Assinar Agora <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-inner card-lift glow-border">
          <h4 className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#a78bfa]" /> Como funciona após a assinatura
          </h4>
          <ol className="space-y-3">
            {[
              'Assine o plano LinkFlowAI Profissional pelo link acima.',
              'Após o pagamento, entre em contato com o administrador informando seu usuário @' + userProfile.username + '.',
              'O administrador analisa e aprova seu acesso.',
              'Volte aqui e preencha seu perfil profissional!',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-slate-400 bg-black/20 p-2.5 rounded-xl border border-white/5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-[#a78bfa]/20 to-indigo-500/20 border border-[#a78bfa]/30 text-[#a78bfa] text-[10px] font-black flex items-center justify-center shadow-inner">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-[10px] text-slate-600 text-center leading-relaxed">
          O LinkFlowAI atua exclusivamente como plataforma de divulgação. Toda negociação e contratação acontece diretamente entre você e o cliente.
        </p>
      </motion.div>
    );
  }

  // Has submitted profile but not approved yet
  const showPendingBanner = isPending;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-2xl">

      {/* Status Banner */}
      {showPendingBanner && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl card-lift glow-border">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">Aguardando aprovação</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Seu perfil foi enviado e está em análise. Em até 48h úteis o administrador aprovará seu acesso. Enquanto isso, você já pode completar seu perfil.
            </p>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl card-lift glow-border">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-300">Perfil Verificado ativo!</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">Você é um Profissional Verificado LinkFlowAI. Seu perfil está visível na busca.</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl card-lift glow-border">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#a78bfa]/10 blur-[60px] pointer-events-none" />
        
        <h2 className="relative text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 flex items-center gap-2 mb-2">
          <Briefcase className="w-5 h-5 text-[#a78bfa]" />
          Seu Perfil Profissional
        </h2>

        {/* Nome de Exibição */}
        <div className="relative z-10">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Nome de Exibição <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Seu nome completo ou nome de marca..."
            maxLength={60}
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all hover:border-white/20"
            required
          />
        </div>

        {/* Foto de Perfil */}
        <div className="relative z-10 space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Foto de Perfil <span className="text-rose-400">*</span>
          </label>
          <div className="bg-black/20 border border-white/10 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="URL da foto" 
                value={profilePicUrl} 
                onChange={(e) => setProfilePicUrl(e.target.value)}
                className="flex-1 bg-black/20 text-xs text-zinc-300 py-3.5 px-4 rounded-xl border border-white/10 hover:border-white/20 focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all placeholder-slate-500 font-mono outline-none" 
              />
              <div className="flex gap-2">
                <input 
                  id="file-upload-pro-avatar" 
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  onChange={async (e) => { 
                    const file = e.target.files?.[0]; 
                    if (file) { 
                      try { 
                        setProfilePicUrl(await compressImage(file, 150, 150, 0.6)); 
                      } catch (err) {
                        console.error("Erro ao comprimir imagem:", err);
                      } 
                    } 
                    e.target.value = ''; 
                  }} 
                />
                <label 
                  htmlFor="file-upload-pro-avatar" 
                  className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-5 py-3.5 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider scale-on-click"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" /> Subir
                </label>
                {profilePicUrl && (
                  <button 
                    type="button" 
                    onClick={() => setProfilePicUrl('')} 
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold px-4 py-3.5 rounded-xl border border-rose-500/20 transition-all cursor-pointer flex-1 sm:flex-none uppercase tracking-wider scale-on-click"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
            
            {/* Visual preview of current select avatar */}
            <div className="flex items-center gap-3">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="Preview do avatar" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-xs text-slate-500">Vazio</div>
              )}
              <div className="flex flex-wrap gap-2">
                {AVATAR_TEMPLATES.map((url, idx) => (
                  <button 
                    key={idx} 
                    type="button" 
                    onClick={() => setProfilePicUrl(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 shrink-0 scale-on-click ${
                      profilePicUrl === url ? 'border-[#a78bfa] scale-110 shadow-[0_0_10px_rgba(167,139,250,0.3)]' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profissão */}
        <div className="relative z-10">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Profissão / Cargo <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={profession}
            onChange={e => setProfession(e.target.value)}
            placeholder="Ex: Desenvolvedor Fullstack, Designer UI/UX..."
            maxLength={80}
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all hover:border-white/20"
          />
        </div>

        {/* Categoria */}
        <div className="relative z-10">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Categoria <span className="text-rose-400">*</span>
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all cursor-pointer hover:border-white/20"
          >
            <option value="" className="bg-slate-900">Selecione uma categoria</option>
            {PRO_CATEGORIES.map(c => (
              <option key={c} value={c} className="bg-slate-900">{c}</option>
            ))}
          </select>
        </div>

        {/* Grid: Cidade + WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#a78bfa]" /> Cidade <span className="text-rose-400">*</span></span>
            </label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ex: São Paulo, SP"
              maxLength={50}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all hover:border-white/20"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-[#a78bfa]" /> WhatsApp <span className="text-rose-400">*</span></span>
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="5511999999999"
              maxLength={20}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all font-mono hover:border-white/20"
            />
            <p className="text-[10px] text-slate-500 mt-1.5">Código do país + DDD + número (apenas dígitos)</p>
          </div>
        </div>

        {/* Bio */}
        <div className="relative z-10">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Descrição / Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Fale sobre você, sua experiência e o que você oferece..."
            rows={4}
            maxLength={600}
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all resize-none hover:border-white/20"
          />
          <p className="text-[10px] text-slate-500 mt-1.5 text-right">{bio.length}/600</p>
        </div>

        {/* Skills */}
        <div className="relative z-10">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Especialidades / Skills <span className="text-slate-600">(máx. 10)</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
              placeholder="Ex: React, Figma, SEO..."
              maxLength={30}
              className="flex-1 bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all hover:border-white/20"
            />
            <button
              onClick={handleAddSkill}
              disabled={!skillInput.trim() || skills.length >= 10}
              className="px-5 py-3 bg-[#a78bfa]/20 hover:bg-[#a78bfa]/30 text-[#a78bfa] rounded-xl border border-[#a78bfa]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-inner scale-on-click"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-[#a78bfa]/10 to-indigo-500/10 text-slate-200 border border-[#a78bfa]/20 px-3 py-1.5 rounded-full shadow-sm hover:border-[#a78bfa]/40 transition-colors">
                  {skill}
                  <button onClick={() => handleRemoveSkill(skill)} className="text-[#a78bfa]/60 hover:text-rose-400 transition-colors cursor-pointer scale-on-click">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Instagram + Portfólio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              <span className="flex items-center gap-1"><Instagram className="w-3.5 h-3.5 text-[#a78bfa]" /> Instagram (opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">@</span>
              <input
                type="text"
                value={instagram}
                onChange={e => setInstagram(e.target.value.replace('@', ''))}
                placeholder="seuusuario"
                maxLength={50}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all hover:border-white/20"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-[#a78bfa]" /> Portfólio / Site (opcional)</span>
            </label>
            <input
              type="url"
              value={portfolio}
              onChange={e => setPortfolio(e.target.value)}
              placeholder="https://meusite.com"
              maxLength={200}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all hover:border-white/20"
            />
          </div>
        </div>

        {/* Domínio Personalizado */}
        {isApproved && (
          <div className="relative z-10 space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-[#a78bfa]" /> Domínio Personalizado</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value.replace(/\s+/g, ''))}
                placeholder="links.seudominio.com.br"
                maxLength={100}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-black/40 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all hover:border-white/20 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Aponte o CNAME do seu domínio ou subdomínio para <strong className="text-slate-300 font-mono">linkflowai.com.br</strong> no seu provedor de DNS para ativar a conexão.
            </p>
          </div>
        )}

        {/* Error */}
        {saveError && (
          <div className="relative z-10 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" /> {saveError}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="relative z-10 w-full group overflow-hidden flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#a78bfa] to-indigo-600 hover:from-[#9061f9] hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-sm rounded-2xl transition-all shadow-[0_0_20px_rgba(167,139,250,0.2)] cursor-pointer disabled:cursor-not-allowed mt-4 scale-on-click"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <span className="relative flex items-center gap-2">
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : saveSuccess ? (
              <><CheckCircle className="w-4 h-4" /> Salvo com sucesso!</>
            ) : (
              <><Save className="w-4 h-4" /> Salvar Perfil Profissional</>
            )}
          </span>
        </button>

        {!isApproved && proProfile && (
          <p className="relative z-10 text-[10px] text-slate-500 text-center pt-2">
            Seu perfil ficará visível na busca somente após a aprovação do administrador.
          </p>
        )}
      </div>

      {/* Legal disclaimer */}
      <p className="text-[10px] text-slate-600 text-center leading-relaxed">
        O LinkFlowAI atua exclusivamente como plataforma de divulgação. Toda negociação, contratação, pagamento e execução dos serviços são realizados diretamente entre contratante e contratado.
      </p>
    </motion.div>
  );
}
