import React, { useState, useRef } from 'react';
import { CURATED_THEMES, AVAILABLE_THEMES, FONTS_LIST, STICKER_LIST, UserTheme, StickerItem } from '../types';
import { Palette, Image as ImageIcon, Sparkles, Droplet, Square, AlignLeft, Maximize, Minimize, Sun, Type, Layout, Smile, Trash2, Video, Blend } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: UserTheme;
  onChange: (updatedTheme: UserTheme) => void;
}

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SidebarSection[] = [
  { id: 'theme', label: 'Theme', icon: <Palette className="w-4 h-4" /> },
  { id: 'header', label: 'Header', icon: <Layout className="w-4 h-4" /> },
  { id: 'wallpaper', label: 'Wallpaper', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { id: 'buttons', label: 'Buttons', icon: <Square className="w-4 h-4" /> },
  { id: 'colors', label: 'Colors', icon: <Droplet className="w-4 h-4" /> },
  { id: 'stickers', label: 'Stickers', icon: <Smile className="w-4 h-4" /> },
  { id: 'footer', label: 'Footer', icon: <span className="text-xs font-bold">©</span> },
];

const GRADIENT_PRESETS = [
  { name: 'Pôr do Sol', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Mar Profundo', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Amor Eterno', value: 'linear-gradient(135deg, #f43b47 0%, #453a94 100%)' },
  { name: 'Floresta Noturna', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Chama Gelada', value: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)' },
  { name: 'Tropical', value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
  { name: 'Lavanda', value: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)' },
  { name: 'Cyberpunk', value: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)' },
  { name: 'Meia-Noite', value: 'linear-gradient(135deg, #000428 0%, #004e92 100%)' },
];

const PATTERN_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'crosshatch', label: 'Cross' },
  { id: 'waves', label: 'Waves' },
];

const CARD_STYLE_OPTIONS = [
  { id: 'flat', label: 'Flat' },
  { id: 'rounded', label: 'Round' },
  { id: 'outline', label: 'Outline' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'brutalist', label: 'Bold' },
];

const BORDER_RADIUS_OPTIONS = [
  { id: 'none', label: 'None', icon: <Square className="w-3 h-3" /> },
  { id: 'subtle', label: 'Soft', icon: <Minimize className="w-3 h-3" /> },
  { id: 'medium', label: 'Med', icon: <Maximize className="w-3 h-3" /> },
  { id: 'full', label: 'Full', icon: <Sun className="w-3 h-3" /> },
];

