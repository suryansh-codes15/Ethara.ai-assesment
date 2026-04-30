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
    if (socket) {
      socket.on('new-chat-message', (message) => {
        if (message.projectId === projectId) {
          setMessages(prev => [...prev, message]);
        }
      });
      return () => socket.off('new-chat-message');
    }
  }, [socket, projectId]);

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
            className="fixed right-0 top-0 bottom-0 z-[71] w-full max-w-[420px] flex flex-col overflow-hidden"
            style={{
              background: 'var(--surface-1)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-40px 0 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <span className="text-xl">💬</span>
                </div>
                <div>
                  <h2 className="font-bold text-[var(--text-primary)] text-base tracking-tight">Project Hub</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Live Team Chat</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth custom-scrollbar"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Syncing Messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-10">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl mb-6 grayscale opacity-50">
                    🎐
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">The chat is quiet</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                    Start the conversation! Every message here is visible to all project members.
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {showAvatar && !isMe && (
                        <span className="text-[10px] font-bold text-[var(--text-muted)] mb-1.5 ml-11 uppercase tracking-tighter opacity-60">
                          {m.user?.name}
                        </span>
                      )}
                      <div className="flex items-end gap-3 max-w-[90%]">
                        {!isMe && showAvatar && (
                           <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {m.user?.name?.charAt(0)}
                          </div>
                        )}
                        {!isMe && !showAvatar && <div className="w-8" />}
                        
                        <div 
                          className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed relative group transition-all duration-200 ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-500/10' 
                              : 'bg-white/5 text-[var(--text-secondary)] rounded-bl-none border border-white/5'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                      {showTimestamp && (
                        <span className={`text-[9px] font-bold text-[var(--text-muted)] mt-1.5 mx-1 opacity-40 uppercase tracking-tighter`}>
                          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-[var(--border)] bg-white/[0.02]">
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
                  placeholder="Share something with the team..."
                  className="input pr-14 text-sm py-4 max-h-32 min-h-[56px] resize-none border-white/5 bg-white/5 focus:bg-white/[0.08] rounded-2xl transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-20 transition-all shadow-lg shadow-indigo-500/20 active:scale-90"
                >
                  {sending ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span className="text-lg">↑</span>}
                </button>
              </form>
              <div className="flex items-center justify-between mt-4">
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-40">
                  Press Enter to send
                </p>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
