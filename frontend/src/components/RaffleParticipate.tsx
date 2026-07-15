import React, { useState, useEffect } from 'react';
import { Raffle, RaffleParticipant } from '../types';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Gift, CheckCircle, XCircle, Clock, Upload, Image, AlertTriangle, Trophy, Users, MessageSquare, ArrowLeft, Camera, Send, X, ExternalLink, LogIn, Check } from 'lucide-react';
import { compressImage } from '../utils/image';

interface RaffleParticipateProps {
  raffleId: string;
  currentUser: any;
  currentUserProfile: any;
  onBack?: () => void;
}

export default function RaffleParticipate({ raffleId, currentUser, currentUserProfile, onBack }: RaffleParticipateProps) {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myParticipant, setMyParticipant] = useState<RaffleParticipant | null>(null);

  useEffect(() => {
    const fetchRaffle = async () => {
      try {
        const docRef = doc(db, 'raffles', raffleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRaffle(docSnap.data() as Raffle);
        } else {
          setError('Sorteio não encontrado.');
        }
      } catch (err) {
        setError('Erro ao carregar sorteio.');
      } finally {
        setLoading(false);
      }
    };
    fetchRaffle();
  }, [raffleId]);

  // Check if current user already submitted
  useEffect(() => {
    if (!currentUser || !raffle) return;

    const q = query(
      collection(db, 'raffles', raffleId, 'participants'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data() as RaffleParticipant;
        setMyParticipant(data);
        setSubmitted(true);
      }
    });

    return () => unsub();
  }, [currentUser, raffleId, raffle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl.trim() || !currentUser || !currentUserProfile || !raffle) return;

    setSubmitting(true);
    try {
      const partsRef = collection(db, 'raffles', raffleId, 'participants');
      const newDocRef = doc(partsRef);
      await addDoc(partsRef, {
        id: newDocRef.id,
        raffleId,
        userId: currentUser.uid,
        username: currentUserProfile.username || currentUser.displayName?.toLowerCase().replace(/\s+/g, '-') || '',
        displayName: currentUserProfile.displayName || currentUser.displayName || '',
        profilePicUrl: currentUserProfile.profilePicUrl || currentUser.photoURL || '',
        proofImageUrl: proofUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
      } as RaffleParticipant);

      setSubmitted(true);
    } catch (err) {
      console.error('Erro ao participar:', err);
      alert('Erro ao enviar participação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-xs text-zinc-500">Carregando sorteio...</p>
        </div>
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center p-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-white mb-1">Sorteio não encontrado</p>
          <p className="text-xs text-zinc-500">{error || 'Este sorteio pode ter sido removido.'}</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Clock, label: 'Aguardando aprovação' },
    approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: CheckCircle, label: 'Aprovado!' },
    rejected: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', icon: XCircle, label: 'Rejeitado' },
  };

  const canParticipate = raffle.status === 'active';

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-100">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>
        )}

        {/* Raffle Header */}
        <div className="bg-[#0f172a] border border-slate-800/60 rounded-2xl overflow-hidden">
          {raffle.coverImage && (
            <div className="w-full h-44">
              <img src={raffle.coverImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">{raffle.title}</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${raffle.status === 'active' ? 'bg-emerald-400' : raffle.status === 'completed' ? 'bg-rose-400' : 'bg-zinc-500'}`} />
                  <span className="text-[10px] text-zinc-500">
                    {raffle.status === 'active' ? 'Aberto' : raffle.status === 'completed' ? 'Encerrado' : 'Cancelado'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{raffle.description}</p>
          </div>
        </div>

        {/* Prize Card */}
        <div className="bg-gradient-to-r from-amber-500/5 via-rose-500/10 to-purple-600/5 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Prêmio</span>
          </div>
          <p className="text-sm font-bold text-white">{raffle.prize}</p>
        </div>

        {/* Requirements */}
        {raffle.requirements && (
          <div className="bg-[#0f172a] border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Requisitos
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{raffle.requirements}</p>
          </div>
        )}

        {/* Participant Status */}
        {submitted && myParticipant && (
          <div className={`${statusColors[myParticipant.status].bg} border ${statusColors[myParticipant.status].border} rounded-2xl p-5`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${statusColors[myParticipant.status].bg} flex items-center justify-center`}>
                {React.createElement(statusColors[myParticipant.status].icon, { className: `w-5 h-5 ${statusColors[myParticipant.status].text}` })}
              </div>
              <div>
                <p className={`text-sm font-bold ${statusColors[myParticipant.status].text}`}>{statusColors[myParticipant.status].label}</p>
                <p className="text-[10px] text-zinc-500">Sua participação foi registrada</p>
              </div>
            </div>
            {raffle.status === 'completed' && raffle.winnerId === currentUser?.uid && (
              <div className="mt-3 bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 text-center">
                <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-amber-400">Parabéns! Você venceu!</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Entre em contato com o organizador para receber seu prêmio.</p>
              </div>
            )}
          </div>
        )}

        {/* Owner Info */}
        <div className="bg-[#0f172a] border border-slate-800/60 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden">
              {raffle.profilePicUrl ? (
                <img src={raffle.profilePicUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">{raffle.displayName?.[0]}</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">{raffle.displayName}</p>
              <p className="text-[10px] text-zinc-500">Organizador</p>
            </div>
          </div>
        </div>

        {/* Participation Form */}
        {canParticipate && !submitted && (
          <form onSubmit={handleSubmit} className="bg-[#0f172a] border border-slate-800/60 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-rose-400" /> Participar do Sorteio
            </h3>

            {currentUser ? (
              <>
                <div>
                  <label className="block text-[10px] text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">
                    Print dos Requisitos
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL da imagem do comprovante"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      className="flex-1 bg-black/40 text-xs text-white py-3 px-4 rounded-xl border border-slate-700/50 focus:border-rose-500/50 focus:outline-none transition-all placeholder-zinc-600"
                      required
                    />
                    <input
                      id="proof-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setProofUrl(await compressImage(file, 800, 800, 0.7));
                          } catch {}
                        }
                        e.target.value = '';
                      }}
                    />
                    <label
                      htmlFor="proof-upload"
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-slate-700/50 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                    </label>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1.5">Envie o print mostrando que você cumpriu os requisitos</p>
                </div>
                {proofUrl && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700/50">
                    <img src={proofUrl} alt="Proof" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setProofUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg hover:bg-black/80 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting || !proofUrl.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Participar do Sorteio</>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-zinc-400 mb-3">Faça login para participar deste sorteio</p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs font-bold rounded-xl transition-all"
                >
                  <LogIn className="w-4 h-4" /> Fazer Login
                </a>
              </div>
            )}
          </form>
        )}

        {/* Closed state */}
        {!canParticipate && !submitted && (
          <div className="bg-[#0f172a] border border-slate-800/60 rounded-2xl p-6 text-center">
            {raffle.status === 'completed' ? (
              <>
                <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">Sorteio Encerrado</p>
                <p className="text-xs text-zinc-500 mt-1">Este sorteio já foi finalizado.</p>
              </>
            ) : (
              <>
                <XCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">Sorteio Cancelado</p>
                <p className="text-xs text-zinc-500 mt-1">Este sorteio não está mais disponível.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
