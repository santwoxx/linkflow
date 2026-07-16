import React, { useState, useEffect } from 'react';
import { UserProfile, LinkItem, ClickLog, ViewLog, Lead, ResumeData } from '../types';
import { db, OperationType, handleFirestoreError, logoutUser } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, onSnapshot, query, orderBy, getDocs, where, limit } from 'firebase/firestore';
import LinkEditor from './LinkEditor';
import PublicProfile from './PublicProfile';
// Componentes de aba pesados: carregados sob demanda (code-splitting por aba)
const ThemeSelector = React.lazy(() => import('./ThemeSelector'));
const StatsView = React.lazy(() => import('./StatsView'));
const CommunityFeed = React.lazy(() => import('./CommunityFeed'));
const DiscoverProfiles = React.lazy(() => import('./DiscoverProfiles'));
const AdminPanel = React.lazy(() => import('./AdminPanel'));
const ProfessionalDashboard = React.lazy(() => import('./ProfessionalDashboard'));
const RafflesList = React.lazy(() => import('./RafflesList'));
import { motion } from 'motion/react';
import LoadingSpinner from './LoadingSpinner';
import { Link2, Sparkles, User, LogOut, Check, Copy, ExternalLink, RefreshCw, MessageSquare, Compass, ImageIcon, Crown, Layout, Smartphone, BarChart4, Briefcase, Upload, AtSign, X, Gift } from 'lucide-react';
import { ADMIN_EMAIL } from '../types';
import { compressImage } from '../utils/image';

interface DashboardProps {
  userProfile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
}

// Fallback padrão exibido enquanto o chunk lazy de uma aba é baixado
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <LoadingSpinner size="sm" message="Carregando..." />
    </div>
  );
}

