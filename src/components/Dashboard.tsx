import React, { useState, useEffect } from 'react';
import { UserProfile, LinkItem, ClickLog } from '../types';
import { db, OperationType, handleFirestoreError, logoutUser } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, addDoc, onSnapshot, query, orderBy, getDocs, where, limit } from 'firebase/firestore';
import LinkEditor from './LinkEditor';
import ThemeSelector from './ThemeSelector';
import StatsView from './StatsView';
import PublicProfile from './PublicProfile';
import CommunityFeed from './CommunityFeed';
import DiscoverProfiles from './DiscoverProfiles';
import AdminPanel from './AdminPanel';
import { Link2, Sparkles, User, LogOut, Check, Copy, ExternalLink, RefreshCw, MessageSquare, Compass, ImageIcon, Crown, Layout, Smartphone, BarChart4 } from 'lucide-react';
import { ADMIN_EMAIL } from '../types';

interface DashboardProps {
  userProfile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
}

export default function Dashboard({ userProfile, onProfileUpdate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'links' | 'design' | 'stats' | 'feed' | 'discover' | 'preview' | 'admin'>('feed');
  const isAdmin = userProfile.email === ADMIN_EMAIL || userProfile.role === 'admin';
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [clicks, setClicks] = useState<ClickLog[]>([]);
  // Per-link in-progress edit overrides from LinkEditor; merged into links
  // only for the live preview, never persisted until "Aplicar" is clicked.
  const [linkPreviewOverrides, setLinkPreviewOverrides] = useState<Record<string, Partial<LinkItem>>>({});
  
  // Compress image to data URI without external storage
  const compressImage = (file: File, maxW: number, maxH: number, quality: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxW) { height *= maxW / width; width = maxW; }
        } else {
          if (height > maxH) { width *= maxH / height; height = maxH; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('ctx')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('img'));
      img.src = URL.createObjectURL(file);
    });

  // Profile settings state indicators
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [profilePicUrl, setProfilePicUrl] = useState(userProfile.profilePicUrl || '');
  const [coverUrl, setCoverUrl] = useState(userProfile.coverUrl || '');
  const [coverColor, setCoverColor] = useState(userProfile.coverColor || '');
  const [coverGradient, setCoverGradient] = useState(userProfile.coverGradient || '');
  const [coverPosition, setCoverPosition] = useState<'top' | 'center' | 'bottom'>(userProfile.coverPosition || 'center');
  const [coverOverlay, setCoverOverlay] = useState<number>(typeof userProfile.coverOverlay === 'number' ? userProfile.coverOverlay : 0);
  const [username, setUsername] = useState(userProfile.username || '');
  const [theme, setTheme] = useState(userProfile.theme);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Sync state with parent userProfile changes
  useEffect(() => {
    setDisplayName(userProfile.displayName || '');
    setBio(userProfile.bio || '');
    setProfilePicUrl(userProfile.profilePicUrl || '');
    setCoverUrl(userProfile.coverUrl || '');
    setCoverColor(userProfile.coverColor || '');
    setCoverGradient(userProfile.coverGradient || '');
    setCoverPosition(userProfile.coverPosition || 'center');
    setCoverOverlay(typeof userProfile.coverOverlay === 'number' ? userProfile.coverOverlay : 0);
    setUsername(userProfile.username || '');
    setTheme(userProfile.theme);
  }, [userProfile]);

  // Create real-time dynamic avatar and cover preview for interactive smartphone
  const livePreviewProfile: UserProfile = {
    ...userProfile,
    displayName: displayName,
    bio: bio,
    profilePicUrl: profilePicUrl,
    coverUrl: coverUrl,
    coverColor: coverColor,
    coverGradient: coverGradient,
    coverPosition: coverPosition,
    coverOverlay: coverOverlay,
    username: username,
    theme: theme,
  };

  // Reusable live phone preview (sticky) used by Construtor and Aparência tabs
  const previewLinks: LinkItem[] = links.map(l =>
    linkPreviewOverrides[l.id] ? { ...l, ...linkPreviewOverrides[l.id] } : l
  );

  const renderPhonePreview = () => (
    <div className="hidden lg:flex shrink-0 w-[380px] self-stretch border-l border-slate-800/40 bg-[#050b18]/60">
      <div className="sticky top-0 w-full max-h-screen overflow-y-auto flex flex-col items-center gap-3 p-6">
        <div className="flex items-center gap-1.5 text-[10px] text-[#a78bfa] font-semibold tracking-wider uppercase select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse"></span>
          Pré-visualização ao Vivo
        </div>
        <div className="w-[300px] rounded-[44px] overflow-hidden border-[8px] border-zinc-700/90 bg-zinc-950 shadow-2xl shadow-black/60 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-b-2xl z-10 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <span className="w-10 h-1 rounded-full bg-zinc-700" />
          </div>
          <div className="w-full overflow-y-auto" style={{ height: '620px' }}>
            <PublicProfile profile={livePreviewProfile} links={previewLinks} previewMode={true} />
          </div>
        </div>
        <p className="text-[9px] text-zinc-600 text-center">As alterações aparecem aqui em tempo real</p>
      </div>
    </div>
  );

  // Suggested pre-made avatar avatars for fast personalizations
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

  const COVER_TEMPLATES = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80'
  ];

  // 1. Subscribe to Links lists in real-time or local fallback
  useEffect(() => {
    if (userProfile.uid === 'demo-user-123') {
      const loadDemoLinks = () => {
        const savedLinkItems = localStorage.getItem('demo_links');
        if (savedLinkItems) {
          setLinks(JSON.parse(savedLinkItems));
        } else {
          const initialLinks: LinkItem[] = [
            {
              id: 'link-1',
              userId: 'demo-user-123',
              title: 'Meu Instagram Oficial',
              url: 'https://instagram.com',
              active: true,
              order: 1,
              type: 'link',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'link-promo-1',
              userId: 'demo-user-123',
              title: 'Promoção de Inverno',
              url: 'https://exemplo.com/promo',
              active: true,
              order: 2,
              type: 'promo_banner',
              imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'link-wpp-1',
              userId: 'demo-user-123',
              title: 'Fale comigo no WhatsApp',
              url: 'https://wa.me/5511999999999',
              active: true,
              order: 3,
              type: 'whatsapp',
              subtitle: 'Atendimento Rápido',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'link-svc-1',
              userId: 'demo-user-123',
              title: 'Meus Serviços',
              url: '',
              active: true,
              order: 4,
              type: 'services',
              content: [
                { id: 'svc-1', name: 'Consultoria em Marketing Digital', description: 'Estratégia completa para alavancar seu negócio online com tráfego pago e orgânico', price: 'R$ 197,00', category: 'Marketing', whatsapp: '5511999999999', deliveryTime: '72h' },
                { id: 'svc-2', name: 'Criação de Site Profissional', description: 'Site institucional completo, responsivo e otimizado para SEO. Inclui domínio e hospedagem por 1 ano.', price: 'R$ 997,00', category: 'Desenvolvimento', whatsapp: '5511999999999', deliveryTime: '7 dias' },
                { id: 'svc-3', name: 'Design de Logotipo', description: 'Identidade visual completa com logo, paleta de cores e manual da marca', price: 'R$ 297,00', category: 'Design', whatsapp: '5511999999999', deliveryTime: '48h' }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'link-2',
              userId: 'demo-user-123',
              title: 'Canal do YouTube',
              url: 'https://youtube.com',
              active: true,
              order: 4,
              type: 'link',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          setLinks(initialLinks);
          localStorage.setItem('demo_links', JSON.stringify(initialLinks));
        }
      };

      loadDemoLinks();
      // Poll mock storage quickly to feel reactive in local developer workspaces
      const interval = setInterval(loadDemoLinks, 1000);
      return () => clearInterval(interval);
    }

    const linksPath = `users/${userProfile.uid}/links`;
    const q = query(collection(db, 'users', userProfile.uid, 'links'), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: LinkItem[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as LinkItem);
      });
      setLinks(items);
    }, (error) => {
      const errMsg = error?.message || String(error);
      const isOfflineMsg = errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('network');
      if (isOfflineMsg) {
        console.warn(`Firestore links listener está operando em modo offline.`);
      } else {
        handleFirestoreError(error, OperationType.LIST, linksPath);
      }
    });

    return () => unsubscribe();
  }, [userProfile.uid]);

  // 2. Subscribe to outbound click stats logs in real-time or local fallback
  useEffect(() => {
    if (userProfile.uid === 'demo-user-123') {
      const loadDemoClicks = () => {
        const savedClicks = localStorage.getItem('demo_clicks');
        if (savedClicks) {
          const parsed = JSON.parse(savedClicks);
          // Map stored dates to firestore-like helper format to prevent interface rendering crashes
          setClicks(parsed.map((c: any) => ({
            id: c.id,
            linkId: c.linkId,
            timestamp: { toDate: () => new Date(c.timestampDate || Date.now()) } as any
          })));
        } else {
          const mockClicks = [
            { id: 'c-1', linkId: 'link-1', timestampDate: new Date(Date.now() - 3600000).toISOString() },
            { id: 'c-2', linkId: 'link-1', timestampDate: new Date(Date.now() - 7200000).toISOString() },
            { id: 'c-3', linkId: 'link-2', timestampDate: new Date(Date.now() - 14400000).toISOString() }
          ];
          localStorage.setItem('demo_clicks', JSON.stringify(mockClicks));
          setClicks(mockClicks.map((c: any) => ({
            id: c.id,
            linkId: c.linkId,
            timestamp: { toDate: () => new Date(c.timestampDate) } as any
          })));
        }
      };

      loadDemoClicks();
      const interval = setInterval(loadDemoClicks, 1000);
      return () => clearInterval(interval);
    }

    const clicksPath = `users/${userProfile.uid}/clicks`;
    const q = query(collection(db, 'users', userProfile.uid, 'clicks'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: ClickLog[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        logs.push({
          id: d.id,
          linkId: data.linkId,
          timestamp: data.timestamp,
        });
      });
      setClicks(logs);
    }, (error) => {
      const errMsg = error?.message || String(error);
      const isOfflineMsg = errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('network');
      if (isOfflineMsg) {
        console.warn(`Firestore clicks listener está operando em modo offline.`);
      } else {
        handleFirestoreError(error, OperationType.LIST, clicksPath);
      }
    });

    return () => unsubscribe();
  }, [userProfile.uid]);

  // 3. Create outbound link / content block
  const handleAddLink = async (title: string, url: string, type: any = 'link', extraData: any = {}) => {
    if (userProfile.uid === 'demo-user-123') {
      const highestOrder = links.length > 0 ? Math.max(...links.map(l => l.order)) : 0;
      const newLink: LinkItem = {
        id: `block-${Date.now()}`,
        userId: userProfile.uid,
        title,
        url,
        active: true,
        order: highestOrder + 1,
        type,
        ...extraData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = [...links, newLink];
      setLinks(updated);
      localStorage.setItem('demo_links', JSON.stringify(updated));
      return;
    }

    const path = `users/${userProfile.uid}/links`;
    try {
      const linksRef = collection(db, 'users', userProfile.uid, 'links');
      const newDocRef = doc(linksRef);
      const newId = newDocRef.id;

      // Find highest order
      const highestOrder = links.length > 0 ? Math.max(...links.map(l => l.order)) : 0;

      await setDoc(newDocRef, {
        id: newId,
        userId: userProfile.uid,
        title,
        url,
        active: true,
        order: highestOrder + 1,
        type,
        ...extraData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  // 4. Update single link credentials
  const handleUpdateLink = async (linkId: string, updates: Partial<LinkItem>) => {
    const merged = { ...updates, updatedAt: new Date() };

    if (userProfile.uid === 'demo-user-123') {
      const updated = links.map(l => l.id === linkId ? { ...l, ...merged } : l);
      setLinks(updated);
      localStorage.setItem('demo_links', JSON.stringify(updated));
      return;
    }

    // Optimistic local update so the preview reflects changes instantly,
    // before the Firestore roundtrip completes (onSnapshot will reconcile).
    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, ...merged } : l));

    const path = `users/${userProfile.uid}/links/${linkId}`;
    try {
      const docRef = doc(db, 'users', userProfile.uid, 'links', linkId);
      await updateDoc(docRef, merged);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // 4b. Receive in-progress edit values from LinkEditor for live preview.
  // Pass `null` to clear the override (on save/cancel).
  const handleLinkPreviewChange = (linkId: string, patch: Partial<LinkItem> | null) => {
    setLinkPreviewOverrides(prev => {
      if (patch === null) {
        if (!(linkId in prev)) return prev;
        const { [linkId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [linkId]: patch };
    });
  };

  // 5. Delete link
  const handleDeleteLink = async (linkId: string) => {
    if (userProfile.uid === 'demo-user-123') {
      const updated = links.filter(l => l.id !== linkId);
      setLinks(updated);
      localStorage.setItem('demo_links', JSON.stringify(updated));
      return;
    }

    const path = `users/${userProfile.uid}/links/${linkId}`;
    try {
      const docRef = doc(db, 'users', userProfile.uid, 'links', linkId);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // 6. Save Profile fields (Display Name, Bio, Avatar Pic, Cover Pic)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const path = `users/${userProfile.uid}`;

    if (userProfile.uid === 'demo-user-123') {
      const updatedProfile: UserProfile = {
        ...userProfile,
        displayName: displayName.trim(),
        bio: bio.trim(),
        profilePicUrl: profilePicUrl.trim(),
        coverUrl: coverUrl.trim(),
        coverColor: coverColor.trim(),
        coverGradient: coverGradient.trim(),
        coverPosition: coverPosition,
        coverOverlay: coverOverlay,
        theme: cleanTheme(theme),
        updatedAt: new Date(),
      };
      localStorage.setItem('linkflow_demo_profile', JSON.stringify(updatedProfile));
      onProfileUpdate(updatedProfile);
      setIsSavingProfile(false);
      return;
    }

    try {
      const newUsername = username.trim().toLowerCase();
      const usernameChanged = newUsername !== userProfile.username;

      if (usernameChanged) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', newUsername), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty && snap.docs[0].id !== userProfile.uid) {
          alert('Este nome de usuário já está em uso. Escolha outro.');
          setIsSavingProfile(false);
          return;
        }
      }

      const docRef = doc(db, 'users', userProfile.uid);
      const updatedProfile: UserProfile = {
        ...userProfile,
        displayName: displayName.trim(),
        bio: bio.trim(),
        username: newUsername,
        profilePicUrl: profilePicUrl.trim(),
        coverUrl: coverUrl.trim(),
        coverColor: coverColor.trim(),
        coverGradient: coverGradient.trim(),
        coverPosition: coverPosition,
        coverOverlay: coverOverlay,
        theme: cleanTheme(theme),
        updatedAt: new Date(),
      };

      const savedTheme = cleanTheme(theme);
      await updateDoc(docRef, {
        displayName: updatedProfile.displayName,
        bio: updatedProfile.bio,
        username: newUsername,
        profilePicUrl: updatedProfile.profilePicUrl,
        coverUrl: updatedProfile.coverUrl,
        coverColor: updatedProfile.coverColor,
        coverGradient: updatedProfile.coverGradient,
        coverPosition: updatedProfile.coverPosition,
        coverOverlay: updatedProfile.coverOverlay,
        theme: savedTheme,
        updatedAt: updatedProfile.updatedAt,
      });

      onProfileUpdate(updatedProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Strip undefined values so Firestore doesn't reject the write
  const cleanTheme = (t: any) => JSON.parse(JSON.stringify(t));

  // Pick a solid background color (sets backgroundType and clears other bg fields)
  const handlePickColor = (color: string) => {
    const { backgroundGradient: _, backgroundImageUrl: __, ...rest } = theme;
    handleThemeChange({ ...rest, themeId: 'custom', backgroundColor: color, backgroundType: 'color' });
  };

  // 7. Update Theme specifically (passed down to ThemeSelector)
  const handleThemeChange = async (updatedTheme: any) => {
    const cleaned = cleanTheme(updatedTheme);
    // 1. Update local reactive theme state immediately
    setTheme(cleaned);

    const path = `users/${userProfile.uid}`;

    if (userProfile.uid === 'demo-user-123') {
      const updatedProfile = {
        ...userProfile,
        theme: cleaned,
        updatedAt: new Date()
      };
      localStorage.setItem('linkflow_demo_profile', JSON.stringify(updatedProfile));
      onProfileUpdate(updatedProfile);
      return;
    }

    try {
      const docRef = doc(db, 'users', userProfile.uid);
      const updatedProfile = {
        ...userProfile,
        theme: cleaned,
        updatedAt: new Date()
      };

      await updateDoc(docRef, {
        theme: cleaned,
        updatedAt: updatedProfile.updatedAt
      });

      onProfileUpdate(updatedProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Layout change handler (updates theme.layout)
  const handleLayoutChange = (layoutUpdate: any) => {
    const updatedTheme = {
      ...theme,
      themeId: 'custom',
      layout: { ...(theme.layout || {}), ...layoutUpdate },
    };
    handleThemeChange(updatedTheme);
  };

  const LAYOUT_PRESETS: { id: string; name: string; desc: string; icon: string; layout: any }[] = [
    { id: 'overlapping', name: 'Clássico', desc: 'Avatar sobreposto ao banner', icon: '⊞', layout: { headerLayout: 'overlapping', avatarAlignment: 'center', avatarSize: 'medium', showCover: true } },
    { id: 'stacked', name: 'Moderno', desc: 'Avatar abaixo do banner', icon: '⊟', layout: { headerLayout: 'stacked', avatarAlignment: 'center', avatarSize: 'medium', showCover: true } },
    { id: 'detached', name: 'Destacado', desc: 'Banner e avatar separados', icon: '⊡', layout: { headerLayout: 'detached', avatarAlignment: 'left', avatarSize: 'large', showCover: true } },
    { id: 'minimal', name: 'Minimalista', desc: 'Apenas avatar, sem banner', icon: '◉', layout: { headerLayout: 'minimal', avatarAlignment: 'center', avatarSize: 'large', showCover: false } },
  ];
  const activeLayout = theme.layout?.headerLayout || 'overlapping';

  const handleLogout = async () => {
    if (userProfile.uid === 'demo-user-123') {
      localStorage.removeItem('linkflow_demo_profile');
      localStorage.removeItem('demo_links');
      localStorage.removeItem('demo_clicks');
      localStorage.removeItem('demo_posts');
      window.location.reload();
      return;
    }
    try {
      await logoutUser();
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  // Copy shareable profile link
  const handleCopyLink = () => {
    const currentUrl = `${window.location.origin}${window.location.pathname}?u=${userProfile.username}`;
    navigator.clipboard.writeText(currentUrl);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const publicProfileUrl = `${window.location.origin}${window.location.pathname}?u=${userProfile.username}`;

  const navItems = [
    { id: 'feed', label: 'Feed', icon: <MessageSquare className="w-5 h-5" /> } as const,
    { id: 'discover', label: 'Descobrir', icon: <Compass className="w-5 h-5" /> } as const,
    { id: 'links', label: 'Construtor', icon: <Link2 className="w-5 h-5" /> } as const,
    { id: 'design', label: 'Aparência', icon: <Layout className="w-5 h-5" /> } as const,
    { id: 'stats', label: 'Métricas', icon: <BarChart4 className="w-5 h-5" /> } as const,
  ] as const;
  if (isAdmin) {
    (navItems as any).push({ id: 'admin', label: 'Admin', icon: <Crown className="w-5 h-5" /> });
  }

  return (
    <div id="full-dashboard-panel" className="min-h-screen bg-black text-slate-100 flex">
      {/* Instagram-style LEFT SIDEBAR */}
      <aside className="hidden md:flex w-[72px] xl:w-[244px] border-r border-slate-800/60 bg-[#0a1128] flex-col items-center xl:items-start py-4 px-3 xl:px-4 gap-1 shrink-0 h-screen sticky top-0 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 px-1 xl:px-3 py-2 w-full">
          <div className="w-9 h-9 rounded-xl bg-[#a78bfa] flex items-center justify-center text-white shadow-[0_0_12px_rgba(167,139,250,0.25)] shrink-0">
            <Link2 className="w-5 h-5 rotate-45" />
          </div>
          <span className="hidden xl:block text-sm font-extrabold tracking-wide text-white">LinkFlow</span>
        </div>

        {/* Nav Items */}
        {navItems.map((item: any) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center justify-center xl:justify-start gap-3 w-full py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === item.id
                ? 'bg-[#a78bfa]/10 text-[#a78bfa] font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
            title={item.label}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="hidden xl:block text-sm">{item.label}</span>
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile link */}
        <div className="w-full px-1 xl:px-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center xl:justify-start gap-3 w-full py-2.5 px-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all cursor-pointer"
            title="Copiar link do perfil"
          >
            <User className="w-5 h-5 shrink-0" />
            <span className="hidden xl:block text-sm truncate">@{userProfile.username}</span>
          </button>
          <div className="hidden xl:flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-black/30 border border-slate-800/60">
            <span className="text-[9px] text-zinc-600 font-mono truncate flex-1">{publicProfileUrl}</span>
            {copiedNotification ? (
              <Check className="w-3 h-3 text-green-400 shrink-0" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-500 hover:text-[#a78bfa] transition-all shrink-0 cursor-pointer" onClick={handleCopyLink} />
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center xl:justify-start gap-3 w-full py-2.5 px-3 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer mt-1"
          title="Sair"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="hidden xl:block text-sm">Sair</span>
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a1128]/95 backdrop-blur-md border-t border-slate-800/60 flex items-center justify-around py-2 px-1">
        {navItems.slice(0, 5).map((item: any) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === item.id ? 'text-[#a78bfa]' : 'text-zinc-500'
            }`}
          >
            <span className="w-5 h-5">{item.icon}</span>
            <span className="text-[8px] font-semibold uppercase tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a1128]/95 backdrop-blur-md border-b border-slate-800/40 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#a78bfa] flex items-center justify-center text-white">
            <Link2 className="w-4 h-4 rotate-45" />
          </div>
          <span className="text-sm font-extrabold text-white">LinkFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopyLink} className="text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded-lg border border-slate-800 transition-all cursor-pointer">
            {copiedNotification ? 'Copiado!' : 'Copiar'}
          </button>
          <button onClick={handleLogout} className="text-[10px] text-zinc-500 hover:text-rose-400 transition-all cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className={`flex-1 flex pt-0 md:pt-0 pb-16 md:pb-0 ${activeTab === 'design' || activeTab === 'links' ? '' : 'overflow-y-auto'}`}>
        <div id="controls-panel-container" className={`flex-1 ${activeTab === 'design' || activeTab === 'links' ? 'flex' : 'overflow-y-auto'} ${activeTab === 'feed' ? 'max-w-2xl mx-auto px-4 py-4 md:py-6' : activeTab === 'design' || activeTab === 'links' ? '' : 'p-4 sm:p-5 md:p-6 space-y-6 md:max-w-3xl lg:max-w-4xl mx-auto w-full'}`}>

          {/* TAB: SOCIAL COMMUNITY FEED (default) */}
          {activeTab === 'feed' && (
            <div id="tab-content-feed" className="pb-6">
              <CommunityFeed currentUserProfile={userProfile} />
            </div>
          )}

          {/* TAB: LINKS MANAGEMENT */}
          {activeTab === 'links' && (
            <div id="tab-content-links" className="flex w-full">
              <div className="flex-1 min-w-0 p-4 sm:p-5 md:p-6 space-y-6">
                <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800/50 shadow-lg">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <ExternalLink className="w-4 h-4 text-[#a78bfa] shrink-0" />
                      <h3 className="text-xs font-semibold text-slate-300 whitespace-nowrap">Sua página pública</h3>
                      <span className="text-[10px] text-zinc-500 font-mono truncate bg-black/40 border border-slate-800 px-2 py-1 rounded-lg">{publicProfileUrl}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-lg bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/20 transition-all cursor-pointer"
                      >
                        {copiedNotification ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
                      </button>
                      <a
                        id="visit-public-profile-from-builder"
                        href={`?u=${userProfile.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
                        title="Abrir minha página pública em nova aba"
                      >
                        <ExternalLink className="w-3 h-3" /> Visitar
                      </a>
                    </div>
                  </div>
                </div>
                <LinkEditor
                  links={links}
                  onAdd={handleAddLink}
                  onUpdate={handleUpdateLink}
                  onDelete={handleDeleteLink}
                  onPreviewChange={handleLinkPreviewChange}
                />
                <div className="h-10" />
              </div>
              {renderPhonePreview()}
            </div>
          )}

          {/* TAB: DISCOVER PROFILES */}
          {activeTab === 'discover' && (
            <div id="tab-content-discover" className="pb-10 h-full">
              <DiscoverProfiles />
            </div>
          )}

          {/* TAB: ADMIN PANEL (CEO only) */}
          {activeTab === 'admin' && (
            <div id="tab-content-admin" className="pb-10">
              <AdminPanel />
            </div>
          )}

          {/* TAB: STATISTICS / METRICAS */}
          {activeTab === 'stats' && (
            <div id="tab-content-stats" className="space-y-6 pb-10">
              {/* Copy profile link card */}
              <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800/50 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-[#a78bfa]" />
                    Seu Link Público
                  </h3>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/20 transition-all cursor-pointer"
                  >
                    {copiedNotification ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 bg-black/40 rounded-lg border border-slate-800 px-3 py-2">
                  <span className="text-xs text-slate-400 font-mono truncate flex-1">{publicProfileUrl}</span>
                  <button
                    onClick={handleCopyLink}
                    className="text-zinc-400 hover:text-[#a78bfa] transition-all cursor-pointer shrink-0"
                    title="Copiar link"
                  >
                    {copiedNotification ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <StatsView links={links} clicks={clicks} />
            </div>
          )}

          {/* TAB: PROFILE DESIGN & APPEARANCE — Two-column sticky layout */}
          {activeTab === 'design' && (
            <div id="tab-content-design" className="flex w-full">

              {/* LEFT COLUMN — scrollable controls */}
              <div className="flex-1 min-w-0 p-4 sm:p-5 md:p-6 space-y-6">

              <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800/50 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Layout className="w-3.5 h-3.5 text-[#a78bfa]" />
                    Layout do Perfil
                  </h3>
                  <span className="text-[10px] text-zinc-500">Clique para aplicar</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {LAYOUT_PRESETS.map((p) => {
                    const isActive = activeLayout === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleLayoutChange(p.layout)}
                        className={`flex-shrink-0 w-28 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                          isActive ? 'border-[#a78bfa] bg-[#a78bfa]/10 shadow-[0_0_12px_rgba(167,139,250,0.3)]' : 'border-slate-800 hover:border-slate-600 bg-black/20'
                        }`}
                      >
                        <div className={`text-lg mb-1 ${isActive ? 'text-[#a78bfa]' : 'text-zinc-500'}`}>{p.icon}</div>
                        <div className={`text-[11px] font-bold ${isActive ? 'text-[#a78bfa]' : 'text-zinc-300'}`}>{p.name}</div>
                        <div className="text-[8px] text-zinc-500 mt-0.5">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                {/* Editor Controls */}
                <div className="space-y-6 min-w-0">
                  <form id="profile-editor-form" onSubmit={handleSaveProfile} className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800/50 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
                      <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 font-sans">
                        <User className="w-4 h-4 text-[#a78bfa]" />
                        Editor Visual
                      </h3>
                      <span className="text-[11px] font-bold text-[#a78bfa] bg-[#a78bfa]/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Canva Editor</span>
                    </div>
                    <div className="flex flex-col gap-6">
                      <div className="flex-1 space-y-5 min-w-0">
                    <div className="bg-black/30 rounded-xl p-4 border border-slate-900 space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-[#a78bfa] to-purple-500" /> Cor de Fundo
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {['#0f172a','#1e1b4b','#1a1a2e','#0d1117','#111827','#1c1917','#171717','#1f2937','#020617','#000000','#2d1b69','#1a3a5c','#3b0764','#164e63','#0b3d0b','#3d0c0c','#7c2d12','#4c1d95','#0f0f0f','#262626'].map((c) => (
                          <button key={c} type="button" onClick={() => handlePickColor(c)}
                            className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer hover:scale-110 ${
                              theme.backgroundColor === c ? 'border-[#a78bfa] scale-110 ring-2 ring-[#a78bfa]/30' : 'border-transparent hover:border-zinc-500'
                            }`}
                            style={{ backgroundColor: c }} title={c} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4 border border-slate-900 space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layout className="w-3 h-3 text-[#a78bfa]" /> Posição & Estrutura
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[{label:'Avatar',key:'avatarAlignment',opts:[{k:'left',l:'← Esq'},{k:'center',l:'Centro'},{k:'right',l:'Dir →'}]},{label:'Tamanho',key:'avatarSize',opts:[{k:'small',l:'P'},{k:'medium',l:'M'},{k:'large',l:'G'}]},{label:'Largura',key:'contentWidth',opts:[{k:'narrow',l:'Estreito'},{k:'medium',l:'Médio'},{k:'wide',l:'Largo'}]},{label:'Espaçamento',key:'elementSpacing',opts:[{k:'compact',l:'Compacto'},{k:'normal',l:'Normal'},{k:'spacious',l:'Espaçoso'}]}].map(g => (
                          <div key={g.key}>
                            <label className="text-[9px] text-zinc-500 block mb-1">{g.label}</label>
                            <div className="flex gap-1">
                              {g.opts.map((o:any) => (
                                <button key={o.k} type="button" onClick={() => handleLayoutChange({[g.key]: o.k})}
                                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                    ((theme.layout as any)?.[g.key] || g.opts[1]?.k) === o.k
                                      ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]'
                                      : 'bg-black/40 border-slate-800 text-zinc-500 hover:border-slate-600'
                                  }`}>{o.l}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <label className="text-[9px] text-zinc-500">Mostrar Banner de Capa</label>
                        <button type="button" onClick={() => handleLayoutChange({ showCover: !(theme.layout?.showCover ?? true) })}
                          className={`relative w-9 h-5 rounded-full transition-all cursor-pointer ${(theme.layout?.showCover ?? true) ? 'bg-[#a78bfa]' : 'bg-zinc-700'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${(theme.layout?.showCover ?? true) ? 'left-4' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4 border border-slate-900 space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#a78bfa]" /> Informações do Perfil
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-500 block mb-1">Nome de Exibição</label>
                          <input type="text" placeholder="Seu nome ou marca" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-black text-xs text-slate-200 py-2 px-3 rounded-lg border border-slate-800 focus:border-[#a78bfa] focus:outline-none transition-all placeholder-slate-700" required />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 block mb-1">Link Personalizado</label>
                          <div className="flex items-center gap-1.5 bg-black border border-slate-800 rounded-lg px-3 focus-within:border-[#a78bfa] transition-all">
                            <span className="text-[11px] text-zinc-600 font-mono shrink-0">/?u=</span>
                            <input type="text" placeholder="seu-nome" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                              className="w-full bg-transparent text-xs text-slate-200 py-2 focus:outline-none transition-all placeholder-slate-700 font-mono" required />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[9px] text-zinc-500 block mb-1">Biografia</label>
                          <textarea rows={1} placeholder="Uma breve descrição" value={bio} onChange={(e) => setBio(e.target.value)}
                            className="w-full bg-black text-xs text-slate-200 py-2 px-3 rounded-lg border border-slate-800 focus:border-[#a78bfa] focus:outline-none transition-all placeholder-slate-700 resize-none" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4 border border-slate-900 space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-emerald-400" /> Foto de Perfil
                      </h4>
                      <div className="flex gap-2">
                        <input type="text" placeholder="URL da foto" value={profilePicUrl} onChange={(e) => setProfilePicUrl(e.target.value)}
                          className="flex-1 bg-black text-[10px] text-slate-300 py-2 px-3 rounded-lg border border-slate-800 focus:border-[#a78bfa] focus:outline-none transition-all placeholder-slate-700 font-mono" />
                        <input id="file-upload-avatar" type="file" accept="image/*" className="hidden"
                          onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { setProfilePicUrl(await compressImage(file, 150, 150, 0.6)); } catch {} } e.target.value = ''; }} />
                        <label htmlFor="file-upload-avatar" className="bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#a78bfa] text-[10px] font-bold px-2.5 py-2 rounded-lg border border-[#a78bfa]/20 transition-all cursor-pointer shrink-0 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Upload
                        </label>
                        {profilePicUrl && (
                          <button type="button" onClick={() => setProfilePicUrl('')} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2.5 py-2 rounded-lg border border-rose-500/20 transition-all cursor-pointer shrink-0">Limpar</button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_TEMPLATES.map((url, idx) => (
                          <button key={idx} type="button" onClick={() => setProfilePicUrl(url)}
                            className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 shrink-0 ${
                              profilePicUrl === url ? 'border-[#a78bfa] scale-110 shadow-[0_0_6px_rgba(167,139,250,0.5)]' : 'border-slate-800 hover:border-slate-600'
                            }`}>
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4 border border-slate-900 space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-[#a78bfa]" /> Banner de Capa
                      </h4>
                      <div className="flex gap-2">
                        <input type="text" placeholder="URL da imagem de capa" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)}
                          className="flex-1 bg-black text-[10px] text-slate-300 py-2 px-3 rounded-lg border border-slate-800 focus:border-[#a78bfa] focus:outline-none transition-all placeholder-slate-700 font-mono" />
                        <input id="file-upload-cover" type="file" accept="image/*" className="hidden"
                          onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { setCoverUrl(await compressImage(file, 800, 320, 0.7)); } catch {} } e.target.value = ''; }} />
                        <label htmlFor="file-upload-cover" className="bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#a78bfa] text-[10px] font-bold px-2.5 py-2 rounded-lg border border-[#a78bfa]/20 transition-all cursor-pointer shrink-0 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Upload
                        </label>
                        {coverUrl && (
                          <button type="button" onClick={() => setCoverUrl('')} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2.5 py-2 rounded-lg border border-rose-500/20 transition-all cursor-pointer shrink-0">Remover</button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {COVER_TEMPLATES.map((url, idx) => (
                          <button key={idx} type="button" onClick={() => setCoverUrl(url)}
                            className={`h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 shrink-0 ${
                              coverUrl === url ? 'border-[#a78bfa] shadow-[0_0_6px_rgba(167,139,250,0.4)]' : 'border-slate-800 hover:border-slate-600'
                            }`}>
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-pink-400" />
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Cor de fundo do banner (sem imagem)</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={(() => {
                              const c = (coverColor || '').trim();
                              if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
                              return '#0a1128';
                            })()}
                            onChange={(e) => { setCoverColor(e.target.value); setCoverGradient(''); }}
                            className="w-9 h-9 rounded border border-slate-800 bg-transparent cursor-pointer shrink-0"
                            title="Cor sólida da capa"
                          />
                          <input
                            type="text"
                            placeholder="#0a1128 ou rgba(0,0,0,0.5)"
                            value={coverColor}
                            onChange={(e) => { setCoverColor(e.target.value); if (e.target.value) setCoverGradient(''); }}
                            className="flex-1 bg-black text-[10px] text-slate-300 py-2 px-3 rounded-lg border border-slate-800 focus:border-[#a78bfa] focus:outline-none transition-all placeholder-slate-700 font-mono"
                          />
                          {coverColor && (
                            <button type="button" onClick={() => setCoverColor('')} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2.5 py-2 rounded-lg border border-rose-500/20 transition-all cursor-pointer shrink-0">Limpar</button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {['#0a1128','#1e1b4b','#1a1a2e','#0d1117','#111827','#000000','#3b0764','#164e63','#0b3d0b','#3d0c0c','#7c2d12','#4c1d95','#7f1d1d','#831843','#ffffff','#f8fafc','#f0fdf4','#fef2f2','#fefce8','#f5f3ff','#ecfeff','#fff7ed','#fdf2f8','#0f172a','#020617','#262626','#0f0f0f','#1c1917','#171717','#1f2937','#0d9488','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#10b981','#f43f5e','#3b82f6','#a855f7'].map((c) => (
                            <button key={c} type="button" onClick={() => { setCoverColor(c); setCoverGradient(''); }}
                              className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer hover:scale-110 ${
                                coverColor === c ? 'border-[#a78bfa] scale-110 ring-2 ring-[#a78bfa]/30' : 'border-transparent hover:border-zinc-500'
                              }`}
                              style={{ backgroundColor: c }} title={c} />
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Gradiente do banner</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                            value={coverGradient}
                            onChange={(e) => { setCoverGradient(e.target.value); if (e.target.value) setCoverColor(''); }}
                            className="flex-1 bg-black text-[10px] text-slate-300 py-2 px-3 rounded-lg border border-slate-800 focus:border-[#a78bfa] focus:outline-none transition-all placeholder-slate-700 font-mono"
                          />
                          {coverGradient && (
                            <button type="button" onClick={() => setCoverGradient('')} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2.5 py-2 rounded-lg border border-rose-500/20 transition-all cursor-pointer shrink-0">Limpar</button>
                          )}
                        </div>
                        <div className="h-8 w-full rounded-lg border border-slate-800 transition-all" style={{ background: coverGradient || coverColor || 'transparent' }} />

                        <div className="pt-1 space-y-3">
                          <div>
                            <label className="text-[9px] text-zinc-500 block mb-1">Posição da imagem</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {(['top','center','bottom'] as const).map((p) => (
                                <button key={p} type="button" onClick={() => setCoverPosition(p)}
                                  className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                    coverPosition === p ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]' : 'bg-black/40 border-slate-800 text-zinc-500 hover:border-slate-600'
                                  }`}>{p === 'top' ? 'Topo' : p === 'center' ? 'Centro' : 'Baixo'}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-500 block mb-1">Overlay escuro: {coverOverlay}%</label>
                            <input
                              type="range"
                              min="0"
                              max="80"
                              value={coverOverlay}
                              onChange={(e) => setCoverOverlay(Number(e.target.value))}
                              className="w-full accent-[#a78bfa]"
                            />
                            <p className="text-[8px] text-zinc-600">Aplica um tom escuro sobre a imagem para destacar o conteúdo.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-1 flex items-center justify-end gap-3">
                      <span className="text-[9px] text-zinc-600 italic">Todas as alterações são salvas ao clicar em Salvar</span>
                      <button type="submit" disabled={isSavingProfile}
                        className="px-5 py-3 bg-[#a78bfa] hover:bg-[#c4b5fd] disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(167,139,250,0.25)]">
                        {isSavingProfile ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Salvando...</span></> : 'Salvar Perfil'}
                      </button>
                    </div>
                  </div>
                </div>
                  </form>

                  <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800/50 shadow-lg">
                    <ThemeSelector currentTheme={theme} onChange={handleThemeChange} />
                  </div>
                </div>
              </div>

              {/* pb spacer */}
              <div className="h-10" />

              </div>{/* END LEFT COLUMN */}

              {renderPhonePreview()}

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
