export interface ProfileLayout {
  headerLayout: 'overlapping' | 'stacked' | 'detached' | 'minimal';
  avatarAlignment: 'center' | 'left' | 'right';
  avatarSize: 'small' | 'medium' | 'large';
  contentWidth: 'narrow' | 'medium' | 'wide';
  elementSpacing: 'compact' | 'normal' | 'spacious';
  showCover: boolean;
}

export const DEFAULT_LAYOUT: ProfileLayout = {
  headerLayout: 'overlapping',
  avatarAlignment: 'center',
  avatarSize: 'medium',
  contentWidth: 'medium',
  elementSpacing: 'normal',
  showCover: true,
};

export interface ThemeConfig {
  id: string;
  name: string;
  backgroundClass: string;
  buttonClass: string;
  textColorClass: string;
  buttonColor: string;
  buttonTextColor: string;
  fontClass: string;
  cardStyle: 'flat' | 'rounded' | 'outline' | 'shadow' | 'brutalist';
}

export interface StickerItem {
  id: string;
  emoji: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface UserTheme {
  themeId: string;
  customBackground?: string;
  cardStyle: 'flat' | 'rounded' | 'outline' | 'shadow' | 'brutalist';
  fontFamily: string;
  buttonColor: string;
  buttonTextColor: string;
  backgroundColor: string;

  backgroundType?: 'color' | 'gradient' | 'image';
  backgroundGradient?: string;
  backgroundImageUrl?: string;
  glassmorphism?: boolean;
  avatarFrame?: 'none' | 'story' | 'gold' | 'neon' | 'cyberpunk' | 'rainbow' | 'fire';

  layout?: ProfileLayout;

  // Premium v2
  borderRadius?: 'none' | 'subtle' | 'medium' | 'full';
  buttonGradient?: string;
  letterSpacing?: 'tight' | 'normal' | 'wide' | 'wider';
  avatarGlow?: boolean;
  patternOverlay?: 'none' | 'dots' | 'grid' | 'crosshatch' | 'waves';
  buttonSize?: 'small' | 'medium' | 'large';
  textAlign?: 'center' | 'left';

  // Linktree-style Header
  headerStyle?: 'classic' | 'hero';
  titleStyle?: 'text' | 'logo';
  titleColor?: string;
  titleLogoUrl?: string;

  // Linktree-style Wallpaper
  wallpaperStyle?: 'fill' | 'gradient' | 'blur' | 'pattern' | 'image' | 'video';
  wallpaperBlur?: number;
  wallpaperNoise?: boolean;
  wallpaperVideoUrl?: string;
  gradientDirection?: 'linear-up' | 'linear-down' | 'radial';

  // Stickers
  stickers?: StickerItem[];

  // Footer
  footerText?: string;
  showBranding?: boolean;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  profilePicUrl: string;
  coverUrl?: string;
  coverColor?: string;
  coverGradient?: string;
  coverPosition?: 'top' | 'center' | 'bottom';
  coverOverlay?: number;
  theme: UserTheme;
  email?: string;
  role?: 'user' | 'admin';
  banned?: boolean;
  followersCount?: number;
  followingCount?: number;
  createdAt: any;
  updatedAt: any;
}

export const ADMIN_EMAIL = 'brisasofc@gmail.com';

export type BlockType = 'link' | 'whatsapp' | 'telegram' | 'buy_now' | 'payment' | 'products' | 'services' | 'service_card' | 'testimonials' | 'gallery' | 'promo_banner';

export interface ProductItem {
  id: string;
  name: string;
  price: string;
  oldPrice?: string;
  imageUrl: string;
  url: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  text: string;
  rating: number;
  imageUrl?: string;
}

export interface ServiceListing {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl?: string;
  whatsapp?: string;
  contactLink?: string;
  deliveryTime?: string;
}

export interface LinkItem {
  id: string;
  userId: string;
  title: string;
  url: string;
  active: boolean;
  order: number;
  type?: BlockType;        // Type of the block, defaults to 'link' if missing
  subtitle?: string;       // Subtitle under the main link title
  badgeText?: string;      // A badge text (e.g., "HOT", "NEW", "10% OFF")
  iconEmoji?: string;      // Emoji directly selected for the link
  iconUrl?: string;        // Custom logo/image for the link (overrides iconEmoji when set)
  animation?: string;      // Attention getter animation: none, pulse, wobble, bounce, glow

