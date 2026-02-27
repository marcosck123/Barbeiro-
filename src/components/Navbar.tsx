import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, Calendar, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <Scissors className="w-6 h-6" />
          <span>BarberFlow</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
          <Link to="/" className="hover:text-white transition-colors">Catálogo</Link>
          {user && <Link to="/booking" className="hover:text-white transition-colors">Agendar</Link>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" />
                Painel
              </Link>
            )}
            {user.role === 'barber' && (
              <Link to="/barber" className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Agenda
              </Link>
            )}
            <div className="h-4 w-px bg-white/10 mx-2" />
            <span className="text-sm text-gray-400">{user.username}</span>
            <button onClick={() => { logout(); navigate('/'); }} className="text-gray-400 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Entrar</Link>
            <Link to="/register" className="btn-vercel-primary">Cadastrar</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
