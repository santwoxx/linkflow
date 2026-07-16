import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, LinkItem, FreeCanvasItem, FREE_CANVAS_WIDTH } from '../types';
import { X, Save, RotateCcw, AlignCenterHorizontal, ArrowUpToLine, ArrowDownToLine, Plus, Minus, Move, Globe, Sparkles } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRUTOR LIVRE (estilo Canva)
// Editor visual onde o usuário arrasta e redimensiona os elementos da página
// pública (avatar, nome, bio, redes sociais e cada link) em um canvas de
// coordenadas fixas (FREE_CANVAS_WIDTH un.). As posições são salvas em
// theme.freeLayoutItems e renderizadas pelo PublicProfile com escala
// proporcional — o que você vê aqui é o que aparece na página.
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasEditorProps {
  profile: UserProfile;
  links: LinkItem[];
  theme: any;
  onSave: (updatedTheme: any) => Promise<void> | void;
  onClose: () => void;
}

// Altura aproximada de cada tipo de bloco no render real (para o mock do editor)
const REP_HEIGHTS: Record<string, number> = {
  promo_banner: 180,
  products: 240,
  gallery: 340,
  services: 260,
  testimonials: 210,
  scheduling: 250,
  send_resume: 56,
};
const DEFAULT_LINK_H = 52;

const BLOCK_LABELS: Record<string, string> = {
  promo_banner: 'Banner Promocional',
  products: 'Vitrine de Produtos',
  gallery: 'Galeria de Fotos',
  services: 'Serviços',
  testimonials: 'Depoimentos',
  scheduling: 'Agendamento',
};

function repHeight(link: LinkItem): number {
  return REP_HEIGHTS[link.type || ''] ?? DEFAULT_LINK_H;
}