  // Per-button advanced customization (overrides the profile theme)
  customColor?: string;        // Background color (hex/rgba) — ignored if useGradient && customGradient
  customTextColor?: string;    // Text color (hex/rgba)
  customGradient?: string;     // CSS gradient string (e.g. linear-gradient(135deg, #f00, #00f))
  useGradient?: boolean;       // If true, use customGradient instead of customColor
  customBorderColor?: string;  // Border color
  customBorderWidth?: number;  // Border width in px (0–8)
  customStyle?: 'flat' | 'rounded' | 'outline' | 'shadow' | 'brutalist' | 'glass' | 'gradient' | 'neon';
  customRadius?: 'none' | 'subtle' | 'medium' | 'full' | 'pill';
  customSize?: 'small' | 'medium' | 'large' | 'xl';
  customShadow?: boolean;      // Drop shadow on/off
  customGlass?: boolean;       // Glassmorphism (backdrop blur + transparency) on/off
  customFont?: 'sans' | 'serif' | 'mono' | 'space' | 'outfit' | 'syne' | 'bebas' | 'caveat';
  customTextAlign?: 'left' | 'center' | 'right';
  customLetterSpacing?: 'tight' | 'normal' | 'wide' | 'wider';
  customUppercase?: boolean;   // Force uppercase title
  customIconPosition?: 'left' | 'right' | 'top' | 'none';

  // Specific fields for specialized blocks
  content?: any;           // Generic array for items (products, testimonials, services, gallery image urls)
  imageUrl?: string;       // For Promo Banner

