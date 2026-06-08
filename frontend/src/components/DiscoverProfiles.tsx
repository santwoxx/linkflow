import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { UserProfile, LinkItem } from '../types';
import { Search, Compass, Flame, Users, X, Loader2, Sparkles, User as UserIcon, Users as UsersIcon } from 'lucide-react';
import PublicProfile from './PublicProfile';

export default function DiscoverProfiles() {
  const [activeTab, setActiveTab] = useState<'trending' | 'new' | 'search'>('trending');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Profile State
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [selectedProfileLinks, setSelectedProfileLinks] = useState<LinkItem[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  const fetchProfiles = async (type: 'trending' | 'new' | 'search', search?: string) => {
    setIsLoading(true);
    setProfiles([]);
    try {
      let q;
      const usersRef = collection(db, 'users');

      if (search && search.length > 2) {
        // Levenshtein / Prefix Search simulation for Firebase
        const searchLower = search.toLowerCase();
        q = query(
          usersRef,
          where('username', '>=', searchLower),
          where('username', '<=', searchLower + '\uf8ff'),
          limit(20)
        );
      } else if (type === 'new') {
        q = query(usersRef, orderBy('createdAt', 'desc'), limit(15));
      } else {
        // Trending / Recently Active
        q = query(usersRef, orderBy('updatedAt', 'desc'), limit(15));
      }

      const querySnapshot = await getDocs(q);
      const fetched: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push(doc.data() as UserProfile);
      });

      setProfiles(fetched);
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'search') {
      if (searchQuery.length > 2) {
        const debounce = setTimeout(() => {
          fetchProfiles('search', searchQuery);
        }, 500);
        return () => clearTimeout(debounce);
      } else {
        setProfiles([]);
      }
    } else {
      fetchProfiles(activeTab);
    }
  }, [activeTab, searchQuery]);

  // Open Instagram-style Lightbox Modal
  const handleOpenProfile = async (profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsLoadingLinks(true);
    try {
      const linksRef = collection(db, 'users', profile.uid, 'links');
      const q = query(linksRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const fetchedLinks: LinkItem[] = [];
      snapshot.forEach(doc => {
        fetchedLinks.push(doc.data() as LinkItem);
      });
      setSelectedProfileLinks(fetchedLinks);
    } catch (error) {
      console.error("Erro ao carregar links do perfil", error);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const closeProfileModal = () => {
    setSelectedProfile(null);
    setSelectedProfileLinks([]);
  };

  return (
    <div className="space-y-6 pb-12 relative h-full">
      
      {/* Header section */}
      <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800/50 shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Compass className="w-6 h-6 text-[#a78bfa]" />
              Descobrir Perfis
            </h2>
            <p className="text-xs text-slate-400">
              Explore nossa comunidade de criadores de conteúdo, afiliados e influenciadores. 
              Inspire-se e conecte-se com as mentes criativas do LinkFlowAI.
            </p>
          </div>
          
          <div className="w-full md:w-[300px]">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Pesquisar @usuario..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length > 0) setActiveTab('search');
                  else setActiveTab('trending');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-[#a78bfa] transition-all shadow-inner"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 mt-6 border-b border-slate-800/60 pb-1">
          <button
            onClick={() => { setActiveTab('trending'); setSearchQuery(''); }}
            className={`pb-2 px-3 font-semibold text-[11px] uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'trending' ? 'border-[#a78bfa] text-[#a78bfa]' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Em Alta
          </button>
          <button
            onClick={() => { setActiveTab('new'); setSearchQuery(''); }}
            className={`pb-2 px-3 font-semibold text-[11px] uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'new' ? 'border-[#a78bfa] text-[#a78bfa]' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Novos Criadores
          </button>
          {activeTab === 'search' && (
            <button
              className="pb-2 px-3 font-semibold text-[11px] uppercase tracking-widest border-b-2 border-[#a78bfa] text-[#a78bfa] transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Resultados
            </button>
          )}
        </div>
      </div>

      {/* Grid of Profiles */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#a78bfa] gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Buscando perfis...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0f172a]/50 rounded-2xl border border-slate-800/50">
          <Compass className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-slate-300 font-bold mb-1">Nenhum perfil encontrado</h3>
          <p className="text-slate-500 text-sm max-w-sm text-center">
            {activeTab === 'search' ? 'Tente buscar por um @username diferente.' : 'Ainda não há perfis suficientes registrados nesta categoria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((profile) => (
            <div 
              key={profile.uid}
              className="group bg-[#0a101f] border border-slate-800/60 rounded-2xl overflow-hidden hover:border-[#a78bfa]/40 hover:shadow-[0_0_20px_rgba(167,139,250,0.15)] transition-all cursor-pointer flex flex-col"
              onClick={() => handleOpenProfile(profile)}
            >
              {/* Cover Header */}
              <div className="h-24 w-full bg-slate-900 relative">
                {profile.coverUrl ? (
                  <img src={profile.coverUrl} alt="Capa" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#a78bfa]/20 to-purple-900/40" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </div>

              {/* Avatar overlapping */}
              <div className="px-5 pb-5 flex-1 flex flex-col relative mt-[-24px]">
                <div className="flex justify-between items-end mb-3">
                  <div className="p-1 bg-[#0a101f] rounded-full z-10">
                    {profile.profilePicUrl ? (
                      <img src={profile.profilePicUrl} alt={profile.displayName} className="w-12 h-12 rounded-full object-cover border border-slate-700 bg-slate-800" loading="lazy" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#a78bfa] flex items-center justify-center text-white font-bold text-lg border border-slate-700">
                        {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                  </div>
                  
                  {/* Fake "View" button for UI */}
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-700 group-hover:bg-[#a78bfa] group-hover:text-white group-hover:border-[#a78bfa] transition-colors">
                    Visualizar
                  </span>
                </div>

                <h3 className="font-bold text-slate-200 text-sm truncate">{profile.displayName || profile.username}</h3>
                <p className="text-[10px] text-[#a78bfa] font-mono mb-2 truncate">@{profile.username}</p>
                
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1 break-words min-w-0">
                  {profile.bio || <span className="italic opacity-50">Nenhuma biografia informada.</span>}
                </p>

                <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="w-3 h-3" />
                    {profile.followersCount != null ? (
                      profile.followersCount >= 1000 ? `${(profile.followersCount / 1000).toFixed(1)}k` : profile.followersCount
                    ) : 0} seguidores
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- INSTAGRAM STYLE LIGHTBOX MODAL --- */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-2 sm:p-6">
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={closeProfileModal}
            title="Fechar (ou clique fora)"
          />
          
          <div className="relative w-full max-w-sm sm:max-w-md h-[95dvh] sm:h-[85vh] bg-zinc-950 rounded-[40px] border-[6px] border-zinc-900 shadow-2xl overflow-hidden flex flex-col scale-in-center">
            {/* Modal Controls overlay */}
            <div className="absolute top-4 right-4 z-50">
              <button 
                onClick={closeProfileModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-rose-500/80 transition-colors backdrop-blur-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full bg-zinc-950">
              {isLoadingLinks ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-[#a78bfa] gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Montando Página...</p>
                </div>
              ) : (
                <PublicProfile 
                  profile={selectedProfile}
                  links={selectedProfileLinks}
                  previewMode={true} // Preview mode stops analytics tracking
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
