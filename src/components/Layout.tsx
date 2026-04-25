import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { MessageSquare, MapPin, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth, signOut } from '../lib/firebase';
import { motion } from 'motion/react';

const Layout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100 font-sans">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-tighter text-white">Your chats</h1>
        <button 
          onClick={() => signOut(auth)}
          className="rounded-full p-2 hover:bg-zinc-800 transition-colors"
          aria-label="Cerrar Sesión"
        >
          <LogOut size={20} className="text-zinc-400" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 p-2 shadow-2xl z-50 ring-1 ring-white/10">
        <NavLink 
          to="/chats" 
          className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[70px] py-2 rounded-full transition-all ${isActive ? 'bg-white text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Chats</span>
        </NavLink>
        <NavLink 
          to="/discover" 
          className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[70px] py-2 rounded-full transition-all ${isActive ? 'bg-white text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          <MapPin size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Conoce</span>
        </NavLink>
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[70px] py-2 rounded-full transition-all ${isActive ? 'bg-white text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          <User size={20} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Perfil</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