  createdAt: any;
  updatedAt: any;
}

export interface ClickLog {
  id: string;
  linkId: string;
  timestamp: any;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'sophisticated-dark',
    name: 'Azul e Branco Premium',
    backgroundClass: 'bg-[#0a1128] text-slate-100',
    buttonClass: 'bg-[#111a36] border border-blue-500/30 text-white hover:bg-[#1a2954] hover:border-blue-400 transition-all duration-300 shadow-lg',
    textColorClass: 'text-white',
    buttonColor: '#111a36',
    buttonTextColor: '#ffffff',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'classic-dark',
    name: 'Escuridão Clássica',
    backgroundClass: 'bg-zinc-950 text-zinc-100',
    buttonClass: 'bg-zinc-900 border border-zinc-800 text-zinc-100 hover:bg-zinc-800',
    textColorClass: 'text-zinc-100',
    buttonColor: '#18181b',
    buttonTextColor: '#f4f4f5',
    fontClass: 'font-sans',
    cardStyle: 'flat'
  },
  {
    id: 'minimal-light',
    name: 'Azul e Branco Minimalista',
    backgroundClass: 'bg-slate-50 text-slate-900',
    buttonClass: 'bg-white border border-blue-100 shadow-sm text-blue-600 hover:bg-blue-50/50 transition-all duration-300',
    textColorClass: 'text-blue-900',
    buttonColor: '#ffffff',
    buttonTextColor: '#2563eb',
    fontClass: 'font-sans',
    cardStyle: 'shadow'
  },
  {
    id: 'emerald-green',
    name: 'Verde Esmeralda',
    backgroundClass: 'bg-gradient-to-tr from-emerald-950 to-teal-900 text-teal-50',
    buttonClass: 'bg-teal-900/40 border border-teal-500/20 text-teal-100 hover:bg-teal-900/60',
    textColorClass: 'text-teal-50',
    buttonColor: '#114a43',
    buttonTextColor: '#f0fdfa',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'amethyst-purple',
    name: 'Cristal Ametista',
    backgroundClass: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 text-purple-100',
    buttonClass: 'bg-purple-900/30 border border-purple-500/30 text-purple-50 hover:bg-purple-900/50',
    textColorClass: 'text-purple-100',
    buttonColor: '#581c87',
    buttonTextColor: '#faf5ff',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'sunset-peach',
    name: 'Pôr do Sol',
    backgroundClass: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white',
    buttonClass: 'bg-white/20 backdrop-blur-md text-white border border-white/20 hover:bg-white/30',
    textColorClass: 'text-white',
    buttonColor: 'rgba(255,255,255,0.2)',
    buttonTextColor: '#ffffff',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'brutalist-neon',
    name: 'Neon Brutalista',
    backgroundClass: 'bg-black text-[#ccff00]',
    buttonClass: 'bg-[#ccff00] text-black border-2 border-black font-extrabold shadow-[4px_4px_0px_0px_rgba(204,255,0,0.5)]',
    textColorClass: 'text-[#ccff00]',
    buttonColor: '#ccff00',
    buttonTextColor: '#000000',
    fontClass: 'font-mono',
    cardStyle: 'brutalist'
  },
  {
    id: 'ocean-deep',
    name: 'Oceano Profundo',
    backgroundClass: 'bg-gradient-to-b from-sky-950 via-blue-900 to-indigo-950 text-blue-100',
    buttonClass: 'bg-white/10 backdrop-blur-md border border-sky-400/30 text-sky-100 hover:bg-white/20 hover:border-sky-400/50 shadow-lg shadow-sky-500/10',
    textColorClass: 'text-blue-100',
    buttonColor: '#0c4a6e',
    buttonTextColor: '#e0f2fe',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'royal-crimson',
    name: 'Carmim Real',
    backgroundClass: 'bg-gradient-to-br from-zinc-950 via-red-950 to-rose-950 text-rose-100',
    buttonClass: 'bg-rose-900/40 border border-rose-500/30 text-rose-50 hover:bg-rose-900/60 hover:border-rose-400/50 shadow-lg shadow-rose-500/10',
    textColorClass: 'text-rose-100',
    buttonColor: '#881337',
    buttonTextColor: '#fff1f2',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'cosmic-night',
    name: 'Noite Cósmica',
    backgroundClass: 'bg-gradient-to-tr from-slate-950 via-violet-950 to-fuchsia-950 text-fuchsia-100',
    buttonClass: 'bg-violet-900/30 border border-violet-500/30 text-violet-50 hover:bg-violet-900/50 backdrop-blur-sm shadow-lg shadow-violet-500/10',
    textColorClass: 'text-fuchsia-100',
    buttonColor: '#3b0764',
    buttonTextColor: '#faf5ff',
    fontClass: 'font-sans',
    cardStyle: 'shadow'
  },
  {
    id: 'apple-premium',
    name: 'Apple',
    backgroundClass: 'bg-white text-zinc-900',
    buttonClass: 'bg-zinc-50 border border-zinc-200 text-zinc-900 hover:bg-zinc-100 shadow-sm rounded-full',
    textColorClass: 'text-zinc-900',
    buttonColor: '#fafafa',
    buttonTextColor: '#18181b',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'netflix-premium',
    name: 'Netflix',
    backgroundClass: 'bg-[#141414] text-white',
    buttonClass: 'bg-[#e50914] text-white font-bold hover:bg-[#f40612] shadow-lg shadow-red-600/20',
    textColorClass: 'text-white',
    buttonColor: '#e50914',
    buttonTextColor: '#ffffff',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'neon-premium',
    name: 'Neon',
    backgroundClass: 'bg-black text-[#00fff7]',
    buttonClass: 'bg-[#00fff7]/10 border border-[#00fff7]/40 text-[#00fff7] hover:bg-[#00fff7]/20 shadow-[0_0_15px_rgba(0,255,247,0.2)]',
    textColorClass: 'text-[#00fff7]',
    buttonColor: '#00fff7',
    buttonTextColor: '#000000',
    fontClass: 'font-mono',
    cardStyle: 'rounded'
  },
  {
    id: 'cyberpunk-premium',
    name: 'Cyberpunk 2077',
    backgroundClass: 'bg-gradient-to-br from-[#0d0221] via-[#1a0533] to-[#0d0221] text-[#ff00ff]',
    buttonClass: 'bg-[#ff00ff]/20 border border-[#00ffff]/40 text-[#00ffff] hover:bg-[#ff00ff]/30 shadow-[0_0_10px_rgba(255,0,255,0.3)]',
    textColorClass: 'text-[#ff00ff]',
    buttonColor: '#ff00ff',
    buttonTextColor: '#00ffff',
    fontClass: 'font-space',
    cardStyle: 'brutalist'
  },
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    backgroundClass: 'bg-[#0a0a0f] text-[#a78bfa]',
    buttonClass: 'bg-[#1c1c24] border border-[#a78bfa]/40 text-[#a78bfa] hover:bg-[#2a2a35] shadow-[0_0_10px_rgba(167,139,250,0.15)]',
    textColorClass: 'text-[#a78bfa]',
    buttonColor: '#1c1c24',
    buttonTextColor: '#a78bfa',
    fontClass: 'font-sans',
    cardStyle: 'shadow'
  }
];

