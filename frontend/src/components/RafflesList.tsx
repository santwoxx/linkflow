import React, { useState, useEffect } from 'react';
import { Raffle } from '../types';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import RaffleDetail from './RaffleDetail';
import { Gift, Plus, Trash2, Edit2, ChevronRight, Users, Trophy, Calendar, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Award, Image, X } from 'lucide-react';
import { compressImage } from '../utils/image';

interface RafflesListProps {
  userId: string;
  username: string;
  displayName: string;
  profilePicUrl: string;
}

export default function RafflesList({ userId, username, displayName, profilePicUrl }: RafflesListProps) {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [requirements, setRequirements] = useState('');
  const [coverImage, setCoverImage] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'raffles'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const items: Raffle[] = [];
      snap.forEach((d) => items.push(d.data() as Raffle));
      setRaffles(items);
    });

    return () => unsub();
  }, [userId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !prize.trim()) return;

    setCreating(true);
    try {
      const rafflesRef = collection(db, 'raffles');
      const newDocRef = doc(rafflesRef);
      await addDoc(rafflesRef, {
        id: newDocRef.id,
        userId,
        username,
        displayName,
        profilePicUrl,
        title: title.trim(),
        description: description.trim(),
        prize: prize.trim(),
        requirements: requirements.trim(),
        coverImage: coverImage.trim() || '',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as Raffle);

      setTitle('');
      setDescription('');
      setPrize('');
      setRequirements('');
      setCoverImage('');
      setShowCreate(false);
    } catch (err) {
      console.error('Erro ao criar sorteio:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (raffleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este sorteio?')) return;
    try {
      await deleteDoc(doc(db, 'raffles', raffleId));
    } catch (err) {
      console.error('Erro ao excluir sorteio:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <span className="w-2 h-2 rounded-full bg-emerald-400" />;
      case 'drawing': return <RefreshCw className="w-3.5 h-3.5 text-amber-400" />;
      case 'completed': return <Award className="w-3.5 h-3.5 text-rose-400" />;
      case 'cancelled': return <XCircle className="w-3.5 h-3.5 text-zinc-500" />;
      default: return <Clock className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'drawing': return 'Sorteando';
      case 'completed': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (selectedRaffle) {
    return (
      <RaffleDetail
        raffle={selectedRaffle}
        isOwner={true}
        onBack={() => setSelectedRaffle(null)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Meus Sorteios</h2>
            <p className="text-[11px] text-zinc-400">Crie e gerencie sorteios para sua audiência</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-500/20"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancelar' : 'Criar Sorteio'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="bg-[#0f172a] border border-slate-800/60 rounded-2xl p-5 space-y-4"
        >
          <div>
            <label className="block text-[10px] text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Título do Sorteio</label>
            <input
              type="text"
              placeholder="Ex: Sorteio de Ano Novo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 text-xs text-white py-3 px-4 rounded-xl border border-slate-700/50 focus:border-rose-500/50 focus:outline-none transition-all placeholder-zinc-600"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Descrição</label>
            <textarea
              placeholder="Explique como participar do sorteio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-black/40 text-xs text-white py-3 px-4 rounded-xl border border-slate-700/50 focus:border-rose-500/50 focus:outline-none transition-all placeholder-zinc-600 resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Prêmio</label>
            <input
              type="text"
              placeholder="Ex: Um iPhone 15 Pro"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              className="w-full bg-black/40 text-xs text-white py-3 px-4 rounded-xl border border-slate-700/50 focus:border-rose-500/50 focus:outline-none transition-all placeholder-zinc-600"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Regras / Requisitos</label>
            <textarea
              placeholder="Descreva os requisitos para participar (seguir, comentar, etc)"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={3}
              className="w-full bg-black/40 text-xs text-white py-3 px-4 rounded-xl border border-slate-700/50 focus:border-rose-500/50 focus:outline-none transition-all placeholder-zinc-600 resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Imagem de Capa (URL)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="flex-1 bg-black/40 text-xs text-white py-3 px-4 rounded-xl border border-slate-700/50 focus:border-rose-500/50 focus:outline-none transition-all placeholder-zinc-600"
              />
              <input
                id="raffle-cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      setCoverImage(await compressImage(file, 800, 400, 0.7));
                    } catch {}
                  }
                  e.target.value = '';
                }}
              />
              <label
                htmlFor="raffle-cover-upload"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-slate-700/50 transition-all cursor-pointer"
              >
                <Image className="w-4 h-4" />
              </label>
            </div>
          </div>
          {coverImage && (
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-700/50">
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setCoverImage('')}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg hover:bg-black/80 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={creating || !title.trim() || !description.trim() || !prize.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Criando...</>
            ) : (
              <><Gift className="w-4 h-4" /> Criar Sorteio</>
            )}
          </button>
        </motion.form>
      )}

      {/* Raffles List */}
      {raffles.length === 0 && !showCreate && (
        <div className="bg-[#0f172a] border border-slate-800/60 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-6 h-6 text-rose-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Nenhum sorteio ainda</p>
          <p className="text-xs text-zinc-500">Crie seu primeiro sorteio para engajar sua audiência!</p>
        </div>
      )}

      <div className="grid gap-3">
        {raffles.map((raffle) => (
          <motion.button
            key={raffle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedRaffle(raffle)}
            className="w-full text-left bg-[#0f172a] hover:bg-[#1a2540] border border-slate-800/60 rounded-2xl p-4 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              {raffle.coverImage ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-700/50">
                  <img src={raffle.coverImage} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-600/20 flex items-center justify-center shrink-0 border border-slate-700/50">
                  <Gift className="w-6 h-6 text-rose-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(raffle.status)}
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{getStatusLabel(raffle.status)}</span>
                </div>
                <h3 className="text-sm font-bold text-white truncate">{raffle.title}</h3>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">{raffle.prize}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
                  <Users className="w-3.5 h-3.5" />
                  <span>?</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