export default function Dashboard({ userProfile, onProfileUpdate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'links' | 'design' | 'stats' | 'feed' | 'discover' | 'preview' | 'admin' | 'raffles'>('feed');
  const isAdmin = userProfile.email === ADMIN_EMAIL || userProfile.role === 'admin';
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [clicks, setClicks] = useState<ClickLog[]>([]);
  const [views, setViews] = useState<ViewLog[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
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
  const [colorTab, setColorTab] = useState<'dark' | 'light' | 'gradient'>('dark');
  const [measurementId, setMeasurementId] = useState(userProfile.measurementId || '');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(userProfile.analyticsEnabled ?? false);

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
    if (userProfile.measurementId !== undefined) setMeasurementId(userProfile.measurementId);
    if (userProfile.analyticsEnabled !== undefined) setAnalyticsEnabled(userProfile.analyticsEnabled);
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

  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Reusable live phone preview (sticky) used by Construtor and Aparência tabs
  const previewLinks: LinkItem[] = links.map(l =>
    linkPreviewOverrides[l.id] ? { ...l, ...linkPreviewOverrides[l.id] } : l
  );

  const renderPhonePreview = (options?: { mobile?: boolean }) => {
    const isMobile = options?.mobile;
    return (
      <div className={`${isMobile ? 'fixed inset-0 z-50 bg-[#050b18]/95 backdrop-blur-xl flex flex-col' : 'hidden lg:flex shrink-0 w-[380px] self-stretch border-l border-slate-800/40 bg-[#050b18]/60'}`}>
        <div className={`${isMobile ? 'flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto' : 'sticky top-0 w-full max-h-screen overflow-y-auto flex flex-col items-center gap-3 p-6'}`}>
          {isMobile && (
            <div className="w-full flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-1.5 text-[10px] text-[#a78bfa] font-semibold tracking-wider uppercase select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse"></span>
                Pré-visualização ao Vivo
              </div>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {!isMobile && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#a78bfa] font-semibold tracking-wider uppercase select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse"></span>
              Pré-visualização ao Vivo
            </div>
          )}
          <div className="w-[300px] rounded-[44px] overflow-hidden border-[8px] border-zinc-700/90 bg-zinc-950 shadow-2xl shadow-black/60 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-b-2xl z-10 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <span className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>
            <div className="w-full overflow-y-auto" style={{ height: '620px' }}>
              <PublicProfile profile={livePreviewProfile} links={previewLinks} previewMode={true} />
            </div>
          </div>
          <p className="text-[9px] text-zinc-600 text-center mt-3">As alterações aparecem aqui em tempo real</p>
        </div>
      </div>
    );
  };

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

  const DARK_BACKGROUNDS = [
    { name: 'Midnight Blue', value: '#020617' },
    { name: 'Slate Night', value: '#0f172a' },
    { name: 'Dark Indigo', value: '#1e1b4b' },
    { name: 'Noir Absolute', value: '#000000' },
    { name: 'Cyber Blue', value: '#0d1117' },
    { name: 'Pure Charcoal', value: '#171717' },
    { name: 'Deep Purple', value: '#2d1b69' },
    { name: 'Gothic Obsidian', value: '#1a1a2e' },
    { name: 'Deep Forest', value: '#0b3d0b' },
    { name: 'Crimson Night', value: '#3d0c0c' },
  ];

  const LIGHT_BACKGROUNDS = [
    { name: 'Pure White', value: '#ffffff' },
    { name: 'Snowy Slate', value: '#f8fafc' },
    { name: 'Mint White', value: '#f0fdf4' },
    { name: 'Rose Petal', value: '#fef2f2' },
    { name: 'Warm Cream', value: '#fefce8' },
    { name: 'Lilac Haze', value: '#f5f3ff' },
    { name: 'Ice Cyan', value: '#ecfeff' },
    { name: 'Peach Sunset', value: '#fff7ed' },
    { name: 'Sakura Blush', value: '#fdf2f8' },
  ];

  const GRADIENT_BACKGROUNDS = [
    { name: 'Sunset Glow', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Neon Cyber', value: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)' },
    { name: 'Ocean Haze', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Purple Night', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Deep Space', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
    { name: 'Fresh Mint', value: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)' },
    { name: 'Lemon Sun', value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
    { name: 'Lavender Blush', value: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)' },
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
            timestamp: { toDate: () => new Date(c.timestampDate || Date.now()) } as any,
            device: c.device || 'Mobile',
            os: c.os || 'iOS',
            browser: c.browser || 'Safari',
            referrer: c.referrer || 'Instagram',
            language: c.language || 'pt-BR'
          })));
        } else {
          const mockClicks = [
            { id: 'c-1', linkId: 'link-1', timestampDate: new Date(Date.now() - 3600000).toISOString(), device: 'Mobile', os: 'iOS', browser: 'Safari', referrer: 'Instagram', language: 'pt-BR' },
            { id: 'c-2', linkId: 'link-1', timestampDate: new Date(Date.now() - 7200000).toISOString(), device: 'Mobile', os: 'Android', browser: 'Chrome', referrer: 'TikTok', language: 'pt-BR' },
            { id: 'c-3', linkId: 'link-2', timestampDate: new Date(Date.now() - 14400000).toISOString(), device: 'Desktop', os: 'Windows', browser: 'Chrome', referrer: 'Google Search', language: 'en-US' }
          ];
          localStorage.setItem('demo_clicks', JSON.stringify(mockClicks));
          setClicks(mockClicks.map((c: any) => ({
            id: c.id,
            linkId: c.linkId,
            timestamp: { toDate: () => new Date(c.timestampDate) } as any,
            device: c.device,
            os: c.os,
            browser: c.browser,
            referrer: c.referrer,
            language: c.language
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
      const logs: ClickLog[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        logs.push({
          id: d.id,
          linkId: data.linkId,
          timestamp: data.timestamp,
          device: data.device,
          os: data.os,
          browser: data.browser,
          referrer: data.referrer,
          language: data.language
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

  // Load mock views for demo user
  useEffect(() => {
    if (userProfile.uid !== 'demo-user-123') return;

    const loadDemoViews = () => {
      const savedViews = localStorage.getItem('demo_views');
      if (savedViews) {
        const parsed = JSON.parse(savedViews);
        setViews(parsed.map((v: any) => ({
          id: v.id,
          visitorId: v.visitorId,
          timestamp: { toDate: () => new Date(v.timestampDate || Date.now()) } as any,
          device: v.device,
          os: v.os,
          browser: v.browser,
          referrer: v.referrer,
          language: v.language
        })));
      } else {
        const mockViews = [
          { id: 'v-1', visitorId: 'v-1', timestampDate: new Date(Date.now() - 3600000).toISOString(), device: 'Mobile', os: 'iOS', browser: 'Safari', referrer: 'Instagram', language: 'pt-BR' },
          { id: 'v-2', visitorId: 'v-2', timestampDate: new Date(Date.now() - 7200000).toISOString(), device: 'Mobile', os: 'Android', browser: 'Chrome', referrer: 'TikTok', language: 'pt-BR' },
          { id: 'v-3', visitorId: 'v-3', timestampDate: new Date(Date.now() - 14400000).toISOString(), device: 'Desktop', os: 'Windows', browser: 'Chrome', referrer: 'Google Search', language: 'en-US' },
          { id: 'v-4', visitorId: 'v-4', timestampDate: new Date(Date.now() - 86400000).toISOString(), device: 'Mobile', os: 'iOS', browser: 'Safari', referrer: 'Instagram', language: 'pt-BR' },
          { id: 'v-5', visitorId: 'v-5', timestampDate: new Date(Date.now() - 172800000).toISOString(), device: 'Desktop', os: 'macOS', browser: 'Firefox', referrer: 'Direto / Outro', language: 'pt-BR' }
        ];
        localStorage.setItem('demo_views', JSON.stringify(mockViews));
        setViews(mockViews.map((v: any) => ({
          id: v.id,
          visitorId: v.visitorId,
          timestamp: { toDate: () => new Date(v.timestampDate) } as any,
          device: v.device,
          os: v.os,
          browser: v.browser,
          referrer: v.referrer,
          language: v.language
        })));
      }
    };

    loadDemoViews();
    const interval = setInterval(loadDemoViews, 1000);
    return () => clearInterval(interval);
  }, [userProfile.uid]);

  // Real user views subscriber
  useEffect(() => {
    if (userProfile.uid === 'demo-user-123') return;

    const viewsPath = `users/${userProfile.uid}/views`;
    const qV = query(collection(db, 'users', userProfile.uid, 'views'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(qV, { includeMetadataChanges: true }, (snapshot) => {
      const logs: ViewLog[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        logs.push({
          id: d.id,
          visitorId: data.visitorId,
          timestamp: data.timestamp,
          device: data.device,
          os: data.os,
          browser: data.browser,
          referrer: data.referrer,
          language: data.language
        });
      });
      setViews(logs);
    }, (error) => {
      const errMsg = error?.message || String(error);
      const isOfflineMsg = errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('network');
      if (isOfflineMsg) {
        console.warn(`Firestore views listener está operando em modo offline.`);
      } else {
        handleFirestoreError(error, OperationType.LIST, viewsPath);
      }
    });

    return () => unsubscribe();
  }, [userProfile.uid]);

  // Leads listener
  useEffect(() => {
    if (userProfile.uid === 'demo-user-123') return;

    const qL = query(collection(db, 'users', userProfile.uid, 'leads'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(qL, { includeMetadataChanges: true }, (snapshot) => {
      const logs: Lead[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        logs.push({
          id: d.id,
          visitorName: data.visitorName || '',
          visitorPhone: data.visitorPhone || '',
          profileOwnerId: data.profileOwnerId || '',
          profileOwnerUsername: data.profileOwnerUsername || '',
          createdAt: data.createdAt,
        });
      });
      setLeads(logs);
    }, (error) => {
      const errMsg = error?.message || String(error);
      const isOfflineMsg = errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('network');
      if (isOfflineMsg) {
        console.warn('Firestore leads listener em modo offline.');
      } else {
        handleFirestoreError(error, OperationType.LIST, `users/${userProfile.uid}/leads`);
      }
    });

    return () => unsubscribe();
  }, [userProfile.uid]);

  // Resumes listener
  useEffect(() => {
    if (userProfile.uid === 'demo-user-123') return;

    const qR = query(collection(db, 'users', userProfile.uid, 'resumes'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(qR, { includeMetadataChanges: true }, (snapshot) => {
      const logs: ResumeData[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        logs.push({
          id: d.id,
          candidateName: data.candidateName || '',
          candidateEmail: data.candidateEmail || '',
          candidatePhone: data.candidatePhone || '',
          message: data.message || '',
          resumeFile: data.resumeFile || '',
          resumeFileName: data.resumeFileName || '',
          destinationEmail: data.destinationEmail || '',
          createdAt: data.createdAt,
        });
      });
      setResumes(logs);
    }, (error) => {
      const errMsg = error?.message || String(error);
      const isOfflineMsg = errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('network');
      if (isOfflineMsg) {
        console.warn('Firestore resumes listener em modo offline.');
      } else {
        handleFirestoreError(error, OperationType.LIST, `users/${userProfile.uid}/resumes`);
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
    overrides: { theme?: any; username?: string; measurementId?: string; analyticsEnabled?: boolean } = {}
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
      const gaMeasurementId = overrides.measurementId !== undefined ? overrides.measurementId : measurementId;
      const gaAnalyticsEnabled = overrides.analyticsEnabled !== undefined ? overrides.analyticsEnabled : analyticsEnabled;

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
        measurementId: gaMeasurementId,
        analyticsEnabled: gaAnalyticsEnabled,
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

  const handlePickGradient = (gradient: string) => {
    const { backgroundImageUrl: __, ...rest } = theme;
    handleThemeChange({ ...rest, themeId: 'custom', backgroundGradient: gradient, backgroundType: 'gradient' });
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
    { id: 'raffles', label: 'Sorteios', icon: <Gift className="w-5 h-5" /> } as const,
    { id: 'links', label: 'Construtor', icon: <Link2 className="w-5 h-5" /> } as const,
    { id: 'design', label: 'Aparência', icon: <Layout className="w-5 h-5" /> } as const,
    { id: 'stats', label: 'Métricas', icon: <BarChart4 className="w-5 h-5" /> } as const,
  ] as const;
  if (isAdmin) {
    (navItems as any).push({ id: 'admin', label: 'Admin', icon: <Crown className="w-5 h-5" /> });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      id="full-dashboard-panel"
      className="min-h-screen bg-[#050b18] text-slate-100 flex selection:bg-[#a78bfa]/30"
    >
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

      {/* Mobile bottom nav — 2 rows of 3 on small phones, 1 row of 6 on larger */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-xl border-t border-slate-800/60 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-0.5 px-1.5 py-1.5">
          {navItems.map((item: any) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 rounded-xl transition-all cursor-pointer min-h-[48px]"
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-[#a78bfa]/10 rounded-xl" />
              )}
              <span className={`relative z-10 transition-transform duration-200 ${activeTab === item.id ? 'text-[#a78bfa] scale-110' : 'text-slate-500'}`}>
                {React.cloneElement(item.icon as React.ReactElement, { className: 'w-4 h-5' })}
              </span>
              <span className={`relative z-10 text-[8px] sm:text-[9px] font-semibold tracking-wide transition-colors leading-none ${activeTab === item.id ? 'text-[#a78bfa]' : 'text-slate-500'}`}>
                {item.label}
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
      <main className={`flex-1 flex pt-[60px] md:pt-0 pb-[72px] md:pb-0 ${activeTab === 'design' || activeTab === 'links' ? '' : 'overflow-y-auto'}`} style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div id="controls-panel-container" className={`flex-1 min-w-0 ${activeTab === 'design' || activeTab === 'links' ? 'flex flex-col lg:flex-row' : 'overflow-y-auto'} ${activeTab === 'feed' ? 'max-w-2xl mx-auto w-full px-4 py-4 md:py-6' : activeTab === 'design' || activeTab === 'links' ? '' : 'p-4 sm:p-5 md:p-6 space-y-6 md:max-w-3xl lg:max-w-4xl mx-auto w-full'}`}>

          {/* TAB: SOCIAL COMMUNITY FEED (default) */}
          {activeTab === 'feed' && (
            <div id="tab-content-feed" className="pb-6">
              <React.Suspense fallback={<TabLoader />}>
                <CommunityFeed currentUserProfile={userProfile} />
              </React.Suspense>
            </div>
          )}

          {/* TAB: LINKS MANAGEMENT */}
          {activeTab === 'links' && (
            <div id="tab-content-links" className="flex w-full">
              <div className="flex-1 min-w-0 px-3 sm:px-5 md:px-6 pt-4 sm:pt-5 md:pt-6 space-y-6">
                <div className="bg-[#0f172a] p-3 sm:p-4 rounded-2xl border border-slate-800/50 shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                      <ExternalLink className="w-4 h-4 text-[#a78bfa] shrink-0 hidden sm:block" />
                      <h3 className="text-[10px] sm:text-xs font-semibold text-slate-300 whitespace-nowrap">Sua página pública</h3>
                      <span className="text-[8px] sm:text-[9px] text-zinc-500 font-mono truncate bg-black/40 border border-slate-800 px-1.5 sm:px-2 py-1 rounded-lg max-w-[100px] sm:max-w-[200px]">{publicProfileUrl}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto justify-end">
                      {/* Preview button — visible on small screens where the side panel is hidden */}
                      <button
                        type="button"
                        onClick={() => setShowMobilePreview(true)}
                        className="lg:hidden flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/20 transition-all cursor-pointer"
                        title="Pré-visualizar"
                      >
                        <Smartphone className="w-3 h-3" /> <span className="hidden xs:inline">Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/20 transition-all cursor-pointer"
                      >
                        {copiedNotification ? <><Check className="w-3 h-3" /> <span className="hidden xs:inline">Copiado!</span></> : <><Copy className="w-3 h-3" /> <span className="hidden xs:inline">Copiar</span></>}
                      </button>
                      <a
                        id="visit-public-profile-from-builder"
                        href={`/${userProfile.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
                        title="Abrir minha página pública em nova aba"
                      >
                        <ExternalLink className="w-3 h-3" /> <span className="hidden xs:inline">Visitar</span>
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

              {/* Floating mobile preview button (fallback for very small screens) */}
              <button
                onClick={() => setShowMobilePreview(true)}
                className="lg:hidden fixed right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-[#a78bfa] to-indigo-600 text-white shadow-xl shadow-[#a78bfa]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer sm:hidden"
                title="Pré-visualizar"
                style={{ bottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}
              >
                <Smartphone className="w-5 h-5" />
              </button>

              {/* Mobile preview overlay */}
              {showMobilePreview && renderPhonePreview({ mobile: true })}

              {renderPhonePreview()}
            </div>
          )}

          {/* TAB: DISCOVER PROFILES */}
          {activeTab === 'discover' && (
            <div id="tab-content-discover" className="pb-10 h-full">
              <React.Suspense fallback={<TabLoader />}>
                <DiscoverProfiles />
              </React.Suspense>
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
                  <LoadingSpinner size="sm" message="Carregando..." />
                </div>
              }>
                <ProfessionalDashboard userProfile={userProfile} onProfileUpdate={onProfileUpdate} />
              </React.Suspense>
            </div>
          )}

          {/* TAB: SORTEIOS */}
          {activeTab === 'raffles' && (
            <div id="tab-content-raffles" className="pb-10 max-w-3xl mx-auto w-full px-4 py-4 md:py-6">
              <React.Suspense fallback={<TabLoader />}>
                <RafflesList
                  userId={userProfile.uid}
                  username={userProfile.username}
                  displayName={userProfile.displayName}
                  profilePicUrl={userProfile.profilePicUrl}
                />
              </React.Suspense>
            </div>
          )}

          {/* TAB: ADMIN PANEL (CEO only) */}
          {activeTab === 'admin' && (
            <div id="tab-content-admin" className="pb-10">
              <React.Suspense fallback={
                <div className="flex items-center justify-center py-16">
                  <LoadingSpinner size="sm" message="Carregando..." />
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
                    <a
                      href={`/${userProfile.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
                      title={`Visitar @${userProfile.username} em nova aba`}
                    >
                      <AtSign className="w-3 h-3" />
                      @{userProfile.username}
                    </a>
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
                  <a
                    href={`/${userProfile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center text-sky-400 hover:text-sky-300 transition-all cursor-pointer"
                    title={`Visitar @${userProfile.username} em nova aba`}
                    aria-label={`Visitar @${userProfile.username} em nova aba`}
                  >
                    <AtSign className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <React.Suspense fallback={<TabLoader />}>
                <StatsView links={links} clicks={clicks} views={views} leads={leads} resumes={resumes} />
              </React.Suspense>
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
                     {/* Cor de Fundo */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#a78bfa] to-indigo-500" /> Cor de Fundo
                          </h4>
                          
                          {/* Sub-tabs for presets */}
                          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                            {([
                              { id: 'dark', label: 'Escuro' },
                              { id: 'light', label: 'Claro' },
                              { id: 'gradient', label: 'Gradientes' },
                            ] as const).map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setColorTab(tab.id)}
                                className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all uppercase tracking-wider cursor-pointer ${
                                  colorTab === tab.id
                                    ? 'bg-[#a78bfa]/15 text-[#a78bfa] border border-[#a78bfa]/20'
                                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Presets List */}
                        <div className="flex flex-wrap gap-2.5 bg-[#111111] border border-white/5 rounded-2xl p-4">
                          {colorTab === 'dark' && DARK_BACKGROUNDS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => handlePickColor(c.value)}
                              className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer hover:scale-110 shadow-sm relative group ${
                                theme.backgroundType === 'color' && theme.backgroundColor === c.value
                                  ? 'border-[#a78bfa] scale-110 ring-4 ring-[#a78bfa]/20'
                                  : 'border-white/5 hover:border-white/20'
                              }`}
                              style={{ backgroundColor: c.value }}
                              title={c.name}
                            >
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap mb-1 z-[50]">{c.name}</span>
                            </button>
                          ))}
                          
                          {colorTab === 'light' && LIGHT_BACKGROUNDS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => handlePickColor(c.value)}
                              className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer hover:scale-110 shadow-sm relative group ${
                                theme.backgroundType === 'color' && theme.backgroundColor === c.value
                                  ? 'border-[#a78bfa] scale-110 ring-4 ring-[#a78bfa]/20'
                                  : 'border-white/5 hover:border-white/20'
                              }`}
                              style={{ backgroundColor: c.value }}
                              title={c.name}
                            >
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap mb-1 z-[50]">{c.name}</span>
                            </button>
                          ))}

                          {colorTab === 'gradient' && GRADIENT_BACKGROUNDS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => handlePickGradient(c.value)}
                              className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer hover:scale-110 shadow-sm relative group ${
                                theme.backgroundType === 'gradient' && theme.backgroundGradient === c.value
                                  ? 'border-[#a78bfa] scale-110 ring-4 ring-[#a78bfa]/20'
                                  : 'border-white/5 hover:border-white/20'
                              }`}
                              style={{ background: c.value }}
                              title={c.name}
                            >
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap mb-1 z-[50]">{c.name}</span>
                            </button>
                          ))}
                        </div>

                        {/* Custom Color/Gradient Builder */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase">Tipo de Fundo</span>
                            <div className="flex gap-1.5 p-1 bg-[#0a0a0a] rounded-xl border border-white/5 max-w-[200px]">
                              <button
                                type="button"
                                onClick={() => handlePickColor(theme.backgroundColor || '#0f172a')}
                                className={`px-4 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer uppercase tracking-wider ${
                                  theme.backgroundType !== 'gradient'
                                    ? 'bg-white/10 text-white border border-white/10'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                Sólido
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePickGradient(theme.backgroundGradient || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)')}
                                className={`px-4 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer uppercase tracking-wider ${
                                  theme.backgroundType === 'gradient'
                                    ? 'bg-white/10 text-white border border-white/10'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                Gradiente
                              </button>
                            </div>
                          </div>

                          {theme.backgroundType === 'gradient' ? (
                            <div className="space-y-2">
                              <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#a78bfa]" /> Gradiente CSS Personalizado
                              </label>
                              <input
                                type="text"
                                placeholder="linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)"
                                value={theme.backgroundGradient || ''}
                                onChange={(e) => handlePickGradient(e.target.value)}
                                className="w-full bg-[#0a0a0a] text-xs text-white py-3.5 px-4 rounded-xl border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 focus:ring-2 focus:ring-[#a78bfa]/20 transition-all placeholder-zinc-600 font-mono outline-none"
                              />
                              <div className="h-10 w-full rounded-xl border border-white/5 mt-2 shadow-inner" style={{ background: theme.backgroundGradient || 'transparent' }} />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-pink-400" /> Cor Sólida Personalizada
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={(() => {
                                    const c = (theme.backgroundColor || '').trim();
                                    if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
                                    return '#0f172a';
                                  })()}
                                  onChange={(e) => handlePickColor(e.target.value)}
                                  className="w-12 h-12 rounded-xl border border-white/5 bg-transparent cursor-pointer shrink-0 animate-in fade-in"
                                  title="Cor sólida de fundo"
                                />
                                <input
                                  type="text"
                                  placeholder="#0f172a"
                                  value={theme.backgroundColor || ''}
                                  onChange={(e) => handlePickColor(e.target.value)}
                                  className="flex-1 bg-[#0a0a0a] text-xs text-white py-3.5 px-4 rounded-xl border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 focus:ring-2 focus:ring-[#a78bfa]/20 transition-all placeholder-zinc-600 font-mono outline-none"
                                />
                              </div>
                            </div>
                          )}
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
                        
                        <div className="sm:col-span-2 pt-3 mt-1 border-t border-white/5 space-y-4">
                          <label className="text-[10px] text-[#a78bfa] font-mono tracking-wide uppercase flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" /> Personalização da Biografia
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Fonte</label>
                              <select 
                                value={theme.bioFontFamily || ''} 
                                onChange={(e) => setTheme({ ...theme, bioFontFamily: e.target.value })}
                                className="w-full bg-[#0a0a0a] text-xs text-white py-2.5 px-3 rounded-lg border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 outline-none transition-all"
                              >
                                <option value="">Padrão do Tema</option>
                                <option value="sans">Sans-Serif</option>
                                <option value="serif">Serif (Elegante)</option>
                                <option value="mono">Monospace</option>
                                <option value="outfit">Outfit (Moderna)</option>
                                <option value="caveat">Handwriting</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Tamanho</label>
                              <select 
                                value={theme.bioFontSize || ''} 
                                onChange={(e) => setTheme({ ...theme, bioFontSize: e.target.value as any })}
                                className="w-full bg-[#0a0a0a] text-xs text-white py-2.5 px-3 rounded-lg border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 outline-none transition-all"
                              >
                                <option value="">Padrão</option>
                                <option value="small">Pequeno</option>
                                <option value="medium">Médio</option>
                                <option value="large">Grande</option>
                                <option value="xl">Extra Grande</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Peso</label>
                              <select 
                                value={theme.bioWeight || ''} 
                                onChange={(e) => setTheme({ ...theme, bioWeight: e.target.value as any })}
                                className="w-full bg-[#0a0a0a] text-xs text-white py-2.5 px-3 rounded-lg border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 outline-none transition-all"
                              >
                                <option value="">Padrão</option>
                                <option value="normal">Normal</option>
                                <option value="medium">Médio</option>
                                <option value="semibold">Semi-Negrito</option>
                                <option value="bold">Negrito</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Alinhamento</label>
                              <select 
                                value={theme.bioAlign || ''} 
                                onChange={(e) => setTheme({ ...theme, bioAlign: e.target.value as any })}
                                className="w-full bg-[#0a0a0a] text-xs text-white py-2.5 px-3 rounded-lg border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 outline-none transition-all"
                              >
                                <option value="">Padrão</option>
                                <option value="center">Centralizado</option>
                                <option value="left">Esquerda</option>
                                <option value="right">Direita</option>
                                <option value="justify">Justificado</option>
                              </select>
                            </div>
                            <div className="sm:col-span-4 space-y-1.5">
                              <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Cor do Texto da Bio</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={theme.bioColor || '#ffffff'}
                                  onChange={(e) => setTheme({ ...theme, bioColor: e.target.value })}
                                  className="w-10 h-10 rounded-lg border border-white/5 bg-transparent cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  placeholder="Ex: Padrão do Tema ou #ffffff"
                                  value={theme.bioColor || ''}
                                  onChange={(e) => setTheme({ ...theme, bioColor: e.target.value })}
                                  className="flex-1 bg-[#0a0a0a] text-xs text-white px-4 rounded-lg border border-white/5 hover:border-white/10 focus:border-[#a78bfa]/50 outline-none transition-all"
                                />
                                {theme.bioColor && (
                                  <button type="button" onClick={() => setTheme({ ...theme, bioColor: undefined })} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold px-3 rounded-lg border border-rose-500/20 transition-all uppercase tracking-wider">Limpar</button>
                                )}
                              </div>
                            </div>
                          </div>
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
                              onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { setProfilePicUrl(await compressImage(file, 400, 400, 0.9)); } catch {} } e.target.value = ''; }} />
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
                              onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { setCoverUrl(await compressImage(file, 1200, 480, 0.85)); } catch {} } e.target.value = ''; }} />
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

                {/* Google Analytics 4 */}
                <div className="relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <BarChart4 className="w-4 h-4 text-emerald-400" />
                        Google Analytics
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={analyticsEnabled}
                          onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-zinc-800 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                        <span className="ml-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          {analyticsEnabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </label>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Conecte sua própria propriedade do Google Analytics 4 para rastrear visitas e cliques na sua página pública.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="relative flex-1 w-full">
                        <input
                          type="text"
                          placeholder="G-XXXXXXXXXX"
                          value={measurementId}
                          onChange={(e) => setMeasurementId(e.target.value.toUpperCase().trim())}
                          className="w-full bg-[#111111] text-xs font-mono text-zinc-300 py-3 px-4 rounded-xl border border-white/5 hover:border-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-zinc-600 outline-none"
                          disabled={!analyticsEnabled}
                        />
                        {measurementId && analyticsEnabled && /^G-[A-Z0-9]{8,12}$/i.test(measurementId) && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const gaId = measurementId.trim();
                          if (gaId && !/^G-[A-Z0-9]{8,12}$/i.test(gaId)) {
                            setSaveToast({ kind: 'error', message: 'Formato inválido. Use G-XXXXXXXXXX' });
                            setTimeout(() => setSaveToast(null), 3500);
                            return;
                          }
                          const ok = await persistProfile({
                            measurementId: gaId || '',
                            analyticsEnabled,
                          });
                          if (ok) {
                            setSaveToast({ kind: 'success', message: 'Configuração do GA salva!' });
                            setTimeout(() => setSaveToast(null), 2500);
                          }
                        }}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                        disabled={!analyticsEnabled}
                      >
                        Salvar GA
                      </button>
                    </div>
                    {measurementId && analyticsEnabled && (
                      <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-xl p-3">
                        <p className="text-[10px] text-emerald-400/80 font-mono">
                          ✓ GA4 ativo — Measurement ID: <strong className="text-emerald-300">{measurementId}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
                  <React.Suspense fallback={<TabLoader />}>
                    <ThemeSelector currentTheme={theme} onChange={handleThemeChange} />
                  </React.Suspense>
                </div>

                {/* pb spacer */}
                <div className="h-10" />

              </div>{/* END LEFT COLUMN */}

              {/* Mobile preview button for Aparência tab */}
              <button
                onClick={() => setShowMobilePreview(true)}
                className="lg:hidden fixed right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-[#a78bfa] to-indigo-600 text-white shadow-xl shadow-[#a78bfa]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Pré-visualizar"
                style={{ bottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}
              >
                <Smartphone className="w-5 h-5" />
              </button>

              {/* Mobile preview overlay for Aparência tab */}
              {showMobilePreview && renderPhonePreview({ mobile: true })}

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
          className={`fixed right-4 z-[100] px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            saveToast.kind === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
              : saveToast.kind === 'theme'
              ? 'bg-[#0f172a]/95 border-[#a78bfa]/40 text-[#a78bfa]'
              : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
          }`}
          style={{ bottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              saveToast.kind === 'error' ? 'bg-rose-400' : saveToast.kind === 'theme' ? 'bg-[#a78bfa]' : 'bg-emerald-400'
            }`}
          />
          {saveToast.message}
        </div>
      )}
    </motion.div>
  );
}