export default function ThemeSelector({ currentTheme, onChange }: ThemeSelectorProps) {
  const [activeSection, setActiveSection] = useState('theme');
  const [expandedGradients, setExpandedGradients] = useState(false);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (key: keyof UserTheme, value: any) => {
    onChange({
      ...currentTheme,
      themeId: 'custom',
      [key]: value,
    });
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = AVAILABLE_THEMES.find((t) => t.id === presetId) || CURATED_THEMES.find((t) => t.id === presetId);
    if (!preset) return;

    const isGradientPreset = preset.backgroundClass.includes('gradient');

    const merged: UserTheme = {
      ...currentTheme,
      themeId: preset.id,
      cardStyle: preset.cardStyle,
      fontFamily: preset.fontClass.includes('mono') ? 'mono' : preset.fontClass.includes('serif') ? 'serif' : preset.fontClass.includes('space') ? 'space' : 'sans',
      buttonColor: preset.buttonColor,
      buttonTextColor: preset.buttonTextColor,
      backgroundColor: preset.backgroundClass,
      backgroundType: isGradientPreset ? 'gradient' : 'color',
      glassmorphism: false,
      avatarFrame: 'none',
      borderRadius: 'medium',
      letterSpacing: 'normal',
      avatarGlow: false,
      patternOverlay: 'none',
      buttonSize: 'medium',
      textAlign: 'center',
      wallpaperStyle: isGradientPreset ? 'gradient' : 'fill',
      wallpaperBlur: isGradientPreset ? 0 : (currentTheme.wallpaperBlur ?? 0),
      gradientDirection: currentTheme.gradientDirection || 'linear-down',
      layout: currentTheme.layout,
      headerStyle: currentTheme.headerStyle || 'classic',
      titleStyle: currentTheme.titleStyle || 'text',
      titleColor: currentTheme.titleColor || '#ffffff',
      titleLogoUrl: currentTheme.titleLogoUrl || '',
      customBackground: currentTheme.customBackground || '',
      backgroundGradient: isGradientPreset ? preset.backgroundClass : (currentTheme.backgroundGradient || ''),
      backgroundImageUrl: isGradientPreset ? '' : (currentTheme.backgroundImageUrl || ''),
      wallpaperVideoUrl: currentTheme.wallpaperVideoUrl || '',
      wallpaperNoise: false,
      buttonGradient: currentTheme.buttonGradient || '',
      stickers: currentTheme.stickers || [],
      footerText: currentTheme.footerText || '',
      showBranding: currentTheme.showBranding !== false,
    };

    onChange(merged);
  };

  const sidebarBtnClass = (id: string) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
      activeSection === id
        ? 'bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
    }`;

  const activeBtnClass = (cond: boolean) =>
    cond ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa] ring-1 ring-[#a78bfa]/20' : 'border-white/10 bg-black text-zinc-500 hover:bg-white/5 hover:text-zinc-300';

  // Sticker drag state
  const [dragStickerId, setDragStickerId] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  const addSticker = (emoji: string) => {
    const stickers = currentTheme.stickers || [];
    const newSticker: StickerItem = {
      id: `sticker-${Date.now()}`,
      emoji,
      x: 20 + Math.random() * 60,
      y: 10 + Math.random() * 50,
      rotation: Math.random() * 20 - 10,
      scale: 1,
    };
    updateField('stickers', [...stickers, newSticker]);
  };

  const removeSticker = (id: string) => {
    const stickers = currentTheme.stickers || [];
    updateField('stickers', stickers.filter(s => s.id !== id));
  };

  const updateSticker = (id: string, updates: Partial<StickerItem>) => {
    const stickers = currentTheme.stickers || [];
    updateField('stickers', stickers.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className="flex gap-0 rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0f] min-h-[500px]">
      {/* Sidebar */}
      <aside className="w-44 shrink-0 border-r border-white/10 bg-black/40 p-2 flex flex-col gap-0.5">
        <div className="px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 border-b border-white/5 mb-1">Design</div>
        {SECTIONS.map((section) => (
          <button key={section.id} onClick={() => setActiveSection(section.id)} className={sidebarBtnClass(section.id)}>
            {section.icon}
            {section.label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[580px]">
        {/* THEME SECTION */}
        {activeSection === 'theme' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Curated</h3>
              <div className="grid grid-cols-3 gap-2">
                {CURATED_THEMES.map((theme) => {
                  const isSelected = currentTheme.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectPreset(theme.id)}
                      className={`relative overflow-hidden p-2 rounded-xl border text-left transition-all ${
                        isSelected ? 'border-[#a78bfa] bg-[#1a1a1a] ring-1 ring-[#a78bfa]/30' : 'border-white/5 bg-black/40 hover:bg-[#1f1f1f]/50 hover:border-white/20'
                      }`}
                    >
                      <div className={`h-10 w-full rounded-lg mb-1.5 flex flex-col justify-center gap-1 p-1.5 ${theme.backgroundClass}`}>
                        <div className="h-0.5 w-1/2 rounded bg-current opacity-20"></div>
                        <div className="h-1.5 w-full rounded-sm" style={{ backgroundColor: theme.buttonColor }}></div>
                        <div className="h-0.5 w-1/3 rounded bg-current opacity-20"></div>
                      </div>
                      <span className="text-[9px] font-medium text-zinc-300 truncate block">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Premium</h3>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_THEMES.map((theme) => {
                  const isSelected = currentTheme.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectPreset(theme.id)}
                      className={`relative overflow-hidden p-2 rounded-xl border text-left transition-all ${
                        isSelected ? 'border-[#a78bfa] bg-[#1a1a1a] ring-1 ring-[#a78bfa]/30' : 'border-white/5 bg-black/40 hover:bg-[#1f1f1f]/50 hover:border-white/20'
                      }`}
                    >
                      <div className={`h-10 w-full rounded-lg mb-1.5 flex flex-col justify-center gap-1 p-1.5 ${theme.backgroundClass}`}>
                        <div className="h-0.5 w-1/2 rounded bg-current opacity-20"></div>
                        <div className="h-1.5 w-full rounded-sm" style={{ backgroundColor: theme.buttonColor }}></div>
                        <div className="h-0.5 w-1/3 rounded bg-current opacity-20"></div>
                      </div>
                      <span className="text-[9px] font-medium text-zinc-300 truncate block">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* HEADER SECTION */}
        {activeSection === 'header' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Layout</label>
              <div className="grid grid-cols-2 gap-2">
                {(['classic', 'hero'] as const).map((layout) => (
                  <button
                    key={layout}
                    onClick={() => updateField('headerStyle', layout)}
                    className={`py-3 px-3 text-[11px] font-bold rounded-xl border transition-all flex flex-col items-center gap-1.5 ${(currentTheme.headerStyle || 'classic') === layout ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-white/10 bg-black text-zinc-500 hover:bg-white/5'}`}
                  >
                    {layout === 'classic' ? (
                      <>
                        <div className="w-14 h-10 rounded-lg bg-zinc-800 flex flex-col items-center justify-center gap-1">
                          <div className="w-6 h-1.5 rounded-full bg-zinc-600"></div>
                          <div className="w-8 h-3 rounded-sm bg-zinc-600"></div>
                        </div>
                        Classic
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-10 rounded-lg bg-zinc-800 flex flex-col items-center justify-center gap-1">
                          <div className="w-8 h-5 rounded-sm bg-zinc-600"></div>
                          <div className="w-6 h-1.5 rounded-full bg-zinc-600"></div>
                        </div>
                        Hero
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Title Style</label>
              <div className="grid grid-cols-2 gap-2">
                {(['text', 'logo'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateField('titleStyle', style)}
                    className={`py-3 text-[11px] font-bold rounded-xl border transition-all ${(currentTheme.titleStyle || 'text') === style ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-white/10 bg-black text-zinc-500 hover:bg-white/5'}`}
                  >
                    {style === 'text' ? 'Text' : 'Logo'}
                  </button>
                ))}
              </div>
            </div>

            {currentTheme.titleStyle !== 'logo' && (
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Title Color</label>
                <div className="flex gap-2">
                  <input type="color" value={currentTheme.titleColor || '#ffffff'} onChange={(e) => updateField('titleColor', e.target.value)} className="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer shrink-0" />
                  <input type="text" value={currentTheme.titleColor || '#ffffff'} onChange={(e) => updateField('titleColor', e.target.value)} className="flex-1 bg-[#111] text-xs font-mono border border-white/10 rounded-lg px-3 text-zinc-300" />
                </div>
              </div>
            )}

            {currentTheme.titleStyle === 'logo' && (
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Logo Image URL</label>
                <input type="url" value={currentTheme.titleLogoUrl || ''} onChange={(e) => updateField('titleLogoUrl', e.target.value)} className="w-full bg-[#111] text-xs font-mono border border-white/10 rounded-lg py-2 px-3 text-zinc-300" placeholder="https://..." />
              </div>
            )}

            <div className="p-4 bg-black/50 border border-white/5 rounded-2xl space-y-4 mt-2">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#a78bfa]" /> Ícones de Redes Sociais no Topo
              </h4>
              <p className="text-[9px] text-zinc-500">Insira suas URLs e elas aparecerão como ícones elegantes logo no início do perfil.</p>
              
              <div className="space-y-3">
                {[
                  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/seu_usuario' },
                  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@seu_canal' },
                  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@seu_usuario' },
                  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/seu_nome' },
                  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/seu_usuario' },
                  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/seu_usuario' },
                  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'Ex: 5511999999999 (somente números)' },
                ].map((social) => (
                  <div key={social.key} className="flex flex-col gap-1">
                    <label className="text-[9px] text-zinc-500 font-mono uppercase">{social.label}</label>
                    <input
                      type="text"
                      value={(currentTheme.headerSocials as any)?.[social.key] || ''}
                      onChange={(e) => {
                        const socials = currentTheme.headerSocials || {};
                        updateField('headerSocials', {
                          ...socials,
                          [social.key]: e.target.value,
                        });
                      }}
                      placeholder={social.placeholder}
                      className="w-full bg-[#111] text-xs font-mono border border-white/10 rounded-lg py-2 px-3 text-zinc-300 outline-none focus:border-[#a78bfa]/50 focus:ring-1 focus:ring-[#a78bfa]/20 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WALLPAPER SECTION */}
        {activeSection === 'wallpaper' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Wallpaper Style</label>
              <div className="grid grid-cols-3 gap-2">
                {(['fill', 'gradient', 'blur', 'pattern', 'image', 'video'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateField('wallpaperStyle', style)}
                    className={`py-2.5 text-[10px] font-bold uppercase rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${(currentTheme.wallpaperStyle || 'fill') === style ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-white/10 bg-black text-zinc-500 hover:bg-white/5'}`}
                  >
                    {style === 'fill' && <Droplet className="w-3.5 h-3.5" />}
                    {style === 'gradient' && <Palette className="w-3.5 h-3.5" />}
                    {style === 'blur' && <Blend className="w-3.5 h-3.5" />}
                    {style === 'pattern' && <Square className="w-3.5 h-3.5" />}
                    {style === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                    {style === 'video' && <Video className="w-3.5 h-3.5" />}
                    <span>{style === 'fill' ? 'Fill' : style === 'blur' ? 'Blur' : style.charAt(0).toUpperCase() + style.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            {(!currentTheme.wallpaperStyle || currentTheme.wallpaperStyle === 'fill') && (
              <div className="p-3 bg-black/50 border border-white/5 rounded-xl">
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Solid Color</label>
                <div className="flex gap-2">
                  <input type="color" value={currentTheme.backgroundColor.startsWith('#') ? currentTheme.backgroundColor : '#000000'} onChange={(e) => { updateField('backgroundColor', e.target.value); updateField('backgroundType', 'color'); }} className="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer shrink-0" />
                  <input type="text" value={currentTheme.backgroundColor} onChange={(e) => { updateField('backgroundColor', e.target.value); updateField('backgroundType', 'color'); }} className="flex-1 bg-[#111] text-xs font-mono border border-white/10 rounded-lg px-3 text-zinc-300" placeholder="#000000" />
                </div>
              </div>
            )}

            {currentTheme.wallpaperStyle === 'gradient' && (
              <div className="space-y-3">
                <div className="p-3 bg-black/50 border border-white/5 rounded-xl space-y-3">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Criador de Gradiente Visual</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Cor Inicial</span>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={currentTheme.gradientStartColor || '#667eea'}
                          onChange={(e) => {
                            const start = e.target.value;
                            const end = currentTheme.gradientEndColor || '#764ba2';
                            const dir = currentTheme.gradientDirection || 'linear-down';
                            let gradVal = `linear-gradient(180deg, ${start} 0%, ${end} 100%)`;
                            if (dir === 'linear-up') gradVal = `linear-gradient(0deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'linear-right') gradVal = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'linear-left') gradVal = `linear-gradient(270deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'radial') gradVal = `radial-gradient(circle, ${start} 0%, ${end} 100%)`;
                            
                            onChange({
                              ...currentTheme,
                              themeId: 'custom',
                              gradientStartColor: start,
                              backgroundGradient: gradVal,
                              backgroundType: 'gradient',
                            });
                          }}
                          className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={currentTheme.gradientStartColor || '#667eea'}
                          onChange={(e) => {
                            const start = e.target.value;
                            const end = currentTheme.gradientEndColor || '#764ba2';
                            const dir = currentTheme.gradientDirection || 'linear-down';
                            let gradVal = `linear-gradient(180deg, ${start} 0%, ${end} 100%)`;
                            if (dir === 'linear-up') gradVal = `linear-gradient(0deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'linear-right') gradVal = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'linear-left') gradVal = `linear-gradient(270deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'radial') gradVal = `radial-gradient(circle, ${start} 0%, ${end} 100%)`;
                            
                            onChange({
                              ...currentTheme,
                              themeId: 'custom',
                              gradientStartColor: start,
                              backgroundGradient: gradVal,
                              backgroundType: 'gradient',
                            });
                          }}
                          className="w-full bg-[#111] text-xs font-mono border border-white/10 rounded-lg px-2 text-zinc-300"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Cor Final</span>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={currentTheme.gradientEndColor || '#764ba2'}
                          onChange={(e) => {
                            const start = currentTheme.gradientStartColor || '#667eea';
                            const end = e.target.value;
                            const dir = currentTheme.gradientDirection || 'linear-down';
                            let gradVal = `linear-gradient(180deg, ${start} 0%, ${end} 100%)`;
                            if (dir === 'linear-up') gradVal = `linear-gradient(0deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'linear-right') gradVal = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'linear-left') gradVal = `linear-gradient(270deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'radial') gradVal = `radial-gradient(circle, ${start} 0%, ${end} 100%)`;
                            
                            onChange({
                              ...currentTheme,
                              themeId: 'custom',
                              gradientEndColor: end,
                              backgroundGradient: gradVal,
                              backgroundType: 'gradient',
                            });
                          }}
                          className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={currentTheme.gradientEndColor || '#764ba2'}
                          onChange={(e) => {
                            const start = currentTheme.gradientStartColor || '#667eea';
                            const end = e.target.value;
                            const dir = currentTheme.gradientDirection || 'linear-down';
                            let gradVal = `linear-gradient(180deg, ${start} 0%, ${end} 100%)`;
                            if (dir === 'linear-up') gradVal = `linear-gradient(0deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'linear-right') gradVal = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'linear-left') gradVal = `linear-gradient(270deg, ${start} 0%, ${end} 100%)`;
                            else if (dir === 'radial') gradVal = `radial-gradient(circle, ${start} 0%, ${end} 100%)`;
                            
                            onChange({
                              ...currentTheme,
                              themeId: 'custom',
                              gradientEndColor: end,
                              backgroundGradient: gradVal,
                              backgroundType: 'gradient',
                            });
                          }}
                          className="w-full bg-[#111] text-xs font-mono border border-white/10 rounded-lg px-2 text-zinc-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-14 w-full rounded-lg border border-white/10 transition-all" style={{ background: currentTheme.backgroundGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Direction</label>
                  <div className="grid grid-cols-5 gap-1">
                    {([
                      { id: 'linear-down', label: 'Baixo' },
                      { id: 'linear-up', label: 'Cima' },
                      { id: 'linear-right', label: 'Dir.' },
                      { id: 'linear-left', label: 'Esq.' },
                      { id: 'radial', label: 'Radial' },
                    ] as const).map((dir) => (
                      <button
                        key={dir.id}
                        type="button"
                        onClick={() => {
                          const start = currentTheme.gradientStartColor || '#667eea';
                          const end = currentTheme.gradientEndColor || '#764ba2';
                          let gradVal = `linear-gradient(180deg, ${start} 0%, ${end} 100%)`;
                          if (dir.id === 'linear-up') gradVal = `linear-gradient(0deg, ${start} 0%, ${end} 100%)`;
                          else if (dir.id === 'linear-right') gradVal = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
                          else if (dir.id === 'linear-left') gradVal = `linear-gradient(270deg, ${start} 0%, ${end} 100%)`;
                          else if (dir.id === 'radial') gradVal = `radial-gradient(circle, ${start} 0%, ${end} 100%)`;

                          onChange({
                            ...currentTheme,
                            themeId: 'custom',
                            gradientDirection: dir.id,
                            backgroundGradient: gradVal,
                            backgroundType: 'gradient',
                          });
                        }}
                        className={`py-2 text-[9px] font-bold rounded-lg border transition-all ${
                          (currentTheme.gradientDirection || 'linear-down') === dir.id
                            ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]'
                            : 'border-white/10 bg-black text-zinc-500 hover:bg-white/5'
                        }`}
                      >
                        {dir.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <button type="button" onClick={() => setExpandedGradients(!expandedGradients)} className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-wider flex items-center gap-1 hover:underline">
                    <Palette className="w-3 h-3" /> {expandedGradients ? 'Ocultar' : 'Mostrar'} Presets
                  </button>
                  {expandedGradients && (
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {GRADIENT_PRESETS.map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => {
                            const hexes = g.value.match(/#[0-9a-fA-F]{6}/g) || [];
                            const start = hexes[0] || '#667eea';
                            const end = hexes[1] || '#764ba2';

                            onChange({
                              ...currentTheme,
                              themeId: 'custom',
                              gradientStartColor: start,
                              gradientEndColor: end,
                              backgroundGradient: g.value,
                              backgroundType: 'gradient',
                            });
                            setExpandedGradients(false);
                          }}
                          className={`h-10 rounded-lg border transition-all hover:scale-105 ${currentTheme.backgroundGradient === g.value ? 'border-[#a78bfa] ring-1 ring-[#a78bfa]/30' : 'border-white/10'}`}
                          style={{ background: g.value }}
                          title={g.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentTheme.wallpaperStyle === 'blur' && (
              <div className="p-3 bg-black/50 border border-white/5 rounded-xl space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Blur Intensity</label>
                  <input type="range" min="0" max="20" value={currentTheme.wallpaperBlur || 8} onChange={(e) => updateField('wallpaperBlur', Number(e.target.value))} className="w-full accent-[#a78bfa]" />
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                    <span>0px</span>
                    <span className="text-zinc-300 font-mono">{currentTheme.wallpaperBlur || 8}px</span>
                    <span>20px</span>
                  </div>
                </div>
                <p className="text-[9px] text-zinc-500">Blur works with an image background. Set one in the Image tab.</p>
              </div>
            )}

            {currentTheme.wallpaperStyle === 'pattern' && (
              <div className="p-3 bg-black/50 border border-white/5 rounded-xl">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Pattern Overlay</label>
                <div className="grid grid-cols-5 gap-2">
                  {PATTERN_OPTIONS.map((p) => (
                    <button key={p.id} onClick={() => updateField('patternOverlay', p.id as any)} className={`py-2 text-[9px] font-bold rounded-lg border transition-all ${(currentTheme.patternOverlay || 'none') === p.id ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-white/10 bg-black text-zinc-500 hover:bg-white/5'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentTheme.wallpaperStyle === 'image' && (
              <div className="p-3 bg-black/50 border border-white/5 rounded-xl space-y-3">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Background Image</label>
                <div className="flex gap-2">
                  <input type="url" value={currentTheme.backgroundImageUrl || ''} onChange={(e) => { updateField('backgroundImageUrl', e.target.value); updateField('backgroundType', 'image'); }} className="flex-1 bg-[#111] text-xs border border-white/10 rounded-lg py-2 px-3 text-zinc-300" placeholder="https://..." />
                  <input ref={backgroundFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => { if (ev.target?.result) { updateField('backgroundImageUrl', ev.target.result as string); updateField('backgroundType', 'image'); } };
                      reader.readAsDataURL(file);
                    }
                  }} />
                  <button type="button" onClick={() => backgroundFileInputRef.current?.click()} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold px-3 rounded-xl border border-blue-500/20 transition-all cursor-pointer shrink-0 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                  </button>
                </div>
                {currentTheme.backgroundImageUrl && <img src={currentTheme.backgroundImageUrl} alt="Preview" className="h-20 w-full object-cover rounded-lg border border-white/10" />}
              </div>
            )}

            {currentTheme.wallpaperStyle === 'video' && (
              <div className="p-3 bg-black/50 border border-white/5 rounded-xl space-y-3">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Video Background URL</label>
                <input type="url" value={currentTheme.wallpaperVideoUrl || ''} onChange={(e) => updateField('wallpaperVideoUrl', e.target.value)} className="w-full bg-[#111] text-xs font-mono border border-white/10 rounded-lg py-2 px-3 text-zinc-300" placeholder="https://example.com/video.mp4" />
                <p className="text-[9px] text-zinc-500">Enter a direct video URL (.mp4, .webm)</p>
              </div>
            )}

            {/* Noise Toggle */}
            <div className="flex items-center justify-between p-3 bg-black/50 border border-white/5 rounded-xl">
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1"><Sparkles className="w-3 h-3 text-zinc-400" /> Noise</h4>
                <p className="text-[9px] text-zinc-500">Add subtle grain texture</p>
              </div>
              <button onClick={() => updateField('wallpaperNoise', !currentTheme.wallpaperNoise)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentTheme.wallpaperNoise ? 'bg-[#a78bfa]' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentTheme.wallpaperNoise ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* TEXT SECTION */}
        {activeSection === 'text' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Font Family</h3>
            <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {FONTS_LIST.map((font) => (
                <button key={font.id} onClick={() => updateField('fontFamily', font.id)} className={`py-3 px-3 text-xs rounded-xl border text-left flex flex-col justify-between transition-all ${currentTheme.fontFamily === font.id ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa] ring-1 ring-[#a78bfa]/20' : 'border-white/5 bg-black/40 text-zinc-300 hover:bg-[#1f1f1f]/50'}`}>
                  <span className={`text-[14px] ${font.class}`}>{font.name}</span>
                  <span className={`text-[11px] text-zinc-500 mt-1 ${font.class}`}>The quick brown fox</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Letter Spacing</label>
              <div className="grid grid-cols-4 gap-2">
                {(['tight', 'normal', 'wide', 'wider'] as const).map((s) => (
                  <button key={s} onClick={() => updateField('letterSpacing', s)} className={`py-2 text-[10px] font-bold rounded-lg border transition-all flex flex-col items-center gap-1 ${(currentTheme.letterSpacing || 'normal') === s ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-white/10 bg-black text-zinc-500 hover:bg-white/5'}`}>
                    <AlignLeft className="w-3 h-3" />
                    {s === 'tight' ? 'Tight' : s === 'normal' ? 'Normal' : s === 'wide' ? 'Wide' : 'Extra'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Alignment</label>
              <div className="grid grid-cols-2 gap-2">
                {(['center', 'left'] as const).map((a) => (
                  <button key={a} onClick={() => updateField('textAlign', a)} className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${(currentTheme.textAlign || 'center') === a ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-white/10 bg-black text-zinc-500 hover:bg-white/5'}`}>
                    {a === 'center' ? 'Center' : 'Left'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BUTTONS SECTION */}
        {activeSection === 'buttons' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Card Style</label>
              <div className="grid grid-cols-3 gap-2">
                {CARD_STYLE_OPTIONS.map((style) => (
                  <button key={style.id} onClick={() => updateField('cardStyle', style.id as any)} className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all ${currentTheme.cardStyle === style.id ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-white/5 bg-black/40 text-zinc-400 hover:bg-[#1a1a1a]'}`}>
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Border Radius</label>
              <div className="grid grid-cols-4 gap-2">
                {BORDER_RADIUS_OPTIONS.map((r) => (
                  <button key={r.id} onClick={() => updateField('borderRadius', r.id as any)} className={`py-2 text-[10px] font-bold rounded-lg border transition-all flex flex-col items-center gap-1 ${(currentTheme.borderRadius || 'medium') === r.id ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-white/10 bg-black text-zinc-500 hover:bg-white/5'}`}>
                    {r.icon}
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Button Size</label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <button key={s} onClick={() => updateField('buttonSize', s)} className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${(currentTheme.buttonSize || 'medium') === s ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-white/10 bg-black text-zinc-500 hover:bg-white/5'}`}>
                    {s === 'small' ? 'Small' : s === 'medium' ? 'Medium' : 'Large'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-purple-500/30 bg-purple-500/5">
              <div>
                <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1"><Palette className="w-3 h-3" /> Gradient Button</h4>
                <p className="text-[9px] text-purple-300/70">Replace solid color with gradient</p>
              </div>
              <button onClick={() => updateField('buttonGradient', currentTheme.buttonGradient ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentTheme.buttonGradient ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentTheme.buttonGradient ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {currentTheme.buttonGradient && (
              <div className="p-3 bg-black/50 border border-white/5 rounded-xl">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Gradient CSS</label>
                <input type="text" value={currentTheme.buttonGradient} onChange={(e) => updateField('buttonGradient', e.target.value)} className="w-full bg-[#111] text-xs font-mono border border-white/10 rounded-lg py-2 px-3 text-zinc-300" />
                <div className="h-8 w-full rounded-lg mt-2" style={{ background: currentTheme.buttonGradient }}></div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl border border-blue-500/30 bg-blue-500/5">
              <div>
                <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Glassmorphism</h4>
                <p className="text-[9px] text-blue-300/70">Translucent glass effect on buttons</p>
              </div>
              <button onClick={() => updateField('glassmorphism', !currentTheme.glassmorphism)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentTheme.glassmorphism ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentTheme.glassmorphism ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Button Color</label>
                <div className="flex gap-2">
                  <input type="color" value={currentTheme.buttonColor.startsWith('#') ? currentTheme.buttonColor : '#ffffff'} onChange={(e) => updateField('buttonColor', e.target.value)} className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer shrink-0" />
                  <input type="text" value={currentTheme.buttonColor} onChange={(e) => updateField('buttonColor', e.target.value)} className="flex-1 bg-[#111] text-xs font-mono border border-white/10 rounded-lg px-2 text-zinc-300" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Text Color</label>
                <div className="flex gap-2">
                  <input type="color" value={currentTheme.buttonTextColor.startsWith('#') ? currentTheme.buttonTextColor : '#000000'} onChange={(e) => updateField('buttonTextColor', e.target.value)} className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer shrink-0" />
                  <input type="text" value={currentTheme.buttonTextColor} onChange={(e) => updateField('buttonTextColor', e.target.value)} className="flex-1 bg-[#111] text-xs font-mono border border-white/10 rounded-lg px-2 text-zinc-300" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-black/50 border border-white/5 rounded-xl space-y-2 mt-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Efeito de Hover nos Botões</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {([
                  { id: 'none', label: 'Nenhum' },
                  { id: 'scale', label: 'Zoom' },
                  { id: 'glow', label: 'Brilho' },
                  { id: 'lift', label: 'Flutuar' },
                  { id: 'outline-grow', label: 'Borda Pulsante' },
                ] as const).map((effect) => (
                  <button
                    key={effect.id}
                    type="button"
                    onClick={() => updateField('buttonHoverEffect', effect.id)}
                    className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      (currentTheme.buttonHoverEffect || 'none') === effect.id
                        ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa] ring-1 ring-[#a78bfa]/20'
                        : 'border-white/5 bg-black text-zinc-400 hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {effect.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COLORS SECTION */}
        {activeSection === 'colors' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Background Color</label>
              <div className="flex gap-2 mb-3">
                <input type="color" value={currentTheme.backgroundColor.startsWith('#') ? currentTheme.backgroundColor : '#000000'} onChange={(e) => { updateField('backgroundColor', e.target.value); updateField('backgroundType', 'color'); }} className="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer shrink-0" />
                <input type="text" value={currentTheme.backgroundColor} onChange={(e) => { updateField('backgroundColor', e.target.value); }} className="flex-1 bg-[#111] text-xs font-mono border border-white/10 rounded-lg px-3 text-zinc-300" />
              </div>
              <div className="flex flex-wrap gap-2">
                {['#0f172a','#1e1b4b','#1a1a2e','#0d1117','#111827','#1c1917','#171717','#1f2937','#020617','#000000','#2d1b69','#1a3a5c','#3b0764','#164e63','#0b3d0b','#3d0c0c','#7c2d12','#4c1d95','#0f0f0f','#262626','#ffffff','#f8fafc','#f0fdf4','#fef2f2','#fefce8','#f5f3ff','#ecfeff','#fff7ed','#fdf2f8'].map((c) => (
                  <button key={c} type="button" onClick={() => { updateField('backgroundColor', c); updateField('backgroundType', 'color'); }}
                    className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer hover:scale-110 ${
                      currentTheme.backgroundColor === c ? 'border-[#a78bfa] scale-110 ring-2 ring-[#a78bfa]/30' : 'border-transparent hover:border-zinc-500'
                    }`}
                    style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Button Color</label>
                <div className="flex gap-2">
                  <input type="color" value={currentTheme.buttonColor.startsWith('#') ? currentTheme.buttonColor : '#ffffff'} onChange={(e) => updateField('buttonColor', e.target.value)} className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer" />
                  <input type="text" value={currentTheme.buttonColor} onChange={(e) => updateField('buttonColor', e.target.value)} className="flex-1 bg-[#111] text-xs font-mono border border-white/10 rounded-lg px-2 text-zinc-300" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Text Color</label>
                <div className="flex gap-2">
                  <input type="color" value={currentTheme.buttonTextColor.startsWith('#') ? currentTheme.buttonTextColor : '#000000'} onChange={(e) => updateField('buttonTextColor', e.target.value)} className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer" />
                  <input type="text" value={currentTheme.buttonTextColor} onChange={(e) => updateField('buttonTextColor', e.target.value)} className="flex-1 bg-[#111] text-xs font-mono border border-white/10 rounded-lg px-2 text-zinc-300" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Title Color</label>
              <div className="flex gap-2">
                <input type="color" value={currentTheme.titleColor || '#ffffff'} onChange={(e) => updateField('titleColor', e.target.value)} className="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer shrink-0" />
                <input type="text" value={currentTheme.titleColor || '#ffffff'} onChange={(e) => updateField('titleColor', e.target.value)} className="flex-1 bg-[#111] text-xs font-mono border border-white/10 rounded-lg px-3 text-zinc-300" />
              </div>
            </div>
          </div>
        )}

        {/* STICKERS SECTION */}
        {activeSection === 'stickers' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Select a sticker to place on your profile</h3>
              <div className="grid grid-cols-5 gap-3">
                {STICKER_LIST.map((sticker) => (
                  <button
                    key={sticker.emoji}
                    onClick={() => addSticker(sticker.emoji)}
                    className="w-full aspect-square bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 cursor-pointer"
                    title={sticker.label}
                  >
                    {sticker.emoji}
                  </button>
                ))}
              </div>
            </div>

            {(currentTheme.stickers || []).length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Placed Stickers ({currentTheme.stickers!.length})</h3>
                <div className="space-y-2">
                  {currentTheme.stickers!.map((sticker) => (
                    <div key={sticker.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${selectedStickerId === sticker.id ? 'border-[#a78bfa] bg-[#a78bfa]/10' : 'border-white/10 bg-black/40'}`}>
                      <button onClick={() => setSelectedStickerId(selectedStickerId === sticker.id ? null : sticker.id)} className="text-2xl w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-lg cursor-pointer">{sticker.emoji}</button>
                      <div className="flex-1 min-w-0">
                        {selectedStickerId === sticker.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] text-zinc-500 uppercase tracking-wider">X: {sticker.x.toFixed(0)}%</label>
                                <input type="range" min="0" max="100" value={sticker.x} onChange={(e) => updateSticker(sticker.id, { x: Number(e.target.value) })} className="w-full accent-[#a78bfa] h-1" />
                              </div>
                              <div>
                                <label className="text-[8px] text-zinc-500 uppercase tracking-wider">Y: {sticker.y.toFixed(0)}%</label>
                                <input type="range" min="0" max="100" value={sticker.y} onChange={(e) => updateSticker(sticker.id, { y: Number(e.target.value) })} className="w-full accent-[#a78bfa] h-1" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] text-zinc-500 uppercase tracking-wider">Scale: {sticker.scale.toFixed(1)}x</label>
                                <input type="range" min="0.5" max="3" step="0.1" value={sticker.scale} onChange={(e) => updateSticker(sticker.id, { scale: Number(e.target.value) })} className="w-full accent-[#a78bfa] h-1" />
                              </div>
                              <div>
                                <label className="text-[8px] text-zinc-500 uppercase tracking-wider">Rotate: {sticker.rotation.toFixed(0)}°</label>
                                <input type="range" min="-180" max="180" value={sticker.rotation} onChange={(e) => updateSticker(sticker.id, { rotation: Number(e.target.value) })} className="w-full accent-[#a78bfa] h-1" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-zinc-400">{sticker.emoji}</span>
                            <span className="text-[9px] text-zinc-500">x:{sticker.x.toFixed(0)}% y:{sticker.y.toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeSticker(sticker.id)} className="p-1.5 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-400 transition-all cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOTER SECTION */}
        {activeSection === 'footer' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Footer Text</label>
              <input type="text" value={currentTheme.footerText || ''} onChange={(e) => updateField('footerText', e.target.value)} className="w-full bg-[#111] text-xs border border-white/10 rounded-lg py-2.5 px-3 text-zinc-300" placeholder="Custom footer message..." maxLength={100} />
            </div>

            <div className="flex items-center justify-between p-3 bg-black/50 border border-white/5 rounded-xl">
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1"><Sparkles className="w-3 h-3 text-emerald-400" /> Show LinkFlowAI Branding</h4>
                <p className="text-[9px] text-zinc-500">Display "Powered by LinkFlowAI" badge</p>
              </div>
              <button onClick={() => updateField('showBranding', currentTheme.showBranding !== false ? false : true)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentTheme.showBranding !== false ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentTheme.showBranding !== false ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}