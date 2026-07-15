import React, { useState, useEffect } from 'react';
import { Raffle, RaffleParticipant, RaffleMessage } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, getDocs, getDoc, deleteDoc, where } from 'firebase/firestore';
import { motion } from 'motion/react';
import RaffleChat from './RaffleChat';
import { Gift, ArrowLeft, Users, Trophy, CheckCircle, XCircle, Clock, RefreshCw, Award, Image, X, MessageSquare, AlertTriangle, Search, ExternalLink, Copy } from 'lucide-react';

interface RaffleDetailProps {
  raffle: Raffle;
  isOwner: boolean;
  onBack: () => void;
}

export default function RaffleDetail({ raffle, isOwner, onBack }: RaffleDetailProps) {
  const [participants, setParticipants] = useState<RaffleParticipant[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'raffles', raffle.id, 'participants'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const items: RaffleParticipant[] = [];
      snap.forEach((d) => items.push(d.data() as RaffleParticipant));
      setParticipants(items);
    });

    return () => unsub();
  }, [raffle.id]);

  const handleApprove = async (participantId: string) => {
    setUpdatingStatus(participantId);
    try {
      await updateDoc(doc(db, 'raffles', raffle.id, 'participants', participantId), {
        status: 'approved'
      });
    } catch (err) {
      console.error('Erro ao aprovar participante:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleReject = async (participantId: string) => {
    setUpdatingStatus(participantId);
    try {
      await updateDoc(doc(db, 'raffles', raffle.id, 'participants', participantId), {
        status: 'rejected'
      });
    } catch (err) {
      console.error('Erro ao rejeitar participante:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDraw = async () => {
    const approved = participants.filter(p => p.status === 'approved');
    if (approved.length === 0) {
      alert('Não há participantes aprovados para sortear.');
      return;
    }

    if (!confirm(`Sortear entre ${approved.length} participantes aprovados?`)) return;

    setDrawing(true);
    try {
      const winner = approved[Math.floor(Math.random() * approved.length)];

      await updateDoc(doc(db, 'raffles', raffle.id), {
        status: 'completed',
        winnerId: winner.userId,
        winnerUsername: winner.username,
        winnerDisplayName: winner.displayName,
        winnerProfilePicUrl: winner.profilePicUrl,
        drawDate: new Date(),
        updatedAt: serverTimestamp(),
      });

      alert(`🎉 Vencedor: ${winner.displayName} (@${winner.username})!`);
    } catch (err) {
      console.error('Erro ao sortear:', err);
    } finally {
      setDrawing(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?view=sorteio&user=${raffle.username}&raffle=${raffle.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const approved = participants.filter(p => p.status === 'approved');
  const pending = participants.filter(p => p.status === 'pending');
  const rejected = participants.filter(p => p.status === 'rejected');

  const getStatusBadge = () => {
    switch (raffle.status) {
      case 'active': return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ativo</span>;
      case 'completed': return <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20"><Award className="w-3 h-3" /> Finalizado</span>;
      case 'cancelled': return <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-500/10 px-2.5 py-1 rounded-full border border-zinc-500/20"><XCircle className="w-3 h-3" /> Cancelado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{raffle.title}</h2>
            <p className="text-[11px] text-zinc-400 truncate">{raffle.prize}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {getStatusBadge()}
          {isOwner && (
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Copiar link do sorteio"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {raffle.coverImage && (
        <div className="w-full h-40 sm:h-52 rounded-2xl overflow-hidden border border-slate-800/60">
          <img src={raffle.coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Description & Requirements */}
      <div className="bg-[#0f172a] border border-slate-800/60 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Sobre o Sorteio</h3>
          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{raffle.description}</p>
        </div>
        {raffle.requirements && (
          <div className="bg-zinc-900/50 border border-slate-700/50 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Requisitos para Participar
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{raffle.requirements}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0f172a] border border-slate-800/60 rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-white">{participants.length}</p>
          <p className="text-[10px] text-zinc-500">Total</p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800/60 rounded-xl p-4 text-center">
          <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-white">{approved.length}</p>
          <p className="text-[10px] text-zinc-500">Aprovados</p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800/60 rounded-xl p-4 text-center">
          <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-white">{pending.length}</p>
          <p className="text-[10px] text-zinc-500">Pendentes</p>
        </div>
      </div>

      {/* Winner Card */}
      {raffle.status === 'completed' && raffle.winnerId && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-600/10 border border-amber-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 p-0.5">
              <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center">
                {raffle.winnerProfilePicUrl ? (
                  <img src={raffle.winnerProfilePicUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Trophy className="w-5 h-5 text-amber-400" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Vencedor</span>
              </div>
              <p className="text-sm font-bold text-white">{raffle.winnerDisplayName}</p>
              <p className="text-[11px] text-zinc-400">@{raffle.winnerUsername}</p>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowChat(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/30 transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Conversar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actions for owner */}
      {isOwner && raffle.status === 'active' && (
        <div className="flex gap-3">
          <button
            onClick={handleDraw}
            disabled={drawing || approved.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {drawing ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Sorteando...</>
            ) : (
              <><Trophy className="w-4 h-4" /> Sortear Vencedor ({approved.length})</>
            )}
          </button>
        </div>
      )}

      {/* Participants */}
      <div>
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" /> Participantes
        </h3>

        {/* Pending */}
        {pending.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Pendentes ({pending.length})
            </h4>
            <div className="space-y-2">
              {pending.map((p) => (
                <div key={p.id} className="bg-[#0f172a] border border-slate-800/60 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                      {p.profilePicUrl ? (
                        <img src={p.profilePicUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">{p.displayName?.[0]}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.displayName}</p>
                      <p className="text-[10px] text-zinc-500">@{p.username}</p>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={p.proofImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
                          title="Ver comprovante"
                        >
                          <Image className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={updatingStatus === p.id}
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all cursor-pointer"
                          title="Aprovar"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          disabled={updatingStatus === p.id}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                          title="Rejeitar"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved */}
        {approved.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3" /> Aprovados ({approved.length})
            </h4>
            <div className="space-y-2">
              {approved.map((p) => (
                <div key={p.id} className="bg-[#0f172a] border border-emerald-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                      {p.profilePicUrl ? (
                        <img src={p.profilePicUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">{p.displayName?.[0]}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.displayName}</p>
                      <p className="text-[10px] text-zinc-500">@{p.username}</p>
                    </div>
                    {isOwner && (
                      <a
                        href={p.proofImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
                        title="Ver comprovante"
                      >
                        <Image className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected */}
        {rejected.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <XCircle className="w-3 h-3" /> Rejeitados ({rejected.length})
            </h4>
            <div className="space-y-2">
              {rejected.map((p) => (
                <div key={p.id} className="bg-[#0f172a] border border-zinc-800/60 rounded-xl p-3 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                      {p.profilePicUrl ? (
                        <img src={p.profilePicUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">{p.displayName?.[0]}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-400 truncate">{p.displayName}</p>
                      <p className="text-[10px] text-zinc-600">@{p.username}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {participants.length === 0 && (
          <div className="bg-[#0f172a] border border-slate-800/60 rounded-2xl p-8 text-center">
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Nenhum participante ainda</p>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && raffle.winnerId && (
        <RaffleChat
          raffleId={raffle.id}
          winnerId={raffle.winnerId}
          winnerName={raffle.winnerDisplayName || raffle.winnerUsername || ''}
          winnerPic={raffle.winnerProfilePicUrl || ''}
          isOwner={isOwner}
          ownerName={raffle.displayName}
          ownerPic={raffle.profilePicUrl}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
