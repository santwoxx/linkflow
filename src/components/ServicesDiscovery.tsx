import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
  onSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ProfessionalProfile, PRO_CATEGORIES, ProCategory } from '../types';
import {
  Search, MapPin, Star, MessageCircle, ChevronRight, ChevronLeft,
  Loader2, SlidersHorizontal, X, Users, AlertTriangle, WifiOff,
} from 'lucide-react';
import ProPromoBanner from './ProPromoBanner';

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

const isIndexError = (err: unknown): boolean => {
  const msg = String((err as { message?: string } | null)?.message || err || '');
  return msg.toLowerCase().includes('index') || msg.toLowerCase().includes('requires an index');
};

const formatRating = (n: number): string => n.toFixed(1).replace(/\.0$/, '');

export default function ServicesDiscovery({ onViewProfile }: ServicesDiscoveryProps) {
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
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

  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const cancelledRef = useRef(false);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim().toLowerCase()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset pagination cursor + results when sort changes
  useEffect(() => {
    lastDocRef.current = null;
  }, [sort]);

  // Try offline cache
  const tryCache = useCallback((): ProfessionalProfile[] | null => {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}_${sort}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ProfessionalProfile[]) : null;
    } catch {
      return null;
    }
  }, [sort]);

  const writeCache = useCallback((items: ProfessionalProfile[]) => {
    try {
      localStorage.setItem(`${CACHE_PREFIX}_${sort}`, JSON.stringify(items));
    } catch {
      /* quota exceeded — ignore */
    }
  }, [sort]);

  // Initial load + real-time subscription on the first page
  useEffect(() => {
    cancelledRef.current = false;
    setProfessionals([]);
    setHasMore(false);
    setError(null);
    setIsOffline(false);
    setIsLoading(true);
    lastDocRef.current = null;

    // Show cache immediately for snappier UX
    const cached = tryCache();
    if (cached && cached.length) {
      setProfessionals(cached);
      setIsLoading(false);
    }

    const sortOpt = SORT_OPTIONS[sort];
    const ref = collection(db, 'professional_profiles');
    const q = query(
      ref,
      where('verified', '==', true),
      orderBy(sortOpt.field, sortOpt.dir),
      limit(PAGE_SIZE),
    );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        if (cancelledRef.current) return;
        if (snap.metadata.fromCache) return; // skip local cache; wait for server
        const items = snap.docs.map((d) => d.data() as ProfessionalProfile);
        setProfessionals(items);
        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        setHasMore(snap.docs.length === PAGE_SIZE);
        setIsLoading(false);
        setIsOffline(false);
        writeCache(items);
      },
      (err) => {
        if (cancelledRef.current) return;
        if (isOfflineError(err)) {
          setIsOffline(true);
          if (!cached) setError('Você está offline. Conecte-se à internet para buscar profissionais.');
          setIsLoading(false);
          return;
        }
        if (isIndexError(err)) {
          setError('Índice composto ausente no Firestore. Rode "firebase deploy --only firestore:indexes" para criar os índices necessários.');
        } else {
          console.error('Erro ao buscar profissionais:', err);
          if (!cached) {
            setError('Não foi possível carregar os profissionais. Tente novamente em instantes.');
          }
        }
        setIsLoading(false);
      },
    );

    return () => {
      cancelledRef.current = true;
      unsub();
    };
  }, [sort, tryCache, writeCache]);

  // Load more (cursor pagination, no real-time)
  const loadMore = useCallback(async () => {
    if (!lastDocRef.current || isLoadingMore || isOffline) return;
    setIsLoadingMore(true);
    try {
      const sortOpt = SORT_OPTIONS[sort];
      const ref = collection(db, 'professional_profiles');
      const q = query(
        ref,
        where('verified', '==', true),
        orderBy(sortOpt.field, sortOpt.dir),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE),
      );
      const snap = await getDocs(q);
      if (cancelledRef.current) return;
      const items = snap.docs.map((d) => d.data() as ProfessionalProfile);
      setProfessionals((prev) => {
        const next = [...prev, ...items];
        writeCache(next);
        return next;
      });
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      if (isOfflineError(err)) {
        setIsOffline(true);
        return;
      }
      console.error('Erro ao carregar mais profissionais:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isOffline, sort, writeCache]);

  // Client-side filters (search/category/city) on top of the loaded pages
  const filtered = useMemo(() => {
    return professionals.filter((p) => {
      const matchSearch = !searchQuery
        || p.displayName.toLowerCase().includes(searchQuery)
        || p.profession.toLowerCase().includes(searchQuery)
        || (p.username || '').toLowerCase().includes(searchQuery);
      const matchCat = !selectedCategory || p.category === selectedCategory;
      const matchCity = !selectedCity || p.city.toLowerCase().includes(selectedCity.toLowerCase());
      return matchSearch && matchCat && matchCity;
    });
  }, [professionals, searchQuery, selectedCategory, selectedCity]);

  // City suggestions come from the union of all loaded pages
  const cityOptions = useMemo(() => {
    const cities: string[] = professionals.map((p) => p.city).filter((c): c is string => Boolean(c));
    const unique = Array.from(new Set(cities));
    return unique.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [professionals]);

  const clearFilters = () => {
    setSearchInput('');
    setSelectedCategory('');
    setSelectedCity('');
  };

  const hasFilters = !!searchInput || !!selectedCategory || !!selectedCity;

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-100 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a1128] via-[#0f1635] to-[#050b18] border-b border-slate-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.12)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a78bfa] bg-[#a78bfa]/10 border border-[#a78bfa]/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Star className="w-3 h-3 fill-[#a78bfa]" aria-hidden="true" /> Profissionais Verificados
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Encontre o profissional ideal
            </h1>
            <button
              onClick={() => history.back()}
              className="shrink-0 mt-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              aria-label="Voltar para a página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" /> Voltar
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-6 max-w-xl">
            Conecte-se com profissionais verificados pelo LinkFlow. Contato direto via WhatsApp, sem intermediários.
          </p>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nome, profissão..."
                aria-label="Buscar profissionais por nome, profissão ou usuário"
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60 focus:bg-slate-900 transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${showFilters || selectedCategory || selectedCity ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]' : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'}`}
              aria-expanded={showFilters}
              aria-controls="filters-panel"
              aria-label={showFilters ? 'Fechar filtros de busca' : 'Abrir filtros de busca'}
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Filtros</span>
              {(selectedCategory || selectedCity) && <span className="w-2 h-2 bg-[#a78bfa] rounded-full" aria-hidden="true" />}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div id="filters-panel" className="mt-3 p-4 bg-slate-900/80 border border-slate-700/60 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="sort-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Ordenar por</label>
                  <select
                    id="sort-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-[#a78bfa]/60 cursor-pointer"
                  >
                    {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
                      <option key={key} value={key}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="category-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Categoria</label>
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ProCategory | '')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-[#a78bfa]/60 cursor-pointer"
                  >
                    <option value="">Todas as categorias</option>
                    {PRO_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Cidade</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <input
                      id="city-input"
                      type="text"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      list="cities-list"
                      placeholder="Ex: São Paulo..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#a78bfa]/60"
                    />
                    <datalist id="cities-list">
                      {cityOptions.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer">
                  <X className="w-3 h-3" aria-hidden="true" /> Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Category pills (only when filters panel is closed) */}
          {!showFilters && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Filtrar por categoria">
              <button
                onClick={() => setSelectedCategory('')}
                aria-pressed={!selectedCategory}
                className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${!selectedCategory ? 'bg-[#a78bfa] text-white border-[#a78bfa]' : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'}`}
              >
                Todos
              </button>
              {PRO_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${selectedCategory === cat ? 'bg-[#a78bfa] text-white border-[#a78bfa]' : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'}`}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Offline banner */}
      {isOffline && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="flex items-start gap-2 bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 text-xs text-amber-300">
            <WifiOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Você está offline. Exibindo resultados salvos no seu dispositivo (se houver). Novos profissionais não aparecerão até você reconectar.
            </span>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && !isLoading && professionals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/30 border border-rose-900/40 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-rose-500" aria-hidden="true" />
            </div>
            <h3 className="text-slate-300 font-bold mb-2">Não foi possível carregar</h3>
            <p className="text-slate-500 text-sm max-w-sm">{error}</p>
          </div>
        ) : isLoading && professionals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3" role="status" aria-live="polite">
            <Loader2 className="w-8 h-8 text-[#a78bfa] animate-spin" aria-hidden="true" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Buscando profissionais...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-600" aria-hidden="true" />
            </div>
            <h3 className="text-slate-300 font-bold mb-2">Nenhum profissional encontrado</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              {hasFilters ? 'Tente ajustar os filtros.' : 'Ainda não há profissionais verificados nesta plataforma.'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 text-[#a78bfa] hover:text-[#c4b5fd] text-sm font-semibold transition-colors cursor-pointer">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500" aria-live="polite">
                <span className="font-bold text-slate-300">{filtered.length}</span> profissional{filtered.length !== 1 ? 'is' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                {professionals.length > filtered.length && (
                  <span className="text-slate-600"> · {professionals.length} carregado{professionals.length !== 1 ? 's' : ''} do servidor</span>
                )}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer">
                  <X className="w-3 h-3" aria-hidden="true" /> Limpar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((pro) => {
                const hasRating = (pro.ratingCount ?? 0) > 0 && typeof pro.rating === 'number';
                return (
                  <article
                    key={pro.uid}
                    className="group bg-[#0a1128] border border-slate-800/60 rounded-2xl overflow-hidden hover:border-[#a78bfa]/40 hover:shadow-[0_0_24px_rgba(167,139,250,0.12)] transition-all duration-300 flex flex-col cursor-pointer"
                    onClick={() => onViewProfile(pro.username)}
                  >
                    {/* Card Header */}
                    <div className="h-20 bg-gradient-to-br from-[#a78bfa]/20 via-indigo-900/30 to-[#050b18] relative" aria-hidden="true">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,0.15)_0%,transparent_60%)]" />
                    </div>

                    <div className="px-4 pb-4 flex-1 flex flex-col -mt-8 relative">
                      <div className="flex items-end justify-between mb-3">
                        {/* Avatar */}
                        <div className="p-0.5 bg-[#0a1128] rounded-full ring-2 ring-[#a78bfa]/30">
                          {pro.profilePicUrl ? (
                            <img src={pro.profilePicUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#a78bfa] to-indigo-600 flex items-center justify-center text-white font-bold text-xl" aria-hidden="true">
                              {pro.displayName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        {/* Trust badge: rating if available, otherwise verified-only */}
                        {hasRating ? (
                          <div
                            className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full"
                            aria-label={`Avaliação ${formatRating(pro.rating!)} de 5 com ${pro.ratingCount} avaliações`}
                          >
                            <Star className="w-2.5 h-2.5 fill-amber-400" aria-hidden="true" />
                            {formatRating(pro.rating!)} <span className="text-amber-400/70">({pro.ratingCount})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-amber-400" aria-hidden="true" /> Verificado
                          </div>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-100 text-sm truncate">{pro.displayName}</h3>
                      <p className="text-[#a78bfa] text-[11px] font-medium mb-1 truncate">{pro.profession}</p>

                      <div className="flex items-center gap-3 mb-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <span aria-hidden="true">{CATEGORY_ICONS[pro.category] || '⚡'}</span>
                          {pro.category}
                        </span>
                        {pro.city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" aria-hidden="true" /> {pro.city}
                          </span>
                        )}
                      </div>

                      {pro.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {pro.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="text-[9px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/60 px-2 py-0.5 rounded-full">
                              {skill}
                            </span>
                          ))}
                          {pro.skills.length > 3 && (
                            <span className="text-[9px] text-slate-500 px-1 self-center">+{pro.skills.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="mt-auto pt-3 border-t border-slate-800/60">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewProfile(pro.username); }}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#a78bfa] text-[11px] font-bold rounded-xl border border-[#a78bfa]/20 hover:border-[#a78bfa]/40 transition-all cursor-pointer group-hover:bg-[#a78bfa]/20"
                          aria-label={`Ver perfil de ${pro.displayName}`}
                        >
                          Ver Perfil <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Load more */}
            {hasMore && !hasFilters && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore || isOffline}
                  className="px-6 py-3 bg-slate-900/80 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700/60 hover:border-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Carregando...
                    </>
                  ) : (
                    <>Carregar mais profissionais</>
                  )}
                </button>
              </div>
            )}
            {!hasMore && professionals.length > 0 && !hasFilters && (
              <p className="text-center text-[10px] text-slate-600 mt-6 uppercase tracking-widest font-bold">
                Todos os profissionais foram carregados
              </p>
            )}
            {hasFilters && professionals.length >= PAGE_SIZE && !hasMore && (
              <p className="text-center text-[10px] text-slate-600 mt-6">
                Dica: limpe os filtros para carregar mais resultados.
              </p>
            )}
          </>
        )}

        {/* Promo Banner — Become a Pro */}
        <div className="mt-12">
          <ProPromoBanner source="services_discovery" />
        </div>

        {/* Legal Disclaimer */}
        <p className="text-center text-[10px] text-slate-600 mt-6 leading-relaxed max-w-lg mx-auto">
          O LinkFlow atua exclusivamente como plataforma de divulgação. Toda negociação, contratação e execução dos serviços é realizada diretamente entre contratante e contratado — o LinkFlow não intermedia nem se responsabiliza pelos serviços prestados.
        </p>
      </div>
    </div>
  );
}
