import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function ChatPanel({ projectId, open, onClose }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(socket?.connected || false);
  const scrollRef = useRef(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await chatAPI.getMessages(projectId);
      setMessages(data.messages || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (open) fetchMessages();
  }, [open, projectId]);

  useEffect(() => {
    if (socket && open) {
      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);
      
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      
      // Join project room for real-time messages
      socket.emit('join-project', projectId);

      socket.on('new-chat-message', (message) => {
        if (message.projectId === projectId) {
          setMessages(prev => [...prev, message]);
        }
      });

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('new-chat-message');
        socket.emit('leave-project', projectId);
      };
    }
  }, [socket, projectId, open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      await chatAPI.send(projectId, text);
    } catch { 
      toast.error("Failed to send message");
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 450, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[71] w-full max-w-[420px] flex flex-col overflow-hidden glass-premium border-l border-white/10"
            style={{
              boxShadow: '-40px 0 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h2 className="font-black text-white text-lg tracking-tight uppercase tracking-[0.1em]">Project Hub</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                      {isConnected ? 'Syncing Live' : 'Establishing Link...'}
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-white group"
              >
                <span className="text-xl group-hover:rotate-90 transition-transform duration-300">✕</span>
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth custom-scrollbar"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="w-12 h-12 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-2xl shadow-indigo-500/10" />
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] animate-pulse">Initializing Data Stream</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-12 opacity-40">
                  <div className="w-24 h-24 rounded-[40px] bg-white/5 flex items-center justify-center text-5xl mb-8 grayscale animate-float">
                    🎐
                  </div>
                  <h3 className="text-lg font-black text-white mb-3 uppercase tracking-widest">Zero Frequency</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed font-bold">
                    No encrypted messages detected in this sector. Initiate communication to begin.
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.userId === user?.id || m.user?.id === user?.id;
                  const showAvatar = idx === 0 || messages[idx-1].userId !== m.userId;
                  const showTimestamp = idx === messages.length - 1 || messages[idx+1].userId !== m.userId;
                  
                  return (
                    <motion.div 
                      key={m._id} 
                      initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {showAvatar && !isMe && (
                        <span className="text-[9px] font-black text-indigo-400 mb-2 ml-12 uppercase tracking-widest opacity-80">
                          {m.user?.name}
                        </span>
                      )}
                      <div className="flex items-end gap-3 max-w-[92%] group/msg">
                        {!isMe && showAvatar && (
                           <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black shadow-2xl border border-white/10"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                            {m.user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {!isMe && !showAvatar && <div className="w-9" />}
                        
                        <div 
                          className={`px-5 py-4 rounded-[24px] text-[13px] font-medium leading-relaxed relative transition-all duration-300 ${
                            isMe 
                              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-[0_10px_30px_rgba(99,102,241,0.2)] border border-indigo-400/20' 
                              : 'bg-white/5 text-[var(--text-secondary)] rounded-bl-none border border-white/5 hover:bg-white/[0.08]'
                          }`}
                        >
                          {m.text}
                          {isMe && (
                            <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />
                            </div>
                          )}
                        </div>
                      </div>
                      {showTimestamp && (
                        <span className={`text-[9px] font-black text-[var(--text-muted)] mt-2 mx-1 opacity-40 uppercase tracking-tighter`}>
                          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Input Area */}
            <div className="p-8 border-t border-white/5 bg-white/[0.01] backdrop-blur-3xl">
              <form onSubmit={handleSend} className="relative">
                <textarea
                  rows={1}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Broadcast message..."
                  className="input pr-16 text-sm py-5 max-h-32 min-h-[64px] resize-none border-white/5 bg-white/5 focus:bg-white/[0.1] rounded-[24px] transition-all font-medium placeholder:text-[var(--text-muted)]/50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 disabled:opacity-20 transition-all shadow-2xl shadow-indigo-600/40 active:scale-90"
                >
                  {sending ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span className="text-xl">↑</span>}
                </button>
              </form>
              <div className="flex items-center justify-between mt-5">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] opacity-60">
                     Encryption Active
                   </p>
                </div>
                <div className="flex gap-2">
                   <div className="w-1 h-1 rounded-full bg-white/10" />
                   <div className="w-1 h-1 rounded-full bg-white/10" />
                   <div className="w-1 h-1 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
