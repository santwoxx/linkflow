import React, { useState, useEffect } from 'react';
import { UserProfile, LinkItem, ADMIN_EMAIL, DEFAULT_LAYOUT } from '../types';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ExternalLink, Copy, Check, Sparkles, MessageSquare, Link as LinkIcon, LogIn, Star, Crown, UserPlus, UserCheck, Briefcase, ShoppingBag, Clock, ShieldCheck, Music } from 'lucide-react';
import CommunityFeed from './CommunityFeed';
import { isFollowing, followUser, unfollowUser } from '../utils/follow';
import GoToNatanDevButton from './GoToNatanDevButton';

interface PublicProfileProps {
  profile: UserProfile;
  links: LinkItem[];
  previewMode?: boolean;
}

export default function PublicProfile({ profile, links, previewMode = false }: PublicProfileProps) {
  const [copied, setCopied] = useState(false);
  const [profileTab, setProfileTab] = useState<'links' | 'social'>('links');
  
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [sessionProfile, setSessionProfile] = useState<UserProfile | null>(null);
  const [proData, setProData] = useState<any>(null);

  // Check professional profile
  useEffect(() => {
    if (profile.serviceEnabled && profile.verifiedProfessional && profile.uid) {
      getDoc(doc(db, 'professional_profiles', profile.uid))
        .then(snap => {
          if (snap.exists()) {
            setProData(snap.data());
          }
        })
        .catch(err => {
          if (!String(err).includes('offline')) {
            console.error('Erro ao buscar perfil profissional:', err);
          }
        });
    }
  }, [profile]);

  // Follow state
  const [followingState, setFollowingState] = useState(false);
  const [followersCount, setFollowersCount] = useState(profile.followersCount || 0);
  const [followingCount, setFollowingCount] = useState(profile.followingCount || 0);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = sessionProfile?.uid === profile.uid;

  // Check follow status on mount / session change
  useEffect(() => {
    if (previewMode || !sessionProfile || isOwnProfile) {
      setFollowingState(false);
      return;
    }
    isFollowing(sessionProfile.uid, profile.uid).then(setFollowingState);
  }, [sessionProfile, profile.uid, previewMode, isOwnProfile]);

  // Sync counts when profile changes
  useEffect(() => {
    setFollowersCount(profile.followersCount || 0);
    setFollowingCount(profile.followingCount || 0);
  }, [profile.followersCount, profile.followingCount]);

  const handleToggleFollow = async () => {
    if (!sessionProfile || followLoading) return;
    setFollowLoading(true);
    try {
      if (followingState) {
        await unfollowUser(sessionProfile.uid, profile.uid);
        setFollowingState(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        await followUser(sessionProfile.uid, profile.uid);
        setFollowingState(true);
        setFollowersCount((c) => c + 1);
      }
    } catch (err) {
      console.error('Erro ao seguir/deixar de seguir:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  // Authenticate session listener
  useEffect(() => {
    if (previewMode) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setSessionUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSessionProfile(docSnap.data() as UserProfile);
          }
        } catch (err: any) {
          const isOfflineProfile = err?.message?.includes('offline') || String(err).includes('offline');
          if (isOfflineProfile) {
            console.warn("Firestore offline ao carregar perfil do visitante. Pulando...");
          } else {
            console.error("Erro ao carregar perfil do visitante:", err);
          }
        }
      } else {
        setSessionProfile(null);
      }
    });

    return () => unsubscribe();
  }, [previewMode]);

  // Extract styling rules from config
  const theme = profile.theme;
  const layout = theme.layout || DEFAULT_LAYOUT;
  const isCustomBg = theme.backgroundColor && (theme.backgroundColor.startsWith('#') || theme.backgroundColor.startsWith('rgb') || theme.backgroundColor.startsWith('hsl'));
  
  // Decide font class
  let fontClass = 'font-sans';
  if (theme.fontFamily === 'space') fontClass = 'font-space';
  else if (theme.fontFamily === 'serif') fontClass = 'font-serif';
  else if (theme.fontFamily === 'mono') fontClass = 'font-mono';
  else if (theme.fontFamily === 'outfit') fontClass = 'font-outfit';
  else if (theme.fontFamily === 'syne') fontClass = 'font-syne';
  else if (theme.fontFamily === 'cinzel') fontClass = 'font-cinzel';
  else if (theme.fontFamily === 'bebas') fontClass = 'font-bebas';
  else if (theme.fontFamily === 'caveat') fontClass = 'font-caveat';

  // Admin/CEO check
  const isOwner = profile.email === ADMIN_EMAIL || profile.role === 'admin';

  // Premium font spacing
  const letterSpacingClass = theme.letterSpacing === 'tight' ? 'tracking-tight' :
    theme.letterSpacing === 'wide' ? 'tracking-wide' :
    theme.letterSpacing === 'wider' ? 'tracking-wider' : 'tracking-normal';

  // Premium text alignment
  const textAlignClass = theme.textAlign === 'left' ? 'text-left' : 'text-center';

  // Premium button size
  const buttonSizeClass = theme.buttonSize === 'small' ? 'py-3 px-4 text-[11px]' :
    theme.buttonSize === 'large' ? 'py-5 px-8 text-sm' : 'py-4 px-6 text-xs';

  // Layout-based classes
  const avatarSizeClass = layout.avatarSize === 'small' ? 'w-16 h-16' :
    layout.avatarSize === 'large' ? 'w-32 h-32' : 'w-24 h-24';
  const avatarBorderSize = layout.avatarSize === 'small' ? 'border-2' :
    layout.avatarSize === 'large' ? 'border-[6px]' : 'border-4';
  const contentMaxW = layout.contentWidth === 'narrow' ? 'max-w-sm' :
    layout.contentWidth === 'wide' ? 'max-w-lg' : 'max-w-md';
  const layoutSpacing = layout.elementSpacing === 'compact' ? 'gap-3' :
    layout.elementSpacing === 'spacious' ? 'gap-6' : 'gap-4';
  const layoutMt = layout.elementSpacing === 'compact' ? 'mt-2' :
    layout.elementSpacing === 'spacious' ? 'mt-5' : 'mt-3';

  // Active links sorted by order
  const activeLinks = links
    .filter((l) => l.active)
    .sort((a, b) => a.order - b.order);

  // Function to register outbound metric clicks
  const handleRegisterClick = async (link: LinkItem) => {
    if (previewMode) {
      console.log(`[Preview] Simulação de clique no link: ${link.title}`);
      return;
    }

    if (profile.uid === 'demo-user-123') {
      const savedClicks = localStorage.getItem('demo_clicks');
      const list = savedClicks ? JSON.parse(savedClicks) : [];
      list.unshift({
        id: `c-${Date.now()}`,
        linkId: link.id,
        timestampDate: new Date().toISOString()
      });
      localStorage.setItem('demo_clicks', JSON.stringify(list));
      console.log(`[Demo] Clique local gravado com sucesso!`);
      return;
    }

    try {
      // Create a unique Click identifier
      const clicksRef = collection(db, 'users', profile.uid, 'clicks');
      const clickDocRef = doc(clicksRef);
      const clickId = clickDocRef.id;

      await setDoc(clickDocRef, {
        id: clickId,
        linkId: link.id,
        timestamp: serverTimestamp()
      });
      console.log(`Clique gravado com sucesso!`);
    } catch (error) {
      // Silent logging, fallback to handler but don't disrupt user navigation
      console.error("Incapaz de registrar clique:", error);
    }
  };

  // Copy profile link
  const handleCopyLink = () => {
    const currentUrl = `${window.location.origin}${window.location.pathname}?u=${profile.username}`;
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Button interactive styling based on theme
  const getButtonStyle = () => {
    const base = `w-full max-w-md ${buttonSizeClass} text-center font-semibold transition-all duration-300 flex items-center justify-between group cursor-pointer `;
    
    // Border radius
    const radiusClass = theme.borderRadius === 'none' ? 'rounded-none' :
      theme.borderRadius === 'subtle' ? 'rounded-lg' :
      theme.borderRadius === 'full' ? 'rounded-full' : 'rounded-2xl';
    
    // Solid background styles
    const hasSolidColor = theme.buttonColor && (theme.buttonColor.startsWith('#') || theme.buttonColor.startsWith('rgb'));
    const solidBg = hasSolidColor ? { backgroundColor: theme.buttonColor, color: theme.buttonTextColor } : {};

    // Premium gradient button override
    const hasGradient = !!theme.buttonGradient;
    const gradientBg = hasGradient ? { background: theme.buttonGradient, color: theme.buttonTextColor, border: 'none' } : {};

    let variantClasses = radiusClass + " ";
    
    switch (theme.cardStyle) {
      case 'rounded':
        variantClasses += "hover:scale-[1.02] active:scale-[0.98] shadow-sm";
        break;
      case 'outline':
        variantClasses += "border-2 hover:bg-white/5 active:scale-[0.98]";
        if (!hasSolidColor && !hasGradient) variantClasses += " border-current";
        break;
      case 'shadow':
        variantClasses += "hover:scale-[1.02] active:scale-[0.98] shadow-lg border border-white/10 hover:shadow-xl";
        break;
      case 'brutalist':
        variantClasses = `${radiusClass} border-2 border-black font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`;
        if (radiusClass === 'rounded-full') variantClasses = variantClasses.replace('rounded-full', 'rounded-none');
        break;
      case 'flat':
      default:
        variantClasses += "hover:scale-[1.02] active:scale-[0.98] shadow-sm";
        break;
    }

    // PREMIUM: Glassmorphism Effect Override
    if (theme.glassmorphism) {
      variantClasses += " backdrop-blur-lg bg-white/10 border border-white/20 hover:bg-white/20 shadow-xl";
      return { className: base + variantClasses, style: { color: theme.buttonTextColor } };
    }

    return { className: base + variantClasses, style: hasGradient ? gradientBg : solidBg };
  };

  const btnStyle = getButtonStyle();

  // --- RENDER HELPERS ---
  const RenderAvatar = ({ profile: p, theme: t, avatarSizeClass: sizeClass, avatarBorderSize: borderSize }: { profile: UserProfile; theme: any; avatarSizeClass: string; avatarBorderSize: string }) => (
    <div className={`flex ${layout.avatarAlignment === 'left' ? 'justify-start w-full' : layout.avatarAlignment === 'right' ? 'justify-end w-full' : 'justify-center'}`}>
      {p.profilePicUrl ? (
        <div className="relative inline-block">
          {t.avatarFrame === 'story' && <div className="absolute -inset-1.5 rounded-full z-0" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '50%' }}></div>}
          {t.avatarFrame === 'gold' && <div className="absolute -inset-1.5 rounded-full z-0 bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]"></div>}
          {t.avatarFrame === 'neon' && <div className="absolute -inset-1.5 rounded-full z-0 bg-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.9)] animate-pulse"></div>}
          {t.avatarFrame === 'cyberpunk' && <div className="absolute -inset-1.5 rounded-sm z-0 bg-fuchsia-500 transform rotate-45"></div>}
          {t.avatarFrame === 'rainbow' && <div className="absolute -inset-2 rounded-full z-0 animate-spin" style={{ background: 'conic-gradient(#ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0000)', borderRadius: '50%', animationDuration: '4s' }}></div>}
          {t.avatarFrame === 'fire' && <div className="absolute -inset-1.5 rounded-full z-0" style={{ background: 'linear-gradient(135deg, #ff4500 0%, #ff8c00 50%, #ffd700 100%)', borderRadius: '50%', boxShadow: '0 0 25px rgba(255,100,0,0.7)' }}></div>}
          <img id="profile-avatar" src={p.profilePicUrl} referrerPolicy="no-referrer" alt={p.displayName}
            className={`${sizeClass} rounded-full object-cover ${borderSize} border-[#0a1128] bg-[#0a1128] relative z-10 ${t.avatarGlow ? 'shadow-[0_0_25px_rgba(255,255,255,0.25)]' : 'shadow-lg'}`} />
        </div>
      ) : (
        <div className="relative inline-block">
          {t.avatarFrame === 'story' && <div className="absolute -inset-1.5 rounded-full z-0" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '50%' }}></div>}
          {t.avatarFrame === 'gold' && <div className="absolute -inset-1.5 rounded-full z-0 bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]"></div>}
          {t.avatarFrame === 'neon' && <div className="absolute -inset-1.5 rounded-full z-0 bg-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.9)] animate-pulse"></div>}
          {t.avatarFrame === 'cyberpunk' && <div className="absolute -inset-1.5 rounded-sm z-0 bg-fuchsia-500 transform rotate-45"></div>}
          {t.avatarFrame === 'rainbow' && <div className="absolute -inset-2 rounded-full z-0 animate-spin" style={{ background: 'conic-gradient(#ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0000)', borderRadius: '50%', animationDuration: '4s' }}></div>}
          {t.avatarFrame === 'fire' && <div className="absolute -inset-1.5 rounded-full z-0" style={{ background: 'linear-gradient(135deg, #ff4500 0%, #ff8c00 50%, #ffd700 100%)', borderRadius: '50%', boxShadow: '0 0 25px rgba(255,100,0,0.7)' }}></div>}
          <div id="avatar-fallback" className={`${sizeClass} rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold ${borderSize} border-[#0a1128] relative z-10 ${t.avatarGlow ? 'shadow-[0_0_25px_rgba(255,255,255,0.25)]' : 'shadow-lg'}`}>
            {p.displayName ? p.displayName.charAt(0).toUpperCase() : '?'}
          </div>
        </div>
      )}
    </div>
  );

  const titleColor = theme.titleColor || '#ffffff';
  const titleStyle_ = theme.titleStyle || 'text';

  const RenderName = ({ profile: p, isOwner: owner, layoutMt: mt }: { profile: UserProfile; isOwner: boolean; layoutMt: string }) => (
    <h1 id="profile-display-name" className={`text-xl font-bold ${mt} flex items-center justify-center gap-2 ${layout.avatarAlignment === 'left' ? 'justify-start' : layout.avatarAlignment === 'right' ? 'justify-end' : 'justify-center'}`} style={{ color: titleColor }}>
      {titleStyle_ === 'logo' && theme.titleLogoUrl ? (
        <img src={theme.titleLogoUrl} alt={p.displayName} className="max-h-10 max-w-[200px] object-contain" />
      ) : (
        p.displayName || `@${p.username}`
      )}
      {owner && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-lg shadow-amber-500/30 animate-pulse">
          <Crown className="w-3 h-3" /> CEO
        </span>
      )}
    </h1>
  );

  const RenderUsername = ({ profile: p }: { profile: UserProfile }) => (
    <p id="profile-username" className="text-xs opacity-60 font-mono mt-1 text-slate-300">{p.username && `@${p.username}`}</p>
  );

  const RenderBio = ({ profile: p }: { profile: UserProfile }) => (
    p.bio ? <p id="profile-bio" className="text-sm opacity-85 max-w-sm mt-3 whitespace-pre-line leading-relaxed text-slate-100 break-words">{p.bio}</p> : null
  );

  // --- MEDIA BACKGROUND HANDLERS ---
  const bgType = theme.backgroundType || 'color';
  
  const getContainerStyle = () => {
    if (bgType === 'color' && isCustomBg) return { backgroundColor: theme.backgroundColor };
    if (bgType === 'gradient' && theme.backgroundGradient) return { background: theme.backgroundGradient };
    if (bgType === 'image' && theme.backgroundImageUrl && !theme.wallpaperBlur) {
      return { 
        backgroundImage: `url(${theme.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...(!previewMode ? { backgroundAttachment: 'fixed' } : {}),
      };
    }
    return {};
  };

  return (
    <div
      id="public-profile-screen"
      style={getContainerStyle()}
      className={`${previewMode ? 'min-h-0' : 'min-h-[100dvh]'} w-full flex flex-col justify-between items-center py-12 px-6 relative transition-all duration-500 ${fontClass} ${letterSpacingClass} ${textAlignClass} ${
        bgType === 'color' && !isCustomBg ? theme.backgroundColor || 'bg-zinc-950 text-zinc-100' : 'text-zinc-100'
      } ${theme.patternOverlay === 'dots' ? 'bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:20px_20px]' : ''} ${theme.patternOverlay === 'grid' ? 'bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:40px_40px]' : ''} ${theme.patternOverlay === 'crosshatch' ? 'bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_6px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_6px)]' : ''} ${theme.patternOverlay === 'waves' ? 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.04)_0%,transparent_50%),radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.02)_0%,transparent_50%)]' : ''} ${theme.wallpaperNoise ? 'bg-noise' : ''}`}
    >
      {/* Video Background */}
      {theme.wallpaperStyle === 'video' && theme.wallpaperVideoUrl && (
        <video autoPlay muted loop playsInline className={`${previewMode ? 'absolute' : 'fixed'} inset-0 w-full h-full object-cover z-0 pointer-events-none`}>
          <source src={theme.wallpaperVideoUrl} type="video/mp4" />
        </video>
      )}

      {/* Background Image Layer with optional blur */}
      {bgType === 'image' && theme.backgroundImageUrl && (
        <div
          className={`${previewMode ? 'absolute' : 'fixed'} inset-0 z-0 pointer-events-none`}
          style={{
            backgroundImage: `url(${theme.backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: theme.wallpaperBlur ? `blur(${theme.wallpaperBlur}px) scale(${1 + (theme.wallpaperBlur || 0) / 100})` : 'none',
            ...(!previewMode ? { backgroundAttachment: 'fixed' } : {}),
          }}
        />
      )}

      {/* Optional Dark Overlay for readability when using Images or Video */}
      {((bgType === 'image' && theme.backgroundImageUrl) || (theme.wallpaperStyle === 'video' && theme.wallpaperVideoUrl)) ? (
        <div className={`${previewMode ? 'absolute' : 'fixed'} inset-0 z-[1] bg-black/40 backdrop-blur-[1px] pointer-events-none`} />
      ) : null}



      <div className={`w-full ${contentMaxW} flex flex-col items-center relative z-10`}>
        {/* Share Button (Only visible top-right on public profiles or simulated) */}
        {!previewMode && (
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            <GoToNatanDevButton variant="icon" className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 hover:bg-zinc-800/80 p-2.5 rounded-full" />
            <button
              id="share-profile-btn"
              onClick={handleCopyLink}
              type="button"
              className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 hover:bg-zinc-800/80 text-zinc-300 hover:text-zinc-100 p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer"
              title="Copiar link para divulgar"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* 1. Header Information */}
        {/* Hero layout - full-bleed cover with text overlay */}
        {theme.headerStyle === 'hero' ? (
          <div id="profile-card-hero" className={`w-full ${contentMaxW} relative ${layout.elementSpacing === 'compact' ? 'mb-4' : layout.elementSpacing === 'spacious' ? 'mb-8' : 'mb-6'} rounded-2xl overflow-hidden`}>
            <div className="w-full h-56 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900">
              {profile.coverUrl ? (
                <img src={profile.coverUrl} alt="Hero" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/30 via-slate-950/60 to-indigo-950/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center">
                <RenderAvatar profile={profile} theme={theme} avatarSizeClass="w-20 h-20" avatarBorderSize="border-4" />
                <RenderName profile={profile} isOwner={isOwner} layoutMt="mt-3" />
                <RenderUsername profile={profile} />
                <RenderBio profile={profile} />
              </div>
            </div>
          </div>
        ) : layout.headerLayout === 'stacked' && (
          <div id="profile-card-header" className={`w-full ${contentMaxW} ${layout.elementSpacing === 'compact' ? 'mb-4' : layout.elementSpacing === 'spacious' ? 'mb-8' : 'mb-6'} rounded-2xl overflow-hidden bg-black/20 border border-white/5 shadow-md`}>
            {layout.showCover && (
              <div className="w-full h-32 relative overflow-hidden bg-gradient-to-tr from-slate-900 via-indigo-950/50 to-slate-900 border-b border-white/5">
                {profile.coverUrl ? (
                  <img src={profile.coverUrl} alt="Foto de Capa" referrerPolicy="no-referrer" className="w-full h-full object-cover transition-all duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[#a78bfa]/20 via-slate-950/40 to-indigo-950/15">
                    <div role="img" className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
                  </div>
                )}
              </div>
            )}
            <div className={`flex flex-col items-center ${layout.avatarAlignment === 'left' ? 'items-start px-4' : layout.avatarAlignment === 'right' ? 'items-end px-4' : 'items-center px-4'} pb-6 ${layout.showCover ? 'mt-4' : 'mt-6'} relative z-10`}>
              <RenderAvatar profile={profile} theme={theme} avatarSizeClass={avatarSizeClass} avatarBorderSize={avatarBorderSize} />
              <RenderName profile={profile} isOwner={isOwner} layoutMt={layoutMt} />
              <RenderUsername profile={profile} />
              <RenderBio profile={profile} />
            </div>
          </div>
        )}

        {layout.headerLayout === 'detached' && (
          <>
            {layout.showCover && (
              <div className={`w-full ${contentMaxW} h-32 rounded-2xl overflow-hidden bg-black/20 border border-white/5 shadow-md mb-4`}>
                {profile.coverUrl ? (
                  <img src={profile.coverUrl} alt="Foto de Capa" referrerPolicy="no-referrer" className="w-full h-full object-cover transition-all duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[#a78bfa]/20 via-slate-950/40 to-indigo-950/15">
                    <div role="img" className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
                  </div>
                )}
              </div>
            )}
            <div className={`w-full ${contentMaxW} rounded-2xl bg-black/20 border border-white/5 shadow-md p-6 ${layout.elementSpacing === 'compact' ? 'mb-4' : layout.elementSpacing === 'spacious' ? 'mb-8' : 'mb-6'}`}>
              <div className={`flex flex-col ${layout.avatarAlignment === 'left' ? 'items-start' : layout.avatarAlignment === 'right' ? 'items-end' : 'items-center'}`}>
                <RenderAvatar profile={profile} theme={theme} avatarSizeClass={avatarSizeClass} avatarBorderSize={avatarBorderSize} />
                <RenderName profile={profile} isOwner={isOwner} layoutMt={layoutMt} />
                <RenderUsername profile={profile} />
                <RenderBio profile={profile} />
              </div>
            </div>
          </>
        )}

        {layout.headerLayout === 'minimal' && (
          <div className={`w-full ${contentMaxW} rounded-2xl bg-black/20 border border-white/5 shadow-md p-6 ${layout.elementSpacing === 'compact' ? 'mb-4' : layout.elementSpacing === 'spacious' ? 'mb-8' : 'mb-6'}`}>
            <div className={`flex flex-col ${layout.avatarAlignment === 'left' ? 'items-start' : layout.avatarAlignment === 'right' ? 'items-end' : 'items-center'}`}>
              <RenderAvatar profile={profile} theme={theme} avatarSizeClass={avatarSizeClass} avatarBorderSize={avatarBorderSize} />
              <RenderName profile={profile} isOwner={isOwner} layoutMt={layoutMt} />
              <RenderUsername profile={profile} />
              <RenderBio profile={profile} />
            </div>
          </div>
        )}

        {(!layout.headerLayout || layout.headerLayout === 'overlapping') && theme.headerStyle !== 'hero' && (
          <div id="profile-card-header" className={`w-full ${contentMaxW} relative ${layout.elementSpacing === 'compact' ? 'mb-4' : layout.elementSpacing === 'spacious' ? 'mb-8' : 'mb-6'} rounded-2xl overflow-hidden bg-black/20 border border-white/5 shadow-md`}>
            {layout.showCover && (
              <div className="w-full h-32 relative overflow-hidden bg-gradient-to-tr from-slate-900 via-indigo-950/50 to-slate-900 border-b border-white/5">
                {profile.coverUrl ? (
                  <img src={profile.coverUrl} alt="Foto de Capa" referrerPolicy="no-referrer" className="w-full h-full object-cover transition-all duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[#a78bfa]/20 via-slate-950/40 to-indigo-950/15">
                    <div role="img" className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
                  </div>
                )}
              </div>
            )}
            <div className={`flex flex-col items-center ${layout.avatarAlignment === 'left' ? 'items-start pl-5' : layout.avatarAlignment === 'right' ? 'items-end pr-5' : 'items-center'} px-4 pb-6 ${layout.showCover ? 'mt-[-48px]' : 'mt-6'} relative z-10`}>
              <RenderAvatar profile={profile} theme={theme} avatarSizeClass={avatarSizeClass} avatarBorderSize={avatarBorderSize} />
              <RenderName profile={profile} isOwner={isOwner} layoutMt={layoutMt} />
              <RenderUsername profile={profile} />
              <RenderBio profile={profile} />
            </div>
          </div>
        )}

        {/* Follow Stats + Button */}
        {!previewMode && (
          <div className={`w-full ${contentMaxW} flex items-center justify-between gap-4 ${layout.elementSpacing === 'compact' ? 'mb-4' : layout.elementSpacing === 'spacious' ? 'mb-8' : 'mb-6'} px-4`}>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-sm font-extrabold text-white">{followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}k` : followersCount}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-extrabold text-white">{followingCount >= 1000 ? `${(followingCount / 1000).toFixed(1)}k` : followingCount}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Seguindo</p>
              </div>
            </div>
            {sessionProfile && !isOwnProfile && (
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  followingState
                    ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                    : 'bg-[#a78bfa] text-white hover:bg-[#c4b5fd] shadow-md shadow-[#a78bfa]/20'
                } ${followLoading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {followingState ? (
                  <><UserCheck className="w-3.5 h-3.5" /> Seguindo</>
                ) : (
                  <><UserPlus className="w-3.5 h-3.5" /> Seguir</>
                )}
              </button>
            )}
          </div>
        )}

        {/* 2. Brand Tabs: Links and Social Feed */}
        <div className={`flex bg-black/25 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 w-full ${contentMaxW} gap-1 ${layout.elementSpacing === 'compact' ? 'mb-4' : layout.elementSpacing === 'spacious' ? 'mb-8' : 'mb-6'} justify-center`}>
          <button
            type="button"
            onClick={() => setProfileTab('links')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              profileTab === 'links'
                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Links
          </button>
          
          <button
            type="button"
            onClick={() => setProfileTab('social')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              profileTab === 'social'
                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Rede Social
          </button>
        </div>

        {/* 3. Conditional Content Rendering */}
        {profileTab === 'links' ? (
          <div id="profile-buttons-list" className={`w-full flex flex-col items-center ${layoutSpacing}`}>
            {activeLinks.length === 0 ? (
              <div className={`text-center py-12 px-4 rounded-xl border border-dashed border-white/10 ${contentMaxW} w-full bg-white/5 backdrop-blur-sm`}>
                <p className="text-sm opacity-60">Nenhum link disponível no momento.</p>
              </div>
            ) : (
              <>
              {profile.serviceEnabled && profile.verifiedProfessional && proData && (
                <div className="w-full max-w-md space-y-4 mb-6">
                  <h3 className="text-xs font-bold text-center uppercase tracking-widest flex items-center justify-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-[#a78bfa]" /> Serviços Profissionais
                  </h3>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Profissional Verificado LinkFlow</span>
                    </div>
                    <h4 className="text-lg font-black text-white mb-1 font-sans">{proData.profession}</h4>
                    {proData.skills && proData.skills.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] text-white/60 uppercase tracking-wider block mb-2 font-bold">Especialidades:</span>
                        <div className="flex flex-wrap gap-2">
                          {proData.skills.map((skill: string, i: number) => (
                            <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/10 text-white shadow-sm border border-white/10">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {proData.whatsapp && (
                      <a
                        href={`https://wa.me/${proData.whatsapp.replace(/\D/g, '')}?text=Olá! Encontrei seu perfil no LinkFlow e gostaria de solicitar um orçamento.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" /> Entrar em contato
                      </a>
                    )}
                  </div>
                </div>
              )}
              {activeLinks.map((link) => {
                const animClass = link.animation === 'pulse' ? ' anim-pulse' :
                                  link.animation === 'wobble' ? ' anim-wobble' :
                                  link.animation === 'bounce' ? ' anim-bounce' :
                                  link.animation === 'glow' ? ' anim-glow' : '';
                
                // --- SPECIALIZED BLOCKS RENDER ---
                
                // Promo Banner
                if (link.type === 'promo_banner') {
                  return (
                    <a
                      key={link.id}
                      href={link.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleRegisterClick(link)}
                      className={`w-full max-w-md rounded-2xl overflow-hidden block shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 ${animClass}`}
                    >
                      <img src={link.imageUrl} alt={link.title} className="w-full h-auto object-cover" />
                    </a>
                  );
                }

                // Products Carousel
                if (link.type === 'products') {
                  const products = link.content || [];
                  if (products.length === 0) return null;
                  return (
                    <div key={link.id} className="w-full max-w-md space-y-3 relative">
                      <h3 className="text-sm font-bold text-center uppercase tracking-widest">{link.title}</h3>
                      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 w-[calc(100%+3rem)] scroll-px-6">
                        {products.map((prod: any, idx: number) => (
                          <a
                            key={idx}
                            href={prod.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-[140px] w-[140px] shrink-0 snap-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-2 flex flex-col gap-2 hover:bg-white/20 transition-all cursor-pointer shadow-xl"
                          >
                            <img src={prod.imageUrl} alt={prod.name} className="w-full aspect-square rounded-xl object-cover" />
                            <div className="px-1 pb-1">
                              <h4 className="text-[11px] font-semibold truncate text-white">{prod.name}</h4>
                              <p className="text-xs font-black text-emerald-400 mt-1">{prod.price}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Image Gallery
                if (link.type === 'gallery') {
                  const images = link.content || [];
                  if (images.length === 0) return null;
                  return (
                    <div key={link.id} className="w-full max-w-md space-y-3">
                      <h3 className="text-sm font-bold text-center uppercase tracking-widest">{link.title}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {images.map((imgUrl: string, idx: number) => (
                          <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-white/10 shadow-sm">
                            <img src={imgUrl} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt="Galeria" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Services Marketplace (Linkdim-style)
                if (link.type === 'services') {
                  const services = link.content || [];
                  if (services.length === 0) return null;
                  return (
                    <div key={link.id} className="w-full max-w-md space-y-3">
                      <h3 className="text-sm font-bold text-center uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-emerald-400" /> {link.title}
                      </h3>
                      <p className="text-[10px] text-white/50 text-center -mt-1">Cada profissional é responsável pelo seu serviço. O LinkFlow não é intermediador.</p>
                      <div className="space-y-3">
                        {services.map((svc: any, idx: number) => (
                          <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all shadow-lg">
                            <div className="flex items-start gap-3">
                              {svc.imageUrl && (
                                <img src={svc.imageUrl} alt={svc.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-bold text-white truncate">{svc.name}</h4>
                                  {svc.category && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 uppercase tracking-wider shrink-0">
                                      {svc.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-white/70 leading-relaxed line-clamp-2">{svc.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-base font-black text-emerald-400">{svc.price}</span>
                                  {svc.deliveryTime && (
                                    <span className="text-[9px] text-white/40 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {svc.deliveryTime}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                              <a
                                href={svc.whatsapp ? `https://wa.me/${svc.whatsapp.replace(/\D/g, '')}?text=Olá! Tenho interesse no serviço: ${svc.name}` : svc.contactLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Contratar
                              </a>
                              {svc.whatsapp && (
                                <a
                                  href={`https://wa.me/${svc.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  WhatsApp
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-[9px] text-white/30 text-center flex items-center justify-center gap-1 pt-1">
                        <ShieldCheck className="w-3 h-3" />
                        Transação direta entre você e o profissional
                      </div>
                    </div>
                  );
                }

                // Testimonials
                if (link.type === 'testimonials') {
                  const tests = link.content || [];
                  if (tests.length === 0) return null;
                  return (
                    <div key={link.id} className="w-full max-w-md space-y-3 relative">
                      <h3 className="text-sm font-bold text-center uppercase tracking-widest flex items-center justify-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-400"/> {link.title}</h3>
                      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 w-[calc(100%+3rem)] scroll-px-6">
                        {tests.map((t: any, idx: number) => (
                          <div key={idx} className="min-w-[260px] w-[260px] shrink-0 snap-center bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center gap-3">
                            <div className="flex gap-1">
                              {[...Array(t.rating || 5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                            </div>
                            <p className="text-xs italic text-white/80 leading-relaxed">"{t.text}"</p>
                            <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{t.name}</h4>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // --- DEFAULT BUTTON LINKS (Link, WhatsApp, Telegram, Buy Now) ---

                // Color overrides for specialized CTA buttons
                const isWhatsapp = link.type === 'whatsapp';
                const isBuyNow = link.type === 'buy_now';
                const specializedBtnStyle: Record<string, string> = { ...btnStyle.style };
                if (isWhatsapp) {
                  specializedBtnStyle.backgroundColor = '#16a34a'; // Tailwind green-600
                  specializedBtnStyle.color = '#ffffff';
                  specializedBtnStyle.border = 'none';
                } else if (isBuyNow) {
                  specializedBtnStyle.backgroundColor = '#d97706'; // Tailwind amber-600
                  specializedBtnStyle.color = '#ffffff';
                  specializedBtnStyle.border = 'none';
                }

                // Per-link advanced customization overrides
                const hasCustomBg = !!(link.useGradient && link.customGradient) || !!link.customColor;
                const customStyleClasses: string[] = [];
                if (link.customStyle === 'flat') customStyleClasses.push('!rounded-none');
                else if (link.customStyle === 'rounded') customStyleClasses.push('!rounded-2xl');
                else if (link.customStyle === 'outline') customStyleClasses.push('!rounded-xl');
                else if (link.customStyle === 'shadow') customStyleClasses.push('!rounded-xl');
                else if (link.customStyle === 'brutalist') customStyleClasses.push('!rounded-none');
                else if (link.customStyle === 'glass') customStyleClasses.push('!rounded-2xl');
                else if (link.customStyle === 'gradient') customStyleClasses.push('!rounded-xl');
                else if (link.customStyle === 'neon') customStyleClasses.push('!rounded-xl');

                if (link.customRadius === 'none') customStyleClasses.push('!rounded-none');
                else if (link.customRadius === 'subtle') customStyleClasses.push('!rounded-md');
                else if (link.customRadius === 'medium') customStyleClasses.push('!rounded-xl');
                else if (link.customRadius === 'full') customStyleClasses.push('!rounded-2xl');
                else if (link.customRadius === 'pill') customStyleClasses.push('!rounded-full');

                if (link.customSize === 'small') customStyleClasses.push('!py-1.5 !text-[10px]');
                else if (link.customSize === 'medium') customStyleClasses.push('!py-2.5 !text-xs');
                else if (link.customSize === 'large') customStyleClasses.push('!py-3.5 !text-sm');
                else if (link.customSize === 'xl') customStyleClasses.push('!py-4 !text-base');

                if (link.customShadow) customStyleClasses.push('!shadow-xl !shadow-black/40');
                if (link.customGlass) customStyleClasses.push('!backdrop-blur-md');

                if (link.customFont === 'sans') customStyleClasses.push('!font-sans');
                else if (link.customFont === 'serif') customStyleClasses.push('!font-serif');
                else if (link.customFont === 'mono') customStyleClasses.push('!font-mono');
                else if (link.customFont === 'space') customStyleClasses.push('!font-space');
                else if (link.customFont === 'outfit') customStyleClasses.push('!font-outfit');
                else if (link.customFont === 'syne') customStyleClasses.push('!font-syne');
                else if (link.customFont === 'bebas') customStyleClasses.push('!font-bebas');
                else if (link.customFont === 'caveat') customStyleClasses.push('!font-caveat');

                // Inline style overrides from per-link customization
                if (hasCustomBg) {
                  if (link.useGradient && link.customGradient) {
                    specializedBtnStyle.background = link.customGradient;
                    specializedBtnStyle.backgroundColor = '';
                  } else if (link.customColor) {
                    specializedBtnStyle.background = '';
                    specializedBtnStyle.backgroundColor = link.customColor;
                  }
                }
                if (link.customTextColor) specializedBtnStyle.color = link.customTextColor;
                if (link.customBorderWidth && link.customBorderWidth > 0) {
                  specializedBtnStyle.border = `${link.customBorderWidth}px solid ${link.customBorderColor || '#a78bfa'}`;
                }
                if (link.customStyle === 'shadow') {
                  specializedBtnStyle.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
                } else if (link.customStyle === 'brutalist') {
                  specializedBtnStyle.boxShadow = '4px 4px 0 0 #000';
                } else if (link.customStyle === 'neon' && (link.customColor || link.customGradient)) {
                  specializedBtnStyle.boxShadow = `0 0 18px ${link.customColor || '#a78bfa'}`;
                }
                if (link.customLetterSpacing) {
                  specializedBtnStyle.letterSpacing = link.customLetterSpacing === 'tight' ? '-0.02em'
                    : link.customLetterSpacing === 'wide' ? '0.05em'
                    : link.customLetterSpacing === 'wider' ? '0.15em' : '0';
                }

                const iconPos = link.customIconPosition || 'left';
                const showIcon = (!!link.iconEmoji || !!link.iconUrl) && iconPos !== 'none';
                const iconLeft = showIcon && (iconPos === 'left' || (!link.customIconPosition));
                const iconTop = showIcon && iconPos === 'top';
                const iconRight = showIcon && iconPos === 'right';
                const titleAlignClass = link.customTextAlign === 'left' ? '!items-start !text-left'
                  : link.customTextAlign === 'right' ? '!items-end !text-right' : '!items-center !text-center';
                const iconNode = link.iconUrl ? (
                  <img src={link.iconUrl} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded object-contain shrink-0 select-none" />
                ) : link.iconEmoji ? (
                  <span className="text-base shrink-0 select-none">{link.iconEmoji}</span>
                ) : null;

                return (
                  <a
                    key={link.id}
                    id={`link-node-${link.id}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleRegisterClick(link)}
                    className={`${btnStyle.className}${animClass} relative flex items-center justify-between group overflow-visible ${customStyleClasses.join(' ')}`}
                    style={specializedBtnStyle}
                  >
                    {link.badgeText && (
                      <span className="absolute -top-2 -right-1 font-mono font-black text-[9px] uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-md z-10 animate-pulse border border-white/20">
                        {link.badgeText}
                      </span>
                    )}

                    <span className="w-4"></span>

                    <div className={`flex flex-col ${titleAlignClass} w-full min-w-0 py-1.5 select-none relative`}>
                      {iconTop && iconNode}
                      <div className={`flex items-center w-full ${link.customTextAlign === 'left' ? 'justify-start' : link.customTextAlign === 'right' ? 'justify-end' : 'justify-center'} gap-2`}>
                        {iconLeft && iconNode}
                        <span className={`font-extrabold text-xs sm:text-sm tracking-wide truncate ${link.customUppercase ? 'uppercase' : ''}`}>
                          {link.title}
                        </span>
                        {iconRight && iconNode}
                      </div>

                      {link.subtitle && (
                        <span className="text-[10px] sm:text-[11px] opacity-75 font-normal tracking-wide mt-1 leading-tight truncate max-w-full">
                          {link.subtitle}
                        </span>
                      )}
                    </div>

                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </span>
                  </a>
                );
              })}
              </>
            )}
          </div>
        ) : (
          <div className={`w-full ${contentMaxW} text-left space-y-4`}>
            {/* If visitor is a guest, prompt them to sign in or sign up */}
            {!sessionUser && !previewMode && (
              <div className="bg-white/5 border border-white/10 p-4.5 rounded-2xl backdrop-blur-md text-center space-y-3 shadow-lg">
                <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                  Você está visualizando a rede social de <span className="font-bold text-white">@{profile.username}</span> como visitante. Faça login para curtir, comentar e criar o seu próprio <span className="font-bold">LinkFlow</span>!
                </p>
                <a
                  href="/"
                  className="inline-flex py-2 px-4 bg-[#a78bfa] hover:bg-[#c4b5fd] rounded-xl text-[10px] font-bold text-white uppercase tracking-wider items-center gap-1.5 transition-all hover:scale-105 cursor-pointer shadow-md shadow-[#a78bfa]/10"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar no LinkFlow
                </a>
              </div>
            )}
            
            <CommunityFeed 
              currentUserProfile={sessionProfile || {
                uid: 'guest',
                username: 'visitante',
                displayName: 'Visitante',
                bio: '',
                profilePicUrl: '',
                theme: profile.theme,
                createdAt: new Date(),
                updatedAt: new Date()
              }}
              filterByUserId={profile.uid}
              previewMode={previewMode || !sessionUser}
            />
          </div>
        )}
      </div>

      {/* Stickers - floating decorative elements */}
      {theme.stickers && theme.stickers.length > 0 && (
        <div className={`${previewMode ? 'absolute' : 'fixed'} inset-0 pointer-events-none z-20 overflow-hidden`}>
          {theme.stickers.map((sticker) => (
            <span
              key={sticker.id}
              className="absolute select-none"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                fontSize: `${sticker.scale * 1.5}rem`,
                transition: 'transform 0.2s',
              }}
            >
              {sticker.emoji}
            </span>
          ))}
        </div>
      )}

      {/* 3. Footer */}
      <div id="profile-badge-footer" className="mt-16 text-center select-none flex flex-col items-center gap-2">
        {theme.footerText && (
          <p className="text-[10px] text-white/40 max-w-xs leading-relaxed">{theme.footerText}</p>
        )}
        {theme.showBranding !== false && (
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/60 backdrop-blur-md border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all font-sans font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Desenvolvido com LinkFlow
          </a>
        )}
      </div>
    </div>
  );
}