function isLightHex(color?: string): boolean {
  if (!color || !color.startsWith('#')) return false;
  const hex = color.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (full.length < 6) return false;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Monta a pilha padrão (mesma ordem do layout normal) como ponto de partida
function buildDefaultItems(
  profile: UserProfile,
  theme: any,
  activeLinks: LinkItem[]
): { items: FreeCanvasItem[]; canvasH: number } {
  const items: FreeCanvasItem[] = [];
  let y = 28;
  let z = 1;
  const avatarW = 96;
  items.push({ id: 'avatar', x: (FREE_CANVAS_WIDTH - avatarW) / 2, y, w: avatarW, h: avatarW, z: z++ });
  y += avatarW + 14;
  items.push({ id: 'name', x: 40, y, w: 320, h: 30, z: z++ });
  y += 36;
  items.push({ id: 'username', x: 40, y, w: 320, h: 18, z: z++ });
  y += 28;
  if (profile.bio) {
    items.push({ id: 'bio', x: 30, y, w: 340, h: 66, z: z++ });
    y += 76;
  }
  const hasSocials = theme?.headerSocials && Object.values(theme.headerSocials).some(Boolean);
  if (hasSocials) {
    items.push({ id: 'socials', x: 30, y, w: 340, h: 40, z: z++ });
    y += 52;
  }
  y += 10;
  for (const l of activeLinks) {
    const h = repHeight(l);
    items.push({ id: `link:${l.id}`, x: 20, y, w: 360, h, z: z++ });
    y += h + 14;
  }
  return { items, canvasH: Math.max(640, y + 48) };
}

export default function CanvasEditor({ profile, links, theme, onSave, onClose }: CanvasEditorProps) {
  const activeLinks = links.filter((l) => l.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // ── Estado inicial: layout salvo (sincronizado com links atuais) ou pilha padrão
  const [items, setItems] = useState<FreeCanvasItem[]>(() => {
    const saved: FreeCanvasItem[] = Array.isArray(theme?.freeLayoutItems) ? theme.freeLayoutItems : [];
    if (saved.length === 0) return buildDefaultItems(profile, theme, activeLinks).items;

    // Remove itens de links que não existem mais / inativos
    const valid = saved.filter((it) => {
      if (!it.id.startsWith('link:')) return true;
      return activeLinks.some((l) => `link:${l.id}` === it.id);
    });
    // Adiciona links novos (criados depois do layout salvo) no fim do canvas
    let bottom = valid.reduce((m, it) => Math.max(m, it.y + it.h), 40);
    let maxZ = valid.reduce((m, it) => Math.max(m, it.z || 1), 1);
    for (const l of activeLinks) {
      if (!valid.some((it) => it.id === `link:${l.id}`)) {
        bottom += 14;
        valid.push({ id: `link:${l.id}`, x: 20, y: bottom, w: 360, h: repHeight(l), z: ++maxZ });
        bottom += repHeight(l);
      }
    }
    return valid;
  });

  const [canvasH, setCanvasH] = useState<number>(() => {
    const saved = Number(theme?.freeCanvasHeight);
    if (saved && saved >= 300) return saved;
    return buildDefaultItems(profile, theme, activeLinks).canvasH;
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapGuide, setSnapGuide] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Escala do canvas para caber na área do editor
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const update = () => setScale(clamp((el.clientWidth - 32) / FREE_CANVAS_WIDTH, 0.5, 1.25));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Trava o scroll do body enquanto o editor está aberto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Drag / Resize com pointer events (mouse + toque)
  const dragRef = useRef<null | {
    id: string;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    orig: FreeCanvasItem;
  }>(null);

  const startDrag = (e: React.PointerEvent, id: string, mode: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setSelectedId(id);
    dragRef.current = { id, mode, startX: e.clientX, startY: e.clientY, orig: { ...item } };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / scale;
    const dy = (e.clientY - drag.startY) / scale;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== drag.id) return it;
        if (drag.mode === 'move') {
          let x = clamp(drag.orig.x + dx, -it.w * 0.4, FREE_CANVAS_WIDTH - it.w * 0.6);
          const y = clamp(drag.orig.y + dy, 0, canvasH - 16);
          // Snap na linha central vertical
          const center = x + it.w / 2;
          if (Math.abs(center - FREE_CANVAS_WIDTH / 2) < 8) {
            x = (FREE_CANVAS_WIDTH - it.w) / 2;
            setSnapGuide(true);
          } else {
            setSnapGuide(false);
          }
          // Estende o canvas automaticamente ao arrastar para baixo
          if (y + it.h > canvasH - 24) setCanvasH(Math.ceil(y + it.h + 60));
          return { ...it, x, y };
        }
        // resize: avatar mantém proporção quadrada; demais ajustam largura
        if (it.id === 'avatar') {
          const size = clamp(drag.orig.w + Math.max(dx, dy), 40, 240);
          return { ...it, w: size, h: size };
        }
        const w = clamp(drag.orig.w + dx, 60, FREE_CANVAS_WIDTH);
        return { ...it, w };
      })
    );
  };

  const endDrag = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
    }
    dragRef.current = null;
    setSnapGuide(false);
  };

  // ── Ações do item selecionado
  const centerSelected = () => {
    if (!selectedId) return;
    setItems((prev) => prev.map((it) => (it.id === selectedId ? { ...it, x: (FREE_CANVAS_WIDTH - it.w) / 2 } : it)));
  };
  const bringToFront = () => {
    if (!selectedId) return;
    const maxZ = items.reduce((m, it) => Math.max(m, it.z || 1), 1);
    setItems((prev) => prev.map((it) => (it.id === selectedId ? { ...it, z: maxZ + 1 } : it)));
  };
  const sendToBack = () => {
    if (!selectedId) return;
    const minZ = items.reduce((m, it) => Math.min(m, it.z || 1), 1);
    setItems((prev) => prev.map((it) => (it.id === selectedId ? { ...it, z: minZ - 1 } : it)));
  };

  const resetLayout = () => {
    const def = buildDefaultItems(profile, theme, activeLinks);
    setItems(def.items);
    setCanvasH(def.canvasH);
    setSelectedId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Normaliza z para inteiros positivos e arredonda coordenadas
      const sorted = [...items].sort((a, b) => (a.z || 1) - (b.z || 1));
      const cleaned = sorted.map((it, i) => ({
        id: it.id,
        x: Math.round(it.x),
        y: Math.round(it.y),
        w: Math.round(it.w),
        h: Math.round(it.h),
        z: i + 1,
      }));
      await onSave({
        ...theme,
        freeLayoutEnabled: true,
        freeLayoutItems: cleaned,
        freeCanvasHeight: Math.round(canvasH),
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Aparência do canvas (espelha o fundo do tema)
  const bgType = theme?.backgroundType || 'color';
  const canvasStyle: React.CSSProperties = {};
  let canvasBgClass = '';
  if (bgType === 'gradient' && theme?.backgroundGradient) {
    canvasStyle.background = theme.backgroundGradient;
  } else if (bgType === 'image' && theme?.backgroundImageUrl) {
    canvasStyle.backgroundImage = `url(${theme.backgroundImageUrl})`;
    canvasStyle.backgroundSize = 'cover';
    canvasStyle.backgroundPosition = 'center';
  } else if (theme?.backgroundColor && (theme.backgroundColor.startsWith('#') || theme.backgroundColor.startsWith('rgb'))) {
    canvasStyle.backgroundColor = theme.backgroundColor;
  } else {
    canvasBgClass = theme?.backgroundColor || 'bg-zinc-950 text-zinc-100';
  }
  const lightBg = isLightHex(theme?.backgroundColor);
  const baseTextColor = lightBg ? '#18181b' : '#f4f4f5';
  const titleColor = theme?.titleColor || baseTextColor;

  const fontClassMap: Record<string, string> = {
    sans: 'font-sans', serif: 'font-serif', mono: 'font-mono', space: 'font-space',
    outfit: 'font-outfit', syne: 'font-syne', cinzel: 'font-cinzel', bebas: 'font-bebas', caveat: 'font-caveat',
  };
  const fontClass = fontClassMap[theme?.fontFamily] || 'font-sans';

  // ── Conteúdo de cada elemento (mock fiel ao render público)
  const renderItemContent = (item: FreeCanvasItem) => {
    if (item.id === 'avatar') {
      return profile.profilePicUrl ? (
        <img
          src={profile.profilePicUrl}
          referrerPolicy="no-referrer"
          alt={profile.displayName}
          draggable={false}
          className="w-full h-full rounded-full object-cover border-4 border-[#0a1128] shadow-lg select-none pointer-events-none"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-[#0a1128] shadow-lg select-none">
          {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : '?'}
        </div>
      );
    }
    if (item.id === 'name') {
      return (
        <h1 className="text-xl font-bold text-center truncate select-none" style={{ color: titleColor }}>
          {profile.displayName || `@${profile.username}`}
        </h1>
      );
    }
    if (item.id === 'username') {
      return (
        <p className="text-xs opacity-60 font-mono text-center select-none" style={{ color: baseTextColor }}>
          @{profile.username}
        </p>
      );
    }
    if (item.id === 'bio') {
      return (
        <p className="text-sm opacity-85 text-center whitespace-pre-line leading-relaxed break-words select-none" style={{ color: theme?.bioColor || baseTextColor }}>
          {profile.bio}
        </p>
      );
    }
    if (item.id === 'socials') {
      const count = theme?.headerSocials ? Object.values(theme.headerSocials).filter(Boolean).length : 0;
      return (
        <div className="flex flex-wrap gap-2.5 justify-center select-none">
          {Array.from({ length: Math.max(1, count) }).map((_, i) => (
            <span key={i} className={`w-9 h-9 rounded-full flex items-center justify-center border ${lightBg ? 'bg-black/5 border-black/10 text-zinc-700' : 'bg-white/5 border-white/15 text-zinc-300'}`}>
              <Globe className="w-4 h-4" />
            </span>
          ))}
        </div>
      );
    }
    if (item.id.startsWith('link:')) {
      const link = activeLinks.find((l) => `link:${l.id}` === item.id);
      if (!link) return null;
      const blockLabel = BLOCK_LABELS[link.type || ''];
      if (blockLabel) {
        return (
          <div className={`w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 select-none ${lightBg ? 'border-black/20 bg-black/5 text-zinc-700' : 'border-white/20 bg-white/5 text-zinc-200'}`}>
            <Sparkles className="w-4 h-4 opacity-60" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{blockLabel}</span>
            <span className="text-xs font-semibold px-3 truncate max-w-full">{link.title}</span>
          </div>
        );
      }
      // Botões padrão (link, whatsapp, buy_now, send_resume)
      const btnBg = link.type === 'whatsapp' ? '#16a34a'
        : link.type === 'buy_now' ? '#d97706'
        : (link.useGradient && link.customGradient) ? undefined
        : link.customColor || theme?.buttonColor || '#1d4ed8';
      const btnStyle: React.CSSProperties = {
        background: link.useGradient && link.customGradient ? link.customGradient : (theme?.buttonGradient && !link.customColor && link.type !== 'whatsapp' && link.type !== 'buy_now' ? theme.buttonGradient : undefined),
        backgroundColor: btnBg,
        color: (link.type === 'whatsapp' || link.type === 'buy_now') ? '#ffffff' : link.customTextColor || theme?.buttonTextColor || '#ffffff',
      };
      return (
        <div
          className={`w-full h-full flex items-center justify-center gap-2 px-4 font-extrabold text-xs tracking-wide select-none shadow-sm ${
            theme?.borderRadius === 'none' ? 'rounded-none' : theme?.borderRadius === 'subtle' ? 'rounded-lg' : theme?.borderRadius === 'full' ? 'rounded-full' : 'rounded-2xl'
          }`}
          style={btnStyle}
        >
          {link.iconEmoji && <span className="text-base">{link.iconEmoji}</span>}
          <span className="truncate">{link.title}</span>
        </div>
      );
    }
    return null;
  };

  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#050b18] flex flex-col" role="dialog" aria-label="Construtor Livre">
      {/* ── Toolbar superior */}
      <header className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 py-3 border-b border-slate-800/70 bg-[#0a1128]/90 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Fechar sem salvar"
            aria-label="Fechar editor"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Move className="w-4 h-4 text-[#a78bfa] shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">Construtor Livre</h2>
            <span className="text-[8px] font-black uppercase tracking-wider bg-[#a78bfa]/15 text-[#a78bfa] border border-[#a78bfa]/25 px-1.5 py-0.5 rounded-md shrink-0">Beta</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1 bg-black/40 border border-slate-800 rounded-xl px-2 py-1">
            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Altura</span>
            <button onClick={() => setCanvasH((h) => Math.max(400, h - 100))} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer" title="Diminuir altura do canvas"><Minus className="w-3 h-3" /></button>
            <span className="text-[10px] text-slate-300 font-mono w-10 text-center">{Math.round(canvasH)}</span>
            <button onClick={() => setCanvasH((h) => h + 100)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer" title="Aumentar altura do canvas"><Plus className="w-3 h-3" /></button>
          </div>
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/50 transition-all cursor-pointer"
            title="Reorganizar tudo na pilha padrão"
          >
            <RotateCcw className="w-3 h-3" /> <span className="hidden sm:inline">Restaurar</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-[10px] font-extrabold px-3 sm:px-4 py-2 rounded-xl bg-[#a78bfa] hover:bg-[#c4b5fd] disabled:bg-slate-800 disabled:text-slate-500 text-white uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#a78bfa]/20"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* ── Área do canvas */}
      <div ref={areaRef} className="flex-1 overflow-auto overscroll-contain p-4 flex justify-center" onPointerDown={() => setSelectedId(null)}>
        <div style={{ width: FREE_CANVAS_WIDTH * scale, height: canvasH * scale }} className="relative shrink-0">
          <div
            className={`absolute top-0 left-0 overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl ${canvasBgClass} ${fontClass}`}
            style={{ width: FREE_CANVAS_WIDTH, height: canvasH, transform: `scale(${scale})`, transformOrigin: 'top left', ...canvasStyle }}
          >
            {/* Linha-guia central (snap) */}
            {snapGuide && (
              <div className="absolute top-0 bottom-0 w-px bg-[#a78bfa] z-[999] pointer-events-none" style={{ left: FREE_CANVAS_WIDTH / 2 }} />
            )}

            {items.map((item) => {
              const isSel = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onPointerDown={(e) => startDrag(e, item.id, 'move')}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className={`absolute cursor-grab active:cursor-grabbing ${isSel ? 'ring-2 ring-[#a78bfa] ring-offset-1 ring-offset-transparent rounded-lg' : 'hover:ring-1 hover:ring-[#a78bfa]/40 rounded-lg'}`}
                  style={{ left: item.x, top: item.y, width: item.w, height: item.h, zIndex: item.z || 1, touchAction: 'none' }}
                >
                  {renderItemContent(item)}

                  {/* Alça de redimensionamento */}
                  {isSel && (
                    <div
                      onPointerDown={(e) => startDrag(e, item.id, 'resize')}
                      onPointerMove={onDragMove}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-[#a78bfa] border-2 border-white shadow-md cursor-nwse-resize z-[50]"
                      style={{ touchAction: 'none' }}
                      title="Arraste para redimensionar"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Barra inferior: ações do selecionado + dica */}
      <footer className="shrink-0 border-t border-slate-800/70 bg-[#0a1128]/90 backdrop-blur-md px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        {selectedItem ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mr-1 hidden sm:inline">Selecionado:</span>
            <button onClick={centerSelected} className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-all cursor-pointer" title="Centralizar horizontalmente">
              <AlignCenterHorizontal className="w-3 h-3" /> Centralizar
            </button>
            <button onClick={bringToFront} className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-all cursor-pointer" title="Trazer para frente">
              <ArrowUpToLine className="w-3 h-3" /> Frente
            </button>
            <button onClick={sendToBack} className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-all cursor-pointer" title="Enviar para trás">
              <ArrowDownToLine className="w-3 h-3" /> Trás
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500">
            <span className="font-bold text-slate-400">Dica:</span> arraste os elementos para mover • toque em um elemento e use a alça roxa para redimensionar
          </p>
        )}
        <span className="text-[9px] text-slate-600 font-mono hidden md:inline shrink-0">{items.length} elementos • canvas {FREE_CANVAS_WIDTH}×{Math.round(canvasH)}</span>
      </footer>
    </div>
  );
}
