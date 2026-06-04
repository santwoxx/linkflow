import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { UserProfile, LinkItem } from '../types';
import { Crown, Users, Link2, BarChart2, Sparkles, RefreshCw, ExternalLink, ChevronDown, ChevronRight, Ban, CheckCircle, Calendar, MousePointerClick, Hash, ShieldBan, Edit3, Check, X } from 'lucide-react';

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
                  <div className="flex items-center gap-2 shrink-0">
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
    </div>
  );
}
