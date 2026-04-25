import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { formatTime } from '../lib/utils';
import { MessageCircle, Search, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const Chats: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const otherUserId = data.participants.find((id: string) => id !== user.uid);
        
        // Fetch other user profile
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
        const otherUserData = otherUserDoc.exists() ? otherUserDoc.data() : { displayName: 'Desconocido', photoURL: '' };

        return {
          id: chatDoc.id,
          ...data,
          otherUser: otherUserData
        };
      }));

      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-zinc-900/50 rounded-3xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-white uppercase italic">Chats</h2>
        <div className="bg-zinc-900 p-2 rounded-full">
          <Search size={20} className="text-zinc-500" />
        </div>
      </div>

      <div className="space-y-2">
        {chats.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="bg-zinc-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle size={32} className="text-zinc-700" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">No hay conversaciones aún.<br/>Ve a 'Conoce' para encontrar a alguien.</p>
          </div>
        ) : (
          chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                to={`/chats/${chat.id}`}
                className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-transparent hover:border-zinc-800 hover:bg-zinc-900 rounded-[2rem] transition-all group"
              >
                <div className="relative">
                  <img src={chat.otherUser.photoURL} alt="" className="w-14 h-14 rounded-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-4 border-zinc-950 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-black text-white truncate">{chat.otherUser.displayName}</h3>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{formatTime(chat.updatedAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-500 truncate font-medium">
                    {chat.lastMessage || 'Empieza a chatear...'}
                  </p>
                </div>
                <ChevronRight className="text-zinc-800 group-hover:text-zinc-400 transition-colors" size={20} />
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Chats;
