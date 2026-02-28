import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Calendar, Clock, History, Plus } from 'lucide-react';
import { Appointment, Availability, Barber } from '../types';
import { storageService } from '../services/storage';

export default function BarberPanel() {
  const { user } = useAuth();
  const [barber, setBarber] = useState<Barber | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [newSlot, setNewSlot] = useState({ date: '', time: '' });

  useEffect(() => {
    if (user) {
      storageService.getBarbers().then(barbers => {
        const b = barbers.find((bar: any) => bar.user_id === user.id);
        if (b) {
          setBarber(b);
          fetchAvailability(b.id);
          fetchHistory(b.id);
        }
      });
    }
  }, [user]);

  const fetchAvailability = (id: number) => {
    storageService.getAvailability(id).then(setAvailability);
  };

  const fetchHistory = (id: number) => {
    storageService.getBarberHistory(id).then(setHistory);
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barber) return;
    const start = `${newSlot.date}T${newSlot.time}:00`;
    await storageService.addAvailability({
      barber_id: barber.id,
      start_time: start,
      end_time: start // Simplified for now
    });
    setNewSlot({ date: '', time: '' });
    fetchAvailability(barber.id);
  };

  if (!barber) return (
    <div className="pt-32 text-center opacity-50">
      <p>Você ainda não está cadastrado como barbeiro. Entre em contato com o administrador.</p>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Painel do Barbeiro</h1>
            <p className="text-gray-500 mt-2">Olá, {barber.name}. Gerencie sua agenda e acompanhe seus ganhos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Availability Management */}
          <section className="lg:col-span-1 space-y-6">
            <div className="vercel-card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Adicionar Horário
              </h2>
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Data</label>
                  <input 
                    type="date" 
                    value={newSlot.date}
                    onChange={e => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full input-vercel"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Hora</label>
                  <input 
                    type="time" 
                    value={newSlot.time}
                    onChange={e => setNewSlot(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full input-vercel"
                    required
                  />
                </div>
                <button type="submit" className="w-full btn-vercel-primary">Abrir Horário</button>
              </form>
            </div>

            <div className="vercel-card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Horários Disponíveis
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {availability.map(slot => (
                  <div key={slot.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-xs font-mono">{new Date(slot.start_time).toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] uppercase text-emerald-400 font-bold">Livre</span>
                  </div>
                ))}
                {availability.length === 0 && <p className="text-xs text-gray-600 text-center py-4 italic">Nenhum horário aberto.</p>}
              </div>
            </div>
          </section>

          {/* History */}
          <section className="lg:col-span-2 vercel-card p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <History className="w-5 h-5" /> Histórico de Atendimentos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase text-gray-500 tracking-widest">
                    <th className="pb-4">Data/Hora</th>
                    <th className="pb-4">Corte</th>
                    <th className="pb-4">Pagamento</th>
                    <th className="pb-4">Minha Parte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((item, i) => (
                    <tr key={i} className="group hover:bg-white/5 transition-colors">
                      <td className="py-4 text-xs font-mono">{new Date(item.start_time).toLocaleString('pt-BR')}</td>
                      <td className="py-4 text-sm">{item.haircut_name}</td>
                      <td className="py-4">
                        <span className="text-[10px] uppercase bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-400">
                          {item.payment_method}
                        </span>
                      </td>
                      <td className="py-4 text-white font-mono font-bold text-sm">
                        R$ {(item.total_price * (item.commission_rate || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-sm text-gray-600 italic">Nenhum atendimento realizado ainda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
