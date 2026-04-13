import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  serverTimestamp,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './lib/errorHandlers';
import { generateSecretId, AREAS } from './lib/utils';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  Plus, 
  X, 
  TrendingUp, 
  MapPin, 
  AlertTriangle,
  Send,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ErrorBoundary } from './components/ErrorBoundary';

import { detectLocation, UserLocation } from './lib/locationService';

// --- Types ---

interface Confession {
  id: string;
  text: string;
  area: string;
  likes: number;
  commentsCount: number;
  timestamp: Timestamp;
  secretId: string;
  reports: number;
}

interface Comment {
  id: string;
  confessionId: string;
  text: string;
  timestamp: Timestamp;
}

// --- Components ---

const ConfessionCard = ({ 
  confession, 
  onClick,
  onLike,
  onReport 
}: { 
  confession: Confession; 
  onClick: () => void;
  onLike: (e: React.MouseEvent) => void;
  onReport: (e: React.MouseEvent) => void;
  key?: string | number;
}) => {
  const isTrending = confession.likes + confession.commentsCount > 10;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-5 mb-4 cursor-pointer hover:neon-glow transition-all active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <span className="text-neon-accent font-mono text-sm font-bold">{confession.secretId}</span>
          <div className="flex items-center text-gray-500 text-xs mt-1">
            <MapPin size={12} className="mr-1" />
            <span>{confession.area}</span>
          </div>
        </div>
        {isTrending && (
          <div className="flex items-center bg-neon-purple/20 text-neon-purple px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <TrendingUp size={10} className="mr-1" />
            Trending
          </div>
        )}
      </div>

      <p className="text-gray-200 text-lg leading-relaxed mb-4 line-clamp-4">
        {confession.text}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex space-x-4">
          <button 
            onClick={onLike}
            className="flex items-center space-x-1.5 text-gray-400 hover:text-red-500 transition-colors group"
          >
            <Heart size={18} className="group-active:scale-125 transition-transform" />
            <span className="text-sm font-medium">{confession.likes}</span>
          </button>
          <div className="flex items-center space-x-1.5 text-gray-400">
            <MessageSquare size={18} />
            <span className="text-sm font-medium">{confession.commentsCount}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const url = `${window.location.origin}?id=${confession.id}`;
              const text = `Check out this anonymous confession from ${confession.area}: "${confession.text.substring(0, 50)}..."`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
            }}
            className="text-gray-400 hover:text-neon-accent transition-colors"
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={onReport}
            className="text-gray-400 hover:text-yellow-500 transition-colors"
          >
            <AlertTriangle size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const CreateModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultArea
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: () => void;
  defaultArea?: string;
}) => {
  const [text, setText] = useState('');
  const [area, setArea] = useState(defaultArea || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultArea && !area) {
      setArea(defaultArea);
    }
  }, [defaultArea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !area || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'confessions'), {
        text,
        area,
        likes: 0,
        commentsCount: 0,
        reports: 0,
        secretId: generateSecretId(),
        timestamp: serverTimestamp()
      });
      setText('');
      setArea('');
      onSuccess();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'confessions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative w-full max-w-lg bg-card-bg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border-t sm:border border-white/10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neon-accent">Share a Secret</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Your Confession
                </label>
                <textarea
                  required
                  maxLength={300}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What's on your mind? Keep it anonymous..."
                  className="w-full h-40 bg-dark-bg/50 border neon-border rounded-xl p-4 text-gray-200 resize-none"
                />
                <div className="text-right text-[10px] text-gray-500 mt-1">
                  {text.length}/300
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Area
                </label>
                <select
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-dark-bg/50 border neon-border rounded-xl p-4 text-gray-200 appearance-none"
                >
                  <option value="" disabled>Select your area</option>
                  {AREAS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !text || !area}
                className="w-full py-4 bg-neon-accent text-dark-bg font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? 'Posting...' : 'Post Anonymously'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const DetailView = ({ 
  confession, 
  onClose 
}: { 
  confession: Confession; 
  onClose: () => void;
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'confessions', confession.id, 'comments'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `confessions/${confession.id}/comments`);
    });

    return () => unsubscribe();
  }, [confession.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'confessions', confession.id, 'comments'), {
        confessionId: confession.id,
        text: newComment,
        timestamp: serverTimestamp()
      });
      
      await updateDoc(doc(db, 'confessions', confession.id), {
        commentsCount: increment(1)
      });

      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `confessions/${confession.id}/comments`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-50 bg-dark-bg flex flex-col"
    >
      <header className="p-4 border-b border-white/5 flex items-center">
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white mr-2">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-neon-accent">Confession Details</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="glass-card p-6 mb-8 border-neon-accent/20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-neon-accent font-mono font-bold">{confession.secretId}</span>
            <span className="text-gray-500 text-xs">{confession.area}</span>
          </div>
          <p className="text-gray-200 text-xl leading-relaxed mb-4">
            {confession.text}
          </p>
          <div className="text-[10px] text-gray-600 uppercase tracking-widest">
            {confession.timestamp ? formatDistanceToNow(confession.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
          </div>
        </div>

        <div className="mb-20">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 px-2">
            Comments ({confession.commentsCount})
          </h3>
          <AnimatePresence initial={false}>
            {comments.map(comment => (
              <motion.div 
                key={comment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/5"
              >
                <p className="text-gray-300 text-sm mb-2">{comment.text}</p>
                <span className="text-[10px] text-gray-600">
                  {comment.timestamp ? formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {comments.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              No comments yet. Be the first!
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-card-bg border-t border-white/10">
        <form onSubmit={handleAddComment} className="flex space-x-2">
          <input
            type="text"
            maxLength={200}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add an anonymous comment..."
            className="flex-1 bg-dark-bg border neon-border rounded-full px-5 py-3 text-sm text-gray-200"
          />
          <button
            type="submit"
            disabled={!newComment || isSubmitting}
            className="p-3 bg-neon-accent text-dark-bg rounded-full disabled:opacity-50 transition-all active:scale-90"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [filterArea, setFilterArea] = useState<string>('Nearby');
  const [sortBy, setSortBy] = useState<'new' | 'trending'>('new');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedConfession, setSelectedConfession] = useState<Confession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initLocation = async () => {
      try {
        const loc = await detectLocation();
        if (loc && loc.city && loc.city !== 'Unknown') {
          console.log('Location detected:', loc.city);
          setUserLocation(loc);
          setFilterArea('Nearby');
        } else {
          console.log('Location detection returned no city, defaulting to All');
          setFilterArea('All');
        }
      } catch (err) {
        console.error('Error in initLocation:', err);
        setFilterArea('All');
      }
    };
    initLocation();
  }, []);

  useEffect(() => {
    let q = query(collection(db, 'confessions'));

    if (filterArea === 'Nearby' && userLocation) {
      q = query(q, where('area', '==', userLocation.city));
    } else if (filterArea !== 'All' && filterArea !== 'Nearby') {
      q = query(q, where('area', '==', filterArea));
    }

    if (sortBy === 'new') {
      q = query(q, orderBy('timestamp', 'desc'));
    } else {
      q = query(q, orderBy('likes', 'desc'), orderBy('timestamp', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConfessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Confession)));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'confessions');
    });

    return () => unsubscribe();
  }, [filterArea, sortBy]);

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'confessions', id), {
        likes: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `confessions/${id}`);
    }
  };

  const handleReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'confessions', id), {
        reports: increment(1)
      });
      alert('Thank you for reporting. We will review this content.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `confessions/${id}`);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen max-w-2xl mx-auto flex flex-col relative">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-md p-4 border-b border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-black tracking-tighter text-white">
              CONFESS<span className="text-neon-accent">BD</span>
            </h1>
            <div className="flex bg-white/5 p-1 rounded-xl">
              <button 
                onClick={() => setSortBy('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'new' ? 'bg-neon-accent text-dark-bg' : 'text-gray-400'}`}
              >
                NEW
              </button>
              <button 
                onClick={() => setSortBy('trending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'trending' ? 'bg-neon-purple text-white' : 'text-gray-400'}`}
              >
                HOT
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto pb-2 space-x-2 no-scrollbar">
            {userLocation ? (
              <button
                onClick={() => setFilterArea('Nearby')}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border flex items-center transition-all ${filterArea === 'Nearby' ? 'bg-neon-accent text-dark-bg border-neon-accent' : 'border-white/10 text-gray-400'}`}
              >
                <MapPin size={12} className="mr-1" />
                Nearby ({userLocation.city})
              </button>
            ) : filterArea === 'Nearby' ? (
              <div className="whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border border-white/5 text-gray-600 flex items-center animate-pulse">
                <MapPin size={12} className="mr-1" />
                Detecting...
              </div>
            ) : null}
            <button
              onClick={() => setFilterArea('All')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${filterArea === 'All' ? 'bg-white text-dark-bg border-white' : 'border-white/10 text-gray-400'}`}
            >
              All Areas
            </button>
            {AREAS.map(area => (
              <button
                key={area}
                onClick={() => setFilterArea(area)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${filterArea === area ? 'bg-neon-accent text-dark-bg border-neon-accent' : 'border-white/10 text-gray-400'}`}
              >
                {area}
              </button>
            ))}
          </div>
        </header>

        {/* Feed */}
        <main className="flex-1 p-4 pb-24">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-neon-accent border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Loading secrets...</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {confessions.length > 0 ? (
                confessions.map(confession => (
                  <ConfessionCard 
                    key={confession.id} 
                    confession={confession}
                    onClick={() => setSelectedConfession(confession)}
                    onLike={(e) => handleLike(confession.id, e)}
                    onReport={(e) => handleReport(confession.id, e)}
                  />
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-600 italic">No confessions found in this area yet.</p>
                  <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="mt-4 text-neon-accent font-bold hover:underline"
                  >
                    Be the first to confess!
                  </button>
                </div>
              )}
            </AnimatePresence>
          )}
        </main>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-neon-accent text-dark-bg rounded-2xl shadow-[0_0_20px_rgba(0,255,157,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <Plus size={32} />
        </button>

        {/* Modals */}
        <CreateModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            // Optional: show toast
          }}
          defaultArea={userLocation?.city}
        />

        <AnimatePresence>
          {selectedConfession && (
            <DetailView 
              confession={selectedConfession} 
              onClose={() => setSelectedConfession(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
