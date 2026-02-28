import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Scissors } from 'lucide-react';
import { storageService } from '../services/storage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await storageService.login(email, password);
      if (user) {
        login(user);
        navigate(user.role === 'admin' ? '/admin' : user.role === 'barber' ? '/barber' : '/');
      } else {
        setError('Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-black">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="vercel-card p-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Scissors className="w-10 h-10 mx-auto mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
          <p className="text-sm text-gray-500 mt-2">Entre com suas credenciais para continuar.</p>
        </div>
        
        {error && <p className="bg-red-500/10 text-red-400 p-3 rounded-md mb-6 text-xs border border-red-500/20">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full input-vercel"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full input-vercel"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="w-full btn-vercel-primary mt-2">
            Entrar
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          Não tem uma conta? <Link to="/register" className="text-white hover:underline">Cadastre-se</Link>
        </p>
      </motion.div>
    </div>
  );
}
