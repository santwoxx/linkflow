import React, { useState, useEffect, useRef } from 'react';
import { RaffleMessage } from '../types';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { X, Send, MessageSquare, User } from 'lucide-react';

interface RaffleChatProps {
  raffleId: string;
  winnerId: string;
  winnerName: string;
  winnerPic: string;
  isOwner: boolean;
  ownerName: string;
  ownerPic: string;
  onClose: () => void;
}

export default function RaffleChat({
  raffleId,
  winnerId,
  winnerName,
  winnerPic,
  isOwner,
  ownerName,
  ownerPic,
  onClose
}: RaffleChatProps) {
  const [messages, setMessages] = useState<RaffleMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'raffles', raffleId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const items: RaffleMessage[] = [];
      snap.forEach((d) => items.push(d.data() as RaffleMessage));
      setMessages(items);
    });

    return () => unsub();
  }, [raffleId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    setSending(true);
    try {
      const msgsRef = collection(db, 'raffles', raffleId, 'messages');
      const newDocRef = doc(msgsRef);
      await addDoc(msgsRef, {
        id: newDocRef.id,
        raffleId,
        senderId: user.uid,
        senderName: user.displayName || 'Usuário',
        senderPic: user.photoURL || '',
        text: text.trim(),
        createdAt: serverTimestamp(),
      } as RaffleMessage);
      setText('');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setSending(false);
    }
  };

  const currentUserId = auth.currentUser?.uid;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0f172a] border border-slate-800/60 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden">
              {isOwner ? (
                winnerPic ? <img src={winnerPic} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-zinc-500" /></div>
              ) : (
                ownerPic ? <img src={ownerPic} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-zinc-500" /></div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{isOwner ? winnerName : ownerName}</p>
              <p className="text-[10px] text-zinc-500">Conversa sobre o prêmio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
              <p className="text-xs text-zinc-500">Nenhuma mensagem ainda</p>
              <p className="text-[10px] text-zinc-600 mt-1">Envie uma mensagem para combinar a entrega do prêmio!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-br-md'
                      : 'bg-zinc-800/80 text-zinc-200 rounded-bl-md'
                  }`}
                >
                  {!isMe && (
                    <p className="text-[9px] font-semibold text-zinc-400 mb-1">{msg.senderName}</p>
                  )}
                  <p>{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800/60">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 bg-black/40 text-xs text-white py-3 px-4 rounded-xl border border-slate-700/50 focus:border-rose-500/50 focus:outline-none transition-all placeholder-zinc-600"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="p-3 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
