import React, { useState } from 'react';
import { LinkItem, BlockType } from '../types';
import { Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, Edit2, Check, X, ToggleLeft, ToggleRight, Loader2, Sparkles, Tag, Smile, Zap, MessageCircle, ShoppingBag, Image as ImageIcon, Star, Briefcase, CreditCard, LayoutTemplate } from 'lucide-react';

interface LinkEditorProps {
  links: LinkItem[];
  onAdd: (title: string, url: string, type?: BlockType, extraData?: any) => Promise<void>;
  onUpdate: (linkId: string, updates: Partial<LinkItem>) => Promise<void>;
  onDelete: (linkId: string) => Promise<void>;
}

export default function LinkEditor({ links, onAdd, onUpdate, onDelete }: LinkEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  // Track which link ID is currently being edited
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editBadgeText, setEditBadgeText] = useState('');
  const [editIconEmoji, setEditIconEmoji] = useState('');
  const [editAnimation, setEditAnimation] = useState('none');
  const [editImageUrl, setEditImageUrl] = useState(''); // For banners
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
    setEditTitle(link.title || '');
    setEditUrl(link.url || '');
    setEditSubtitle(link.subtitle || '');
    setEditBadgeText(link.badgeText || '');
    setEditIconEmoji(link.iconEmoji || '');
    setEditAnimation(link.animation || 'none');
    setEditImageUrl(link.imageUrl || '');
  };

  const handleSaveEdit = async (linkId: string) => {
    if (!editTitle.trim()) return;
    setIsSavingEdit(true);
    try {
      let url = editUrl.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      await onUpdate(linkId, {
        title: editTitle.trim(),
        url: url,
        subtitle: editSubtitle.trim() || '',
        badgeText: editBadgeText.trim() || '',
        iconEmoji: editIconEmoji.trim() || '',
        animation: editAnimation || 'none',
        imageUrl: editImageUrl.trim() || '',
      });
      setEditingLinkId(null);
    } catch (err) {
      console.error(err);
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
                            onClick={() => setEditingLinkId(null)}
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

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-end border-t border-slate-850 pt-3">
                        <button
                          type="button"
                          onClick={() => setEditingLinkId(null)}
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
                            {link.iconEmoji && <span className="text-sm shrink-0">{link.iconEmoji}</span>}
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
