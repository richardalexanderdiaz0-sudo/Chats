import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatTimestamp } from '../lib/utils';
import { Calendar, Mail, User as UserIcon, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

const Profile: React.FC = () => {
  const { user, profile } = useAuth();

  if (!user || !profile) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative inline-block"
        >
          <img 
            src={profile.photoURL} 
            alt={profile.displayName} 
            className="w-32 h-32 rounded-full border-4 border-zinc-800 shadow-2xl object-cover"
          />
          <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-zinc-950"></div>
        </motion.div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">{profile.displayName}</h1>
          <p className="text-zinc-500 font-medium">@{profile.displayName?.toLowerCase().replace(/\s/g, '')}</p>
        </div>
      </header>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center gap-4">
          <div className="bg-white/5 p-3 rounded-2xl">
            <Mail className="text-zinc-400" size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</p>
            <p className="text-white font-medium">{profile.email}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center gap-4">
          <div className="bg-white/5 p-3 rounded-2xl">
            <Calendar className="text-zinc-400" size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Se unió el</p>
            <p className="text-white font-medium">{formatTimestamp(profile.joinedAt)}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center gap-4">
          <div className="bg-white/5 p-3 rounded-2xl">
            <ShieldCheck className="text-zinc-400" size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">ID de Cuenta</p>
            <p className="text-white font-mono text-[10px] break-all">{profile.uid}</p>
          </div>
        </div>
      </motion.div>

      <div className="pt-4">
        <p className="text-center text-zinc-600 text-xs font-medium">
          NEXUS Protocol v1.0.4 • Datos cifrados
        </p>
      </div>
    </div>
  );
};

export default Profile;
