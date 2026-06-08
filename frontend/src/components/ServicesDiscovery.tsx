import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { ProfessionalProfile, PRO_CATEGORIES, ProCategory } from '../types';
import {
  Search, MapPin, Star, ChevronLeft,
  Loader2, SlidersHorizontal, X, Users, AlertTriangle, WifiOff, RefreshCw, MessageCircle, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServicesDiscoveryProps {
  onViewProfile: (username: string) => void;
}

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 200;

const CATEGORY_ICONS: Record<string, string> = {
  'Programação': '💻',
  'Design': '🎨',
  'Marketing': '📈',
  'Tráfego Pago': '🎯',
  'Inteligência Artificial': '🤖',
  'Consultoria': '💼',
  'Vídeo e Edição': '🎬',
  'Social Media': '📱',
  'Copywriting': '✍️',
  'Outros': '⚡',
};

type SortKey = 'recent' | 'name' | 'rating';

const SORT_OPTIONS: Record<SortKey, { label: string; field: string; dir: 'asc' | 'desc' }> = {
  recent: { label: 'Mais recentes', field: 'createdAt', dir: 'desc' },
  name: { label: 'Nome A–Z', field: 'displayName', dir: 'asc' },
  rating: { label: 'Melhor avaliados', field: 'rating', dir: 'desc' },
};

const CACHE_PREFIX = 'linkflow_cached_pro_profiles';

const isOfflineError = (err: unknown): boolean => {
  const msg = String((err as { message?: string } | null)?.message || err || '');
  return msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('network');
};

const formatRating = (n: number): string => n.toFixed(1).replace(/\.0$/, '');

// ---- Subcomponents ----

const SkeletonLoading = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-slate-900/60 border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[380px] relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        <div className="h-28 bg-slate-800/50" />
        <div className="px-6 pb-6 flex-1 flex flex-col -mt-12 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-slate-700/80 border-4 border-slate-900 shrink-0 mb-4 animate-pulse" />
          <div className="h-6 bg-slate-700/80 rounded-lg w-3/4 mb-3 animate-pulse" />
          <div className="h-4 bg-slate-800/80 rounded-md w-1/2 mb-6 animate-pulse" />
          <div className="flex gap-2 mb-6">
            <div className="h-6 bg-slate-800/80 rounded-full w-20 animate-pulse" />
            <div className="h-6 bg-slate-800/80 rounded-full w-20 animate-pulse" />
          </div>
          <div className="mt-auto pt-4 border-t border-white/5 flex gap-3">
            <div className="h-11 bg-slate-800/60 rounded-xl flex-1 animate-pulse" />
            <div className="h-11 bg-slate-800/60 rounded-xl flex-1 animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ConversionBanner = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="col-span-full my-6 rounded-3xl bg-gradient-to-br from-[#a78bfa]/10 via-indigo-500/10 to-transparent border border-[#a78bfa]/20 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 w-64 h-64 bg-[#a78bfa]/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#a78bfa]/20 transition-colors duration-700" />
    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
    <div className="relative z-10 flex-1">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] text-[10px] font-bold uppercase tracking-wider mb-4 border border-[#a78bfa]/20">
        <Zap className="w-3 h-3" /> Para Profissionais
      </div>
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
        Mostre seus serviços para milhares de visitantes.
      </h3>
      <ul className="flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 mb-0">
        <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Perfil verificado</li>
        <li className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Destaque na busca</li>
        <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[#a78bfa]" /> WhatsApp direto</li>
      </ul>
    </div>
    <div className="relative z-10 shrink-0 w-full md:w-auto">
      <a href="?tab=design" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-black hover:bg-slate-200 font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-0.5">
        Quero anunciar <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  </motion.div>
);

// ---- Main Component ----

export default function ServicesDiscovery({ onViewProfile }: ServicesDiscoveryProps) {
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [explicitFeatured, setExplicitFeatured] = useState<ProfessionalProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProCategory | ''>('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent');

  // Stats specific logic to avoid constant recalculations from DB
  const [cachedCities, setCachedCities] = useState<string[]>([]);
  
  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim().toLowerCase()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const tryCache = useCallback((): ProfessionalProfile[] | null => {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}_${sort}_${selectedCategory}_${selectedCity}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ProfessionalProfile[]) : null;
    } catch {
      return null;
    }
  }, [sort, selectedCategory, selectedCity]);

  const writeCache = useCallback((items: ProfessionalProfile[]) => {
    try {
      localStorage.setItem(`${CACHE_PREFIX}_${sort}_${selectedCategory}_${selectedCity}`, JSON.stringify(items));
    } catch {
      // quota exceeded
    }
  }, [sort, selectedCategory, selectedCity]);

  // Load Explicit Featured Pros
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const ref = collection(db, 'professional_profiles');
        const qF = query(ref, where('verified', '==', true), where('featured', '==', true), limit(4));
        const snap = await getDocs(qF);
        setExplicitFeatured(snap.docs.map(d => d.data() as ProfessionalProfile));
      } catch (err) {
        console.error('Error fetching featured', err);
      }
    };
    fetchFeatured();
  }, []);

  // Main Query
  useEffect(() => {
    setProfessionals([]);
    setError(null);
    setIsOffline(false);
    setIsLoading(true);

    const cached = tryCache();
    if (cached && cached.length) {
      setProfessionals(cached);
      setIsLoading(false);
    }

    const ref = collection(db, 'professional_profiles');
    
    // Fetch all verified without ordering to prevent Firebase index errors
    const q = query(ref, where('verified', '==', true));

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.fromCache && snap.empty) return;
        
        const items = snap.docs.map((d) => d.data() as ProfessionalProfile);
        setProfessionals(items);
        setIsLoading(false);
        setIsOffline(false);
        writeCache(items);

        // Update cities cache for the autocomplete
        setCachedCities(prev => {
          const newCities = new Set([...prev, ...items.map(i => i.city).filter(Boolean) as string[]]);
          return Array.from(newCities).sort();
        });
      },
      (err) => {
        if (isOfflineError(err)) {
          setIsOffline(true);
          if (!cached) setError('Você está offline. Conecte-se à internet para buscar profissionais.');
          setIsLoading(false);
          return;
        }
        
        console.error('Firestore Error:', err);
        setError('Estamos atualizando nossa vitrine de profissionais. Tente novamente em alguns instantes.');
        setIsLoading(false);
      },
    );

    return () => unsub();
  }, [tryCache, writeCache]);

  // loadMore logic removed since we are fetching all verified at once

  // Client-side text search and filtering
  const filtered = useMemo(() => {
    let result = [...professionals];

    // Inject Camile Bezerra if she's not in the database response
    if (!result.some((p) => p.username === 'nails_camilebezerra')) {
      result.unshift({
        uid: 'camile-bezerra-123',
        username: 'nails_camilebezerra',
        displayName: 'Camile Bezerra',
        profilePicUrl: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&auto=format&fit=crop&q=80',
        profession: 'Nails Designer',
        category: 'Outros',
        bio: 'Especialista em Alongamentos de Unha, Blindagem e Nail Art Delicadas ✨🌸',
        whatsapp: '5581999999999',
        city: 'Recife',
        skills: ['Gel', 'Nail Art', 'Manicure', 'Blindagem', 'Cutilagem'],
        verified: true,
        rating: 5.0,
        ratingCount: 12,
        createdAt: { seconds: Date.now() / 1000 },
        updatedAt: { seconds: Date.now() / 1000 }
      });
    }

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedCity) {
      result = result.filter((p) => p.city === selectedCity);
    }

    if (searchQuery) {
      result = result.filter((p) => 
        p.displayName.toLowerCase().includes(searchQuery)
        || p.profession.toLowerCase().includes(searchQuery)
        || (p.username || '').toLowerCase().includes(searchQuery)
        || (p.skills || []).some(s => s.toLowerCase().includes(searchQuery))
      );
    }

    // Sort locally
    result.sort((a, b) => {
      if (sort === 'recent') {
        const dA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt as any).getTime() || 0;
        const dB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt as any).getTime() || 0;
        return dB - dA;
      }
      if (sort === 'name') {
        return (a.displayName || '').localeCompare(b.displayName || '');
      }
      if (sort === 'rating') {
        const rA = a.rating || 0;
        const rB = b.rating || 0;
        return rB - rA;
      }
      return 0;
    });

    return result;
  }, [professionals, searchQuery, selectedCategory, selectedCity, sort]);

  const clearFilters = () => {
    setSearchInput('');
    setSelectedCategory('');
    setSelectedCity('');
  };

  const hasFilters = !!searchInput || !!selectedCategory || !!selectedCity;

  // Stats calculation (estimations based on current view/cache)
  const stats = useMemo(() => {
    const totalPros = professionals.length + (hasMore ? '+' : '');
    const uniqueCats = PRO_CATEGORIES.length; // We know total categories available
    const uniqueCities = cachedCities.length > 0 ? cachedCities.length : new Set(professionals.map(p => p.city).filter(Boolean)).size;
    return { pros: totalPros, cats: uniqueCats, cities: uniqueCities };
  }, [professionals, hasMore, cachedCities]);

  // Featured pros logic
  const featuredPros = useMemo(() => {
    let list: ProfessionalProfile[] = [];
    if (explicitFeatured.length > 0) {
      list = [...explicitFeatured];
    } else {
      // Fallback: Select pros with more than 3 skills and an avatar
      list = filtered.filter(p => p.profilePicUrl && p.skills?.length >= 3);
    }

    // Ensure Camile Bezerra is at the top of the featured list
    const camileInFeatured = list.find(p => p.username === 'nails_camilebezerra');
    const camileInFiltered = filtered.find(p => p.username === 'nails_camilebezerra');

    if (camileInFeatured) {
      const filteredList = list.filter(p => p.username !== 'nails_camilebezerra');
      return [camileInFeatured, ...filteredList].slice(0, 4);
    } else if (camileInFiltered) {
      const filteredList = list.filter(p => p.username !== 'nails_camilebezerra');
      return [camileInFiltered, ...filteredList].slice(0, 4);
    }

    return list.slice(0, 4);
  }, [filtered, explicitFeatured]);

  const mainGridPros = useMemo(() => {
    const featuredIds = new Set(featuredPros.map(p => p.uid));
    return filtered.filter(p => !featuredIds.has(p.uid));
  }, [filtered, featuredPros]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-32 font-sans selection:bg-[#a78bfa]/30 selection:text-white">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => history.back()}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          
          <div className="flex items-center gap-2 bg-[#a78bfa]/10 border border-[#a78bfa]/20 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-[#a78bfa]" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#a78bfa]">
              Verificados
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section Premium */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.15)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight mb-6">
              Contrate profissionais <br className="hidden sm:block"/> verificados sem intermediários
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
              Conecte-se diretamente com especialistas em programação, design, marketing, inteligência artificial e muito mais. Negociação direta, zero taxas.
            </p>
          </motion.div>

          {/* Search Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-2xl mx-auto relative group z-20"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#a78bfa]/30 to-indigo-500/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
            <div className="relative flex items-center bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-[#a78bfa]/50 focus-within:bg-slate-900/80 transition-all">
              <Search className="w-6 h-6 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nome, profissão, habilidade..."
                className="w-full bg-transparent border-none py-3 px-4 text-base sm:text-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`shrink-0 ml-2 px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  showFilters || selectedCity 
                  ? 'bg-[#a78bfa] text-white shadow-[0_0_15px_rgba(167,139,250,0.4)]' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" /> <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          {!isLoading && professionals.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mt-16 flex flex-wrap justify-center gap-8 sm:gap-16"
            >
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-white drop-shadow-md">{stats.pros}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Profissionais</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-white drop-shadow-md">{stats.cats}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Categorias</span>
              </div>
              <div className="flex flex-col items-center hidden sm:flex">
                <span className="text-4xl font-black text-white drop-shadow-md">{stats.cities}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Cidades</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-emerald-400 drop-shadow-md">100%</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Contato Direto</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        
        {/* Filters Panel Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="overflow-hidden mt-6"
            >
              <div className="p-6 sm:p-8 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ordenar por</label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa] focus:bg-black/80 transition-all cursor-pointer appearance-none"
                    >
                      {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
                        <option key={key} value={key}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Localização (Cidade)</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        list="cities-list"
                        placeholder="Buscar cidade... ex: São Paulo"
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa] focus:bg-black/80 transition-all"
                      />
                      <datalist id="cities-list">
                        {cachedCities.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>
                </div>
                {hasFilters && (
                  <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
                    <button onClick={clearFilters} className="px-5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-2 cursor-pointer">
                      <X className="w-4 h-4" /> Limpar Filtros
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Chips Premium */}
        <div className="mt-10 mb-8">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            <button
              onClick={() => setSelectedCategory('')}
              className={`snap-start shrink-0 px-6 py-3.5 rounded-2xl text-sm font-bold border transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                !selectedCategory 
                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              Todos
            </button>
            {PRO_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                className={`snap-start shrink-0 px-6 py-3.5 rounded-2xl text-sm font-bold border transition-all duration-300 cursor-pointer flex items-center gap-2 relative overflow-hidden group ${
                  selectedCategory === cat 
                  ? 'bg-gradient-to-r from-[#a78bfa] to-indigo-500 text-white border-transparent shadow-[0_0_25px_rgba(167,139,250,0.4)]' 
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {selectedCategory === cat && (
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <span className="text-lg">{CATEGORY_ICONS[cat]}</span> {cat}
              </button>
            ))}
          </div>
        </div>

        {isOffline && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-sm text-amber-300 mb-8">
            <WifiOff className="w-5 h-5 shrink-0" />
            <p>Você está offline. Exibindo resultados armazenados localmente.</p>
          </div>
        )}

        {error && !isLoading && professionals.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(244,63,94,0.1)]">
              <AlertTriangle className="w-12 h-12 text-rose-400" />
            </div>
            <h3 className="text-3xl font-extrabold text-white mb-4">Algo deu errado</h3>
            <p className="text-slate-400 text-lg max-w-lg leading-relaxed mb-10">{error}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-4 bg-white text-black font-bold rounded-2xl transition-all hover:bg-slate-200 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl">
              <RefreshCw className="w-5 h-5" /> Tentar novamente
            </button>
          </motion.div>
        ) : isLoading && professionals.length === 0 ? (
          <SkeletonLoading />
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-8">
              <Search className="w-12 h-12 text-slate-500" />
            </div>
            <h3 className="text-3xl font-extrabold text-white mb-4">Nenhum resultado encontrado</h3>
            <p className="text-slate-400 text-lg max-w-md mb-8">
              {hasFilters ? 'Tente ajustar seus filtros de busca para encontrar o profissional ideal.' : 'Ainda não há profissionais verificados cadastrados nesta seção.'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all flex items-center gap-2 hover:scale-105">
                <X className="w-5 h-5" /> Limpar todos os filtros
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-16">
            
            {/* Featured Section */}
            {!hasFilters && featuredPros.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Destaques</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredPros.map((pro, index) => (
                    <motion.div 
                      key={pro.uid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ProCard pro={pro} onViewProfile={onViewProfile} isFeatured />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Main Listing */}
            <section>
              {(!hasFilters && featuredPros.length > 0) && (
                <div className="flex items-center gap-3 mb-8">
                  <Users className="w-6 h-6 text-slate-400" />
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Descubra mais especialistas</h2>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mainGridPros.map((pro, index) => (
                  <React.Fragment key={pro.uid}>
                    {/* Insert Banner every 6 cards in the main grid */}
                    {index > 0 && index % 6 === 0 && (
                      <ConversionBanner />
                    )}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (index % 6) * 0.05 }}
                    >
                      <ProCard pro={pro} onViewProfile={onViewProfile} />
                    </motion.div>
                  </React.Fragment>
                ))}
              </div>
            </section>

            {/* Load More Removed - Infinite Scroll Not Needed with Local Filters */}

            {!hasMore && professionals.length > 0 && !hasFilters && (
              <div className="flex items-center justify-center mt-16 pb-12 opacity-50">
                <div className="h-px bg-white/20 w-24" />
                <span className="mx-6 text-xs font-bold text-white uppercase tracking-widest">Fim da lista</span>
                <div className="h-px bg-white/20 w-24" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Subcomponent: ProCard Premium ----

function ProCard({ pro, onViewProfile, isFeatured }: { pro: ProfessionalProfile, onViewProfile: (u: string) => void, isFeatured?: boolean }) {
  const hasRating = (pro.ratingCount ?? 0) > 0 && typeof pro.rating === 'number';
  // Check if phone or whatsapp exists
  const rawNumber = pro.whatsapp || '';
  const waNumber = rawNumber.replace(/\D/g, '');
  const waLink = waNumber ? `https://wa.me/55${waNumber}?text=Olá! Encontrei seu perfil no LinkFlow e gostaria de saber mais sobre seus serviços.` : null;

  return (
    <article 
      onClick={() => onViewProfile(pro.username)}
      className="group relative bg-[#0a0f25]/80 backdrop-blur-3xl border border-white/5 hover:border-[#a78bfa]/50 rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(167,139,250,0.3)] hover:-translate-y-1.5 transition-all duration-500 cursor-pointer flex flex-col h-full"
    >
      {/* Decorative top glow */}
      <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${isFeatured ? 'from-amber-500/20' : 'from-[#a78bfa]/20'} to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
      
      <div className="p-6 flex-1 flex flex-col relative z-10">
        <div className="flex justify-between items-start mb-6">
          {/* Avatar */}
          <div className="relative">
            {pro.profilePicUrl ? (
              <img src={pro.profilePicUrl} alt={pro.displayName} className="w-24 h-24 rounded-2xl object-cover shadow-2xl border-2 border-white/10 group-hover:border-[#a78bfa]/50 transition-colors duration-500" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/10 group-hover:border-[#a78bfa]/50 flex items-center justify-center text-4xl font-extrabold text-white shadow-2xl transition-colors duration-500">
                {pro.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 border-[3px] border-[#0a0f25] shadow-sm" title="Verificado">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Badge */}
          <div className="shrink-0">
            {hasRating ? (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-extrabold text-amber-400">{formatRating(pro.rating!)} <span className="opacity-70 font-medium">({pro.ratingCount})</span></span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-xs font-bold text-slate-300">Novo</span>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-white mb-1.5 truncate group-hover:text-[#a78bfa] transition-colors">{pro.displayName}</h3>
        <p className="text-sm text-[#a78bfa] font-bold mb-5 truncate">{pro.profession}</p>

        <div className="flex items-center gap-4 text-[13px] text-slate-400 font-medium mb-6">
          <span className="flex items-center gap-1.5">
            <span>{CATEGORY_ICONS[pro.category] || '⚡'}</span> <span className="truncate max-w-[120px]">{pro.category}</span>
          </span>
          {pro.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> <span className="truncate max-w-[100px]">{pro.city}</span>
            </span>
          )}
        </div>

        {/* Skills */}
        {pro.skills && pro.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {pro.skills.slice(0, 3).map((skill, i) => (
              <span key={i} className="text-[11px] font-bold bg-white/5 text-slate-300 border border-white/10 px-3 py-1.5 rounded-lg">
                {skill}
              </span>
            ))}
            {pro.skills.length > 3 && (
              <span className="text-[11px] font-bold text-slate-500 px-2 py-1.5">+{pro.skills.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions Bottom */}
        <div className="mt-auto pt-6 border-t border-white/5 grid grid-cols-2 gap-3">
          {waLink ? (
            <a 
              href={waLink} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="col-span-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/20 transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
            >
              WhatsApp
            </a>
          ) : (
            <div className="col-span-1" /> // Spacer if no whatsapp
          )}
          
          <button
            className={`flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold rounded-xl transition-all text-center hover:scale-[1.02] active:scale-[0.98] ${
              waLink 
              ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' 
              : 'col-span-2 bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/20 group-hover:bg-[#a78bfa] group-hover:text-white'
            }`}
          >
            Ver Perfil <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    </article>
  );
}
