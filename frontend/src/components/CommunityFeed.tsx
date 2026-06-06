import React, { useState, useEffect } from 'react';
import { UserProfile, SocialPost, PostComment, ADMIN_EMAIL } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  where
} from 'firebase/firestore';
import {
  Heart,
  MessageSquare,
  Send,
  Trash2,
  Plus,
  Globe,
  Sparkles,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  Bookmark,
  Smile,
  Grid,
  List,
  X,
  MoreHorizontal,
  AtSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GoToNatanDevButton from './GoToNatanDevButton';

interface CommunityFeedProps {
  currentUserProfile: UserProfile;
  filterByUserId?: string; // Optional: viewing posts belonging to a specific user (on their public profile)
  previewMode?: boolean;
}



export default function CommunityFeed({ currentUserProfile, filterByUserId, previewMode = false }: CommunityFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = currentUserProfile.email === ADMIN_EMAIL || currentUserProfile.role === 'admin';
  
  // Post publisher states
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Compress image from file input to data URI
  const compressImage = (file: File, maxW: number, maxH: number, quality: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxW) { height *= maxW / width; width = maxW; }
        } else {
          if (height > maxH) { width *= maxH / height; height = maxH; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('ctx')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('img'));
      img.src = URL.createObjectURL(file);
    });

  // Active view layout toggle for profile page: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Comments toggles & loading maps
  const [commentsMap, setCommentsMap] = useState<{ [postId: string]: PostComment[] }>({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});

  // Clipboard Copied feedback string
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Double Click / Double Tap animation burst
  const [heartBurstPostId, setHeartBurstPostId] = useState<string | null>(null);
  
  // Bookmarked posts list mock
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);

  // Detailed lightbox modal of selected post (Instagram style)
  const [selectedPostLightbox, setSelectedPostLightbox] = useState<SocialPost | null>(null);

  // Quick preset emojis
  const QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '😍', '😂', '💯', '✨'];

  // 1. Listen to posts or local fallback
  useEffect(() => {
    if (currentUserProfile.uid === 'demo-user-123' || filterByUserId === 'demo-user-123') {
      const loadDemoPosts = () => {
        const savedPosts = localStorage.getItem('demo_posts');
        let list: SocialPost[] = savedPosts ? JSON.parse(savedPosts) : [];

        if (filterByUserId) {
          list = list.filter(p => p.userId === filterByUserId);
        }
        setPosts(list);
        setLoading(false);
      };

      loadDemoPosts();
      const interval = setInterval(loadDemoPosts, 1500);
      return () => clearInterval(interval);
    }

    let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    if (filterByUserId) {
      q = query(
        collection(db, 'posts'), 
        where('userId', '==', filterByUserId), 
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: SocialPost[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as SocialPost);
      });
      setPosts(list);
      setLoading(false);
    }, (err) => {
      const errMsg = err?.message || String(err);
      if (errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('network')) {
        console.warn("Firestore posts listener está offline.");
      } else {
        console.error("Firestore listening error (posts):", err);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterByUserId, currentUserProfile.uid]);

  // 2. Fetch or subscribe to comments for a specific post with local fallback
  useEffect(() => {
    if (!activeCommentsPostId) return;

    if (currentUserProfile.uid === 'demo-user-123' || filterByUserId === 'demo-user-123') {
      const loadDemoComments = () => {
        const savedComments = localStorage.getItem(`demo_comments_${activeCommentsPostId}`);
        const list: PostComment[] = savedComments ? JSON.parse(savedComments) : [];
        setCommentsMap(prev => ({
          ...prev,
          [activeCommentsPostId]: list
        }));
      };

      loadDemoComments();
      const interval = setInterval(loadDemoComments, 1500);
      return () => clearInterval(interval);
    }

    const commentsRef = collection(db, 'posts', activeCommentsPostId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PostComment[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as PostComment);
      });
      setCommentsMap(prev => ({
        ...prev,
        [activeCommentsPostId]: list
      }));
    }, (err) => {
      const errMsg = err?.message || String(err);
      if (errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('network')) {
        console.warn("Firestore comments listener está offline.");
      } else {
        console.error("Firestore listening error (comments):", err);
      }
    });

    return () => unsubscribe();
  }, [activeCommentsPostId, currentUserProfile.uid, filterByUserId]);

  // Publish Post action
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !imageUrl.trim()) return;
    if (previewMode && currentUserProfile.uid !== 'demo-user-123') {
      alert("Posts desativados em pré-visualização.");
      return;
    }

    if (currentUserProfile.uid === 'demo-user-123') {
      setIsPublishing(true);
      const id = `p-${Date.now()}`;
      const postData: SocialPost = {
        id,
        userId: currentUserProfile.uid,
        username: currentUserProfile.username,
        displayName: currentUserProfile.displayName || currentUserProfile.username,
        profilePicUrl: currentUserProfile.profilePicUrl || '',
        caption: caption.trim(),
        imageUrl: imageUrl.trim(),
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString() as any,
        updatedAt: new Date().toISOString() as any
      };

      const savedPosts = localStorage.getItem('demo_posts');
      const list = savedPosts ? JSON.parse(savedPosts) : [];
      list.unshift(postData);
      localStorage.setItem('demo_posts', JSON.stringify(list));

      setCaption('');
      setImageUrl('');
      setIsSelectorOpen(false);
      setIsPublishing(false);
      return;
    }

    setIsPublishing(true);
    const id = doc(collection(db, 'posts')).id;

    try {
      const postData: SocialPost = {
        id,
        userId: currentUserProfile.uid,
        username: currentUserProfile.username,
        displayName: currentUserProfile.displayName || currentUserProfile.username,
        profilePicUrl: currentUserProfile.profilePicUrl || '',
        caption: caption.trim(),
        imageUrl: imageUrl.trim(),
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'posts', id), {
        ...postData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setCaption('');
      setImageUrl('');
      setIsSelectorOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `posts/${id}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Like action
  const handleLikePost = async (post: SocialPost) => {
    if (previewMode && currentUserProfile.uid !== 'demo-user-123') return;

    if (currentUserProfile.uid === 'demo-user-123' || filterByUserId === 'demo-user-123') {
      const savedPosts = localStorage.getItem('demo_posts');
      if (!savedPosts) return;
      let list: SocialPost[] = JSON.parse(savedPosts);
      list = list.map(p => {
        if (p.id === post.id) {
          const isLiked = p.likes.includes(currentUserProfile.uid);
          const updatedLikes = isLiked 
            ? p.likes.filter(uid => uid !== currentUserProfile.uid)
            : [...p.likes, currentUserProfile.uid];
          return {
            ...p,
            likes: updatedLikes,
            likesCount: updatedLikes.length
          };
        }
        return p;
      });
      localStorage.setItem('demo_posts', JSON.stringify(list));
      
      // Update our open lightbox state in real-time as well
      if (selectedPostLightbox && selectedPostLightbox.id === post.id) {
        const isLiked = selectedPostLightbox.likes.includes(currentUserProfile.uid);
        const updatedLikes = isLiked 
          ? selectedPostLightbox.likes.filter(uid => uid !== currentUserProfile.uid)
          : [...selectedPostLightbox.likes, currentUserProfile.uid];
        setSelectedPostLightbox({
          ...selectedPostLightbox,
          likes: updatedLikes,
          likesCount: updatedLikes.length
        });
      }
      return;
    }

    const isLiked = post.likes.includes(currentUserProfile.uid);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUserProfile.uid),
          likesCount: increment(-1)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUserProfile.uid),
          likesCount: increment(1)
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  // Double tap like activation
  const handleDoubleTap = (post: SocialPost) => {
    // Show heart flash
    setHeartBurstPostId(post.id);
    setTimeout(() => {
      setHeartBurstPostId(null);
    }, 900);

    // If not liked already, fire like
    if (!post.likes?.includes(currentUserProfile.uid)) {
      handleLikePost(post);
    }
  };

  // Copy shared post link
  const handleSharePost = (post: SocialPost) => {
    const postUrl = `${window.location.origin}${window.location.pathname}?u=${post.username}&p=${post.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2500);
    });
  };

  // Toggle Bookmark mock
  const handleBookmarkPost = (postId: string) => {
    if (bookmarkedPosts.includes(postId)) {
      setBookmarkedPosts(bookmarkedPosts.filter(id => id !== postId));
    } else {
      setBookmarkedPosts([...bookmarkedPosts, postId]);
    }
  };

  // Add Comment action
  const handleAddComment = async (postId: string) => {
    const text = newCommentText[postId]?.trim();
    if (!text) return;
    if (previewMode && currentUserProfile.uid !== 'demo-user-123') return;

    if (currentUserProfile.uid === 'demo-user-123' || filterByUserId === 'demo-user-123') {
      const commentId = `c-${Date.now()}`;
      const commentData: PostComment = {
        id: commentId,
        postId,
        userId: currentUserProfile.uid,
        username: currentUserProfile.username,
        displayName: currentUserProfile.displayName || currentUserProfile.username,
        profilePicUrl: currentUserProfile.profilePicUrl || '',
        text,
        createdAt: new Date().toISOString() as any
      };

      const savedComments = localStorage.getItem(`demo_comments_${postId}`);
      const commentsList = savedComments ? JSON.parse(savedComments) : [];
      commentsList.push(commentData);
      localStorage.setItem(`demo_comments_${postId}`, JSON.stringify(commentsList));

      // Update comments counter
      const savedPosts = localStorage.getItem('demo_posts');
      if (savedPosts) {
        let list: SocialPost[] = JSON.parse(savedPosts);
        list = list.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p);
        localStorage.setItem('demo_posts', JSON.stringify(list));
      }

      setNewCommentText(prev => ({
        ...prev,
        [postId]: ''
      }));
      return;
    }

    const commentId = doc(collection(db, 'posts', postId, 'comments')).id;
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);

    try {
      const commentData: PostComment = {
        id: commentId,
        postId,
        userId: currentUserProfile.uid,
        username: currentUserProfile.username,
        displayName: currentUserProfile.displayName || currentUserProfile.username,
        profilePicUrl: currentUserProfile.profilePicUrl || '',
        text,
        createdAt: new Date()
      };

      await setDoc(commentRef, {
        ...commentData,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      setNewCommentText(prev => ({
        ...prev,
        [postId]: ''
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `posts/${postId}/comments/${commentId}`);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (previewMode && currentUserProfile.uid !== 'demo-user-123') return;
    if (!window.confirm("Deseja realmente excluir esta publicação?")) return;

    if (currentUserProfile.uid === 'demo-user-123' || filterByUserId === 'demo-user-123' || isAdmin) {
      const savedPosts = localStorage.getItem('demo_posts');
      if (savedPosts) {
        let list: SocialPost[] = JSON.parse(savedPosts);
        list = list.filter(p => p.id !== postId);
        localStorage.setItem('demo_posts', JSON.stringify(list));
      }
      if (currentUserProfile.uid !== 'demo-user-123' && filterByUserId !== 'demo-user-123') return;
      return;
    }

    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (previewMode && currentUserProfile.uid !== 'demo-user-123') return;
    if (!window.confirm("Excluir este comentário?")) return;

    if (currentUserProfile.uid === 'demo-user-123' || filterByUserId === 'demo-user-123') {
      const savedComments = localStorage.getItem(`demo_comments_${postId}`);
      if (savedComments) {
        let commentsList: PostComment[] = JSON.parse(savedComments);
        commentsList = commentsList.filter(c => c.id !== commentId);
        localStorage.setItem(`demo_comments_${postId}`, JSON.stringify(commentsList));
      }

      const savedPosts = localStorage.getItem('demo_posts');
      if (savedPosts) {
        let list: SocialPost[] = JSON.parse(savedPosts);
        list = list.map(p => p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) } : p);
        localStorage.setItem('demo_posts', JSON.stringify(list));
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(-1)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${postId}/comments/${commentId}`);
    }
  };

  // Parse hashtags or user handles (@gabi) inside text to style them in bright blue
  const renderStyledText = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith('#') && part.length > 1) {
        return <span key={i} className="text-[#38bdf8] font-medium hover:underline cursor-pointer">{part}</span>;
      }
      if (part.startsWith('@') && part.length > 1) {
        return <span key={i} className="text-[#0284c7] font-semibold hover:underline cursor-pointer">{part}</span>;
      }
      return part;
    });
  };

  // Convert raw date or timestamp into a friendly Portuguese string
  const formatTimeAgo = (rawDate: any): string => {
    const postDate = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate || Date.now());
    const seconds = Math.floor((new Date().getTime() - postDate.getTime()) / 1000);
    
    if (seconds < 60) return 'HÁ ALGUNS SEGUNDOS';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `HÁ ${minutes} ${minutes === 1 ? 'MINUTO' : 'MINUTOS'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `HÁ ${hours} ${hours === 1 ? 'HORA' : 'HORAS'}`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `HÁ ${days} ${days === 1 ? 'DIA' : 'DIAS'}`;
    
    return postDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <div className="w-full max-w-[620px] mx-auto space-y-4 md:space-y-6">
      
      {/* 1. PREMIUM POST WIDGET */}
      {!filterByUserId && (
        <div className="relative group bg-[#0a0a0a] backdrop-blur-2xl rounded-3xl border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/5 via-transparent to-indigo-900/5 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#a78bfa] to-indigo-600 rounded-full blur-[6px] opacity-40 group-hover:opacity-70 transition-opacity" />
                {currentUserProfile.profilePicUrl ? (
                  <img 
                    src={currentUserProfile.profilePicUrl} 
                    alt={currentUserProfile.displayName} 
                    className="relative w-11 h-11 rounded-full object-cover shrink-0 border-2 border-white/5"
                  />
                ) : (
                  <div className="relative w-11 h-11 rounded-full bg-[#151515] flex items-center justify-center font-bold text-white shrink-0 border-2 border-white/5">
                    {currentUserProfile.displayName?.charAt(0) || currentUserProfile.username.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-[#a78bfa] uppercase tracking-widest leading-none mb-1">Comunidade</p>
                <p className="text-sm text-zinc-200 font-semibold">O que você quer compartilhar?</p>
              </div>
            </div>

            <button
              id="open-ig-widget"
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 transition-all shrink-0"
            >
              {isSelectorOpen ? <X className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
              <span className="hidden sm:inline">{isSelectorOpen ? 'Cancelar' : 'Criar Post'}</span>
            </button>
          </div>

          <AnimatePresence>
            {isSelectorOpen && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                onSubmit={handlePublishPost}
                className="relative overflow-hidden mt-5 pt-5 border-t border-white/5 space-y-4"
              >
                <div className="relative group/textarea">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#a78bfa]/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-focus-within/textarea:opacity-100 transition-opacity pointer-events-none" />
                  <textarea
                    placeholder="Escreva sua mensagem aqui..."
                    rows={3}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="relative w-full bg-[#111111] text-sm text-white py-4 px-5 rounded-2xl border border-white/5 focus:border-[#a78bfa] focus:bg-[#151515] focus:outline-none transition-all placeholder-zinc-600 leading-relaxed resize-none shadow-inner"
                    maxLength={1000}
                  />
                </div>

                {imageUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-72 group/img shadow-lg">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-3 right-3 px-3 py-1.5 text-[10px] font-black bg-black/80 hover:bg-black text-white uppercase tracking-wider rounded-xl transition-colors cursor-pointer backdrop-blur-md"
                    >
                      Remover foto
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 p-1 bg-[#111111] rounded-2xl border border-white/5 flex items-center gap-1 shadow-inner">
                    <input
                      id="post-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const dataUri = await compressImage(file, 1200, 1200, 0.7);
                            setImageUrl(dataUri);
                          } catch (err) {
                            console.error('Erro ao comprimir imagem:', err);
                          }
                        }
                        e.target.value = '';
                      }}
                    />
                    <label
                      htmlFor="post-image-upload"
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl cursor-pointer hover:bg-white/5 text-zinc-400 hover:text-white transition-all group/btn"
                    >
                      <ImageIcon className="w-5 h-5 text-[#a78bfa] group-hover/btn:scale-110 transition-transform" />
                      <span className="text-xs font-bold">Galeria</span>
                    </label>
                    <div className="w-px h-6 bg-white/10" />
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl cursor-pointer transition-all hover:bg-white/5 ${showUrlInput ? 'text-white bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                      title="Inserir URL de imagem"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span className="text-xs font-bold">Link URL</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isPublishing || (!caption.trim() && !imageUrl.trim())}
                    aria-label={isPublishing ? 'Publicando...' : 'Compartilhar publicação'}
                    className="py-3.5 px-8 rounded-2xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-[#a78bfa] to-indigo-600 hover:from-[#9061f9] hover:to-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:shadow-[0_0_30px_rgba(167,139,250,0.5)] active:scale-95 transition-all disabled:cursor-not-allowed"
                  >
                    {isPublishing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Publicar
                      </>
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {showUrlInput && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-1"
                    >
                      <input
                        type="url"
                        placeholder="Cole a URL da imagem aqui (https://...)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-[#151515] text-xs text-zinc-200 py-3 px-4 rounded-xl border border-white/5 focus:border-[#a78bfa] focus:outline-none transition-all shadow-inner"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. Feed Header - If on Profile, show Grid/List Layout Mode Toggles */}
      <div className="flex items-center justify-between mt-1 px-1">
        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
          <Globe className="w-4 h-4 text-pink-500 animate-pulse" />
          {filterByUserId ? 'Publicações do Perfil' : 'Feed do Momento'}
        </h3>
        
        {/* Responsive layout selectors for profiles */}
        {filterByUserId ? (
          <div className="flex bg-slate-900 border border-white/5 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-[#151515] text-pink-500' : 'text-slate-450 hover:text-white'}`}
              title="Visualização em Grid (Instagram)"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-[#151515] text-pink-500' : 'text-slate-450 hover:text-white'}`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-zinc-500">
            {posts.length} {posts.length === 1 ? 'postagem' : 'postagens'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="w-8 h-8 text-pink-550 animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-450">Buscando do Banco...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-white/5 bg-[#0d1527]/20 p-6 animate-fadeIn">
          <Sparkles className="w-10 h-10 text-pink-500/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-400">Nenhum post publicado por aqui.</p>
          <p className="text-xs text-zinc-600 mt-1">Abra "Nova Publicação" para postar a primeira foto!</p>
        </div>
      ) : filterByUserId && viewMode === 'grid' ? (
        
        /* 4. Instagram Profile 3-Column Grid View */
        <div className="grid grid-cols-3 gap-1 md:gap-2.5">
          {posts.map((post) => (
            <div 
              key={post.id}
              onClick={() => {
                setSelectedPostLightbox(post);
                setActiveCommentsPostId(post.id);
              }}
              className="relative aspect-square bg-[#131b2e] overflow-hidden cursor-pointer group hover:opacity-95 transition-opacity"
            >
              <img 
                src={post.imageUrl || 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&q=80'} 
                alt="Feed thumbnail"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Instagram Hover state displaying likes / comments counts */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-bold text-xs sm:text-sm transition-opacity duration-200">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-white" />
                  {post.likesCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 fill-white" />
                  {post.commentsCount || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        
        /* 5. Standard Vertical Instagram Feed List */
        <div className="space-y-6">
          {posts.map((post) => {
            const isLikedByMe = post.likes?.includes(currentUserProfile.uid);
            const isMyPost = post.userId === currentUserProfile.uid;
            
            return (
              <article 
                key={post.id} 
                className="bg-[#0a0a0a] backdrop-blur-xl rounded-3xl border border-white/5/50 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] animate-fadeIn group/post relative"
              >
                {/* 5A. Post Header (IG styled metadata) */}
                <div className="p-3.5 flex items-center justify-between border-b border-slate-850/20">
                  <div className="flex items-center gap-3">
                    <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-yellow-405 via-pink-500 to-purple-600">
                      <div className="bg-[#0f172a] p-[1.5px] rounded-full">
                        {post.profilePicUrl ? (
                          <img 
                            src={post.profilePicUrl} 
                            alt={post.displayName} 
                            className="w-8.5 h-8.5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8.5 h-8.5 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs">
                            {post.displayName ? post.displayName.charAt(0).toUpperCase() : post.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white leading-none">
                          {post.displayName}
                        </span>
                        <span className="text-zinc-600 text-xs">·</span>
                        <a 
                          href={`/?u=${post.username}`}
                          className="text-[11px] text-pink-400 font-semibold hover:underline"
                        >
                          @{post.username}
                        </a>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-semibold block mt-0.5 tracking-wider uppercase">
                        SÃO PAULO, BRASIL · LINKFLOW
                      </span>
                    </div>
                  </div>

                  {/* Actions dots/delete */}
                  <div className="flex items-center gap-1">
                    {(isMyPost || isAdmin) && !previewMode && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg text-slate-550 hover:text-rose-400 hover:bg-slate-900/60 transition-all cursor-pointer"
                        title={isAdmin && !isMyPost ? "Remover (Admin)" : "Remover postagem"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button className="p-1.5 text-zinc-500 hover:text-white cursor-pointer" title="Opções">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 5B. Post Image with Double Tap / Double Click like animation */}
                {post.imageUrl && (
                  <div 
                    onDoubleClick={() => handleDoubleTap(post)}
                    className="relative border-b border-white/5 bg-black/90 flex justify-center items-center overflow-hidden select-none group cursor-pointer min-h-[200px] max-h-[80vh]"
                  >
                    <img 
                      src={post.imageUrl} 
                      alt="Instagram slide" 
                      className="w-full h-full object-contain transition-transform duration-700 hover:scale-101"
                    />

                    {/* Sliding Red Heart Popping Overlay */}
                    <AnimatePresence>
                      {heartBurstPostId === post.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.3 }}
                          animate={{ opacity: 1, scale: [0.3, 1.25, 0.95, 1.05, 1] }}
                          exit={{ opacity: 0, scale: 0.2, y: -20 }}
                          transition={{ duration: 0.45 }}
                          className="absolute inset-0 flex items-center justify-center z-10 pointers-events-none"
                        >
                          <div className="p-5 rounded-full bg-black/45 backdrop-blur-sm">
                            <Heart className="w-16 h-16 text-rose-500 fill-rose-500 filter drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Double tap tutor label */}
                    <div className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded bg-black/60 text-[8px] font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                      Clique duas vezes para curtir
                    </div>
                  </div>
                )}

                {/* 5C. Instagram Icon Interaction Bar */}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between select-none">
                  <div className="flex items-center gap-4">
                    {/* Heart Like */}
                    <button
                      onClick={() => handleLikePost(post)}
                      className={`transition-transform duration-200 active:scale-75 cursor-pointer ${
                        isLikedByMe 
                          ? 'text-rose-500 hover:text-rose-400' 
                          : 'text-slate-350 hover:text-white'
                      }`}
                      title={isLikedByMe ? "Descurtir" : "Curtir"}
                    >
                      <Heart className={`w-[23px] h-[23px] ${isLikedByMe ? 'fill-rose-500 text-rose-500 animate-heartBeat' : 'stroke-[2]'}`} />
                    </button>

                    {/* View Comments drawer trigger */}
                    <button
                      onClick={() => {
                        if (activeCommentsPostId === post.id) {
                          setActiveCommentsPostId(null);
                        } else {
                          setActiveCommentsPostId(post.id);
                        }
                      }}
                      className="text-slate-350 hover:text-white active:scale-90 transition-transform cursor-pointer"
                      title="Comentários"
                    >
                      <MessageSquare className="w-[22px] h-[22px] stroke-[2]" />
                    </button>

                    {/* Direct Sharing */}
                    <button
                      onClick={() => handleSharePost(post)}
                      className="text-slate-350 hover:text-white active:scale-95 transition-transform cursor-pointer relative"
                      title="Copiar Link para envio"
                    >
                      <AnimatePresence>
                        {copiedPostId === post.id ? (
                          <motion.span
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: -16, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute left-1/2 -translate-x-1/2 text-[9px] bg-green-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 min-w-[76px] text-center"
                          >
                            Copiado!
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                      <Send className="w-[22px] h-[22px] stroke-[2]" />
                    </button>

                    {/* Separator + quick-nav to @natanmarinho-dev */}
                    <span className="w-px h-5 bg-slate-700/60 mx-0.5" aria-hidden="true" />
                    <a
                      href="?u=natanmarinho-dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 active:scale-95 transition-transform cursor-pointer"
                      title="Visitar @natanmarinho-dev em nova aba"
                      aria-label="Visitar @natanmarinho-dev em nova aba"
                    >
                      <AtSign className="w-[22px] h-[22px] stroke-[2]" />
                    </a>
                  </div>

                  {/* Bookmark list save mockup */}
                  <button
                    onClick={() => handleBookmarkPost(post.id)}
                    className="text-slate-350 hover:text-white active:scale-90 transition-transform cursor-pointer"
                    title="Salvar"
                  >
                    <Bookmark className={`w-[22px] h-[22px] ${bookmarkedPosts.includes(post.id) ? 'fill-white text-white' : 'stroke-[2]'}`} />
                  </button>
                </div>

                {/* 5D. Instagram Info text: Likes counter */}
                <div className="px-4 select-none">
                  <p className="text-xs font-extrabold text-slate-205">
                    {post.likesCount ? (
                      `${post.likesCount} ${post.likesCount === 1 ? 'curtida' : 'curtidas'}`
                    ) : (
                      'Seja o primeiro a curtir'
                    )}
                  </p>
                </div>

                {/* 5E. Instagram Info text: Author bold header & styled description */}
                <div className="px-4 pt-1.5 space-y-1">
                  <p className="text-xs text-zinc-300 leading-relaxed text-slate-250 font-normal break-words min-w-0">
                    <span className="font-extrabold text-white mr-1.5 cursor-pointer hover:underline">{post.username}</span>
                    {renderStyledText(post.caption)}
                  </p>
                </div>

                {/* 5F. Live Inline Comment display */}
                <div className="px-4 pt-2">
                  
                  {/* Total comment counts link triggers comment manager below */}
                  {post.commentsCount > 0 && (
                    <button
                      onClick={() => {
                        setActiveCommentsPostId(post.id === activeCommentsPostId ? null : post.id);
                      }}
                      className="text-[11px] text-zinc-500 font-semibold hover:text-zinc-400 cursor-pointer block border-none outline-none text-left mb-1"
                    >
                      Ver {post.commentsCount === 1 ? 'o único comentário' : `todos os ${post.commentsCount} comentários`}
                    </button>
                  )}

                  {/* Scrolling Comments section as slide */}
                  <AnimatePresence>
                    {activeCommentsPostId === post.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-white/5/60 mt-3 pt-3 space-y-2.5 bg-black/15 p-3 rounded-xl mb-1"
                      >
                        <div className="max-h-52 overflow-y-auto pr-1 space-y-2.5">
                          {!(commentsMap[post.id]?.length) ? (
                            <p className="text-[10px] text-zinc-500 italic">Carregando comentários ou sem mensagens registradas.</p>
                          ) : (
                            commentsMap[post.id].map((comment) => {
                              const isMyComment = comment.userId === currentUserProfile.uid;
                              return (
                                <div key={comment.id} className="flex gap-2.5 text-xs items-start bg-slate-900/30 p-2 rounded-lg border border-slate-850/40">
                                  {comment.profilePicUrl ? (
                                    <img 
                                      src={comment.profilePicUrl} 
                                      alt={comment.displayName} 
                                      className="w-6.5 h-6.5 rounded-full object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-6.5 h-6.5 rounded-full bg-slate-705 flex items-center justify-center font-bold text-[9px] uppercase shrink-0 text-white">
                                      {comment.username.charAt(0)}
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-extrabold text-zinc-200">{comment.username}</span>
                                      <span className="text-[9px] text-zinc-500">· {formatTimeAgo(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-slate-350 mt-0.5 break-words text-[11px] font-medium leading-relaxed">
                                      {comment.text}
                                    </p>
                                  </div>

                                  {(isMyComment || isMyPost) && !previewMode && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(post.id, comment.id)}
                                      className="p-1 text-zinc-600 hover:text-red-400 cursor-pointer"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 5G. Time Elapsed display (IG style: bottom small date) */}
                <div className="px-4 py-2 opacity-50">
                  <span className="text-[9px] font-bold text-zinc-500 tracking-wider">
                    {formatTimeAgo(post.createdAt)}
                  </span>
                </div>

                {/* 5H. IG-Style Flat Comment Bar with Quick Emojis picker bar */}
                {!previewMode && (
                  <div className="border-t border-slate-850/40">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-[#141d33]/20">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setNewCommentText(prev => ({
                              ...prev,
                              [post.id]: (prev[post.id] || '') + emoji
                            }));
                          }}
                          className="hover:scale-125 text-sm transition-transform cursor-pointer p-0.5 select-none"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center px-4 py-3 gap-2">
                      <Smile className="w-4 h-4 text-zinc-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Adicione um comentário público..."
                        value={newCommentText[post.id] || ''}
                        onChange={(e) => setNewCommentText(prev => ({
                          ...prev,
                          [post.id]: e.target.value
                        }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(post.id);
                          }
                        }}
                        className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-slate-600 focus:outline-none min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newCommentText[post.id]?.trim()}
                        className="text-xs font-bold text-sky-400 hover:text-sky-350 disabled:text-slate-700 transition-colors cursor-pointer shrink-0"
                      >
                        Publicar
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* 6. DETAILED INSTAGRAM-STYLE DIRECT MEDIA LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedPostLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
          >
            {/* Main Instagram Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0f172a] border border-white/5 w-full max-w-[920px] rounded-2xl md:rounded-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-[620px] relative shadow-2xl"
            >
              
              {/* Close Button top-right */}
              <button
                onClick={() => {
                  setSelectedPostLightbox(null);
                  setActiveCommentsPostId(null);
                }}
                className="absolute top-2.5 right-2.5 md:hidden z-30 p-1 bg-black/60 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Side: Post picture */}
              <div 
                onDoubleClick={() => handleDoubleTap(selectedPostLightbox)}
                className="w-full md:w-[55%] bg-black flex justify-center items-center overflow-hidden h-[300px] md:h-full relative group"
              >
                <img
                  src={selectedPostLightbox.imageUrl}
                  alt="Lightbox representation"
                  className="w-full h-full object-cover"
                />

                {/* Giant heart splash double click in grid visualizer too */}
                <AnimatePresence>
                  {heartBurstPostId === selectedPostLightbox.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{ opacity: 1, scale: [0.3, 1.25, 0.95, 1.05, 1] }}
                      exit={{ opacity: 0, scale: 0.2 }}
                      transition={{ duration: 0.45 }}
                      className="absolute inset-0 flex items-center justify-center z-10"
                    >
                      <div className="p-4 rounded-full bg-black/40 backdrop-blur-sm">
                        <Heart className="w-14 h-14 text-rose-500 fill-rose-500" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Side: Header metadata + scrolling comments + commentary actions */}
              <div className="w-full md:w-[45%] flex flex-col h-[350px] md:h-full border-t md:border-t-0 md:border-l border-slate-850/60">
                
                {/* Frame Author */}
                <div className="p-3.5 border-b border-slate-850/40 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedPostLightbox.profilePicUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={selectedPostLightbox.displayName}
                      className="w-8 h-8 rounded-full border border-pink-500 object-cover"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight">{selectedPostLightbox.displayName}</span>
                      <span className="text-[10px] text-pink-400 font-semibold block leading-none">@{selectedPostLightbox.username}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPostLightbox(null);
                      setActiveCommentsPostId(null);
                    }}
                    className="hidden md:inline-flex text-zinc-400 hover:text-white p-1 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Frame Comments Scroll */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900/30">
                  
                  {/* The Post caption is the first persistent item */}
                  <div className="flex gap-2.5 items-start">
                    <img
                      src={selectedPostLightbox.profilePicUrl}
                      alt={selectedPostLightbox.displayName}
                      className="w-7.5 h-7.5 rounded-full object-cover shrink-0"
                    />
                    <div className="text-xs">
                      <p className="text-slate-350 leading-relaxed">
                        <span className="font-extrabold text-white mr-1.5">{selectedPostLightbox.username}</span>
                        {renderStyledText(selectedPostLightbox.caption)}
                      </p>
                      <span className="text-[9px] text-zinc-500 font-bold block mt-1 uppercase tracking-wider">{formatTimeAgo(selectedPostLightbox.createdAt)}</span>
                    </div>
                  </div>

                  {/* Subcollection Comments list */}
                  <div className="border-t border-slate-850/40 pt-4 space-y-3.5">
                    {!(commentsMap[selectedPostLightbox.id]?.length) ? (
                      <p className="text-[11px] text-zinc-500 italic">Pesquisando ou sem comentários ainda.</p>
                    ) : (
                      commentsMap[selectedPostLightbox.id].map((comment) => {
                        const isMyComment = comment.userId === currentUserProfile.uid;
                        return (
                          <div key={comment.id} className="flex gap-2.5 items-start text-xs">
                            <img
                              src={comment.profilePicUrl || 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=150&auto=format&fit=crop&q=80'}
                              alt={comment.username}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-zinc-300 leading-relaxed text-[11.5px]">
                                <span className="font-extrabold text-white mr-1.5">{comment.username}</span>
                                {comment.text}
                              </p>
                              <span className="text-[9px] text-zinc-500 font-bold mt-0.5 block">{formatTimeAgo(comment.createdAt)}</span>
                            </div>

                            {(isMyComment || selectedPostLightbox.userId === currentUserProfile.uid) && !previewMode && (
                              <button
                                onClick={() => handleDeleteComment(selectedPostLightbox.id, comment.id)}
                                className="text-zinc-600 hover:text-rose-400 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Frame Action Toolbar */}
                <div className="p-3.5 border-t border-slate-850/40 bg-[#0f172a] shrink-0">
                  <div className="flex items-center justify-between pb-2 select-none">
                    <div className="flex items-center gap-3.5">
                      <button 
                        onClick={() => handleLikePost(selectedPostLightbox)}
                        className={`text-xs font-bold transition-transform active:scale-75 cursor-pointer ${
                          selectedPostLightbox.likes?.includes(currentUserProfile.uid) ? 'text-rose-500' : 'text-slate-350 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-5.5 h-5.5 ${selectedPostLightbox.likes?.includes(currentUserProfile.uid) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                      
                      <button 
                        onClick={() => handleSharePost(selectedPostLightbox)}
                        className="text-slate-350 hover:text-white cursor-pointer active:scale-90"
                      >
                        <Send className="w-5.5 h-5.5" />
                      </button>
                    </div>

                    <button 
                      onClick={() => handleBookmarkPost(selectedPostLightbox.id)}
                      className="text-slate-350 hover:text-white cursor-pointer"
                    >
                      <Bookmark className={`w-5.5 h-5.5 ${bookmarkedPosts.includes(selectedPostLightbox.id) ? 'fill-white text-white' : ''}`} />
                    </button>
                  </div>

                  <p className="text-[11px] font-black text-zinc-200">
                    {selectedPostLightbox.likesCount || 0} {selectedPostLightbox.likesCount === 1 ? 'curtida' : 'curtidas'}
                  </p>
                  <span className="text-[8px] font-black text-zinc-500 tracking-wider block mt-0.5 uppercase">
                    {formatTimeAgo(selectedPostLightbox.createdAt)}
                  </span>
                </div>

                {/* Lightbox Comment entry input bar */}
                {!previewMode && (
                  <div className="p-3 bg-[#050505]/60 border-t border-slate-850/40 shrink-0 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Adicione um comentário..."
                      value={newCommentText[selectedPostLightbox.id] || ''}
                      onChange={(e) => setNewCommentText(prev => ({
                        ...prev,
                        [selectedPostLightbox.id]: e.target.value
                      }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddComment(selectedPostLightbox.id);
                        }
                      }}
                      className="flex-1 bg-transparent text-xs text-zinc-200 focus:outline-none placeholder-slate-705"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(selectedPostLightbox.id)}
                      disabled={!newCommentText[selectedPostLightbox.id]?.trim()}
                      className="text-xs font-bold text-sky-400 hover:text-sky-350 disabled:text-slate-800 transition-colors cursor-pointer shrink-0"
                    >
                      Publicar
                    </button>
                  </div>
                )}

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
