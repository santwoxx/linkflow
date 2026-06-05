import React, { useState, useEffect } from 'react';
import { LinkItem, BlockType, FONTS_LIST } from '../types';
import { compressImage } from '../utils/image';
import { Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, Edit2, Check, X, ToggleLeft, ToggleRight, Loader2, Sparkles, Tag, Smile, Zap, MessageCircle, ShoppingBag, Image as ImageIcon, Star, Briefcase, CreditCard, LayoutTemplate, Palette, Type, Square, Droplet, Eye, EyeOff, Maximize, Minimize, AlignLeft, AlignCenter, AlignRight, Upload, AlertTriangle } from 'lucide-react';

interface LinkEditorProps {
  links: LinkItem[];
  onAdd: (title: string, url: string, type?: BlockType, extraData?: any) => Promise<void>;
  onUpdate: (linkId: string, updates: Partial<LinkItem>) => Promise<void>;
  onDelete: (linkId: string) => Promise<void>;
  onPreviewChange?: (linkId: string, patch: Partial<LinkItem> | null) => void;
}

// Translates a Firestore / network error thrown by onUpdate into a short,
// user-facing message in pt-BR.
function parseSaveError(err: any): string {
  const raw: string =
    (err && typeof err.message === 'string' ? err.message : String(err)) || '';
  const code: string = err?.code || '';

  if (code === 'permission-denied' || /permission|insufficient permissions/i.test(raw)) {
    return 'Sem permissão para salvar. Verifique se está logado e se é dono deste link.';
  }
  if (code === 'unavailable' || /network|offline|fetch failed/i.test(raw)) {
    return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
  }
  if (code === 'failed-precondition' || /invalid|validation|ensure|constraint/i.test(raw)) {
    return 'Algum valor enviado é inválido (cor, tamanho, etc). Revise cor/tamanho/gradiente.';
  }
  if (code === 'deadline-exceeded') {
    return 'A requisição demorou demais. Tente novamente.';
  }
  if (code === 'quota-exceeded' || /quota/i.test(raw)) {
    return 'Limite de armazenamento atingido. Tente reduzir o tamanho das imagens.';
  }
  // Fallback: show the raw message but trim long JSON dumps
  const trimmed = raw.replace(/^Error:\s*/i, '').slice(0, 200);
  return trimmed || 'Erro desconhecido ao salvar.';
}

