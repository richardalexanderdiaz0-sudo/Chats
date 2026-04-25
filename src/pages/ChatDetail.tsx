import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, addDoc, onSnapshot, orderBy, serverTimestamp, doc, getDoc, updateDoc, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, MoreVertical, Image as ImageIcon } from 'lucide-react';
import { formatTime } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const ChatDetail: React.FC = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    // Fetch other user profile
    const fetchOtherUser = async () => {
      const chatSnap = await getDoc(doc(db, 'chats', chatId));
      if (chatSnap.exists()) {
        const participants = chatSnap.data().participants;
        const otherId = participants.find((id: string) => id !== user.uid);
        const userDoc = await getDoc(doc(db, 'users', otherId));
        if (userDoc.exists()) setOtherUser(userDoc.data());
      }
    };
    fetchOtherUser();

    // Messages listener
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setMessages(msgs);
      setLoading(false);
      
      // Local Notification for new messages from other user
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.senderId !== user.uid) {
        showNotification(lastMsg.text);
      }
    });

    return () => unsubscribe();
  }, [chatId, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showNotification = (body: string) => {
    if (Notification.permission === 'granted') {
      new Notification('NEXUS - Nuevo mensaje', {
        body,
        icon: '/favicon.ico'
      });
    }
  };

  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !chatId || !user) return;

    const messageText = text;
    setText('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: messageText,
        createdAt: serverTimestamp()
      });


      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: messageText,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error sending message", e);
    }
  };

  return (
    <div className="flex flex-col h-screen fixed inset-0 bg-zinc-950 z-[60]">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={24} className="text-white" />
        </button>
        {otherUser && (
          <div className="flex-1 flex items-center gap-3">
            <div className="relative">
              <img src={otherUser.photoURL} alt="" className="w-10 h-10 rounded-full border border-zinc-700" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-tight">{otherUser.displayName}</h3>
              <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">En línea</p>
            </div>
          </div>
        )}
        <button className="p-2 rounded-full hover:bg-zinc-800">
          <MoreVertical size={20} className="text-zinc-500" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
             <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isMe = msg.senderId === user?.uid;
              const showTime = i === messages.length - 1 || messages[i+1]?.senderId !== msg.senderId;
              
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] space-y-1`}>
                    <div className={`px-4 py-3 rounded-3xl text-sm font-medium shadow-sm ${
                      isMe 
                      ? 'bg-white text-zinc-950 rounded-br-none' 
                      : 'bg-zinc-800 text-white rounded-bl-none border border-zinc-700/50'
                    }`}>
                      {msg.text}
                    </div>
                    {showTime && (
                      <p className={`text-[10px] font-bold text-zinc-600 uppercase tracking-tighter ${isMe ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800">
        <form onSubmit={handleSend} className="flex gap-3">
          <div className="flex-1 relative flex items-center">
            <button type="button" className="absolute left-3 p-2 text-zinc-500 hover:text-white">
              <ImageIcon size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Mensaje..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm font-medium"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={!text.trim()}
            className="bg-white text-zinc-950 p-4 rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:grayscale"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatDetail;
