import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../lib/firebase';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Chrome, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/chats" replace />;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur-sm"
      >
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black tracking-tighter text-white">NEXUS</h2>
          <p className="text-zinc-500 text-sm">{isRegister ? 'Crea una cuenta para empezar' : 'Bienvenido de nuevo'}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium placeholder:text-zinc-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium placeholder:text-zinc-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-zinc-950 font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegister ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="relative flex items-center gap-4 py-2">
          <div className="h-px flex-1 bg-zinc-800"></div>
          <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">O continúa con</span>
          <div className="h-px flex-1 bg-zinc-800"></div>
        </div>

        <button 
          onClick={handleGoogle} 
          disabled={loading}
          className="w-full bg-zinc-800 border border-zinc-700 text-white font-bold py-4 rounded-2xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-3"
        >
          <Chrome size={20} />
          Google
        </button>

        <p className="text-center text-sm text-zinc-500">
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <button 
            onClick={() => setIsRegister(!isRegister)} 
            className="ml-2 text-white font-bold hover:underline"
          >
            {isRegister ? 'Inicia Sesión' : 'Regístrate'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
