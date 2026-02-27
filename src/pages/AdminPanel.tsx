import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Image as ImageIcon, Trash2, TrendingUp, Users, Scissors, Wand2 } from 'lucide-react';
import { Haircut, User, Barber } from '../types';
import { editHaircutImage } from '../services/gemini';

export default function AdminPanel() {
  const [haircuts, setHaircuts] = useState<Haircut[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [newHaircut, setNewHaircut] = useState({
    name: '',
    description: '',
    price: 0,
    estimated_time: 30,
    image: ''
  });
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [hRes, rRes, bRes] = await Promise.all([
      fetch('/api/haircuts'),
      fetch('/api/admin/reports'),
      fetch('/api/barbers')
    ]);
    setHaircuts(await hRes.json());
    setReports(await rRes.json());
    setBarbers(await bRes.json());
  };

  const handleAddHaircut = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/haircuts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHaircut)
    });
    if (res.ok) {
      setNewHaircut({ name: '', description: '', price: 0, estimated_time: 30, image: '' });
      fetchData();
    }
  };

  const handleAiEditImage = async () => {
    if (!newHaircut.image || !imagePrompt) return;
    setIsEditingImage(true);
    try {
      const newImage = await editHaircutImage(newHaircut.image, imagePrompt);
      if (newImage) {
        setNewHaircut(prev => ({ ...prev, image: newImage }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewHaircut(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-gray-500 mt-2">Gerencie seu catálogo, barbeiros e finanças.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="vercel-card p-6">
            <div className="flex justify-between items-start mb-4">
              <TrendingUp className="text-white w-5 h-5" />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Receita Total</span>
            </div>
            <p className="text-3xl font-bold">R$ {reports.reduce((acc, curr) => acc + curr.total_revenue, 0).toFixed(2)}</p>
          </div>
          <div className="vercel-card p-6">
            <div className="flex justify-between items-start mb-4">
              <Users className="text-white w-5 h-5" />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Barbeiros Ativos</span>
            </div>
            <p className="text-3xl font-bold">{barbers.length}</p>
          </div>
          <div className="vercel-card p-6">
            <div className="flex justify-between items-start mb-4">
              <Scissors className="text-white w-5 h-5" />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Cortes</span>
            </div>
            <p className="text-3xl font-bold">{haircuts.length}</p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Add Haircut Form */}
        <section className="glass p-8 rounded-2xl">
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
            <Plus className="w-6 h-6 text-gold" /> Adicionar Novo Corte
          </h2>
          <form onSubmit={handleAddHaircut} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm opacity-60 mb-1">Nome do Corte</label>
                <input 
                  type="text" 
                  value={newHaircut.name}
                  onChange={e => setNewHaircut(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-gold outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm opacity-60 mb-1">Preço (R$)</label>
                <input 
                  type="number" 
                  value={newHaircut.price}
                  onChange={e => setNewHaircut(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-gold outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm opacity-60 mb-1">Tempo (min)</label>
                <input 
                  type="number" 
                  value={newHaircut.estimated_time}
                  onChange={e => setNewHaircut(prev => ({ ...prev, estimated_time: parseInt(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-gold outline-none"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm opacity-60 mb-1">Descrição</label>
                <textarea 
                  value={newHaircut.description}
                  onChange={e => setNewHaircut(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-gold outline-none h-24"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm opacity-60 mb-1">Imagem</label>
                <div className="flex gap-4 items-start">
                  <div className="w-32 h-32 glass rounded-lg overflow-hidden flex items-center justify-center relative">
                    {newHaircut.image ? (
                      <img src={newHaircut.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="opacity-20 w-8 h-8" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs opacity-50">Clique no quadro para fazer upload ou use a IA para editar.</p>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Ex: Adicione um filtro vintage..."
                        value={imagePrompt}
                        onChange={e => setImagePrompt(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none"
                      />
                      <button 
                        type="button"
                        onClick={handleAiEditImage}
                        disabled={isEditingImage || !newHaircut.image}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 p-2 rounded-lg transition-colors"
                      >
                        <Wand2 className={`w-4 h-4 ${isEditingImage ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="w-full btn-primary">Salvar no Catálogo</button>
          </form>
        </section>

        {/* Barber Management */}
        <section className="glass p-8 rounded-2xl">
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-gold" /> Gerenciar Barbeiros
          </h2>
          <div className="space-y-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-gold">Novo Barbeiro</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const res = await fetch('/api/barbers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    user_id: parseInt(formData.get('user_id') as string),
                    name: formData.get('name'),
                    bio: formData.get('bio'),
                    commission_rate: parseFloat(formData.get('commission_rate') as string) / 100
                  })
                });
                if (res.ok) {
                  form.reset();
                  fetchData();
                }
              }} className="space-y-3">
                <input name="user_id" type="number" placeholder="ID do Usuário" className="w-full bg-dark border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" required />
                <input name="name" type="text" placeholder="Nome Artístico" className="w-full bg-dark border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" required />
                <input name="bio" type="text" placeholder="Breve História/Bio" className="w-full bg-dark border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" required />
                <div className="flex gap-2">
                  <input name="commission_rate" type="number" placeholder="Comissão %" className="flex-1 bg-dark border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" required />
                  <button type="submit" className="bg-gold text-dark font-bold px-4 py-2 rounded-lg text-sm">Adicionar</button>
                </div>
              </form>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs opacity-50 uppercase tracking-widest">Barbeiros Cadastrados</h4>
              {barbers.map(b => (
                <div key={b.id} className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <div>
                      <p className="font-bold">{b.name}</p>
                      <p className="text-[10px] opacity-40">User ID: {b.user_id} • {(b.commission_rate * 100).toFixed(0)}% comissão</p>
                    </div>
                    <button 
                      onClick={async () => {
                        const res = await fetch(`/api/appointments/history/${b.id}`);
                        const data = await res.json();
                        alert(`Histórico de ${b.name}:\n` + data.map((a: any) => `- ${a.haircut_name}: R$ ${a.total_price.toFixed(2)} (${new Date(a.start_time).toLocaleDateString()})`).join('\n'));
                      }}
                      className="text-[10px] text-gold hover:underline"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reports Table */}
        <section className="glass p-8 rounded-2xl">
          <h2 className="text-2xl font-serif font-bold mb-6">Relatório de Comissões</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase opacity-50">
                  <th className="pb-4">Barbeiro</th>
                  <th className="pb-4">Receita</th>
                  <th className="pb-4">Comissão (%)</th>
                  <th className="pb-4">A Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((report, i) => (
                  <tr key={i}>
                    <td className="py-4 font-medium">{report.barber_name}</td>
                    <td className="py-4 font-mono">R$ {report.total_revenue.toFixed(2)}</td>
                    <td className="py-4">{(report.commission_rate * 100).toFixed(0)}%</td>
                    <td className="py-4 text-gold font-mono font-bold">R$ {report.total_commission.toFixed(2)}</td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center opacity-40">Nenhum dado disponível.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