export const CURATED_THEMES: ThemeConfig[] = [
  {
    id: 'agate',
    name: 'Agate',
    backgroundClass: 'bg-gradient-to-br from-slate-900 via-zinc-800 to-stone-900 text-stone-100',
    buttonClass: 'bg-stone-800/60 border border-stone-600/30 text-stone-100 hover:bg-stone-700/60 backdrop-blur-sm',
    textColorClass: 'text-stone-100',
    buttonColor: '#44403c',
    buttonTextColor: '#f5f5f4',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'air',
    name: 'Air',
    backgroundClass: 'bg-gradient-to-b from-sky-100 via-white to-blue-50 text-slate-800',
    buttonClass: 'bg-white/80 border border-sky-200 text-sky-800 hover:bg-white shadow-sm',
    textColorClass: 'text-slate-800',
    buttonColor: '#f0f9ff',
    buttonTextColor: '#075985',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'astrid',
    name: 'Astrid',
    backgroundClass: 'bg-gradient-to-tr from-rose-950 via-fuchsia-950 to-purple-950 text-pink-100',
    buttonClass: 'bg-white/10 backdrop-blur-md border border-pink-400/30 text-pink-100 hover:bg-white/20',
    textColorClass: 'text-pink-100',
    buttonColor: '#831843',
    buttonTextColor: '#fce7f3',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'aura',
    name: 'Aura',
    backgroundClass: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 text-violet-100',
    buttonClass: 'bg-violet-800/40 border border-violet-400/30 text-violet-50 hover:bg-violet-800/60 backdrop-blur-sm',
    textColorClass: 'text-violet-100',
    buttonColor: '#4c1d95',
    buttonTextColor: '#f5f3ff',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'bliss',
    name: 'Bliss',
    backgroundClass: 'bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 text-amber-900',
    buttonClass: 'bg-amber-100/80 border border-amber-200 text-amber-800 hover:bg-amber-200/80 shadow-sm',
    textColorClass: 'text-amber-900',
    buttonColor: '#fef3c7',
    buttonTextColor: '#92400e',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'blocks',
    name: 'Blocks',
    backgroundClass: 'bg-white text-zinc-900',
    buttonClass: 'bg-zinc-100 border-2 border-zinc-200 text-zinc-900 hover:bg-zinc-200 rounded-none font-bold',
    textColorClass: 'text-zinc-900',
    buttonColor: '#f4f4f5',
    buttonTextColor: '#18181b',
    fontClass: 'font-sans',
    cardStyle: 'flat'
  },
  {
    id: 'bloom',
    name: 'Bloom',
    backgroundClass: 'bg-gradient-to-b from-pink-50 via-rose-50 to-white text-rose-800',
    buttonClass: 'bg-white/90 border border-rose-200 text-rose-700 hover:bg-rose-50 shadow-sm backdrop-blur-sm',
    textColorClass: 'text-rose-800',
    buttonColor: '#fff1f2',
    buttonTextColor: '#be123c',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'breeze',
    name: 'Breeze',
    backgroundClass: 'bg-gradient-to-b from-teal-50 via-cyan-50 to-sky-50 text-cyan-800',
    buttonClass: 'bg-white/80 border border-cyan-200 text-cyan-700 hover:bg-cyan-50 shadow-sm',
    textColorClass: 'text-cyan-800',
    buttonColor: '#ecfeff',
    buttonTextColor: '#0e7490',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'encore',
    name: 'Encore',
    backgroundClass: 'bg-gradient-to-r from-zinc-950 via-neutral-900 to-zinc-950 text-zinc-100',
    buttonClass: 'bg-zinc-800/60 border border-zinc-700/40 text-zinc-100 hover:bg-zinc-700/60',
    textColorClass: 'text-zinc-100',
    buttonColor: '#27272a',
    buttonTextColor: '#f4f4f5',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'grid',
    name: 'Grid',
    backgroundClass: 'bg-zinc-950 text-white bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:30px_30px]',
    buttonClass: 'bg-white/5 border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm',
    textColorClass: 'text-white',
    buttonColor: '#1a1a2e',
    buttonTextColor: '#ffffff',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'groove',
    name: 'Groove',
    backgroundClass: 'bg-gradient-to-br from-emerald-950 via-teal-900 to-green-950 text-emerald-100',
    buttonClass: 'bg-emerald-800/40 border border-emerald-500/30 text-emerald-50 hover:bg-emerald-800/60 backdrop-blur-sm',
    textColorClass: 'text-emerald-100',
    buttonColor: '#065f46',
    buttonTextColor: '#ecfdf5',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'haven',
    name: 'Haven',
    backgroundClass: 'bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 text-blue-100',
    buttonClass: 'bg-blue-900/40 border border-blue-400/30 text-blue-50 hover:bg-blue-900/60 backdrop-blur-sm',
    textColorClass: 'text-blue-100',
    buttonColor: '#1e3a5f',
    buttonTextColor: '#eff6ff',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'lake',
    name: 'Lake',
    backgroundClass: 'bg-gradient-to-t from-cyan-950 via-blue-900 to-indigo-950 text-cyan-100',
    buttonClass: 'bg-white/10 border border-cyan-400/30 text-cyan-50 hover:bg-white/20 backdrop-blur-md',
    textColorClass: 'text-cyan-100',
    buttonColor: '#164e63',
    buttonTextColor: '#ecfeff',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'mineral',
    name: 'Mineral',
    backgroundClass: 'bg-gradient-to-br from-stone-950 via-zinc-900 to-neutral-950 text-stone-100',
    buttonClass: 'bg-stone-800/50 border border-stone-600/30 text-stone-100 hover:bg-stone-700/50',
    textColorClass: 'text-stone-100',
    buttonColor: '#44403c',
    buttonTextColor: '#f5f5f4',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'nourish',
    name: 'Nourish',
    backgroundClass: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 text-green-800',
    buttonClass: 'bg-white/80 border border-green-200 text-green-700 hover:bg-green-50 shadow-sm',
    textColorClass: 'text-green-800',
    buttonColor: '#f0fdf4',
    buttonTextColor: '#166534',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'rise',
    name: 'Rise',
    backgroundClass: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-amber-800',
    buttonClass: 'bg-amber-100/80 border border-amber-200 text-amber-700 hover:bg-amber-200/80',
    textColorClass: 'text-amber-800',
    buttonColor: '#fef3c7',
    buttonTextColor: '#b45309',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'sweat',
    name: 'Sweat',
    backgroundClass: 'bg-gradient-to-b from-rose-500 via-pink-600 to-rose-700 text-white',
    buttonClass: 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30',
    textColorClass: 'text-white',
    buttonColor: '#be185d',
    buttonTextColor: '#ffffff',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'tress',
    name: 'Tress',
    backgroundClass: 'bg-gradient-to-br from-amber-800 via-yellow-700 to-orange-800 text-amber-50',
    buttonClass: 'bg-amber-700/40 border border-amber-400/30 text-amber-50 hover:bg-amber-700/60 backdrop-blur-sm',
    textColorClass: 'text-amber-50',
    buttonColor: '#92400e',
    buttonTextColor: '#fffbeb',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'twilight',
    name: 'Twilight',
    backgroundClass: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-950 text-fuchsia-100',
    buttonClass: 'bg-fuchsia-800/40 border border-fuchsia-400/30 text-fuchsia-50 hover:bg-fuchsia-800/60 backdrop-blur-sm',
    textColorClass: 'text-fuchsia-100',
    buttonColor: '#701a75',
    buttonTextColor: '#fdf4ff',
    fontClass: 'font-sans',
    cardStyle: 'rounded'
  },
  {
    id: 'vox',
    name: 'Vox',
    backgroundClass: 'bg-gradient-to-br from-violet-950 via-purple-800 to-indigo-900 text-violet-100',
    buttonClass: 'bg-violet-700/40 border border-violet-400/30 text-violet-50 hover:bg-violet-700/60 backdrop-blur-sm shadow-lg shadow-violet-500/10',
    textColorClass: 'text-violet-100',
    buttonColor: '#5b21b6',
    buttonTextColor: '#f5f3ff',
    fontClass: 'font-sans',
    cardStyle: 'shadow'
  },
];

