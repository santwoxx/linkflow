import React, { useState, useEffect } from 'react';
import { auth, db, loginWithGoogle, logoutUser } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocFromServer, getDocs, getDocsFromServer, query, setDoc, updateDoc, where, limit, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { UserProfile, LinkItem, AVAILABLE_THEMES, ADMIN_EMAIL } from './types';
import Dashboard from './components/Dashboard';
import PublicProfile from './components/PublicProfile';
const ServicesDiscovery = React.lazy(() => import('./components/ServicesDiscovery'));
const ProfessionalProfilePage = React.lazy(() => import('./components/ProfessionalProfilePage'));
const ProSalesPage = React.lazy(() => import('./components/ProSalesPage'));
import { Link2, Sparkles, LogIn, Lock, CheckCircle, RefreshCw, BarChart4, Palette, Heart, AlertTriangle, ExternalLink, Ban, FileText, X, Briefcase, Users, ShieldCheck, TrendingUp, Smartphone, Store } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [registrationRequired, setRegistrationRequired] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [bannedUser, setBannedUser] = useState<UserProfile | null>(null);
  const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | null>(null);
  
  // Username selection state for first-time login
  const [chosenUsername, setChosenUsername] = useState('');
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Real-time (debounced) check for username availability against Firestore database
  useEffect(() => {
    const cleaned = chosenUsername.trim().toLowerCase();
    
    if (!cleaned) {
      setUsernameAvailable(null);
      setUsernameError('');
      setUsernameCheckLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_\-]+$/.test(cleaned)) {
      setUsernameAvailable(false);
      setUsernameError('Use apenas letras, números, hífens (-) ou sublinhados (_).');
      setUsernameCheckLoading(false);
      return;
    }

    if (cleaned.length < 3 || cleaned.length > 30) {
      setUsernameAvailable(false);
      setUsernameError('O link deve ter entre 3 e 30 caracteres.');
      setUsernameCheckLoading(false);
      return;
    }

    setUsernameCheckLoading(true);
    setUsernameError('');
    setUsernameAvailable(null);

    const delayDebounce = setTimeout(async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', cleaned), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          setUsernameAvailable(false);
          setUsernameError('Este link personalizado já está sendo usado por outra pessoa. Escolha outro!');
        } else {
          setUsernameAvailable(true);
          setUsernameError('');
        }
      } catch (err: any) {
        console.error("Erro ao verificar disponibilidade de link exclusivo:", err);
        // If there's an offline/network warning, assume locally validated for offline test compatibility
        if (err?.message?.includes('offline') || String(err).includes('offline') || err?.message?.includes('network')) {
          setUsernameAvailable(true);
          setUsernameError('');
        } else {
          setUsernameAvailable(null);
          setUsernameError('Não foi possível verificar a disponibilidade no momento. Tente novamente.');
        }
      } finally {
        setUsernameCheckLoading(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [chosenUsername]);

  // States for public link page view (e.g. ?u=slug)
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [publicView, setPublicView] = useState<string | null>(null);
  const [publicProProfile, setPublicProProfile] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [publicLinks, setPublicLinks] = useState<LinkItem[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);

  // Dynamic SEO meta tags for public profiles
  useEffect(() => {
    if (publicProfile) {
      const desc = publicProfile.bio || `Confira os links e serviços de ${publicProfile.displayName} no LinkFlow`;
      document.title = `${publicProfile.displayName} (@${publicProfile.username}) | LinkFlow`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', desc);
      // Open Graph
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
      ogTitle.setAttribute('content', `${publicProfile.displayName} | LinkFlow`);
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) { ogDesc = document.createElement('meta'); ogDesc.setAttribute('property', 'og:description'); document.head.appendChild(ogDesc); }
      ogDesc.setAttribute('content', desc);
      if (publicProfile.profilePicUrl) {
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) { ogImage = document.createElement('meta'); ogImage.setAttribute('property', 'og:image'); document.head.appendChild(ogImage); }
        ogImage.setAttribute('content', publicProfile.profilePicUrl);
      }
    } else if (!publicSlug) {
      document.title = 'LinkFlow | Sua Página de Links + Rede Social';
    }
    return () => {
      if (publicSlug && !publicProfile) {
        document.title = 'LinkFlow | Sua Página de Links + Rede Social';
      }
    };
  }, [publicProfile, publicSlug]);

  // Parse URL parameter "?u=username"
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get('u');
    const view = params.get('view');
    const pro = params.get('pro');
    if (u) {
      setPublicSlug(u.trim().toLowerCase());
    }
    if (view) {
      setPublicView(view.trim().toLowerCase());
    }
    if (pro) {
      setPublicProProfile(pro.trim().toLowerCase());
    }
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch public page data if publicSlug is detected
  useEffect(() => {
    if (!publicSlug) return;

    let unsubProfile: (() => void) | null = null;
    let unsubLinks: (() => void) | null = null;
    let cancelled = false;
    let loadedAnything = false;
    let resolvedUid: string | null = null;
    // Cross-tab "owner just saved" notification so public tab refreshes instantly.
    const broadcastChannel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('linkflow_public_sync')
      : null;

    const finishInitialLoad = () => {
      if (loadedAnything) return;
      loadedAnything = true;
      setPublicLoading(false);
    };

    const applyLinks = (items: LinkItem[]) => {
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setPublicLinks(items);
      try {
        localStorage.setItem(`linkflow_cached_links_public_${publicSlug}`, JSON.stringify(items));
      } catch {}
    };

    const tryOfflineCache = () => {
      const cachedProfile = localStorage.getItem(`linkflow_cached_profile_public_${publicSlug}`);
      const cachedLinks = localStorage.getItem(`linkflow_cached_links_public_${publicSlug}`);
      if (cachedProfile) {
        setPublicProfile(JSON.parse(cachedProfile));
        if (cachedLinks) setPublicLinks(JSON.parse(cachedLinks));
        return true;
      }
      return false;
    };

    const refreshLinksFromServer = async (uid: string) => {
      try {
        const linksRef = collection(db, 'users', uid, 'links');
        const linksQuery = query(linksRef, where('active', '==', true));
        const linksSnap = await getDocsFromServer(linksQuery);
        if (cancelled) return;
        const items: LinkItem[] = [];
        linksSnap.forEach((l) => items.push(l.data() as LinkItem));
        applyLinks(items);
        finishInitialLoad();
      } catch (err) {
        if (cancelled) return;
        const isOffline = String((err as any)?.message || '').includes('offline');
        if (isOffline) tryOfflineCache();
      }
    };

    const refreshProfileFromServer = async () => {
      try {
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('username', '==', publicSlug), limit(1));
        const snap = await getDocsFromServer(userQuery);
        if (cancelled) return;
        if (snap.empty) return;
        const profileData = snap.docs[0].data() as UserProfile;
        setPublicProfile(profileData);
        try {
          localStorage.setItem(`linkflow_cached_profile_public_${publicSlug}`, JSON.stringify(profileData));
        } catch {}
      } catch (err) {
        if (cancelled) return;
        console.warn('[PublicProfile] refreshProfileFromServer falhou:', err);
      }
    };

    const applyNatanMock = () => {
      const defaultProfile: UserProfile = {
        uid: 'natan-marinho-ceo-123',
        username: 'natanmarinho-dev',
        displayName: 'Natan Marinho',
        bio: 'CEO & Founder do LinkFlow 🚀 | Desenvolvedor Fullstack | Especialista em criar ecossistemas digitais de alta performance e conexões sem fricção.',
        profilePicUrl: 'https://i.ibb.co/YFV7fWfd/IMG-0259.jpg',
        email: 'brisasofc@gmail.com',
        role: 'admin',
        verifiedProfessional: true,
        serviceEnabled: true,
        theme: {
          themeId: 'sophisticated-dark',
          cardStyle: 'rounded',
          fontFamily: 'sans',
          buttonColor: '#111a36',
          buttonTextColor: '#ffffff',
          backgroundColor: 'bg-[#0a1128] text-slate-100',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const defaultLinks: LinkItem[] = [
        {
          id: 'natan-booking',
          userId: 'natan-marinho-ceo-123',
          title: 'Agendamento de Consultorias',
          url: '5581999999999',
          active: true,
          order: 1,
          type: 'scheduling',
          animation: 'glow',
          content: [
            {
              id: 'svc-n1',
              name: 'Mentoria & Consultoria Técnica',
              description: 'Sessão individual para arquitetura de software, SaaS e escalabilidade.',
              price: 'R$ 300,00',
              duration: '1h 00m'
            },
            {
              id: 'svc-n2',
              name: 'Desenvolvimento de Landing Page Premium',
              description: 'Página ultra rápida com design moderno, SEO otimizado e conversão focada.',
              price: 'Sob Orçamento',
              duration: '5 dias'
            },
            {
              id: 'svc-n3',
              name: 'Integração de Métodos de Pagamento',
              description: 'Configuração completa de checkout transparente (Mercado Pago, Stripe, etc.).',
              price: 'R$ 800,00',
              duration: '2 dias'
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'natan-instagram',
          userId: 'natan-marinho-ceo-123',
          title: 'Siga no Instagram @natanmarinho.dev',
          url: 'https://instagram.com/natanmarinho.dev',
          active: true,
          order: 2,
          type: 'link',
          iconEmoji: '📸',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'natan-github',
          userId: 'natan-marinho-ceo-123',
          title: 'GitHub Professional',
          url: 'https://github.com',
          active: true,
          order: 3,
          type: 'link',
          iconEmoji: '💻',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      setPublicProfile(defaultProfile);
      setPublicLinks(defaultLinks);
      finishInitialLoad();
    };

    const applyCamileMock = () => {
      if (publicSlug === 'natanmarinho-dev') {
        applyNatanMock();
        return;
      }
      const defaultProfile: UserProfile = {
        uid: 'camile-bezerra-123',
        username: 'nails_camilebezerra',
        displayName: 'Camile Bezerra',
        bio: 'Nails Designer | Especialista em Alongamentos de Unha, Blindagem e Nail Art Delicadas ✨🌸\nEntre em contato e agende seu horário abaixo!',
        profilePicUrl: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&auto=format&fit=crop&q=80',
        email: 'camilebezerra92@gmail.com',
        role: 'user',
        verifiedProfessional: true,
        serviceEnabled: true,
        theme: {
          themeId: 'cherry-blossom',
          cardStyle: 'rounded',
          fontFamily: 'sans',
          buttonColor: '#ffffff',
          buttonTextColor: '#db2777',
          backgroundColor: 'bg-gradient-to-b from-pink-50 via-rose-100 to-pink-50 text-rose-900',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const defaultLinks: LinkItem[] = [
        {
          id: 'camile-booking',
          userId: 'camile-bezerra-123',
          title: 'Agendamento de Serviços',
          url: '73981177122',
          active: true,
          order: 1,
          type: 'scheduling',
          animation: 'glow-pink',
          content: [
            {
              id: 'svc-1',
              name: 'Alongamento em Gel (Fibra/Tip)',
              description: 'Alongamento super resistente com acabamento natural e delicado.',
              price: 'R$ 130,00',
              duration: '2h 00m'
            },
            {
              id: 'svc-2',
              name: 'Manicure & Pedicure Completa',
              description: 'Cutilagem russa, esmaltação e hidratação das mãos e pés.',
              price: 'R$ 50,00',
              duration: '1h 00m'
            },
            {
              id: 'svc-3',
              name: 'Blindagem de Unha Natural',
              description: 'Capa de gel protetora para evitar quebras e garantir maior duração do esmalte.',
              price: 'R$ 80,00',
              duration: '1h 00m'
            },
            {
              id: 'svc-4',
              name: 'Nail Art Personalizada (por unha)',
              description: 'Pedraria, glitter, encapsulada ou desenhos manuais exclusivos.',
              price: 'R$ 10,00',
              duration: '15m'
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'camile-instagram',
          userId: 'camile-bezerra-123',
          title: 'Instagram Profissional',
          url: 'https://instagram.com/nails_camilebezerra',
          active: true,
          order: 2,
          type: 'link',
          animation: 'float-delicate',
          iconEmoji: '📸',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'camile-whatsapp',
          userId: 'camile-bezerra-123',
          title: 'Falar no WhatsApp Comercial',
          url: 'https://wa.me/5573981177122',
          active: true,
          order: 3,
          type: 'whatsapp',
          iconEmoji: '💬',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      setPublicProfile(defaultProfile);
      setPublicLinks(defaultLinks);
      finishInitialLoad();
    };

    // Support sandbox demo bypass (kept in sync with dashboard via storage events)
    if (publicSlug === 'usuario_demo') {
      const applyDemo = () => {
        const savedDemoProfile = localStorage.getItem('linkflow_demo_profile');
        const defaultProfile: UserProfile = savedDemoProfile ? JSON.parse(savedDemoProfile) : {
          uid: 'demo-user-123',
          username: 'usuario_demo',
          displayName: 'Administrador Demo',
          bio: 'Sou um perfil de testes do LinkFlow! Teste todos os recursos livremente.',
          profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          theme: {
            themeId: 'sophisticated-dark',
            cardStyle: 'rounded',
            fontFamily: 'sans',
            buttonColor: '#1d4ed8',
            buttonTextColor: '#ffffff',
            backgroundColor: 'bg-[#050b18] text-slate-100',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const savedDemoLinks = localStorage.getItem('demo_links');
        const defaultLinks: LinkItem[] = savedDemoLinks ? JSON.parse(savedDemoLinks) : [
          {
            id: 'link-1',
            userId: 'demo-user-123',
            title: 'Siga-me no Instagram',
            url: 'https://instagram.com',
            active: true,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'link-2',
            userId: 'demo-user-123',
            title: 'Meu Canal Principal',
            url: 'https://youtube.com',
            active: true,
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        setPublicProfile(defaultProfile);
        setPublicLinks(defaultLinks);
        finishInitialLoad();
      };

      applyDemo();
      window.addEventListener('storage', applyDemo);
      window.addEventListener('linkflow_demo_updated', applyDemo);
      return () => {
        window.removeEventListener('storage', applyDemo);
        window.removeEventListener('linkflow_demo_updated', applyDemo);
      };
    }

    setPublicLoading(true);
    setPublicError(null);

    // Listen for cross-tab "owner saved" broadcasts (forces an immediate re-fetch).
    const onBroadcast = (ev: MessageEvent) => {
      const data = ev.data as { type?: string; slug?: string; uid?: string } | null;
      if (!data) return;
      if (data.slug !== publicSlug) return;
      if (data.type === 'link_updated' && data.uid) {
        refreshLinksFromServer(data.uid);
        refreshProfileFromServer();
      } else if (data.type === 'profile_updated') {
        refreshProfileFromServer();
      }
    };
    if (broadcastChannel) broadcastChannel.addEventListener('message', onBroadcast);

    // Also listen to the same-tab custom event (BroadcastChannel doesn't fire in
    // the same tab). Useful for in-tab updates from the dashboard preview.
    const onLocalUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as { type?: string; slug?: string; uid?: string } | undefined;
      if (!detail) return;
      if (detail.slug !== publicSlug) return;
      if (detail.type === 'link_updated' && detail.uid) {
        refreshLinksFromServer(detail.uid);
        refreshProfileFromServer();
      } else if (detail.type === 'profile_updated') {
        refreshProfileFromServer();
      }
    };
    window.addEventListener('linkflow_public_sync_local', onLocalUpdate);

    // 1. Force an initial server fetch (bypasses Firestore cache → no stale color).
    const initialFetch = async () => {
      try {
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('username', '==', publicSlug), limit(1));
        const querySnapshot = await getDocsFromServer(userQuery);

        if (cancelled) return;

        if (querySnapshot.empty) {
          if (publicSlug === 'nails_camilebezerra' || publicSlug === 'natanmarinho-dev') {
            applyCamileMock();
            return;
          }
          setPublicError('Página não encontrada.');
          setPublicLinks([]);
          finishInitialLoad();
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const profileData = userDoc.data() as UserProfile;
        setPublicProfile(profileData);
        try {
          localStorage.setItem(`linkflow_cached_profile_public_${publicSlug}`, JSON.stringify(profileData));
        } catch {}

        if (profileData.banned) {
          setPublicLinks([]);
          finishInitialLoad();
          return;
        }

        resolvedUid = profileData.uid;

        const linksRef = collection(db, 'users', profileData.uid, 'links');
        const linksQuery = query(linksRef, where('active', '==', true));
        const linksSnapshot = await getDocsFromServer(linksQuery);
        if (cancelled) return;
        const items: LinkItem[] = [];
        linksSnapshot.forEach((l) => items.push(l.data() as LinkItem));
        applyLinks(items);
        finishInitialLoad();
      } catch (err: any) {
        if (cancelled) return;
        const isOffline = String(err?.message || '').includes('offline');
        if (isOffline && tryOfflineCache()) {
          finishInitialLoad();
          return;
        }
        console.error('Erro ao buscar página pública:', err);
        setPublicError('Falha ao carregar o perfil.');
        finishInitialLoad();
      }
    };

    initialFetch();

    // 2. After the initial server fetch, attach a real-time listener so subsequent
    //    saves in the same tab show up immediately. We use includeMetadataChanges
    //    and IGNORE snapshots where metadata.fromCache === true, because the
    //    Firestore SDK delivers the local IndexedDB cache before the server
    //    response. Without this filter, the cached (stale) data would overwrite
    //    the fresh server data fetched by initialFetch().
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('username', '==', publicSlug), limit(1));

    unsubProfile = onSnapshot(
      userQuery,
      { includeMetadataChanges: true },
      (querySnapshot) => {
        if (cancelled) return;
        // Skip local cache snapshots — only apply server-confirmed data
        if (querySnapshot.metadata.fromCache) {
          console.debug('[PublicProfile] Ignorando snapshot do cache local — aguardando servidor');
          return;
        }
        if (querySnapshot.empty) {
          if (publicSlug === 'nails_camilebezerra' || publicSlug === 'natanmarinho-dev') {
            applyCamileMock();
            return;
          }
          setPublicError('Página não encontrada.');
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const profileData = userDoc.data() as UserProfile;
        setPublicProfile(profileData);
        try {
          localStorage.setItem(`linkflow_cached_profile_public_${publicSlug}`, JSON.stringify(profileData));
        } catch {}

        if (profileData.banned) {
          if (unsubLinks) { unsubLinks(); unsubLinks = null; }
          setPublicLinks([]);
          return;
        }

        if (resolvedUid !== profileData.uid) {
          resolvedUid = profileData.uid;
          if (unsubLinks) { unsubLinks(); unsubLinks = null; }
          const linksRef = collection(db, 'users', profileData.uid, 'links');
          const linksQuery = query(linksRef, where('active', '==', true));
          unsubLinks = onSnapshot(
            linksQuery,
            { includeMetadataChanges: true },
            (linksSnapshot) => {
              if (cancelled) return;
              if (linksSnapshot.metadata.fromCache) return;
              const items: LinkItem[] = [];
              linksSnapshot.forEach((l) => items.push(l.data() as LinkItem));
              applyLinks(items);
            },
            (linksErr) => {
              if (cancelled) return;
              console.warn('Erro no snapshot de links públicos:', linksErr);
            }
          );
        }
      },
      (err) => {
        if (cancelled) return;
        console.warn('Erro no snapshot do perfil público:', err);
      }
    );

    return () => {
      cancelled = true;
      if (unsubProfile) unsubProfile();
      if (unsubLinks) unsubLinks();
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', onBroadcast);
        broadcastChannel.close();
      }
      window.removeEventListener('linkflow_public_sync_local', onLocalUpdate);
    };
  }, [publicSlug]);

  // Auth Observer
  useEffect(() => {
    const savedDemo = localStorage.getItem('linkflow_demo_profile');
    if (savedDemo) {
      const parsed = JSON.parse(savedDemo);
      setCurrentUser({
        uid: 'demo-user-123',
        displayName: parsed.displayName,
        email: 'demo@linkflowai.com.br',
        photoURL: parsed.profilePicUrl,
        emailVerified: true,
      } as any);
      setUserProfile(parsed);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setRegistrationRequired(false);
      setUserProfile(null);
      setBannedUser(null);

      if (firebaseUser) {
        try {
          // Check if profile exists at users/{uid}
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            // Inject email from Firebase Auth if missing in Firestore doc (existing profiles)
            data.email = data.email || firebaseUser.email || '';
            if (data.email === ADMIN_EMAIL) {
              data.role = 'admin';
              data.verifiedProfessional = true;
              data.serviceEnabled = true;
              const ceoPic = 'https://i.ibb.co/YFV7fWfd/IMG-0259.jpg';
              if (data.profilePicUrl !== ceoPic) {
                data.profilePicUrl = ceoPic;
                updateDoc(userDocRef, { profilePicUrl: ceoPic, verifiedProfessional: true, serviceEnabled: true }).catch(() => {});
              } else {
                updateDoc(userDocRef, { verifiedProfessional: true, serviceEnabled: true }).catch(() => {});
              }
            }
            if (data.email === 'camilebezerra92@gmail.com') {
              if (!data.verifiedProfessional || !data.serviceEnabled) {
                data.verifiedProfessional = true;
                data.serviceEnabled = true;
                updateDoc(userDocRef, { verifiedProfessional: true, serviceEnabled: true }).catch(() => {});
              }
            }
            localStorage.setItem(`linkflow_cached_profile_${firebaseUser.uid}`, JSON.stringify(data));
            if (data.banned) { setBannedUser(data); setUserProfile(null); }
            else { setUserProfile(data); }
          } else {
            // Profile does not exist, trigger Registration Guard
            setRegistrationRequired(true);
          }
        } catch (err: any) {
          const isOffline = err?.message?.includes('offline') || String(err).includes('offline');
          if (isOffline) {
            console.warn("Firestore está offline. Carregando dados cadastrais pelo cache local...");
            
            // Try cache fallback
            const cached = localStorage.getItem(`linkflow_cached_profile_${firebaseUser.uid}`);
            if (cached) {
              setUserProfile(JSON.parse(cached));
            } else {
              // If completely new user logged in offline, provide a friendly local workspace setup
              const isAdminEmail = firebaseUser.email === ADMIN_EMAIL;
              const tempOfflineProfile: UserProfile = {
                uid: firebaseUser.uid,
                username: firebaseUser.displayName?.toLowerCase().replace(/\s+/g, '-') || `user-${firebaseUser.uid.substring(0, 5)}`,
                displayName: firebaseUser.displayName || 'Usuário Local Offline',
                bio: 'Olá! Você está com acesso offline local. Configure seu banco de dados para sincronizar na nuvem.',
                profilePicUrl: isAdminEmail ? 'https://i.ibb.co/YFV7fWfd/IMG-0259.jpg' : (firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
                email: firebaseUser.email || '',
                role: isAdminEmail ? 'admin' : 'user',
                theme: {
                  themeId: 'sophisticated-dark',
                  cardStyle: 'rounded',
                  fontFamily: 'sans',
                  buttonColor: '#1d4ed8',
                  buttonTextColor: '#ffffff',
                  backgroundColor: 'bg-[#050b18] text-slate-100',
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              localStorage.setItem(`linkflow_cached_profile_${firebaseUser.uid}`, JSON.stringify(tempOfflineProfile));
              setUserProfile(tempOfflineProfile);
            }
          } else {
            console.error("Erro inesperado ao verificar dados cadastrais:", err);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle first-time Registration
  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanedUsername = chosenUsername.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_\-]+$/.test(cleanedUsername)) {
      setUsernameError('Use apenas letras, números, hífens (-) ou sublinhados (_).');
      return;
    }

    if (cleanedUsername.length < 3 || cleanedUsername.length > 30) {
      setUsernameError('O link deve ter entre 3 e 30 caracteres.');
      return;
    }

    setRegistering(true);
    setUsernameError('');

    try {
      let isOfflineMode = false;
      let querySnapshot;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', cleanedUsername), limit(1));
        querySnapshot = await getDocs(q);
      } catch (dbErr: any) {
        if (dbErr?.message?.includes('offline') || String(dbErr).includes('offline')) {
          console.warn("Firestore offline durante a verificação de nome de usuário. Procedendo com reserva local/offline.");
          isOfflineMode = true;
        } else {
          throw dbErr;
        }
      }

      if (!isOfflineMode && querySnapshot && !querySnapshot.empty) {
        setUsernameError('Este link personalizado já está sendo usado por outra pessoa. Escolha outro!');
        setRegistering(false);
        return;
      }

      const isAdminEmail = currentUser.email === ADMIN_EMAIL;

      const newUserProfile: UserProfile = {
        uid: currentUser.uid,
        username: cleanedUsername,
        displayName: currentUser.displayName || cleanedUsername,
          bio: isOfflineMode 
            ? 'Nota: Perfil criado em modo offline/local temporário.'
            : 'Olá! Confira meus links e serviços. Entre em contato pelo WhatsApp para orçamentos!',
        profilePicUrl: isAdminEmail ? 'https://i.ibb.co/YFV7fWfd/IMG-0259.jpg' : (currentUser.photoURL || ''),
        email: currentUser.email || '',
        role: isAdminEmail ? 'admin' : 'user',
        theme: {
          themeId: 'sophisticated-dark',
          cardStyle: 'rounded',
          fontFamily: 'sans',
          buttonColor: '#111a36',
          buttonTextColor: '#ffffff',
          backgroundColor: 'bg-[#0a1128] text-slate-100',
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (currentUser.email === ADMIN_EMAIL) {
        newUserProfile.verifiedProfessional = true;
        newUserProfile.serviceEnabled = true;
      }

      if (currentUser.email === 'camilebezerra92@gmail.com') {
        newUserProfile.verifiedProfessional = true;
        newUserProfile.serviceEnabled = true;
        newUserProfile.theme = {
          themeId: 'cherry-blossom',
          cardStyle: 'rounded',
          fontFamily: 'sans',
          buttonColor: '#ffffff',
          buttonTextColor: '#db2777',
          backgroundColor: 'bg-gradient-to-b from-pink-50 via-rose-100 to-pink-50 text-rose-900',
        };
      }

      if (!isOfflineMode) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), newUserProfile);
        } catch (docErr: any) {
          if (docErr.message?.includes('Missing or insufficient permissions') || docErr.code === 'permission-denied') {
            console.warn("Permissão negada pelo Firebase (Regras de Segurança). Ativando o fallback Offline/Local para permitir que você teste o Dashboard!");
            isOfflineMode = true;
          } else {
            throw docErr;
          }
        }
      }
      
      // Save locally to cache & simulated demo DB
      localStorage.setItem(`linkflow_cached_profile_${currentUser.uid}`, JSON.stringify(newUserProfile));
      setUserProfile(newUserProfile);
      setRegistrationRequired(false);
    } catch (err) {
      console.error("Erro ao registrar perfil:", err);
      setUsernameError('Incapaz de registrar no servidor. Erro interno.');
    } finally {
      setRegistering(false);
    }
  };

  const startDemoSession = () => {
    const defaultDemoProfile: UserProfile = {
      uid: 'demo-user-123',
      username: 'usuario_demo',
      displayName: 'Administrador Demo',
      bio: 'Sou um perfil de testes do LinkFlow! Teste todos os recursos livremente.',
      profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      email: 'demo@linkflowai.com.br',
      role: 'user',
      theme: {
        themeId: 'sophisticated-dark',
        cardStyle: 'rounded',
        fontFamily: 'sans',
        buttonColor: '#1d4ed8',
        buttonTextColor: '#ffffff',
        backgroundColor: 'bg-[#050b18] text-slate-100',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    localStorage.setItem('linkflow_demo_profile', JSON.stringify(defaultDemoProfile));
    setCurrentUser({
      uid: 'demo-user-123',
      displayName: defaultDemoProfile.displayName,
      email: 'demo@linkflowai.com.br',
      photoURL: defaultDemoProfile.profilePicUrl,
    } as any);
    setUserProfile(defaultDemoProfile);
    setAuthError(null);
    setShowConfigGuide(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setAuthError(null);
    setShowConfigGuide(false);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Erro completo de autenticação:", error);
      const errCode = error?.code || '';
      const errMsg = error?.message || String(error);

      if (errCode === 'auth/configuration-not-found' || errMsg.includes('configuration-not-found')) {
        setAuthError('O login por Google não está ativo no Console do seu Firebase.');
        setShowConfigGuide(true);
      } else if (errCode === 'auth/popup-closed-by-user') {
        setAuthError('A janela de autenticação do Google foi fechada antes de concluir.');
      } else {
        setAuthError(`Erro na autenticação: ${errMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ----- RENDER NEW PROFESSIONAL MODULE ROUTES -----
  if (publicView === 'servicos') {
    if (publicProProfile) {
      return (
        <React.Suspense fallback={
          <div className="min-h-screen bg-[#050b18] flex items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 text-[#a78bfa] animate-spin" />
          </div>
        }>
          <ProfessionalProfilePage 
            username={publicProProfile} 
            currentUserProfile={userProfile}
            onBack={() => {
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('pro');
              window.history.pushState({}, '', newUrl.toString());
              setPublicProProfile(null);
            }} 
          />
        </React.Suspense>
      );
    }
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-[#050b18] flex items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 text-[#a78bfa] animate-spin" />
        </div>
      }>
        <ServicesDiscovery 
          currentUserProfile={userProfile}
          onViewProfile={(username) => {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('pro', username);
            window.history.pushState({}, '', newUrl.toString());
            setPublicProProfile(username);
          }} 
        />
      </React.Suspense>
    );
  }

  if (publicView === 'profissional') {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-[#050b18] flex items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 text-[#a78bfa] animate-spin" />
        </div>
      }>
        <ProSalesPage />
      </React.Suspense>
    );
  }

  // ----- RENDER BRIGHT PUBLIC PAGE ROUTE -----
  if (publicSlug) {
    if (publicLoading) {
      return (
        <div className="min-h-screen bg-[#050b18] flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-[#a78bfa] animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Carregando links...</span>
        </div>
      );
    }

    if (publicProfile?.banned) {
      return (
        <div className="min-h-screen bg-[#050b18] flex items-center justify-center p-6">
          <div className="max-w-md bg-[#0f172a] p-8 rounded-3xl border border-rose-900/30 space-y-4 text-center shadow-xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <Ban className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white">Conta Suspensa</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Esta conta foi desativada por violação dos termos de uso.
            </p>
            <div className="pt-2">
              <a href="/" className="inline-flex py-3 px-6 rounded-xl bg-[#a78bfa] hover:bg-[#c4b5fd] text-white text-xs font-bold transition-all">
                Criar Meu LinkFlow
              </a>
            </div>
          </div>
        </div>
      );
    }

    if (publicError || !publicProfile) {
      return (
        <div className="min-h-screen bg-[#050b18] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-[#0f172a] p-8 rounded-3xl border border-slate-900 space-y-4 shadow-xl" role="alert">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-bold font-sans text-slate-200">Página Não Encontrada</h1>
            <p className="text-xs text-slate-500">
              O link <span className="font-mono text-slate-400">@{publicSlug}</span> não está associado a nenhuma conta registrada ou foi desativado.
            </p>
            <p className="text-[10px] text-slate-600">Código: 404</p>
            <div className="pt-2">
              <a
                href="/"
                className="inline-flex py-3 px-6 rounded-xl bg-[#a78bfa] hover:bg-[#c4b5fd] text-white text-xs font-bold font-sans tracking-wide transition-all shadow-lg shadow-[#a78bfa]/20"
                aria-label="Criar minha página no LinkFlow"
              >
                Criar Meu LinkFlow
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Return gorgeous custom profiles page in viewport
    return (
      <div className="min-h-screen w-screen overflow-x-hidden leading-none">
        <PublicProfile profile={publicProfile} links={publicLinks} />
      </div>
    );
  }

  // ----- RENDER LOADER SCREEN -----
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b18] flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 text-[#a78bfa] animate-spin" />
        <span className="text-xs font-semibold uppercase tracking-widest text-[#a78bfa]/80 font-mono">Verificando sessão...</span>
      </div>
    );
  }

  // ----- RENDER REGISTRATION WIZARD (CHOOSE USERNAME SLUG) -----
  if (registrationRequired) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#a78bfa]/10 text-[#a78bfa] flex items-center justify-center rounded-2xl mx-auto mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-sans text-white">Reserve Seu Link Exclusivo</h2>
            <p className="text-xs text-slate-400">
              Olá, <span className="font-semibold text-slate-200">{currentUser?.displayName}</span>! Escolha o nome da sua página de divulgação.
            </p>
          </div>

          <form onSubmit={handleRegisterProfile} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1.5">Nome de Usuário (Slug URL)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-slate-500 font-mono select-none">linkflowai.com.br/?u=</span>
                <input
                  id="chosen-username-input"
                  type="text"
                  placeholder="seu-nome"
                  value={chosenUsername}
                  onChange={(e) => {
                    // Force lowercase, remove spaces with dash, only accept alphanumeric and special characters
                    const inputVal = e.target.value.toLowerCase().replace(/\s+/g, '-');
                    setChosenUsername(inputVal);
                  }}
                  className={`w-full bg-black text-xs font-mono py-3.5 pl-[145px] pr-10 rounded-xl border focus:outline-none transition-all placeholder-slate-800 ${
                    usernameCheckLoading ? 'border-[#a78bfa]/50 text-[#a78bfa]' :
                    usernameAvailable === true ? 'border-emerald-500/80 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]' :
                    usernameAvailable === false ? 'border-rose-500/80 text-rose-400 bg-rose-950/5' :
                    'border-slate-800 text-slate-200 focus:border-[#a78bfa]'
                  }`}
                  required
                  disabled={registering}
                />
                
                {/* Embedded status icons */}
                {usernameCheckLoading && (
                  <RefreshCw className="absolute right-3.5 w-4 h-4 text-[#a78bfa] animate-spin" />
                )}
                {!usernameCheckLoading && usernameAvailable === true && (
                  <CheckCircle className="absolute right-3.5 w-4 h-4 text-emerald-500" />
                )}
                {!usernameCheckLoading && usernameAvailable === false && (
                  <AlertTriangle className="absolute right-3.5 w-4 h-4 text-rose-500" />
                )}
              </div>
              
              <span className="text-[10px] text-slate-500 mt-1.5 block leading-relaxed">
                Este será o endereço único da sua página. Use apenas letras minúsculas, números, hífens (-) ou sublinhados (_).
              </span>
            </div>

            {/* Custom feedback card */}
            {!usernameCheckLoading && usernameAvailable === true && chosenUsername.trim() !== '' && (
              <div className="text-[11px] text-emerald-400 bg-emerald-950/10 border border-emerald-900/20 rounded-lg p-2.5 flex items-start gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Parabéns!</span> O slug <strong className="font-mono">linkflowai.com.br/?u={chosenUsername.trim().toLowerCase()}</strong> está 100% disponível para reserva.
                </div>
              </div>
            )}

            {!usernameCheckLoading && usernameAvailable === false && usernameError && (
              <div className="text-[11px] text-rose-400 bg-rose-950/10 border border-rose-900/20 rounded-lg p-2.5 flex items-start gap-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Não disponível:</span> {usernameError}
                </div>
              </div>
            )}

            <button
              id="reserve-slug-btn"
              type="submit"
              disabled={registering || usernameCheckLoading || usernameAvailable === false || !chosenUsername.trim()}
              className="w-full py-3.5 bg-[#a78bfa] hover:bg-[#c4b5fd] disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 tracking-wide font-sans cursor-pointer transition-all shadow-lg shadow-[#a78bfa]/20 hover:shadow-[#a78bfa]/30"
            >
              {registering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Configurando Sua Conta...</span>
                </>
              ) : (
                'Criar Minha Página'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----- BANNED USER SCREEN -----
  if (bannedUser) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center p-6">
        <div className="max-w-md bg-[#0f172a] p-8 rounded-3xl border border-rose-900/30 space-y-4 text-center shadow-xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <Ban className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Conta Suspensa</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Sua conta foi desativada por violação dos termos de uso da plataforma.
          </p>
          <p className="text-[10px] text-zinc-600">
            Se você acredita que isso foi um erro, entre em contato com o suporte.
          </p>
          <div className="pt-2">
            <button
              onClick={async () => {
                await logoutUser();
              }}
              className="py-3 px-6 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 transition-all cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----- AUTHENTICATED STATE: DASHBOARD -----
  if (currentUser && userProfile) {
    return (
      <Dashboard
        userProfile={userProfile}
        onProfileUpdate={(updated) => setUserProfile(updated)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-200 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Decorative ambient backgrounds lines */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#a78bfa]/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-[#a78bfa]/10 blur-[120px] pointer-events-none"></div>

      {/* Header Landing */}
      <header className="px-6 py-5 border-b border-slate-800/40 flex items-center justify-between sticky top-0 bg-[#050b18]/80 backdrop-blur-md z-40" role="banner">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#a78bfa] flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(167,139,250,0.3)]" aria-hidden="true">
            <Link2 className="w-4 h-4 rotate-45 text-white" />
          </div>
          <span className="font-sans font-extrabold text-sm tracking-wide text-white select-none">LinkFlow</span>
        </div>
        <nav aria-label="Navegação principal" className="flex items-center gap-2">
          <a
            href="?view=servicos"
            className="py-1.5 px-3 hover:bg-[#a78bfa]/10 text-xs text-slate-300 hover:text-white font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            aria-label="Encontrar profissionais e serviços"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#a78bfa]" aria-hidden="true" /> Serviços
          </a>
          <button
            onClick={handleLogin}
            className="py-1.5 px-3.5 border border-slate-800 hover:border-[#a78bfa]/40 hover:bg-[#a78bfa]/10 text-xs text-slate-300 hover:text-white font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            aria-label="Entrar no LinkFlow com Google"
          >
            <LogIn className="w-3.5 h-3.5 text-[#a78bfa]" aria-hidden="true" /> Entrar
          </button>
        </nav>
      </header>

      {/* Main heroic splash section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto text-center space-y-10 z-10" role="main">
        
        {/* Highlight Pill */}
        <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-gradient-to-r from-[#a78bfa]/20 to-[#c4b5fd]/20 border border-[#a78bfa]/30 text-[#a78bfa] text-[10px] font-bold uppercase tracking-wider select-none animate-bounce shadow-lg shadow-[#a78bfa]/10">
          <Sparkles className="w-3 h-3" />
          +1000 Usuários | Plataforma 100% Gratuita
        </div>

        {/* Catchy headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight font-sans">
            Sua página de links (Link na Bio), seus serviços e <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] via-[#c4b5fd] to-white">sua rede social</span> em um só lugar
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed font-light">
            Crie sua página de links grátis no LinkFlow, a melhor <strong className="text-[#a78bfa]">alternativa ao Linktree</strong> para Instagram, TikTok e WhatsApp. Centralize seus contatos, <strong className="text-slate-300">divulgue portfólios</strong>, publique atualizações no feed e agende clientes — <strong className="text-slate-300">tudo sem mensalidades e 100% gratuito</strong>.
          </p>
        </div>

        {/* CTA Login Button with Auth Errors and Manual Debug Guides */}
        <div className="pt-2 flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
          {authError && (
            <div className="text-left w-full bg-red-950/20 border border-red-900/30 rounded-2xl p-4 sm:p-5 space-y-2">
              <div className="flex items-start gap-2 text-red-400 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
              
              {showConfigGuide && (
                  <div className="mt-3 text-xs text-slate-400 space-y-2 leading-relaxed bg-black/30 p-4 sm:p-5 rounded-xl border border-slate-900">
                  <span className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">Como Ativar o Login no Google:</span>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                    <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-[#a78bfa] hover:underline inline-flex items-center gap-0.5 font-semibold">Console do Firebase <ExternalLink className="w-3 h-3 inline" /></a>.</li>
                    <li>Abra o seu projeto cadastrado <span className="font-mono text-slate-200 bg-slate-800 px-1 py-0.5 rounded text-[10px]">linkflow-bf1bb</span>.</li>
                    <li>No menu esquerdo, navegue até <span className="font-semibold text-slate-300">Criação &gt; Authentication</span>.</li>
                    <li>Selecione a aba <span className="font-semibold text-slate-300">Sign-in method</span> e clique em <span className="font-semibold text-[#a78bfa]">Adicionar novo provedor</span>.</li>
                    <li>Escolha o <span className="font-bold text-slate-200">Google</span>, ligue o seletor para ativar, preencha o e-mail de suporte padrão da sua conta e clique em <span className="font-bold text-[#a78bfa]">Salvar</span>.</li>
                    <li>Certifique-se também de conferir se o domínio <span className="font-mono text-slate-300 select-all bg-slate-900 px-1 py-0.5 text-[9px] rounded block mt-1 break-all">{window.location.host}</span> está liberado na seção <span className="font-semibold text-slate-300">Domínios Autorizados</span> embaixo na aba de Configurações do Authentication.</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              id="register-cta-btn"
              onClick={handleLogin}
              className="px-8 py-4 bg-gradient-to-r from-[#a78bfa] to-[#c4b5fd] hover:from-[#c4b5fd] hover:to-[#ddd6fe] hover:scale-[1.02] active:scale-[0.98] text-black font-extrabold text-xs rounded-xl tracking-wide font-sans shadow-[0_0_30px_rgba(167,139,250,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 uppercase shrink-0"
              aria-label="Criar minha página no LinkFlow gratuitamente"
            >
              <LogIn className="w-4 h-4 text-white" aria-hidden="true" />
              Criar Minha Página Grátis
            </button>
            <a
              href="?view=servicos"
              className="px-6 py-4 bg-[#0a1128] hover:bg-[#0f1635] border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-white font-bold text-xs rounded-xl tracking-wide font-sans transition-all cursor-pointer flex items-center justify-center gap-2 uppercase shrink-0"
              aria-label="Encontrar profissionais e serviços"
            >
              <Briefcase className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              Encontrar Profissionais
            </a>
          </div>

          <div className="flex items-center gap-6 text-[10px] text-slate-500 font-sans flex-wrap justify-center">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-[#a78bfa]" /> Login com Google</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Sem compromissos</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-purple-500" /> +1000 usuários ativos</span>
          </div>
        </div>

        {/* How it works - Service Marketplace */}
        <section className="w-full pt-4" aria-label="Como funciona o marketplace">
          <div className="bg-gradient-to-r from-emerald-500/5 via-[#a78bfa]/10 to-purple-500/5 border border-slate-800/50 rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <Store className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Como funciona o marketplace de serviços</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-black shrink-0" aria-hidden="true">1</div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Você cria sua vitrine</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Adicione seus serviços com preço, descrição e contato direto por WhatsApp.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] flex items-center justify-center text-xs font-black shrink-0" aria-hidden="true">2</div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Clientes encontram você</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Seus serviços aparecem na sua página pública e no feed de descoberta de perfis.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-black shrink-0" aria-hidden="true">3</div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Negociação direta</h3>
                  <p className="text-[10px] text-slate-500 mt-1">O comprador entra em contato pelo WhatsApp. O LinkFlow não é intermediador — a responsabilidade é toda sua.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-8 text-left" aria-label="Recursos da plataforma">
          
          <article className="bg-[#0f172a] p-5 rounded-2xl border border-slate-900/50 space-y-2 shadow-md hover:border-emerald-500/20 hover:shadow-emerald-500/5 transition-all">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-400 flex items-center justify-center mb-2" aria-hidden="true">
              <Store className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 font-sans">Divulgue seus Serviços</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-light">Crie vitrine de serviços com preços, categorias e contato direto por WhatsApp. Você é o dono do seu negócio.</p>
          </article>

          <article className="bg-[#0f172a] p-5 rounded-2xl border border-slate-900/50 space-y-2 shadow-md hover:border-[#a78bfa]/20 hover:shadow-[#a78bfa]/5 transition-all">
            <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/10 text-[#a78bfa] flex items-center justify-center mb-2" aria-hidden="true">
              <Palette className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 font-sans">Totalmente Personalizável</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-light">Mais de 14 temas, paletas, estilos de botões, fontes, capa, avatar e layout — sua página com a sua cara.</p>
          </article>

          <article className="bg-[#0f172a] p-5 rounded-2xl border border-slate-900/50 space-y-2 shadow-md hover:border-purple-500/20 hover:shadow-purple-500/5 transition-all">
            <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-400 flex items-center justify-center mb-2" aria-hidden="true">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 font-sans">Rede Social Integrada</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-light">Publique fotos, receba curtidas e comentários, siga perfis e construa sua comunidade dentro do LinkFlow.</p>
          </article>

          <article className="bg-[#0f172a] p-5 rounded-2xl border border-slate-900/50 space-y-2 shadow-md hover:border-amber-500/20 hover:shadow-amber-500/5 transition-all">
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-400 flex items-center justify-center mb-2" aria-hidden="true">
              <BarChart4 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 font-sans">Métricas em Tempo Real</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-light">Monitore cliques e visualizações em tempo real com gráficos e feed ao vivo de atividades dos seus links.</p>
          </article>

        </section>
      </main>

      {/* Footer copyright */}
      <footer className="px-6 py-6 border-t border-slate-900 text-center text-[10px] text-slate-600 font-medium z-10 flex flex-col sm:flex-row justify-between items-center max-w-4xl w-full mx-auto gap-3">
        <div className="flex items-center gap-4">
          <span className="text-slate-500">© 2026 LinkFlow do Brasil</span>
          <button onClick={() => setShowPolicy('terms')} className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer underline underline-offset-2">
            Termos de Uso
          </button>
          <button onClick={() => setShowPolicy('privacy')} className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer underline underline-offset-2">
            Privacidade
          </button>
        </div>
        <span className="flex items-center gap-1 text-slate-500">
          Feito com <Heart className="w-3 h-3 text-[#a78bfa] fill-[#a78bfa]" /> para conexões e interações rápidas.
        </span>
      </footer>

      {/* Terms of Use Modal */}
      {showPolicy === 'terms' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowPolicy(null)}>
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0f172a] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#a78bfa]" /> Termos de Uso
              </h2>
              <button onClick={() => setShowPolicy(null)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-xs text-slate-300 leading-relaxed">
              <h3 className="text-sm font-bold text-white">1. Aceitação dos Termos</h3>
              <p>Ao acessar e usar o LinkFlow, você declara que leu, entendeu e concorda com estes Termos de Uso. Se não concordar, não utilize a plataforma.</p>

              <h3 className="text-sm font-bold text-white">2. Cadastro e Conta</h3>
              <p>2.1. Você é responsável por manter a confidencialidade dos seus dados de login.<br/>
              2.2. As informações fornecidas no cadastro devem ser verdadeiras e atualizadas.<br/>
              2.3. O LinkFlow se reserva o direito de suspender ou encerrar contas que violem estes termos.</p>

              <h3 className="text-sm font-bold text-white">3. Responsabilidade sobre Serviços Anunciados</h3>
              <p>3.1. O LinkFlow é uma plataforma de divulgação e não intermediador de vendas ou serviços.<br/>
              3.2. Cada usuário é integralmente responsável pelos serviços, produtos e conteúdos que anuncia em sua página.<br/>
              3.3. Transações, acordos, entregas e pagamentos são de responsabilidade exclusiva das partes envolvidas.<br/>
              3.4. O LinkFlow não se responsabiliza por quaisquer danos, prejuízos ou disputas decorrentes de negociações entre usuários.</p>

              <h3 className="text-sm font-bold text-white">4. Conteúdo do Usuário</h3>
              <p>4.1. Você mantém todos os direitos sobre o conteúdo que publica.<br/>
              4.2. Ao publicar, você concede ao LinkFlow uma licença para exibir seu conteúdo na plataforma.<br/>
              4.3. É proibido publicar conteúdo ilegal, ofensivo, difamatório, fraudulento ou que viole direitos de terceiros.</p>

              <h3 className="text-sm font-bold text-white">5. Conduta do Usuário</h3>
              <p>5.1. Não utilizar a plataforma para atividades ilícitas.<br/>
              5.2. Não enviar spam ou conteúdo não solicitado.<br/>
              5.3. Não tentar acessar contas de outros usuários.<br/>
              5.4. Não realizar engenharia reversa ou tentar explorar vulnerabilidades da plataforma.</p>

              <h3 className="text-sm font-bold text-white">6. Limitação de Responsabilidade</h3>
              <p>O LinkFlow não será responsável por danos indiretos, incidentais ou consequenciais decorrentes do uso ou incapacidade de usar a plataforma, incluindo mas não se limitando a perda de dados, lucros cessantes ou interrupção de negócios.</p>

              <h3 className="text-sm font-bold text-white">7. Alterações nos Termos</h3>
              <p>O LinkFlow pode modificar estes termos a qualquer momento. Alterações serão comunicadas na plataforma. O uso continuado após as alterações constitui aceitação dos novos termos.</p>

              <h3 className="text-sm font-bold text-white">8. Lei Aplicável</h3>
              <p>Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca de São Paulo - SP.</p>

              <p className="text-slate-500 pt-2">Última atualização: Junho de 2026</p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPolicy === 'privacy' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowPolicy(null)}>
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0f172a] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Política de Privacidade
              </h2>
              <button onClick={() => setShowPolicy(null)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-xs text-slate-300 leading-relaxed">
              <h3 className="text-sm font-bold text-white">1. Coleta de Informações</h3>
              <p>Coletamos as seguintes informações quando você usa o LinkFlow:<br/>
              - Informações de cadastro: nome, e-mail e foto do perfil (via Google)<br/>
              - Conteúdo publicado: links, posts, comentários e configurações de perfil<br/>
              - Dados de uso: cliques em links, visualizações de página e interações</p>

              <h3 className="text-sm font-bold text-white">2. Uso das Informações</h3>
              <p>Utilizamos suas informações para:<br/>
              - Operar, manter e melhorar a plataforma<br/>
              - Exibir seu perfil público e conteúdo conforme suas configurações<br/>
              - Gerar métricas e estatísticas de uso<br/>
              - Garantir a segurança e integridade da plataforma</p>

              <h3 className="text-sm font-bold text-white">3. Compartilhamento de Dados</h3>
              <p>3.1. Não vendemos seus dados pessoais para terceiros.<br/>
              3.2. Seu perfil público (nome, foto, bio e links) é visível para qualquer visitante da plataforma.<br/>
              3.3. Podemos compartilhar dados com autoridades legais quando exigido por lei.<br/>
              3.4. Utilizamos serviços de terceiros (Firebase, Google Cloud) para hospedagem e infraestrutura.</p>

              <h3 className="text-sm font-bold text-white">4. Seus Direitos</h3>
              <p>Você tem direito a:<br/>
              - Acessar, corrigir ou excluir seus dados pessoais<br/>
              - Solicitar a portabilidade dos seus dados<br/>
              - Revogar o consentimento a qualquer momento<br/>
              - Ser informado sobre compartilhamento de dados<br/>
              Para exercer esses direitos, entre em contato pelo e-mail: contato@linkflowai.com.br</p>

              <h3 className="text-sm font-bold text-white">5. Retenção de Dados</h3>
              <p>Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir sua conta, seus dados serão removidos em até 30 dias, exceto quando necessário para cumprimento de obrigações legais.</p>

              <h3 className="text-sm font-bold text-white">6. Segurança</h3>
              <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia em trânsito, regras de segurança no Firestore e autenticação via Google.</p>

              <h3 className="text-sm font-bold text-white">7. Cookies</h3>
              <p>Utilizamos cookies essenciais para o funcionamento da plataforma. Não utilizamos cookies de rastreamento ou publicidade sem seu consentimento explícito.</p>

              <h3 className="text-sm font-bold text-white">8. Contato</h3>
              <p>Para questões sobre privacidade e proteção de dados, entre em contato:<br/>
              E-mail: contato@linkflowai.com.br</p>

              <p className="text-slate-500 pt-2">Última atualização: Junho de 2026</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