export default function LinkEditor({ links, onAdd, onUpdate, onDelete, onPreviewChange }: LinkEditorProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Track which link ID is currently being edited
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editBadgeText, setEditBadgeText] = useState('');
  const [editIconEmoji, setEditIconEmoji] = useState('');
  const [editIconUrl, setEditIconUrl] = useState('');
  const [editAnimation, setEditAnimation] = useState('none');
  const [editImageUrl, setEditImageUrl] = useState(''); // For banners
  // Per-button advanced customization
  const [editCustomColor, setEditCustomColor] = useState('');
  const [editCustomTextColor, setEditCustomTextColor] = useState('');
  const [editCustomGradient, setEditCustomGradient] = useState('');
  const [editUseGradient, setEditUseGradient] = useState(false);
  const [editCustomStyle, setEditCustomStyle] = useState<'' | 'flat' | 'rounded' | 'outline' | 'shadow' | 'brutalist' | 'glass' | 'gradient' | 'neon'>('');
  const [editCustomRadius, setEditCustomRadius] = useState<'' | 'none' | 'subtle' | 'medium' | 'full' | 'pill'>('');
  const [editCustomSize, setEditCustomSize] = useState<'' | 'small' | 'medium' | 'large' | 'xl'>('');
  const [editCustomShadow, setEditCustomShadow] = useState(false);
  const [editCustomGlass, setEditCustomGlass] = useState(false);
  const [editCustomFont, setEditCustomFont] = useState<'' | 'sans' | 'serif' | 'mono' | 'space' | 'outfit' | 'syne' | 'bebas' | 'caveat'>('');
  const [editCustomBorderColor, setEditCustomBorderColor] = useState('');
  const [editCustomBorderWidth, setEditCustomBorderWidth] = useState(0);
  const [editCustomTextAlign, setEditCustomTextAlign] = useState<'' | 'left' | 'center' | 'right'>('');
  const [editCustomLetterSpacing, setEditCustomLetterSpacing] = useState<'' | 'tight' | 'normal' | 'wide' | 'wider'>('');
  const [editCustomUppercase, setEditCustomUppercase] = useState(false);
  const [editCustomIconPosition, setEditCustomIconPosition] = useState<'' | 'left' | 'right' | 'top' | 'none'>('');
  const [showAdvancedStyle, setShowAdvancedStyle] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);

  // Live preview: report all in-progress edit values to parent so the right-side
  // phone preview reflects the customization while the user is editing (before
  // they click "Aplicar"). Pass `null` from save/cancel handlers to clear.
  useEffect(() => {
    if (!editingLinkId || !onPreviewChange) return;
    onPreviewChange(editingLinkId, {
      title: editTitle,
      url: editUrl,
      subtitle: editSubtitle,
      badgeText: editBadgeText,
      iconEmoji: editIconEmoji,
      iconUrl: editIconUrl,
      animation: editAnimation,
      imageUrl: editImageUrl,
      customColor: editCustomColor,
      customTextColor: editCustomTextColor,
      customGradient: editCustomGradient,
      useGradient: editUseGradient,
      customStyle: editCustomStyle as any,
      customRadius: editCustomRadius as any,
      customSize: editCustomSize as any,
      customShadow: editCustomShadow,
      customGlass: editCustomGlass,
      customFont: editCustomFont as any,
      customBorderColor: editCustomBorderColor,
      customBorderWidth: editCustomBorderWidth,
      customTextAlign: editCustomTextAlign as any,
      customLetterSpacing: editCustomLetterSpacing as any,
      customUppercase: editCustomUppercase,
      customIconPosition: editCustomIconPosition as any,
    });
  }, [
    editingLinkId, onPreviewChange,
    editTitle, editUrl, editSubtitle, editBadgeText, editIconEmoji, editIconUrl, editAnimation, editImageUrl,
    editCustomColor, editCustomTextColor, editCustomGradient, editUseGradient,
    editCustomStyle, editCustomRadius, editCustomSize,
    editCustomShadow, editCustomGlass, editCustomFont,
    editCustomBorderColor, editCustomBorderWidth,
    editCustomTextAlign, editCustomLetterSpacing, editCustomUppercase, editCustomIconPosition,
  ]);

  const handleAddBlock = async (type: BlockType) => {
    setIsAdding(true);
    try {
      let defaultTitle = 'Novo Botão';
      let defaultUrl = 'https://';
      let extraData: any = {};

      switch(type) {
        case 'whatsapp':
          defaultTitle = 'Fale no WhatsApp';
          defaultUrl = 'https://wa.me/55';
          extraData = { iconEmoji: '💬', animation: 'pulse' };
          break;
        case 'telegram':
          defaultTitle = 'Canal do Telegram';
          defaultUrl = 'https://t.me/';
          extraData = { iconEmoji: '✈️' };
          break;
        case 'buy_now':
          defaultTitle = 'Comprar Agora';
          defaultUrl = 'https://';
          extraData = { iconEmoji: '🛒', animation: 'bounce', badgeText: 'OFERTA' };
          break;
        case 'promo_banner':
          defaultTitle = 'Banner Promocional';
          defaultUrl = 'https://';
          extraData = { imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80' };
          break;
        case 'products':
          defaultTitle = 'Produtos em Destaque';
          defaultUrl = '';
          extraData = { 
            content: [
              { id: '1', name: 'Produto Exemplo', price: 'R$ 99,90', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60', url: 'https://' }
            ]
          };
          break;
        case 'testimonials':
          defaultTitle = 'O que nossos clientes dizem';
          defaultUrl = '';
          extraData = {
            content: [
              { id: '1', name: 'João Silva', text: 'Melhor compra que já fiz!', rating: 5 }
            ]
          };
          break;
        case 'services':
          defaultTitle = 'Meus Serviços';
          defaultUrl = '';
          extraData = {
            content: [
              { id: '1', name: 'Consultoria Premium', description: 'Atendimento personalizado para alavancar seus resultados', price: 'R$ 97,00', category: 'Consultoria', whatsapp: '5511999999999', deliveryTime: '48h' }
            ]
          };
          break;
        case 'gallery':
          defaultTitle = 'Galeria de Fotos';
          defaultUrl = '';
          extraData = {
            content: [
              'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=500&auto=format&fit=crop&q=60',
              'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60'
            ]
          };
          break;
      }

      await onAdd(defaultTitle, defaultUrl, type, extraData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (link: LinkItem) => {
    setEditingLinkId(link.id);
    setSaveError(null);
    setEditTitle(link.title || '');
    setEditUrl(link.url || '');
    setEditSubtitle(link.subtitle || '');
    setEditBadgeText(link.badgeText || '');
    setEditIconEmoji(link.iconEmoji || '');
    setEditIconUrl(link.iconUrl || '');
    setEditAnimation(link.animation || 'none');
    setEditImageUrl(link.imageUrl || '');
    setEditCustomColor(link.customColor || '');
    setEditCustomTextColor(link.customTextColor || '');
    setEditCustomGradient(link.customGradient || '');
    setEditUseGradient(!!link.useGradient);
    setEditCustomStyle((link.customStyle as any) || '');
    setEditCustomRadius((link.customRadius as any) || '');
    setEditCustomSize((link.customSize as any) || '');
    setEditCustomShadow(!!link.customShadow);
    setEditCustomGlass(!!link.customGlass);
    setEditCustomFont((link.customFont as any) || '');
    setEditCustomBorderColor(link.customBorderColor || '');
    setEditCustomBorderWidth(link.customBorderWidth || 0);
    setEditCustomTextAlign((link.customTextAlign as any) || '');
    setEditCustomLetterSpacing((link.customLetterSpacing as any) || '');
    setEditCustomUppercase(!!link.customUppercase);
    setEditCustomIconPosition((link.customIconPosition as any) || '');
    setShowAdvancedStyle(false);
  };

  const handleSaveEdit = async (linkId: string) => {
    if (!editTitle.trim()) return;

    // Guard: base64 images stored in iconUrl/imageUrl must fit within the
    // Firestore rule limit (500 000 chars). We cap at 350 000 to stay safe.
    const MAX_IMAGE_CHARS = 350_000;
    const iconUrlVal = editIconUrl.trim();
    const imageUrlVal = editImageUrl.trim();
    if (iconUrlVal.startsWith('data:') && iconUrlVal.length > MAX_IMAGE_CHARS) {
      setSaveError('A imagem da logo é muito grande para salvar. Tente uma imagem menor ou de menor resolução.');
      return;
    }
    if (imageUrlVal.startsWith('data:') && imageUrlVal.length > MAX_IMAGE_CHARS) {
      setSaveError('A imagem do banner é muito grande para salvar. Tente uma imagem menor ou de menor resolução.');
      return;
    }

    setIsSavingEdit(true);
    try {
      let url = editUrl.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      const updatePayload = {
        title: editTitle.trim(),
        url: url,
        subtitle: editSubtitle.trim() || '',
        badgeText: editBadgeText.trim() || '',
        iconEmoji: editIconEmoji.trim() || '',
        iconUrl: iconUrlVal || '',
        animation: editAnimation || 'none',
        imageUrl: imageUrlVal || '',
        customColor: editCustomColor.trim() || '',
        customTextColor: editCustomTextColor.trim() || '',
        customGradient: editCustomGradient.trim() || '',
        useGradient: editUseGradient,
        customStyle: editCustomStyle as any,
        customRadius: editCustomRadius as any,
        customSize: editCustomSize as any,
        customShadow: editCustomShadow,
        customGlass: editCustomGlass,
        customFont: editCustomFont as any,
        customBorderColor: editCustomBorderColor.trim() || '',
        customBorderWidth: editCustomBorderWidth || 0,
        customTextAlign: editCustomTextAlign as any,
        customLetterSpacing: editCustomLetterSpacing as any,
        customUppercase: editCustomUppercase,
        customIconPosition: editCustomIconPosition as any,
      };
      // [diagnóstico] ajuda a confirmar no DevTools que TODOS os campos
      // customizados estão sendo enviados antes do onUpdate().
      console.log('[LinkEditor] saving link', linkId, updatePayload);
      await onUpdate(linkId, updatePayload);
      if (onPreviewChange) onPreviewChange(linkId, null);
      setSaveError(null);
      setEditingLinkId(null);
    } catch (err: any) {
      console.error('[LinkEditor] save failed:', err);
      setSaveError(parseSaveError(err));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= links.length) return;

    const linkContainer = [...links];
    const currentLink = linkContainer[index];
    const targetLink = linkContainer[swapIndex];

    const currentOrder = currentLink.order;
    currentLink.order = targetLink.order;
    targetLink.order = currentOrder;

    await Promise.all([
      onUpdate(currentLink.id, { order: currentLink.order }),
      onUpdate(targetLink.id, { order: targetLink.order })
    ]);
  };

  const sortedLinks = [...links].sort((a, b) => a.order - b.order);

  const BLOCKS_MENU = [
    { type: 'link', label: 'Botão Link', icon: <ExternalLink className="w-4 h-4" /> },
    { type: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4 text-green-400" /> },
    { type: 'promo_banner', label: 'Banner Promo', icon: <ImageIcon className="w-4 h-4 text-purple-400" /> },
    { type: 'buy_now', label: 'Botão Compra', icon: <ShoppingBag className="w-4 h-4 text-amber-400" /> },
    { type: 'products', label: 'Produtos', icon: <LayoutTemplate className="w-4 h-4 text-blue-400" /> },
    { type: 'gallery', label: 'Galeria', icon: <ImageIcon className="w-4 h-4 text-rose-400" /> },
    { type: 'testimonials', label: 'Depoimentos', icon: <Star className="w-4 h-4 text-yellow-400" /> },
    { type: 'services', label: 'Serviços', icon: <Briefcase className="w-4 h-4 text-emerald-400" /> },
  ] as const;

  return (
    <div id="link-editor-container" className="space-y-6">
      {/* 1. Add Block Grid */}
      <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800/50 space-y-4 shadow-lg">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
          <Plus className="w-4 h-4 text-blue-500" />
          Adicionar Bloco de Landing Page
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {BLOCKS_MENU.map((item) => (
            <button
              key={item.type}
              onClick={() => handleAddBlock(item.type)}
              disabled={isAdding}
              className="flex flex-col items-center justify-center p-3 gap-2 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-slate-950 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. List of existing active/inactive blocks */}
      <div id="links-management-list" className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Seus Blocos ({sortedLinks.length})
        </h3>

        {sortedLinks.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-slate-800 bg-[#0d1527] bg-opacity-30">
            <p className="text-sm text-slate-500">Nenhum bloco adicionado ainda.</p>
            <p className="text-xs text-slate-600 mt-1">Escolha uma opção acima para começar!</p>
          </div>
        ) : (
          <div id="links-group" className="space-y-3">
            {sortedLinks.map((link, idx) => {
              const isEditing = editingLinkId === link.id;
              const blockName = BLOCKS_MENU.find(b => b.type === link.type)?.label || 'Bloco';
              
              return (
                <div
                  key={link.id}
                  id={`link-row-${link.id}`}
                  className={`p-4 rounded-2xl border transition-all shadow-md ${
                    link.active
                      ? 'border-slate-800 bg-[#0f172a] hover:border-slate-700'
                      : 'border-slate-900 bg-[#060c1c] opacity-50'
                  }`}
                >
                  {isEditing ? (
                    /* EDIT STATE UI */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-xs font-bold text-blue-400 font-sans flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                          Configurar: {blockName}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                          onClick={() => {
                            if (onPreviewChange && editingLinkId) onPreviewChange(editingLinkId, null);
                            setEditingLinkId(null);
                          }}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Common fields (Title/URL) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-semibold mb-1">Título principal *</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-black text-xs text-slate-200 py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                            required
                          />
                        </div>

                        {(link.type === 'link' || link.type === 'whatsapp' || link.type === 'telegram' || link.type === 'buy_now' || link.type === 'promo_banner') && (
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">Link de Destino / URL</label>
                            <input
                              type="text"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              className="w-full bg-black text-xs text-slate-200 py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                            />
                          </div>
                        )}
                      </div>

                      {/* Promo Banner specific */}
                      {link.type === 'promo_banner' && (
                        <div>
                          <label className="block text-[10px] text-slate-400 font-semibold mb-1">URL da Imagem do Banner</label>
                          <input
                            type="text"
                            value={editImageUrl}
                            onChange={(e) => setEditImageUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-black text-xs text-slate-200 py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      )}

                      {/* Button properties fields */}
                      {(link.type === 'link' || link.type === 'whatsapp' || link.type === 'buy_now' || link.type === 'telegram') && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                                <Tag className="w-3 h-3 text-slate-500" />
                                Subtítulo Auxiliar (Opcional)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Receba em até 5 minutos"
                                value={editSubtitle}
                                onChange={(e) => setEditSubtitle(e.target.value)}
                                className="w-full bg-black text-xs text-slate-200 py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                Texto do Badge (Tag)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: HOT, NOVO, 20% OFF"
                                value={editBadgeText}
                                onChange={(e) => setEditBadgeText(e.target.value)}
                                className="w-full bg-black text-xs text-slate-200 py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-800 font-sans"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                                <Smile className="w-3 h-3 text-amber-400" />
                                Ícone do Link (Emoji)
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  maxLength={10}
                                  placeholder="Ex: 🚀, 💬"
                                  value={editIconEmoji}
                                  onChange={(e) => setEditIconEmoji(e.target.value)}
                                  className="w-full bg-black text-xs text-slate-200 py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-800"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                                <Upload className="w-3 h-3 text-[#a78bfa]" />
                                Logo / Imagem
                              </label>
                              <div className="flex items-center gap-2">
                                <label className="shrink-0 w-10 h-10 rounded-xl border border-dashed border-slate-700 hover:border-[#a78bfa] flex items-center justify-center cursor-pointer overflow-hidden bg-black transition-all">
                                  {editIconUrl ? (
                                    <img src={editIconUrl} alt="logo" className="w-full h-full object-contain" />
                                  ) : (
                                    <Upload className="w-4 h-4 text-slate-500" />
                                  )}
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          setEditIconUrl(await compressImage(file, 96, 96, 0.85));
                                        } catch {}
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                                <input
                                  type="text"
                                  placeholder="ou cole uma URL"
                                  value={editIconUrl}
                                  onChange={(e) => setEditIconUrl(e.target.value)}
                                  className="flex-1 min-w-0 bg-black text-[10px] text-slate-300 py-2 px-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-[#a78bfa] placeholder-slate-700 font-mono"
                                />
                                {editIconUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setEditIconUrl('')}
                                    className="shrink-0 bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-rose-500/20 cursor-pointer"
                                  >
                                    Limpar
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                Animação de Atenção
                              </label>
                              <select
                                value={editAnimation}
                                onChange={(e) => setEditAnimation(e.target.value)}
                                className="w-full bg-black text-xs text-slate-300 py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                              >
                                <option value="none">Fixo</option>
                                <option value="pulse">Pulse</option>
                                <option value="wobble">Wobble</option>
                                <option value="bounce">Bounce</option>
                                <option value="glow">Glow Neon</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Content Arrays Edit Notice */}
                      {(link.type === 'products' || link.type === 'testimonials' || link.type === 'gallery') && (
                        <div className="p-3 bg-blue-900/10 border border-blue-900/30 rounded-xl">
                          <p className="text-[11px] text-blue-400">
                            A edição avançada de itens internos (fotos da galeria, depoimentos individuais) será feita em uma janela modal nas próximas atualizações. O bloco base já está pronto para receber dados via código!
                          </p>
                        </div>
                      )}

                      {/* Advanced per-button customization */}
                      {(link.type === 'link' || link.type === 'whatsapp' || link.type === 'buy_now' || link.type === 'telegram' || link.type === 'payment') && (
                        <div className="bg-gradient-to-br from-[#a78bfa]/5 to-purple-500/5 border border-[#a78bfa]/20 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowAdvancedStyle(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#a78bfa]/5 transition-all cursor-pointer"
                          >
                            <span className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-wider flex items-center gap-1.5">
                              <Palette className="w-3.5 h-3.5" /> Personalização Avançada do Botão
                            </span>
                            <span className="text-[9px] text-slate-500 flex items-center gap-1">
                              {showAdvancedStyle ? 'Ocultar' : 'Mostrar'}
                              {showAdvancedStyle ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
                            </span>
                          </button>

                          {showAdvancedStyle && (
                            <div className="px-4 pb-4 space-y-4 border-t border-[#a78bfa]/10 pt-3">
                              {/* Visual style preset */}
                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
                                  <Square className="w-3 h-3 text-[#a78bfa]" /> Estilo Visual
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {([
                                    { v: '', l: 'Padrão' },
                                    { v: 'flat', l: 'Flat' },
                                    { v: 'rounded', l: 'Round' },
                                    { v: 'outline', l: 'Outline' },
                                    { v: 'shadow', l: 'Shadow' },
                                    { v: 'brutalist', l: 'Brutal' },
                                    { v: 'glass', l: 'Glass' },
                                    { v: 'gradient', l: 'Grad' },
                                    { v: 'neon', l: 'Neon' },
                                  ] as const).map(o => (
                                    <button key={o.v || 'default'} type="button"
                                      onClick={() => setEditCustomStyle(o.v as any)}
                                      className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                        editCustomStyle === o.v
                                          ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]'
                                          : 'bg-black/40 border-slate-800 text-zinc-500 hover:border-slate-600'
                                      }`}>{o.l}</button>
                                  ))}
                                </div>
                              </div>

                              {/* Color customization */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                    <Droplet className="w-3 h-3 text-blue-400" /> Cor de Fundo
                                  </label>
                                  <label className="flex items-center gap-1.5 text-[9px] text-slate-500 cursor-pointer">
                                    <input type="checkbox" checked={editUseGradient} onChange={(e) => setEditUseGradient(e.target.checked)} className="accent-[#a78bfa] w-3 h-3" />
                                    Usar gradiente
                                  </label>
                                </div>
                                {!editUseGradient ? (
                                  <div className="flex gap-2">
                                    <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(editCustomColor) ? editCustomColor : '#111a36'} onChange={(e) => setEditCustomColor(e.target.value)} className="w-9 h-9 rounded border border-slate-800 bg-transparent cursor-pointer shrink-0" title="Cor sólida" />
                                    <input type="text" placeholder="#111a36 ou rgba(...)" value={editCustomColor} onChange={(e) => setEditCustomColor(e.target.value)} className="flex-1 bg-black text-[10px] text-slate-300 py-2 px-3 rounded-lg border border-slate-800 focus:border-[#a78bfa] focus:outline-none font-mono" />
                                    {editCustomColor && <button type="button" onClick={() => setEditCustomColor('')} className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 rounded-lg border border-rose-500/20 cursor-pointer">Limpar</button>}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <input type="text" placeholder="linear-gradient(135deg, #f00, #00f)" value={editCustomGradient} onChange={(e) => setEditCustomGradient(e.target.value)} className="flex-1 bg-black text-[10px] text-slate-300 py-2 px-3 rounded-lg border border-slate-800 focus:border-[#a78bfa] focus:outline-none font-mono" />
                                      {editCustomGradient && <button type="button" onClick={() => setEditCustomGradient('')} className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 rounded-lg border border-rose-500/20 cursor-pointer">Limpar</button>}
                                    </div>
                                    <div className="h-7 w-full rounded-lg border border-slate-800 transition-all" style={{ background: editCustomGradient || 'linear-gradient(135deg, #1e3a8a, #7c3aed)' }} />
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  {['#111a36','#1e40af','#7c3aed','#a78bfa','#db2777','#dc2626','#16a34a','#0d9488','#f59e0b','#f43f5e','#0ea5e9','#10b981','#1f2937','#000000','#ffffff','#6b7280'].map(c => (
                                    <button key={c} type="button" onClick={() => { setEditCustomColor(c); if (editUseGradient) setEditUseGradient(false); }} className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer hover:scale-110 ${editCustomColor === c ? 'border-[#a78bfa] scale-110' : 'border-transparent hover:border-zinc-500'}`} style={{ backgroundColor: c }} title={c} />
                                  ))}
                                </div>
                              </div>

                              {/* Text color */}
                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
                                  <Type className="w-3 h-3 text-emerald-400" /> Cor do Texto
                                </label>
                                <div className="flex gap-2">
                                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(editCustomTextColor) ? editCustomTextColor : '#ffffff'} onChange={(e) => setEditCustomTextColor(e.target.value)} className="w-9 h-9 rounded border border-slate-800 bg-transparent cursor-pointer shrink-0" title="Cor do texto" />
                                  <input type="text" placeholder="#ffffff" value={editCustomTextColor} onChange={(e) => setEditCustomTextColor(e.target.value)} className="flex-1 bg-black text-[10px] text-slate-300 py-2 px-3 rounded-lg border border-slate-800 focus:border-[#a78bfa] focus:outline-none font-mono" />
                                  {editCustomTextColor && <button type="button" onClick={() => setEditCustomTextColor('')} className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 rounded-lg border border-rose-500/20 cursor-pointer">Limpar</button>}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {['#ffffff','#000000','#f8fafc','#fef3c7','#fef2f2','#ecfdf5','#eff6ff','#fdf4ff','#fff7ed','#f0fdf4','#f5f3ff'].map(c => (
                                    <button key={c} type="button" onClick={() => setEditCustomTextColor(c)} className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer hover:scale-110 ${editCustomTextColor === c ? 'border-[#a78bfa] scale-110' : 'border-transparent hover:border-zinc-500'}`} style={{ backgroundColor: c }} title={c} />
                                  ))}
                                </div>
                              </div>

                              {/* Border */}
                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
                                  <Square className="w-3 h-3 text-amber-400" /> Borda
                                </label>
                                <div className="flex gap-2">
                                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(editCustomBorderColor) ? editCustomBorderColor : '#a78bfa'} onChange={(e) => setEditCustomBorderColor(e.target.value)} className="w-9 h-9 rounded border border-slate-800 bg-transparent cursor-pointer shrink-0" />
                                  <input type="text" placeholder="#a78bfa" value={editCustomBorderColor} onChange={(e) => setEditCustomBorderColor(e.target.value)} className="flex-1 bg-black text-[10px] text-slate-300 py-2 px-3 rounded-lg border border-slate-800 focus:border-[#a78bfa] focus:outline-none font-mono" />
                                  <div className="flex items-center gap-1.5 bg-black border border-slate-800 rounded-lg px-2 shrink-0">
                                    <span className="text-[9px] text-zinc-500">Esp:</span>
                                    <input type="number" min="0" max="8" value={editCustomBorderWidth} onChange={(e) => setEditCustomBorderWidth(Math.max(0, Math.min(8, Number(e.target.value))))} className="w-10 bg-transparent text-[10px] text-slate-300 py-2 focus:outline-none text-center font-mono" />
                                    <span className="text-[9px] text-zinc-500">px</span>
                                  </div>
                                </div>
                              </div>

                              {/* Border radius */}
                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-1.5">Arredondamento</label>
                                <div className="grid grid-cols-5 gap-1.5">
                                  {([
                                    { v: '', l: 'Padrão' },
                                    { v: 'none', l: 'Quadrado' },
                                    { v: 'subtle', l: 'Sutil' },
                                    { v: 'medium', l: 'Médio' },
                                    { v: 'full', l: 'Redondo' },
                                    { v: 'pill', l: 'Pílula' },
                                  ] as const).map(o => (
                                    <button key={o.v || 'default'} type="button"
                                      onClick={() => setEditCustomRadius(o.v as any)}
                                      className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                        editCustomRadius === o.v
                                          ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]'
                                          : 'bg-black/40 border-slate-800 text-zinc-500 hover:border-slate-600'
                                      }`}>{o.l}</button>
                                  ))}
                                </div>
                              </div>

                              {/* Size */}
                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-1.5">Tamanho</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {([
                                    { v: '', l: 'Padrão' },
                                    { v: 'small', l: 'P' },
                                    { v: 'medium', l: 'M' },
                                    { v: 'large', l: 'G' },
                                    { v: 'xl', l: 'GG' },
                                  ] as const).map(o => (
                                    <button key={o.v || 'default'} type="button"
                                      onClick={() => setEditCustomSize(o.v as any)}
                                      className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                        editCustomSize === o.v
                                          ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]'
                                          : 'bg-black/40 border-slate-800 text-zinc-500 hover:border-slate-600'
                                      }`}>{o.l}</button>
                                  ))}
                                </div>
                              </div>

                              {/* Font */}
                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
                                  <Type className="w-3 h-3 text-rose-400" /> Fonte do Botão
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {([
                                    { v: '', l: 'Padrão' },
                                    { v: 'sans', l: 'Sans' },
                                    { v: 'serif', l: 'Serif' },
                                    { v: 'mono', l: 'Mono' },
                                    { v: 'space', l: 'Space' },
                                    { v: 'outfit', l: 'Outfit' },
                                    { v: 'syne', l: 'Syne' },
                                    { v: 'bebas', l: 'Bebas' },
                                    { v: 'caveat', l: 'Caveat' },
                                  ] as const).map(o => (
                                    <button key={o.v || 'default'} type="button"
                                      onClick={() => setEditCustomFont(o.v as any)}
                                      className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                        editCustomFont === o.v
                                          ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]'
                                          : 'bg-black/40 border-slate-800 text-zinc-500 hover:border-slate-600'
                                      }`}>{o.l}</button>
                                  ))}
                                </div>
                              </div>

                              {/* Text alignment + letter spacing + uppercase */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] text-slate-400 font-semibold mb-1.5">Alinhamento do Texto</label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {([
                                      { v: '', l: 'Padrão', i: <AlignCenter className="w-3 h-3" /> },
                                      { v: 'left', l: 'Esq', i: <AlignLeft className="w-3 h-3" /> },
                                      { v: 'center', l: 'Centro', i: <AlignCenter className="w-3 h-3" /> },
                                      { v: 'right', l: 'Dir', i: <AlignRight className="w-3 h-3" /> },
                                    ] as const).map(o => (
                                      <button key={o.v || 'default'} type="button"
                                        onClick={() => setEditCustomTextAlign(o.v as any)}
                                        className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                          editCustomTextAlign === o.v
                                            ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]'
                                            : 'bg-black/40 border-slate-800 text-zinc-500 hover:border-slate-600'
                                        }`}>{o.i}{o.l}</button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 font-semibold mb-1.5">Espaçamento Letras</label>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {([
                                      { v: '', l: 'Padrão' },
                                      { v: 'tight', l: 'Justo' },
                                      { v: 'normal', l: 'Normal' },
                                      { v: 'wide', l: 'Largo' },
                                      { v: 'wider', l: 'L+', },
                                    ] as const).map(o => (
                                      <button key={o.v || 'default'} type="button"
                                        onClick={() => setEditCustomLetterSpacing(o.v as any)}
                                        className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                          editCustomLetterSpacing === o.v
                                            ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]'
                                            : 'bg-black/40 border-slate-800 text-zinc-500 hover:border-slate-600'
                                        }`}>{o.l}</button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Icon position */}
                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-1.5">Posição do Ícone (Emoji)</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {([
                                    { v: '', l: 'Padrão' },
                                    { v: 'left', l: '← Esq' },
                                    { v: 'top', l: '↑ Topo' },
                                    { v: 'right', l: 'Dir →' },
                                    { v: 'none', l: 'Oculto' },
                                  ] as const).map(o => (
                                    <button key={o.v || 'default'} type="button"
                                      onClick={() => setEditCustomIconPosition(o.v as any)}
                                      className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                        editCustomIconPosition === o.v
                                          ? 'bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]'
                                          : 'bg-black/40 border-slate-800 text-zinc-500 hover:border-slate-600'
                                      }`}>{o.l}</button>
                                  ))}
                                </div>
                              </div>

                              {/* Toggles */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                <label className="flex items-center justify-between gap-2 bg-black/40 rounded-lg p-2 border border-slate-800 cursor-pointer">
                                  <span className="text-[9px] text-zinc-400 flex items-center gap-1.5">
                                    {editCustomShadow ? <Eye className="w-3 h-3 text-[#a78bfa]" /> : <EyeOff className="w-3 h-3 text-zinc-600" />}
                                    Sombra
                                  </span>
                                  <span className={`relative w-8 h-4 rounded-full transition-all ${editCustomShadow ? 'bg-[#a78bfa]' : 'bg-zinc-700'}`}>
                                    <input type="checkbox" checked={editCustomShadow} onChange={(e) => setEditCustomShadow(e.target.checked)} className="sr-only" />
                                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${editCustomShadow ? 'left-4' : 'left-0.5'}`} />
                                  </span>
                                </label>
                                <label className="flex items-center justify-between gap-2 bg-black/40 rounded-lg p-2 border border-slate-800 cursor-pointer">
                                  <span className="text-[9px] text-zinc-400 flex items-center gap-1.5">
                                    {editCustomGlass ? <Eye className="w-3 h-3 text-[#a78bfa]" /> : <EyeOff className="w-3 h-3 text-zinc-600" />}
                                    Vidro (Blur)
                                  </span>
                                  <span className={`relative w-8 h-4 rounded-full transition-all ${editCustomGlass ? 'bg-[#a78bfa]' : 'bg-zinc-700'}`}>
                                    <input type="checkbox" checked={editCustomGlass} onChange={(e) => setEditCustomGlass(e.target.checked)} className="sr-only" />
                                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${editCustomGlass ? 'left-4' : 'left-0.5'}`} />
                                  </span>
                                </label>
                                <label className="flex items-center justify-between gap-2 bg-black/40 rounded-lg p-2 border border-slate-800 cursor-pointer">
                                  <span className="text-[9px] text-zinc-400 flex items-center gap-1.5">
                                    {editCustomUppercase ? <Eye className="w-3 h-3 text-[#a78bfa]" /> : <EyeOff className="w-3 h-3 text-zinc-600" />}
                                    Maiúsculas
                                  </span>
                                  <span className={`relative w-8 h-4 rounded-full transition-all ${editCustomUppercase ? 'bg-[#a78bfa]' : 'bg-zinc-700'}`}>
                                    <input type="checkbox" checked={editCustomUppercase} onChange={(e) => setEditCustomUppercase(e.target.checked)} className="sr-only" />
                                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${editCustomUppercase ? 'left-4' : 'left-0.5'}`} />
                                  </span>
                                </label>
                              </div>

                              {/* Live mini-preview */}
                              <div className="pt-2 border-t border-[#a78bfa]/10">
                                <label className="block text-[10px] text-slate-400 font-semibold mb-1.5">Pré-visualização</label>
                                <div className="bg-black/30 rounded-xl p-4 border border-slate-800 flex items-center justify-center min-h-[70px]">
                                  <span
                                    className={`px-4 font-bold text-xs tracking-wide flex items-center gap-2 ${
                                      editCustomStyle === 'rounded' ? 'rounded-2xl' :
                                      editCustomStyle === 'flat' ? 'rounded-none' :
                                      editCustomStyle === 'outline' ? 'rounded-xl' :
                                      editCustomStyle === 'shadow' ? 'rounded-xl' :
                                      editCustomStyle === 'brutalist' ? 'rounded-none' :
                                      editCustomStyle === 'glass' ? 'rounded-2xl' :
                                      editCustomStyle === 'gradient' ? 'rounded-xl' :
                                      editCustomStyle === 'neon' ? 'rounded-xl' :
                                      'rounded-xl'
                                    } ${
                                      editCustomRadius === 'none' ? '!rounded-none' :
                                      editCustomRadius === 'subtle' ? '!rounded-md' :
                                      editCustomRadius === 'medium' ? '!rounded-xl' :
                                      editCustomRadius === 'full' ? '!rounded-2xl' :
                                      editCustomRadius === 'pill' ? '!rounded-full' : ''
                                    } ${
                                      editCustomSize === 'small' ? 'py-1.5 text-[10px]' :
                                      editCustomSize === 'medium' ? 'py-2.5 text-xs' :
                                      editCustomSize === 'large' ? 'py-3.5 text-sm' :
                                      editCustomSize === 'xl' ? 'py-4 text-base' : 'py-2.5 text-xs'
                                    } ${
                                      editCustomShadow ? 'shadow-xl shadow-black/40' : ''
                                    } ${
                                      editCustomGlass ? 'backdrop-blur-md' : ''
                                    } ${
                                      editCustomFont === 'sans' ? 'font-sans' :
                                      editCustomFont === 'serif' ? 'font-serif' :
                                      editCustomFont === 'mono' ? 'font-mono' :
                                      editCustomFont === 'space' ? 'font-space' :
                                      editCustomFont === 'outfit' ? 'font-outfit' :
                                      editCustomFont === 'syne' ? 'font-syne' :
                                      editCustomFont === 'bebas' ? 'font-bebas' :
                                      editCustomFont === 'caveat' ? 'font-caveat' : ''
                                    }`}
                                    style={{
                                      background: editUseGradient && editCustomGradient
                                        ? editCustomGradient
                                        : editCustomColor || '#111a36',
                                      color: editCustomTextColor || '#ffffff',
                                      border: editCustomBorderWidth > 0
                                        ? `${editCustomBorderWidth}px solid ${editCustomBorderColor || '#a78bfa'}`
                                        : 'none',
                                      letterSpacing: editCustomLetterSpacing === 'tight' ? '-0.02em' :
                                                      editCustomLetterSpacing === 'normal' ? '0' :
                                                      editCustomLetterSpacing === 'wide' ? '0.05em' :
                                                      editCustomLetterSpacing === 'wider' ? '0.15em' : undefined,
                                      boxShadow: editCustomStyle === 'shadow' ? '0 8px 20px rgba(0,0,0,0.4)' :
                                                 editCustomStyle === 'brutalist' ? '4px 4px 0 0 #000' :
                                                 editCustomStyle === 'neon' ? '0 0 18px ' + (editCustomColor || '#a78bfa') : undefined,
                                    }}
                                  >
                                    {editIconUrl && editCustomIconPosition !== 'none' && editCustomIconPosition !== 'top' ? (
                                      <img src={editIconUrl} alt="" className="w-5 h-5 rounded object-contain shrink-0" />
                                    ) : editIconEmoji && editCustomIconPosition !== 'none' && editCustomIconPosition !== 'top' ? (
                                      <span>{editIconEmoji}</span>
                                    ) : null}
                                    <span className={editCustomUppercase ? 'uppercase' : ''}>
                                      {editTitle || 'Seu Botão'}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Save error banner */}
                      {saveError && (
                        <div
                          role="alert"
                          className="mt-3 flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl"
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-rose-300 uppercase tracking-wider mb-0.5">
                              Não foi possível salvar
                            </p>
                            <p className="text-[11px] text-rose-200/90 break-words">
                              {saveError}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSaveError(null)}
                            className="shrink-0 text-rose-400 hover:text-rose-200 transition-all cursor-pointer"
                            title="Fechar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-end border-t border-slate-850 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (onPreviewChange && editingLinkId) {
                              onPreviewChange(editingLinkId, null);
                            }
                            setEditingLinkId(null);
                          }}
                          className="px-4 py-2 text-xs border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-900 transition-all cursor-pointer font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(link.id)}
                          disabled={isSavingEdit}
                          className="px-4 py-2 text-xs bg-blue-600 text-white font-extrabold rounded-xl hover:bg-blue-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
                        >
                          {isSavingEdit ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Salvando...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Aplicar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* RENDER VIEW UI */
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Reorder handles + Details */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMoveOrder(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded text-slate-600 hover:text-blue-400 disabled:opacity-20 cursor-pointer transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(idx, 'down')}
                            disabled={idx === sortedLinks.length - 1}
                            className="p-1 rounded text-slate-600 hover:text-blue-400 disabled:opacity-20 cursor-pointer transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {blockName}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-200 truncate flex items-center gap-1.5">
                            {link.iconUrl ? (
                              <img src={link.iconUrl} alt="" className="w-4 h-4 rounded object-contain shrink-0" />
                            ) : (
                              link.iconEmoji && <span className="text-sm shrink-0">{link.iconEmoji}</span>
                            )}
                            <span className="truncate">{link.title}</span>
                          </h4>

                          {link.url && (
                            <p className="text-[10px] text-slate-500 truncate font-mono">{link.url}</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick toggles & actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onUpdate(link.id, { active: !link.active })}
                          className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all ${
                            link.active ? 'text-blue-500' : 'text-slate-600'
                          }`}
                          title={link.active ? 'Ativo (Exibindo)' : 'Oculto'}
                        >
                          {link.active ? <ToggleRight className="w-6 h-6 cursor-pointer" /> : <ToggleLeft className="w-6 h-6 cursor-pointer" />}
                        </button>

                        <button
                          onClick={() => handleStartEdit(link)}
                          className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer border border-slate-800/50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja excluir: "${link.title}"?`)) {
                              onDelete(link.id);
                            }
                          }}
                          className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-red-950/20 text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-transparent hover:border-red-900/50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