export const STICKER_LIST = [
  { emoji: '⭐', label: 'Estrela' },
  { emoji: '❤️', label: 'Coração' },
  { emoji: '🔥', label: 'Fogo' },
  { emoji: '💎', label: 'Diamante' },
  { emoji: '🌈', label: 'Arco-Íris' },
  { emoji: '🦋', label: 'Borboleta' },
  { emoji: '🌸', label: 'Flor' },
  { emoji: '👑', label: 'Coroa' },
  { emoji: '💫', label: 'Brilho' },
  { emoji: '⚡', label: 'Raio' },
  { emoji: '🎵', label: 'Nota Musical' },
  { emoji: '🌊', label: 'Onda' },
  { emoji: '🍀', label: 'Trevo' },
  { emoji: '🎯', label: 'Alvo' },
  { emoji: '💡', label: 'Ideia' },
  { emoji: '🔮', label: 'Bola de Cristal' },
  { emoji: '🪄', label: 'Varinha' },
  { emoji: '✨', label: 'Sparkles' },
  { emoji: '🎨', label: 'Paleta' },
  { emoji: '🌙', label: 'Lua' },
];

export const FONTS_LIST = [
  { id: 'sans', name: 'Inter (Moderna)', class: 'font-sans' },
  { id: 'space', name: 'Space Grotesk (Tech)', class: 'font-space' },
  { id: 'serif', name: 'Editorial Serif', class: 'font-serif' },
  { id: 'mono', name: 'JetBrains Mono', class: 'font-mono' },
  { id: 'outfit', name: 'Outfit (Geométrica)', class: 'font-outfit' },
  { id: 'syne', name: 'Syne (Artsy & Bold)', class: 'font-syne font-bold' },
  { id: 'cinzel', name: 'Cinzel (Serif Luxo)', class: 'font-cinzel font-semibold' },
  { id: 'bebas', name: 'Bebas Neue (Impacto)', class: 'font-bebas text-lg tracking-wider' },
  { id: 'caveat', name: 'Caveat (Manuscrito)', class: 'font-caveat text-base' }
];

export interface SocialPost {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  profilePicUrl: string;
  caption: string;
  imageUrl: string;
  likes: string[]; // array of user UIDs
  likesCount: number;
  commentsCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  displayName: string;
  profilePicUrl: string;
  text: string;
  createdAt: any;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: any;
}

