import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { UserPlus, Scissors } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    const data = await res.json();
    if (res.ok) {
      login(data);
      navigate('/');
    } else {
      setError(data.error);
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
          <h2 className="text-2xl font-bold tracking-tight">Criar Conta</h2>
          <p className="text-sm text-gray-500 mt-2">Junte-se à BarberFlow hoje.</p>
        </div>
        
        {error && <p className="bg-red-500/10 text-red-400 p-3 rounded-md mb-6 text-xs border border-red-500/20">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Nome de Usuário</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full input-vercel"
              placeholder="Como quer ser chamado?"
              required
            />
          </div>
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
            Cadastrar
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          Já tem uma conta? <Link to="/login" className="text-white hover:underline">Entrar</Link>
        </p>
      </motion.div>
    </div>
  );
}
