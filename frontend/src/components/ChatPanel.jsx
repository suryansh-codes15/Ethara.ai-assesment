import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPanel({ projectId, open, onClose }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
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
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage('');
    try {
      await chatAPI.send(projectId, text);
      // Socket will handle adding to list
    } catch { /* silent */ }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[71] w-full max-w-[380px] flex flex-col overflow-hidden"
            style={{
              background: 'var(--surface-1)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">💬</span>
                <div>
                  <h2 className="font-bold text-[var(--text-primary)] text-sm">Project Chat</h2>
                  <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Team Communication</p>
                </div>
              </div>
              <button onClick={onClose} className="btn-ghost p-1.5 text-sm">✕</button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  <p className="text-xs">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                  <div className="text-4xl mb-3">🎐</div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs">Be the first to say something!</p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.userId === user?.id || m.user?.id === user?.id;
                  const showAvatar = idx === 0 || messages[idx-1].userId !== m.userId;
                  
                  return (
                    <div key={m._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showAvatar && !isMe && (
                        <span className="text-[10px] font-bold text-[var(--text-muted)] mb-1 ml-1">{m.user?.name}</span>
                      )}
                      <div className="flex items-end gap-2 group">
                        {!isMe && showAvatar && (
                           <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {m.user?.name?.charAt(0)}
                          </div>
                        )}
                        {!isMe && !showAvatar && <div className="w-6" />}
                        
                        <div 
                          className={`max-w-[260px] px-3.5 py-2.5 rounded-2xl text-sm relative group transition-all ${
                            isMe 
                              ? 'bg-indigo-500 text-white rounded-br-none' 
                              : 'bg-white/5 text-[var(--text-secondary)] rounded-bl-none border border-white/5'
                          }`}
                        >
                          {m.text}
                          <span className={`absolute -bottom-4 ${isMe ? 'right-0' : 'left-0'} text-[8px] font-bold text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                            {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] bg-white/[0.01]">
              <div className="relative">
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
                  placeholder="Type a message..."
                  className="input pr-12 text-sm py-3 max-h-32 min-h-[44px] resize-none"
                  style={{ background: 'var(--surface-3)' }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 disabled:opacity-30 disabled:hover:bg-indigo-500 transition-all"
                >
                  ↑
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center font-medium">
                Admins and members can see these messages
              </p>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
