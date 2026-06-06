import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { UserProfile, LinkItem, ProfessionalProfile } from '../types';
import { Crown, Users, Link2, BarChart2, Sparkles, RefreshCw, ExternalLink, ChevronDown, ChevronRight, Ban, CheckCircle, Calendar, MousePointerClick, Hash, ShieldBan, Edit3, Check, X, Briefcase, MapPin, Star, MessageCircle, Trash2, UserPlus, ShieldPlus } from 'lucide-react';

export default function AdminPanel() {
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userLinks, setUserLinks] = useState<Record<string, { links: LinkItem[]; clicksCount: number }>>({});
  const [loadingMetrics, setLoadingMetrics] = useState<Record<string, boolean>>({});
  const [banningUser, setBanningUser] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [editingUsernameValue, setEditingUsernameValue] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // Professionals state
  const [allPros, setAllPros] = useState<ProfessionalProfile[]>([]);
  const [prosLoading, setProsLoading] = useState(true);
  const [prosError, setProsError] = useState('');
  const [approvingUid, setApprovingUid] = useState<string | null>(null);
  const [rejectingUid, setRejectingUid] = useState<string | null>(null);
  const [proFilter, setProFilter] = useState<'pending' | 'verified' | 'all'>('pending');
  const [convertingUid, setConvertingUid] = useState<string | null>(null);
  const [promotingUid, setPromotingUid] = useState<string | null>(null);

  const fetchAllUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const profiles = snap.docs.map(d => d.data() as UserProfile);
      setAllProfiles(profiles);
      setExpandedUser(null);
      setUserLinks({});
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar usuários');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAllUsers(); }, []);

  const fetchAllPros = async () => {
    setProsLoading(true);
    setProsError('');
    try {
      const snap = await getDocs(query(collection(db, 'professional_profiles'), orderBy('createdAt', 'desc'), limit(200)));
      setAllPros(snap.docs.map(d => d.data() as ProfessionalProfile));
    } catch (err: any) {
      setProsError(err?.message || 'Erro ao carregar prestadores');
      console.error(err);
    } finally {
      setProsLoading(false);
    }
  };

  useEffect(() => { fetchAllPros(); }, []);

  const handleApprovePro = async (pro: ProfessionalProfile) => {
    if (!pro.uid) return;
    setApprovingUid(pro.uid);
    try {
      const adminEmail = auth.currentUser?.email || 'admin';
      const ref = doc(db, 'professional_profiles', pro.uid);
      await updateDoc(ref, {
        verified: true,
        pendingApproval: false,
        approvedBy: adminEmail,
        updatedAt: new Date(),
      });
      setAllPros(prev => prev.map(p => p.uid === pro.uid
        ? { ...p, verified: true, pendingApproval: false, approvedBy: adminEmail }
        : p
      ));
    } catch (err: any) {
      console.error('Erro ao aprovar prestador', err);
      alert('Erro ao aprovar: ' + (err?.message || ''));
    } finally {
      setApprovingUid(null);
    }
  };

  const handleRejectPro = async (pro: ProfessionalProfile) => {
    if (!pro.uid) return;
    const ok = window.confirm(`Rejeitar e remover o cadastro de ${pro.displayName} (@${pro.username})? Essa ação não pode ser desfeita.`);
    if (!ok) return;
    setRejectingUid(pro.uid);
    try {
      const ref = doc(db, 'professional_profiles', pro.uid);
      await deleteDoc(ref);
      setAllPros(prev => prev.filter(p => p.uid !== pro.uid));
    } catch (err: any) {
      console.error('Erro ao rejeitar prestador', err);
      alert('Erro ao rejeitar: ' + (err?.message || ''));
    } finally {
      setRejectingUid(null);
    }
  };

  const handleUnverifyPro = async (pro: ProfessionalProfile) => {
    if (!pro.uid) return;
    const ok = window.confirm(`Revogar verificação de ${pro.displayName}? O prestador voltará a ficar oculto da vitrine pública.`);
    if (!ok) return;
    setApprovingUid(pro.uid);
    try {
      const ref = doc(db, 'professional_profiles', pro.uid);
      await updateDoc(ref, {
        verified: false,
        pendingApproval: true,
        updatedAt: new Date(),
      });
      setAllPros(prev => prev.map(p => p.uid === pro.uid
        ? { ...p, verified: false, pendingApproval: true }
        : p
      ));
    } catch (err: any) {
      console.error('Erro ao revogar verificação', err);
      alert('Erro ao revogar: ' + (err?.message || ''));
    } finally {
      setApprovingUid(null);
    }
  };

  const handleConvertToPro = async (user: UserProfile) => {
    if (!user.uid) return;
    const ok = window.confirm(
      `Tornar ${user.displayName} (@${user.username}) um prestador de serviços?\n\n` +
      `Será criado um cadastro em "Pendentes" para você revisar e aprovar. ` +
      `O prestador poderá preencher profissão, WhatsApp e skills depois.`
    );
    if (!ok) return;
    setConvertingUid(user.uid);
    try {
      const ref = doc(db, 'professional_profiles', user.uid);
      const seed: ProfessionalProfile = {
        uid: user.uid,
        username: user.username,
        displayName: user.displayName,
        profilePicUrl: user.profilePicUrl,
        profession: '',
        category: 'Outros',
        bio: '',
        whatsapp: '',
        instagram: '',
        portfolio: '',
        city: '',
        skills: [],
        verified: false,
        pendingApproval: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, seed);
      // Adiciona na lista local de pros para aparecer em "Pendentes" imediatamente
      setAllPros(prev => [
        { ...seed, createdAt: new Date(), updatedAt: new Date() },
        ...prev.filter(p => p.uid !== user.uid),
      ]);
    } catch (err: any) {
      console.error('Erro ao converter em prestador', err);
      alert('Erro ao converter: ' + (err?.message || ''));
    } finally {
      setConvertingUid(null);
    }
  };

  const handleToggleAdmin = async (user: UserProfile) => {
    if (!user.uid) return;
    const willBeAdmin = user.role !== 'admin';
    if (user.email === 'brisasofc@gmail.com' && willBeAdmin) {
      alert('Este e-mail já é admin por regra do Firestore.');
      return;
    }
    const ok = window.confirm(
      willBeAdmin
        ? `Tornar ${user.displayName} (@${user.username}) um administrador? Terá poder total no painel.`
        : `Remover o cargo de administrador de ${user.displayName}?`
    );
    if (!ok) return;
    setPromotingUid(user.uid);
    try {
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, { role: willBeAdmin ? 'admin' : 'user' });
      setAllProfiles(prev => prev.map(p => p.uid === user.uid
        ? { ...p, role: willBeAdmin ? 'admin' : 'user' }
        : p
      ));
    } catch (err: any) {
      console.error('Erro ao alterar role', err);
      alert('Erro ao alterar: ' + (err?.message || ''));
    } finally {
      setPromotingUid(null);
    }
  };

  // Mapa de uids que já possuem cadastro de prestador (para badge na lista de usuários)
  const proByUid = new Map<string, ProfessionalProfile>();
  for (const p of allPros) {
    if (p.uid) proByUid.set(p.uid, p);
  }

  const filteredPros = allPros.filter(p => {
    if (proFilter === 'pending') return p.pendingApproval === true && !p.verified;
    if (proFilter === 'verified') return p.verified === true;
    return true;
  });

  const pendingCount = allPros.filter(p => p.pendingApproval === true && !p.verified).length;
  const verifiedCount = allPros.filter(p => p.verified === true).length;

  const adminCount = allProfiles.filter(p => p.role === 'admin').length;
  const membersCount = allProfiles.filter(p => p.role !== 'admin').length;

  const toggleExpand = async (uid: string, username: string) => {
    if (expandedUser === uid) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(uid);
    if (userLinks[uid]) return;
    setLoadingMetrics(prev => ({ ...prev, [uid]: true }));
    try {
      const linksRef = collection(db, 'users', uid, 'links');
      const linksSnap = await getDocs(query(linksRef, orderBy('order', 'asc')));
      const items = linksSnap.docs.map(d => d.data() as LinkItem);
      const clicksRef = collection(db, 'users', uid, 'clicks');
      const clicksSnap = await getDocs(clicksRef);
      setUserLinks(prev => ({ ...prev, [uid]: { links: items, clicksCount: clicksSnap.size } }));
    } catch (err) {
      console.error('Erro ao carregar métricas de', username, err);
    } finally {
      setLoadingMetrics(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleStartEditUsername = (p: UserProfile) => {
    setEditingUsername(p.uid);
    setEditingUsernameValue(p.username);
  };

  const handleSaveUsername = async (uid: string) => {
    const newUsername = editingUsernameValue.trim().toLowerCase();
    if (!newUsername || newUsername.length < 3) {
      alert('O nome de usuário deve ter pelo menos 3 caracteres.');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(newUsername)) {
      alert('Use apenas letras minúsculas, números, hífen e underscore.');
      return;
    }
    setSavingUsername(true);
    try {
      const q = query(collection(db, 'users'), where('username', '==', newUsername), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].id !== uid) {
        alert('Este nome de usuário já está em uso.');
        setSavingUsername(false);
        return;
      }
      const ref = doc(db, 'users', uid);
      await updateDoc(ref, { username: newUsername });
      setAllProfiles(prev => prev.map(p => p.uid === uid ? { ...p, username: newUsername } : p));
      setEditingUsername(null);
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err?.message || ''));
    } finally {
      setSavingUsername(false);
    }
  };

  const handleCancelEditUsername = () => {
    setEditingUsername(null);
    setEditingUsernameValue('');
  };

  const toggleBan = async (profile: UserProfile) => {
    if (profile.uid === 'demo-user-123') return;
    setBanningUser(profile.uid);
    try {
      const ref = doc(db, 'users', profile.uid);
      await updateDoc(ref, { banned: !profile.banned });
      setAllProfiles(prev => prev.map(p => p.uid === profile.uid ? { ...p, banned: !p.banned } : p));
    } catch (err: any) {
      console.error('Erro ao banir/desbanir usuário', err);
      alert('Erro ao atualizar status: ' + (err?.message || ''));
    } finally {
      setBanningUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-400">Painel Administrativo</h3>
            <p className="text-[10px] text-zinc-500">Gerencie sua plataforma LinkFlow</p>
          </div>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Bem-vindo ao painel de controle da plataforma. Aqui você pode visualizar todos os usuários registrados, métricas gerais do sistema e gerenciar banimentos.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-4 bg-black/50 border border-white/5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#a78bfa]" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total</span>
          </div>
          <span className="text-2xl font-black text-white">{allProfiles.length}</span>
          <span className="text-[10px] text-zinc-500 block mt-1">usuários</span>
        </div>
        <div className="p-4 bg-black/50 border border-white/5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Admins</span>
          </div>
          <span className="text-2xl font-black text-white">{adminCount}</span>
          <span className="text-[10px] text-zinc-500 block mt-1">administradores</span>
        </div>
        <div className="p-4 bg-black/50 border border-white/5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Membros</span>
          </div>
          <span className="text-2xl font-black text-white">{membersCount}</span>
          <span className="text-[10px] text-zinc-500 block mt-1">usuários comuns</span>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#a78bfa]" />
            Usuários Registrados
            <span className="text-[10px] text-zinc-500 font-normal">({allProfiles.length})</span>
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-600">Clique no usuário para ver métricas</span>
            <button onClick={fetchAllUsers} className="text-[10px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Atualizar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-zinc-500 text-xs">Carregando usuários...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : allProfiles.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">Nenhum usuário encontrado</div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {allProfiles.map((p) => (
              <React.Fragment key={p.uid}>
                <div
                  className={`flex items-center gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer ${p.banned ? 'bg-rose-950/10 opacity-70' : ''}`}
                  onClick={() => toggleExpand(p.uid, p.username)}
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 relative">
                    {p.profilePicUrl ? (
                      <img src={p.profilePicUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-500">
                        {p.displayName?.charAt(0) || '?'}
                      </div>
                    )}
                    {p.banned && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <ShieldBan className="w-4 h-4 text-rose-400" />
                      </div>
                    )}
                  </div>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-zinc-200 truncate">{p.displayName}</span>
                      {p.role === 'admin' && (
                        <span className="text-[8px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> CEO
                        </span>
                      )}
                      {proByUid.has(p.uid) && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                          proByUid.get(p.uid)?.verified
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          <Briefcase className="w-2.5 h-2.5" /> {proByUid.get(p.uid)?.verified ? 'Pro' : 'Pro pendente'}
                        </span>
                      )}
                      {p.banned && (
                        <span className="text-[8px] font-bold bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Ban className="w-2.5 h-2.5" /> Banido
                        </span>
                      )}
                    </div>
                    {editingUsername === p.uid ? (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-zinc-600 font-mono shrink-0">@</span>
                        <input
                          type="text"
                          value={editingUsernameValue}
                          onChange={(e) => setEditingUsernameValue(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())}
                          className="bg-black text-[10px] text-zinc-200 px-1.5 py-0.5 rounded border border-[#a78bfa]/40 focus:outline-none w-28 font-mono"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUsername(p.uid); if (e.key === 'Escape') handleCancelEditUsername(); }}
                        />
                        <button onClick={() => handleSaveUsername(p.uid)} disabled={savingUsername} className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={handleCancelEditUsername} className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-500">@{p.username}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {!proByUid.has(p.uid) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleConvertToPro(p); }}
                        disabled={convertingUid === p.uid}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        title="Criar cadastro de prestador (vai para Pendentes)"
                      >
                        {convertingUid === p.uid ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        <span className="hidden md:inline">Tornar Prestador</span>
                      </button>
                    )}
                    {p.role !== 'admin' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleAdmin(p); }}
                        disabled={promotingUid === p.uid}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        title="Promover a administrador (poder total)"
                      >
                        {promotingUid === p.uid ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <ShieldPlus className="w-3 h-3" />
                        )}
                        <span className="hidden md:inline">Admin</span>
                      </button>
                    )}
                    {p.role === 'admin' && p.email !== 'brisasofc@gmail.com' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleAdmin(p); }}
                        disabled={promotingUid === p.uid}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-zinc-700/30 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-600/30 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        title="Remover cargo de administrador"
                      >
                        {promotingUid === p.uid ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <ShieldPlus className="w-3 h-3" />
                        )}
                        <span className="hidden md:inline">Remover Admin</span>
                      </button>
                    )}
                    <div className="hidden sm:flex items-center gap-2 text-[9px] text-zinc-600">
                      <span className="flex items-center gap-0.5"><Link2 className="w-2.5 h-2.5" /> {userLinks[p.uid]?.links.length ?? '-'}</span>
                      <span className="flex items-center gap-0.5"><MousePointerClick className="w-2.5 h-2.5" /> {userLinks[p.uid]?.clicksCount ?? '-'}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartEditUsername(p); }}
                      className="text-zinc-500 hover:text-[#a78bfa] transition-colors cursor-pointer"
                      title="Editar username"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBan(p); }}
                      disabled={banningUser === p.uid || p.uid === 'demo-user-123'}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        p.banned
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {banningUser === p.uid ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : p.banned ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Ban className="w-3 h-3" />
                      )}
                      {p.banned ? 'Desbanir' : 'Banir'}
                    </button>
                    <a
                      href={`/?u=${p.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-zinc-500 hover:text-[#a78bfa] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {expandedUser === p.uid ? (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                  </div>
                </div>
                {expandedUser === p.uid && (
                  <div className="bg-black/30 px-3 py-4 border-t border-white/5 space-y-3">
                    {loadingMetrics[p.uid] ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="w-4 h-4 text-[#a78bfa] animate-spin" />
                        <span className="text-[10px] text-zinc-500 ml-2">Carregando métricas...</span>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-white/5">
                            <span className="text-[9px] text-zinc-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Cadastro</span>
                            <span className="text-[11px] font-semibold text-zinc-200 block mt-0.5">
                              {p.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || 
                               p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString('pt-BR') :
                               p.createdAt instanceof Date ? p.createdAt.toLocaleDateString('pt-BR') :
                               typeof p.createdAt === 'string' ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '---'}
                            </span>
                          </div>
                          <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-white/5">
                            <span className="text-[9px] text-zinc-500 flex items-center gap-1"><Hash className="w-3 h-3" /> Links</span>
                            <span className="text-[11px] font-semibold text-zinc-200 block mt-0.5">
                              {userLinks[p.uid]?.links.length ?? 0}
                            </span>
                          </div>
                          <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-white/5">
                            <span className="text-[9px] text-zinc-500 flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Cliques</span>
                            <span className="text-[11px] font-semibold text-zinc-200 block mt-0.5">
                              {userLinks[p.uid]?.clicksCount ?? 0}
                            </span>
                          </div>
                          <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-white/5">
                            <span className="text-[9px] text-zinc-500">E-mail</span>
                            <span className="text-[10px] font-semibold text-zinc-200 block mt-0.5 truncate">
                              {p.email || '---'}
                            </span>
                          </div>
                        </div>
                        {userLinks[p.uid]?.links && userLinks[p.uid].links.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 block mb-1.5">Links do usuário:</span>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {userLinks[p.uid].links.map(link => (
                                <div key={link.id} className="flex items-center gap-2 bg-zinc-950/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${link.active ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                                  <span className="text-[10px] text-zinc-300 truncate flex-1">{link.title}</span>
                                  <span className="text-[9px] text-zinc-500 truncate max-w-[120px]">{link.url}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-zinc-600 text-center">
        <Sparkles className="w-3 h-3 inline-block mr-1 text-amber-400" />
        LinkFlow Platform — {new Date().getFullYear()}
      </p>

      {/* ============================================================ */}
      {/* PROFESSIONAL APPROVALS (LinkFlow Profissional)               */}
      {/* ============================================================ */}
      <div className="bg-black/40 border border-white/5 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5 flex-wrap gap-2">
          <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            Prestadores de Serviços
            <span className="text-[10px] text-zinc-500 font-normal">({allPros.length})</span>
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg p-0.5">
              {([
                { id: 'pending', label: 'Pendentes', count: pendingCount, color: 'text-amber-400' },
                { id: 'verified', label: 'Aprovados', count: verifiedCount, color: 'text-emerald-400' },
                { id: 'all', label: 'Todos', count: allPros.length, color: 'text-zinc-300' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProFilter(tab.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    proFilter === tab.id
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[9px] ${tab.color}`}>{tab.count}</span>
                </button>
              ))}
            </div>
            <button onClick={fetchAllPros} className="text-[10px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
              <RefreshCw className="w-3 h-3" /> Atualizar
            </button>
          </div>
        </div>

        {prosLoading ? (
          <div className="p-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" /> Carregando prestadores...
          </div>
        ) : prosError ? (
          <div className="p-8 text-center text-rose-400 text-xs">{prosError}</div>
        ) : filteredPros.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            {proFilter === 'pending'
              ? 'Nenhum prestador aguardando aprovação.'
              : proFilter === 'verified'
                ? 'Nenhum prestador aprovado ainda.'
                : 'Nenhum prestador cadastrado.'}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredPros.map((pro) => {
              const isPending = pro.pendingApproval === true && !pro.verified;
              const isApproved = pro.verified === true;
              return (
                <div key={pro.uid} className={`p-3 hover:bg-white/5 transition-colors ${isPending ? 'bg-amber-950/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                      {pro.profilePicUrl ? (
                        <img src={pro.profilePicUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-500">
                          {pro.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-zinc-200 truncate">{pro.displayName}</span>
                        {isApproved && (
                          <span className="text-[8px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-emerald-400" /> Aprovado
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[8px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <RefreshCw className="w-2.5 h-2.5" /> Pendente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 flex-wrap">
                        <span className="text-[#a78bfa] font-medium">{pro.profession}</span>
                        <span>·</span>
                        <span>{pro.category}</span>
                        {pro.city && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {pro.city}</span>
                          </>
                        )}
                      </div>
                      {pro.skills && pro.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pro.skills.slice(0, 4).map((s, i) => (
                            <span key={i} className="text-[8px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded-full border border-zinc-700/60">
                              {s}
                            </span>
                          ))}
                          {pro.skills.length > 4 && (
                            <span className="text-[8px] text-zinc-500 px-1 self-center">+{pro.skills.length - 4}</span>
                          )}
                        </div>
                      )}
                      {pro.approvedBy && isApproved && (
                        <div className="text-[9px] text-zinc-600 mt-0.5">
                          aprovado por {pro.approvedBy}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      {pro.whatsapp && (
                        <a
                          href={`https://wa.me/${pro.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-emerald-400 transition-colors"
                          title={`WhatsApp: ${pro.whatsapp}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <a
                        href={`?view=servicos&pro=${pro.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-[#a78bfa] transition-colors"
                        title="Ver perfil público"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApprovePro(pro)}
                            disabled={approvingUid === pro.uid || rejectingUid === pro.uid}
                            className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {approvingUid === pro.uid ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleRejectPro(pro)}
                            disabled={approvingUid === pro.uid || rejectingUid === pro.uid}
                            className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {rejectingUid === pro.uid ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Rejeitar
                          </button>
                        </>
                      )}
                      {isApproved && (
                        <button
                          onClick={() => handleUnverifyPro(pro)}
                          disabled={approvingUid === pro.uid}
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          title="Revogar verificação e marcar como pendente"
                        >
                          {approvingUid === pro.uid ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Ban className="w-3 h-3" />
                          )}
                          Revogar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
