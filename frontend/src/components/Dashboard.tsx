import React, { useState, useEffect } from 'react';
import { UserProfile, LinkItem, ClickLog } from '../types';
import { db, OperationType, handleFirestoreError, logoutUser } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, onSnapshot, query, orderBy, getDocs, where, limit } from 'firebase/firestore';
import LinkEditor from './LinkEditor';
import ThemeSelector from './ThemeSelector';
import StatsView from './StatsView';
import PublicProfile from './PublicProfile';
import CommunityFeed from './CommunityFeed';
import DiscoverProfiles from './DiscoverProfiles';
const AdminPanel = React.lazy(() => import('./AdminPanel'));
const ProfessionalDashboard = React.lazy(() => import('./ProfessionalDashboard'));
import GoToNatanDevButton from './GoToNatanDevButton';
import { Link2, Sparkles, User, LogOut, Check, Copy, ExternalLink, RefreshCw, MessageSquare, Compass, ImageIcon, Crown, Layout, Smartphone, BarChart4, Briefcase, Upload } from 'lucide-react';
import { ADMIN_EMAIL } from '../types';
import { compressImage } from '../utils/image';

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
  const [saveToast, setSaveToast] = useState<{ kind: 'success' | 'error' | 'theme'; message: string } | null>(null);

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

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
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

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      if (snapshot.metadata.fromCache) return;
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
        subtitle: '',
        badgeText: '',
        iconEmoji: '',
        iconUrl: '',
        animation: 'none',
        imageUrl: '',
        customColor: '',
        customTextColor: '',
        customGradient: '',
        useGradient: false,
        customBorderColor: '',
        customBorderWidth: 0,
        customStyle: '',
        customRadius: '',
        customSize: '',
        customShadow: false,
        customGlass: false,
        customFont: '',
        customTextAlign: '',
        customLetterSpacing: '',
        customUppercase: false,
        customIconPosition: '',
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

      // Send every field with a safe default so the strict Firestore rules
      // never see a missing/typed-mismatched value. extraData is spread last
      // so type-specific defaults (e.g. whatsapp → iconEmoji/💬, animation/pulse)
      // can still override the generic defaults.
      await setDoc(newDocRef, {
        id: newId,
        userId: userProfile.uid,
        title,
        url,
        active: true,
        order: highestOrder + 1,
        type,
        subtitle: '',
        badgeText: '',
        iconEmoji: '',
        iconUrl: '',
        animation: 'none',
        imageUrl: '',
        customColor: '',
        customTextColor: '',
        customGradient: '',
        useGradient: false,
        customBorderColor: '',
        customBorderWidth: 0,
        customStyle: '',
        customRadius: '',
        customSize: '',
        customShadow: false,
        customGlass: false,
        customFont: '',
        customTextAlign: '',
        customLetterSpacing: '',
        customUppercase: false,
        customIconPosition: '',
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
      try {
        localStorage.setItem('demo_links', JSON.stringify(updated));
        window.dispatchEvent(new Event('linkflow_demo_updated'));
      } catch (err) {
        throw err;
      }
      return;
    }

    try {
      const docRef = doc(db, 'users', userProfile.uid, 'links', linkId);
      await updateDoc(docRef, merged);

      // Notify any open public page in another tab so the new color shows up
      // immediately, without waiting for Firestore cache propagation.
      try {
        if (typeof BroadcastChannel !== 'undefined' && userProfile.username) {
          const channel = new BroadcastChannel('linkflow_public_sync');
          channel.postMessage({
            type: 'link_updated',
            slug: userProfile.username,
            uid: userProfile.uid,
            linkId,
            at: Date.now(),
          });
          channel.close();
        }
      } catch {}
    } catch (err) {
      // Surface a friendly error to the caller (LinkEditor will show a banner)
      throw err;
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

  // 6. Save Profile fields (Display Name, Bio, Avatar Pic, Cover Pic) + Theme
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const newUsername = username.trim().toLowerCase();
      const usernameChanged = newUsername !== userProfile.username;

      if (usernameChanged) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', newUsername), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty && snap.docs[0].id !== userProfile.uid) {
          alert('Este nome de usuário já está em uso. Escolha outro.');
          return;
        }
      }

      const ok = await persistProfile({ username: newUsername });
      if (ok) {
        setSaveToast({ kind: 'success', message: 'Perfil e tema salvos com sucesso!' });
        setTimeout(() => setSaveToast(null), 2500);
      } else {
        setSaveToast({ kind: 'error', message: 'Falha ao salvar perfil. Tente novamente.' });
        setTimeout(() => setSaveToast(null), 3500);
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Strip undefined values so Firestore doesn't reject the write
  const cleanTheme = (t: any) => JSON.parse(JSON.stringify(t));

  // ============================================================================
  // SINGLE SOURCE OF TRUTH FOR PROFILE/THEME PERSISTENCE
  // ============================================================================
  // Both "Salvar Perfil" (form submit) and the ThemeSelector (auto-save) must
  // produce the EXACT same Firestore document state. Previously these two
  // paths diverged:
  //   - handleThemeChange wrote only { theme, updatedAt } (partial update).
  //   - handleSaveProfile wrote a custom subset of fields and could clobber
  //     the just-saved theme if the local state hadn't been re-synced yet.
  // Both now funnel through persistProfile(), which:
  //   1. Builds a single, fully-merged UserProfile from the current local
  //      state (form fields + local `theme`).
  //   2. Writes ALL updatable fields in a single updateDoc().
  //   3. Re-fires the cross-tab/same-tab sync events so the public page
  //      refreshes immediately.
  // ============================================================================
  const persistProfile = async (
    overrides: { theme?: any; username?: string } = {}
  ): Promise<boolean> => {
    const path = `users/${userProfile.uid}`;

    if (userProfile.uid === 'demo-user-123') {
      const nextTheme = overrides.theme !== undefined ? cleanTheme(overrides.theme) : cleanTheme(theme);
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
        username: overrides.username !== undefined ? overrides.username : (username.trim().toLowerCase() || userProfile.username),
        theme: nextTheme,
        updatedAt: new Date(),
      };
      localStorage.setItem('linkflow_demo_profile', JSON.stringify(updatedProfile));
      onProfileUpdate(updatedProfile);
      try {
        window.dispatchEvent(new CustomEvent('linkflow_public_sync_local', {
          detail: { type: 'profile_updated', slug: updatedProfile.username, uid: updatedProfile.uid }
        }));
        window.dispatchEvent(new Event('linkflow_demo_updated'));
        if (typeof BroadcastChannel !== 'undefined') {
          const ch = new BroadcastChannel('linkflow_public_sync');
          ch.postMessage({ type: 'profile_updated', slug: updatedProfile.username, uid: updatedProfile.uid });
          ch.close();
        }
      } catch {}
      return true;
    }

    try {
      const nextTheme = overrides.theme !== undefined ? cleanTheme(overrides.theme) : cleanTheme(theme);
      const nextUsername = overrides.username !== undefined ? overrides.username : username.trim().toLowerCase();

      const docRef = doc(db, 'users', userProfile.uid);

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
        username: nextUsername,
        theme: nextTheme,
        updatedAt: new Date(),
      };

      // Single atomic write with the FULL set of updatable fields.
      // Firestore's updateDoc replaces only the listed fields; immutable
      // fields (uid/email/role/banned/counters) are protected by rules.
      await updateDoc(docRef, {
        displayName: updatedProfile.displayName,
        bio: updatedProfile.bio,
        profilePicUrl: updatedProfile.profilePicUrl,
        coverUrl: updatedProfile.coverUrl,
        coverColor: updatedProfile.coverColor,
        coverGradient: updatedProfile.coverGradient,
        coverPosition: updatedProfile.coverPosition,
        coverOverlay: updatedProfile.coverOverlay,
        username: updatedProfile.username,
        theme: nextTheme,
        updatedAt: updatedProfile.updatedAt,
      });

      // Sync to professional_profiles if the professional profile exists in Firestore
      try {
        const proRef = doc(db, 'professional_profiles', userProfile.uid);
        const proSnap = await getDoc(proRef);
        if (proSnap.exists()) {
          await updateDoc(proRef, {
            displayName: updatedProfile.displayName,
            bio: updatedProfile.bio,
            profilePicUrl: updatedProfile.profilePicUrl,
            username: updatedProfile.username,
            updatedAt: new Date()
          });
        }
      } catch (proErr) {
        console.warn("Erro ao sincronizar perfil profissional na aparência:", proErr);
      }

      onProfileUpdate(updatedProfile);

      // Cross-tab + same-tab sync: force the public page to re-fetch.
      try {
        if (updatedProfile.username) {
          window.dispatchEvent(new CustomEvent('linkflow_public_sync_local', {
            detail: { type: 'profile_updated', slug: updatedProfile.username, uid: userProfile.uid }
          }));
          if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel('linkflow_public_sync');
            ch.postMessage({ type: 'profile_updated', slug: updatedProfile.username, uid: userProfile.uid });
            ch.close();
          }
        }
      } catch {}

      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      return false;
    }
  };

  // Pick a solid background color (sets backgroundType and clears other bg fields)
  const handlePickColor = (color: string) => {
    const { backgroundGradient: _, backgroundImageUrl: __, ...rest } = theme;
    handleThemeChange({ ...rest, themeId: 'custom', backgroundColor: color, backgroundType: 'color' });
  };
  // 7. Update Theme specifically (passed down to ThemeSelector)
  // Both this and handleSaveProfile route through persistProfile so the
  // Firestore document state is consistent regardless of which UI the user
  // used to trigger the change.
  const handleThemeChange = async (updatedTheme: any) => {
    const cleaned = cleanTheme(updatedTheme);
    // 1. Update local reactive theme state immediately for the live preview.
    setTheme(cleaned);

    const ok = await persistProfile({ theme: cleaned });
    if (ok) {
      setSaveToast({ kind: 'theme', message: 'Aparência aplicada e sincronizada.' });
      setTimeout(() => setSaveToast(null), 1800);
    } else {
      setSaveToast({ kind: 'error', message: 'Não foi possível aplicar a aparência.' });
      setTimeout(() => setSaveToast(null), 3500);
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
    const currentUrl = `${window.location.origin}/${userProfile.username}`;
    navigator.clipboard.writeText(currentUrl);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const publicProfileUrl = `${window.location.origin}/${userProfile.username}`;

  const navItems = [
    { id: 'feed', label: 'Feed', icon: <MessageSquare className="w-5 h-5" /> } as const,
    { id: 'discover', label: 'Descobrir', icon: <Compass className="w-5 h-5" /> } as const,
    { id: 'professional', label: 'Serviços', icon: <Briefcase className="w-5 h-5" /> } as const,
    { id: 'links', label: 'Construtor', icon: <Link2 className="w-5 h-5" /> } as const,
    { id: 'design', label: 'Aparência', icon: <Layout className="w-5 h-5" /> } as const,
    { id: 'stats', label: 'Métricas', icon: <BarChart4 className="w-5 h-5" /> } as const,
  ] as const;
  if (isAdmin) {
    (navItems as any).push({ id: 'admin', label: 'Admin', icon: <Crown className="w-5 h-5" /> });
  }

  return (
    <div id="full-dashboard-panel" className="min-h-screen bg-[#050b18] text-slate-100 flex selection:bg-[#a78bfa]/30">
      {/* PREMIUM SAAS LEFT SIDEBAR */}
      <aside className="hidden md:flex w-[80px] xl:w-[260px] border-r border-slate-800/40 bg-[#0f172a]/80 backdrop-blur-2xl flex-col items-center xl:items-start py-6 px-3 xl:px-5 gap-2 shrink-0 h-screen sticky top-0 overflow-y-auto shadow-2xl z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-1 xl:px-2 w-full cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a78bfa] to-indigo-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(167,139,250,0.4)] shrink-0">
            <Link2 className="w-5 h-5 rotate-45 stroke-[2.5]" />
          </div>
          <span className="hidden xl:block text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">LinkFlowAI</span>
        </div>

        {/* Nav Items */}
        <nav className="w-full space-y-1.5">
          {navItems.map((item: any) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex items-center justify-center xl:justify-start gap-3.5 w-full py-3 px-3 xl:px-4 rounded-xl transition-all cursor-pointer relative overflow-hidden ${
                activeTab === item.id
                  ? 'bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
              title={item.label}
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#a78bfa]/20 to-transparent opacity-50" />
              )}
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#a78bfa] rounded-r-full shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
              )}
              <span className={`shrink-0 relative z-10 transition-colors ${activeTab === item.id ? 'text-[#a78bfa]' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {item.icon}
              </span>
              <span className={`hidden xl:block text-sm font-semibold relative z-10 transition-colors ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile widget */}
        <div className="w-full bg-[#131c31]/50 border border-slate-800/60 rounded-2xl p-2 xl:p-3 space-y-2 mt-4">
          <button
            onClick={handleCopyLink}
            className="group flex items-center justify-center xl:justify-start gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
            title="Copiar link do perfil"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#a78bfa] to-indigo-500 p-[1.5px] shrink-0">
              <div className="w-full h-full bg-[#0f172a] rounded-full overflow-hidden flex items-center justify-center">
                {userProfile.profilePicUrl ? (
                  <img src={userProfile.profilePicUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-300" />
                )}
              </div>
            </div>
            <div className="hidden xl:block min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-white truncate">{userProfile.displayName || userProfile.username}</p>
              <p className="text-[10px] text-slate-400 truncate group-hover:text-[#a78bfa] transition-colors">@{userProfile.username}</p>
            </div>
          </button>
          
          <div className="hidden xl:flex items-center gap-1.5 pt-1">
            <a
              href={`/${userProfile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/20 transition-all group"
            >
              <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold">Ver Perfil</span>
            </a>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          
          {/* Mobile bottom row fallback inside sidebar */}
          <div className="xl:hidden flex items-center justify-center pt-2 border-t border-slate-800/60">
            <button onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-xl border-t border-slate-800/60 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around p-2">
          {navItems.slice(0, 5).map((item: any) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer group"
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-[#a78bfa]/10 rounded-xl" />
              )}
              <span className={`relative z-10 transition-transform duration-200 ${activeTab === item.id ? 'text-[#a78bfa] -translate-y-0.5 scale-110' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              <span className={`relative z-10 text-[9px] font-bold tracking-wide transition-colors ${activeTab === item.id ? 'text-[#a78bfa]' : 'text-transparent hidden'}`}>
                {activeTab === item.id && item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/90 backdrop-blur-xl border-b border-slate-800/40 flex items-center justify-between px-5 py-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#a78bfa] to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Link2 className="w-4 h-4 rotate-45 stroke-[2.5]" />
          </div>
          <span className="text-base font-black text-white tracking-tight">LinkFlowAI</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopyLink} className="text-[11px] font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5">
            {copiedNotification ? 'Copiado!' : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
          </button>
          <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-800/30 hover:bg-rose-500/10 transition-all cursor-pointer" title="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className={`flex-1 flex pt-16 md:pt-0 pb-24 md:pb-0 ${activeTab === 'design' || activeTab === 'links' ? '' : 'overflow-y-auto'}`}>
        <div id="controls-panel-container" className={`flex-1 ${activeTab === 'design' || activeTab === 'links' ? 'flex flex-col lg:flex-row' : 'overflow-y-auto'} ${activeTab === 'feed' ? 'max-w-2xl mx-auto px-4 py-4 md:py-6' : activeTab === 'design' || activeTab === 'links' ? '' : 'p-4 sm:p-5 md:p-6 space-y-6 md:max-w-3xl lg:max-w-4xl mx-auto w-full'}`}>

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
                      <span className="text-[9px] text-zinc-500 font-mono truncate bg-black/40 border border-slate-800 px-2 py-1 rounded-lg max-w-[120px] sm:max-w-[200px]">{publicProfileUrl}</span>
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
                        href={`/${userProfile.username}`}
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

          {/* TAB: PROFESSIONAL SERVICES */}
          {activeTab === 'professional' && (
            <div id="tab-content-professional" className="pb-10 space-y-4">
              <div className="flex items-center justify-between bg-[#0a1128] border border-slate-800/60 rounded-2xl p-4">
                <div>
                  <p className="text-sm font-bold text-white">Vitrine pública de profissionais</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Veja como os clientes encontram prestadores no LinkFlowAI.</p>
                </div>
                <a
                  href="?view=servicos"
                  className="shrink-0 px-4 py-2 bg-[#a78bfa] hover:bg-[#c4b5fd] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  aria-label="Abrir vitrine pública de profissionais"
                >
                  <Briefcase className="w-3.5 h-3.5" aria-hidden="true" /> Abrir vitrine
                </a>
              </div>
              <React.Suspense fallback={
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-[#a78bfa] animate-spin" aria-hidden="true" />
                </div>
              }>
                <ProfessionalDashboard userProfile={userProfile} onProfileUpdate={onProfileUpdate} />
              </React.Suspense>
            </div>
          )}

          {/* TAB: ADMIN PANEL (CEO only) */}
          {activeTab === 'admin' && (
            <div id="tab-content-admin" className="pb-10">
              <React.Suspense fallback={
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-[#a78bfa] animate-spin" aria-hidden="true" />
                </div>
              }>
                <AdminPanel />
              </React.Suspense>
            </div>
          )}

          {/* TAB: STATISTICS / METRICAS */}
          {activeTab === 'stats' && (
            <div id="tab-content-stats" className="space-y-6 pb-10">
              {/* Copy profile link card */}
              <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800/50 shadow-lg">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-[#a78bfa]" />
                    Seu Link Público
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/20 transition-all cursor-pointer"
                    >
                      {copiedNotification ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
                    </button>
                    <GoToNatanDevButton />
                  </div>
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
                  <GoToNatanDevButton variant="icon" />
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

                {/* 1. LAYOUT PRESETS */}
                <div className="relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Layout className="w-4 h-4 text-[#a78bfa]" />
                        Layout do Perfil
                      </h3>
                      <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase border border-white/5 bg-white/5 px-2.5 py-1 rounded-md">Selecione</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {LAYOUT_PRESETS.map((p) => {
                        const isActive = activeLayout === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleLayoutChange(p.layout)}
                            className={`relative flex flex-col p-5 rounded-2xl border transition-all cursor-pointer text-left overflow-hidden group/btn ${
                              isActive 
                                ? 'border-[#a78bfa]/50 bg-[#a78bfa]/5 shadow-[0_0_30px_rgba(167,139,250,0.15)] ring-1 ring-[#a78bfa]/20' 
                                : 'border-white/5 bg-[#111111] hover:border-white/10 hover:bg-[#151515]'
                            }`}
                          >
                            {isActive && <div className="absolute top-0 right-0 w-20 h-20 bg-[#a78bfa]/20 blur-[30px] pointer-events-none" />}
                            <div className={`relative text-2xl mb-3 transition-transform group-hover/btn:scale-110 ${isActive ? 'text-[#a78bfa]' : 'text-slate-500'}`}>{p.icon}</div>
                            <div className={`relative text-xs font-bold tracking-wide ${isActive ? 'text-white' : 'text-slate-300'}`}>{p.name}</div>
                            <div className="relative text-[10px] text-zinc-500 mt-1.5 leading-relaxed">{p.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. EDITOR VISUAL */}
                <form id="profile-editor-form" onSubmit={handleSaveProfile} className="relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  
                  <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-5 mb-8">
                    <h3 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <User className="w-4 h-4 text-[#a78bfa]" />
                      Editor Visual
                    </h3>
                    <span className="text-[9px] font-bold text-[#a78bfa] border border-[#a78bfa]/20 bg-[#a78bfa]/5 px-3 py-1 rounded-full uppercase tracking-wider font-mono">Pro Editor</span>
                  </div>
                  
                  <div className="relative z-10 flex flex-col gap-8">
                    {/* Cor de fundo */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#a78bfa] to-indigo-500" /> Cor de Fundo
                      </h4>
                      <div className="flex flex-wrap gap-2.5 bg-[#111111] border border-white/5 rounded-2xl p-4">
                        {['#0f172a','#1e1b4b','#1a1a2e','#0d1117','#111827','#1c1917','#171717','#1f2937','#020617','#000000','#2d1b69','#1a3a5c','#3b0764','#164e63','#0b3d0b','#3d0c0c','#7c2d12','#4c1d95','#0f0f0f','#262626'].map((c) => (
                          <button key={c} type="button" onClick={() => handlePickColor(c)}
                            className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer hover:scale-110 shadow-sm ${
                              theme.backgroundColor === c ? 'border-[#a78bfa] scale-110 ring-4 ring-[#a78bfa]/20' : 'border-white/5 hover:border-white/20'
                            }`}
                            style={{ backgroundColor: c }} title={c} />
                        ))}
                      </div>
                    </div>

                    {/* Posicao e Estrutura */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Layout className="w-3.5 h-3.5 text-[#a78bfa]" /> Estrutura & Posição
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#111111] border border-white/5 rounded-2xl p-5">
                        {[{label:'Alinhamento Avatar',key:'avatarAlignment',opts:[{k:'left',l:'Esq'},{k:'center',l:'Centro'},{k:'right',l:'Dir'}]},{label:'Tamanho Avatar',key:'avatarSize',opts:[{k:'small',l:'P'},{k:'medium',l:'M'},{k:'large',l:'G'}]},{label:'Largura Conteúdo',key:'contentWidth',opts:[{k:'narrow',l:'Estreito'},{k:'medium',l:'Médio'},{k:'wide',l:'Largo'}]},{label:'Espaçamento',key:'elementSpacing',opts:[{k:'compact',l:'Compacto'},{k:'normal',l:'Normal'},{k:'spacious',l:'Largo'}]}].map(g => (
                          <div key={g.key} className="space-y-2">
                            <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase">{g.label}</label>
                            <div className="flex gap-1 bg-[#0a0a0a] p-1 rounded-xl border border-white/5">
                              {g.opts.map((o:any) => (
                                <button key={o.k} type="button" onClick={() => handleLayoutChange({[g.key]: o.k})}
                                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider ${
                                    ((theme.layout as any)?.[g.key] || g.opts[1]?.k) === o.k
                                      ? 'bg-white/10 text-white shadow-md border border-white/10'
                                      : 'text-zinc-500 border border-transparent hover:text-zinc-300 hover:bg-white/5'
                                  }`}>{o.l}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="sm:col-span-2 pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-[11px] font-bold text-white tracking-wide">Exibir Banner de Capa</label>
                            <p className="text-[9px] text-zinc-500">Mostra a imagem de fundo no topo do perfil</p>
                          </div>
                          <button type="button" onClick={() => handleLayoutChange({ showCover: !(theme.layout?.showCover ?? true) })}
                            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ring-1 ring-inset ${(theme.layout?.showCover ?? true) ? 'bg-[#a78bfa] ring-[#a78bfa]/50' : 'bg-[#151515] ring-white/10'}`}>
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${(theme.layout?.showCover ?? true) ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Perfil */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#a78bfa]" /> Informações do Perfil
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-[#111111] border border-white/5 rounded-2xl p-5">
                        <div className="space-y-2">
                          <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase">Nome de Exibição</label>
                          <input type="text" placeholder="Seu nome ou marca" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-[#0a0a0a] text-xs text-white py-3.5 px-4 rounded-xl border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 focus:ring-2 focus:ring-[#a78bfa]/20 transition-all placeholder-zinc-600 outline-none" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase">Link Personalizado</label>
                          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/5 hover:border-white/10 rounded-xl px-4 focus-within:border-[#a78bfa]/50 focus-within:ring-2 focus-within:ring-[#a78bfa]/20 transition-all">
                            <span className="text-xs text-zinc-600 font-mono shrink-0">/</span>
                            <input type="text" placeholder="seu-nome" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_\.-]/g, ''))}
                              className="w-full bg-transparent text-xs text-white py-3.5 focus:outline-none transition-all placeholder-zinc-600 font-mono" required />
                          </div>
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                          <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase">Biografia</label>
                          <textarea rows={2} placeholder="Uma breve descrição" value={bio} onChange={(e) => setBio(e.target.value)}
                            className="w-full bg-[#0a0a0a] text-xs text-white py-3.5 px-4 rounded-xl border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 focus:ring-2 focus:ring-[#a78bfa]/20 transition-all placeholder-zinc-600 outline-none resize-none leading-relaxed" />
                        </div>
                      </div>
                    </div>

                    {/* Foto */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Foto de Perfil
                      </h4>
                      <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-5">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input type="text" placeholder="URL da foto" value={profilePicUrl} onChange={(e) => setProfilePicUrl(e.target.value)}
                            className="flex-1 bg-[#0a0a0a] text-xs text-zinc-300 py-3.5 px-4 rounded-xl border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 focus:ring-2 focus:ring-[#a78bfa]/20 transition-all placeholder-zinc-600 font-mono outline-none" />
                          <div className="flex gap-2">
                            <input id="file-upload-avatar" type="file" accept="image/*" className="hidden"
                              onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { setProfilePicUrl(await compressImage(file, 150, 150, 0.6)); } catch {} } e.target.value = ''; }} />
                            <label htmlFor="file-upload-avatar" className="bg-[#151515] hover:bg-[#202020] text-white text-[11px] font-bold px-5 py-3.5 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider">
                              <Upload className="w-3.5 h-3.5 text-emerald-400" /> Subir
                            </label>
                            {profilePicUrl && (
                              <button type="button" onClick={() => setProfilePicUrl('')} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold px-4 py-3.5 rounded-xl border border-rose-500/20 transition-all cursor-pointer flex-1 sm:flex-none uppercase tracking-wider">Limpar</button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {AVATAR_TEMPLATES.map((url, idx) => (
                            <button key={idx} type="button" onClick={() => setProfilePicUrl(url)}
                              className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 shrink-0 ${
                                profilePicUrl === url ? 'border-[#a78bfa] scale-110 shadow-[0_0_15px_rgba(167,139,250,0.3)]' : 'border-white/5 hover:border-white/20'
                              }`}>
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Banner */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-[#a78bfa]" /> Banner de Capa
                      </h4>
                      <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input type="text" placeholder="URL da imagem de capa" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)}
                            className="flex-1 bg-[#0a0a0a] text-xs text-zinc-300 py-3.5 px-4 rounded-xl border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 focus:ring-2 focus:ring-[#a78bfa]/20 transition-all placeholder-zinc-600 font-mono outline-none" />
                          <div className="flex gap-2">
                            <input id="file-upload-cover" type="file" accept="image/*" className="hidden"
                              onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { setCoverUrl(await compressImage(file, 800, 320, 0.7)); } catch {} } e.target.value = ''; }} />
                            <label htmlFor="file-upload-cover" className="bg-[#151515] hover:bg-[#202020] text-white text-[11px] font-bold px-5 py-3.5 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider">
                              <Upload className="w-3.5 h-3.5 text-[#a78bfa]" /> Subir
                            </label>
                            {coverUrl && (
                              <button type="button" onClick={() => setCoverUrl('')} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold px-4 py-3.5 rounded-xl border border-rose-500/20 transition-all cursor-pointer flex-1 sm:flex-none uppercase tracking-wider">Limpar</button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {COVER_TEMPLATES.map((url, idx) => (
                            <button key={idx} type="button" onClick={() => setCoverUrl(url)}
                              className={`h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 shrink-0 ${
                                coverUrl === url ? 'border-[#a78bfa] shadow-[0_0_15px_rgba(167,139,250,0.3)]' : 'border-white/5 hover:border-white/20'
                              }`}>
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-6">
                          <div className="flex flex-col sm:flex-row gap-5">
                            <div className="flex-1 space-y-3">
                              <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-pink-400" /> Cor Sólida
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={(() => {
                                    const c = (coverColor || '').trim();
                                    if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
                                    return '#0a1128';
                                  })()}
                                  onChange={(e) => { setCoverColor(e.target.value); setCoverGradient(''); }}
                                  className="w-12 h-12 rounded-xl border border-white/5 bg-transparent cursor-pointer shrink-0"
                                  title="Cor sólida da capa"
                                />
                                <input
                                  type="text"
                                  placeholder="#0a1128"
                                  value={coverColor}
                                  onChange={(e) => { setCoverColor(e.target.value); if (e.target.value) setCoverGradient(''); }}
                                  className="flex-1 bg-[#0a0a0a] text-xs text-white py-3.5 px-4 rounded-xl border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 focus:ring-2 focus:ring-[#a78bfa]/20 transition-all placeholder-zinc-600 font-mono outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex-1 space-y-3">
                              <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#a78bfa]" /> Gradiente CSS
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="linear-gradient(...)"
                                  value={coverGradient}
                                  onChange={(e) => { setCoverGradient(e.target.value); if (e.target.value) setCoverColor(''); }}
                                  className="flex-1 bg-[#0a0a0a] text-xs text-white py-3.5 px-4 rounded-xl border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 focus:ring-2 focus:ring-[#a78bfa]/20 transition-all placeholder-zinc-600 font-mono outline-none"
                                />
                                {(coverGradient || coverColor) && (
                                  <button type="button" onClick={() => { setCoverGradient(''); setCoverColor(''); }} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold px-4 py-3.5 rounded-xl border border-rose-500/20 transition-all cursor-pointer shrink-0 uppercase tracking-wider">Limpar</button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="h-14 w-full rounded-xl border border-white/5 shadow-inner" style={{ background: coverGradient || coverColor || 'transparent' }} />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-3">
                              <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase">Posição da Imagem</label>
                              <div className="flex gap-1 bg-[#0a0a0a] p-1 rounded-xl border border-white/5">
                                {(['top','center','bottom'] as const).map((p) => (
                                  <button key={p} type="button" onClick={() => setCoverPosition(p)}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider ${
                                      coverPosition === p ? 'bg-white/10 text-white shadow-md border border-white/10' : 'text-zinc-500 border border-transparent hover:text-zinc-300 hover:bg-white/5'
                                    }`}>{p === 'top' ? 'Topo' : p === 'center' ? 'Centro' : 'Baixo'}</button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase flex justify-between">
                                <span>Overlay de Escurecimento</span>
                                <span className="text-white font-bold">{coverOverlay}%</span>
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                value={coverOverlay}
                                onChange={(e) => setCoverOverlay(Number(e.target.value))}
                                className="w-full h-2.5 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer accent-[#a78bfa] border border-white/5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-5 border-t border-white/5">
                    <span className="text-[11px] text-zinc-500 font-medium">As alterações são aplicadas imediatamente ao salvar.</span>
                    <button type="submit" disabled={isSavingProfile}
                      className="w-full sm:w-auto relative group flex items-center justify-center gap-2 px-10 py-4 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer disabled:cursor-not-allowed">
                      <span className="relative flex items-center gap-2">
                        {isSavingProfile ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Salvando...</span></> : 'Salvar Alterações'}
                      </span>
                    </button>
                  </div>
                </form>

                <div className="relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
                  <ThemeSelector currentTheme={theme} onChange={handleThemeChange} />
                </div>

                {/* pb spacer */}
                <div className="h-10" />

              </div>{/* END LEFT COLUMN */}

              {renderPhonePreview()}

            </div>
          )}

        </div>
      </main>

      {/* Save toast for theme/profile persistence feedback */}
      {saveToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            saveToast.kind === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
              : saveToast.kind === 'theme'
              ? 'bg-[#0f172a]/95 border-[#a78bfa]/40 text-[#a78bfa]'
              : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              saveToast.kind === 'error' ? 'bg-rose-400' : saveToast.kind === 'theme' ? 'bg-[#a78bfa]' : 'bg-emerald-400'
            }`}
          />
          {saveToast.message}
        </div>
      )}
    </div>
  );
}
