import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Image as ImageIcon, Trash2, TrendingUp, Users, Scissors, Wand2 } from 'lucide-react';
import { Haircut, User, Barber } from '../types';
import { editHaircutImage } from '../services/gemini';
import { storageService } from '../services/storage';

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
    const [haircuts, reports, barbers] = await Promise.all([
      storageService.getHaircuts(),
      storageService.getAdminReports(),
      storageService.getBarbers()
    ]);
    setHaircuts(haircuts);
    setReports(reports);
    setBarbers(barbers);
  };

  const handleAddHaircut = async (e: React.FormEvent) => {
    e.preventDefault();
    await storageService.addHaircut(newHaircut);
    setNewHaircut({ name: '', description: '', price: 0, estimated_time: 30, image: '' });
    fetchData();
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Haircut Form */}
        <section className="vercel-card p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Adicionar Novo Corte
          </h2>
          <form onSubmit={handleAddHaircut} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Nome do Corte</label>
                <input 
                  type="text" 
                  value={newHaircut.name}
                  onChange={e => setNewHaircut(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full input-vercel"
                  placeholder="Ex: Degradê Moderno"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Preço (R$)</label>
                <input 
                  type="number" 
                  value={newHaircut.price}
                  onChange={e => setNewHaircut(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full input-vercel"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Tempo (min)</label>
                <input 
                  type="number" 
                  value={newHaircut.estimated_time}
                  onChange={e => setNewHaircut(prev => ({ ...prev, estimated_time: parseInt(e.target.value) }))}
                  className="w-full input-vercel"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Descrição</label>
                <textarea 
                  value={newHaircut.description}
                  onChange={e => setNewHaircut(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full input-vercel h-24 resize-none"
                  placeholder="Descreva os detalhes do serviço..."
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Imagem</label>
                <div className="flex gap-6 items-start">
                  <div className="w-32 h-32 vercel-card overflow-hidden flex items-center justify-center relative group">
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold">Upload</div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">IA Image Editor</p>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Ex: Adicione um filtro vintage..."
                        value={imagePrompt}
                        onChange={e => setImagePrompt(e.target.value)}
                        className="flex-1 input-vercel py-1"
                      />
                      <button 
                        type="button"
                        onClick={handleAiEditImage}
                        disabled={isEditingImage || !newHaircut.image}
                        className="bg-white text-black p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <Wand2 className={`w-4 h-4 ${isEditingImage ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="w-full btn-vercel-primary">Salvar no Catálogo</button>
          </form>
        </section>

        {/* Barber Management */}
        <section className="vercel-card p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5" /> Gerenciar Barbeiros
          </h2>
          <div className="space-y-8">
            <div className="bg-white/5 p-6 rounded-lg border border-white/5">
              <h4 className="text-xs font-bold mb-4 uppercase tracking-widest text-gray-400">Novo Barbeiro</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                await storageService.addBarber({
                  user_id: parseInt(formData.get('user_id') as string),
                  name: formData.get('name') as string,
                  bio: formData.get('bio') as string,
                  commission_rate: parseFloat(formData.get('commission_rate') as string) / 100
                });
                form.reset();
                fetchData();
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input name="user_id" type="number" placeholder="ID do Usuário" className="input-vercel" required />
                  <input name="name" type="text" placeholder="Nome Artístico" className="input-vercel" required />
                </div>
                <input name="bio" type="text" placeholder="Breve História/Bio" className="w-full input-vercel" required />
                <div className="flex gap-4">
                  <input name="commission_rate" type="number" placeholder="Comissão %" className="flex-1 input-vercel" required />
                  <button type="submit" className="btn-vercel-primary">Adicionar</button>
                </div>
              </form>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] text-gray-500 uppercase tracking-widest">Equipe Atual</h4>
              {barbers.map(b => (
                <div key={b.id} className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/20 transition-all">
                  <div>
                    <p className="font-bold text-sm">{b.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">User ID: {b.user_id} • {(b.commission_rate * 100).toFixed(0)}% comissão</p>
                  </div>
                  <button 
                    onClick={async () => {
                      const data = await storageService.getBarberHistory(b.id);
                      alert(`Histórico de ${b.name}:\n` + data.map((a: any) => `- ${a.haircut_name}: R$ ${a.total_price.toFixed(2)} (${new Date(a.start_time).toLocaleDateString()})`).join('\n'));
                    }}
                    className="text-[10px] text-gray-400 hover:text-white transition-colors"
                  >
                    Ver Detalhes
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reports Table */}
        <section className="vercel-card p-8 lg:col-span-2">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Relatório de Comissões
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase text-gray-500 tracking-widest">
                  <th className="pb-4">Barbeiro</th>
                  <th className="pb-4">Receita</th>
                  <th className="pb-4">Comissão (%)</th>
                  <th className="pb-4">A Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((report, i) => (
                  <tr key={i} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium text-sm">{report.barber_name}</td>
                    <td className="py-4 font-mono text-sm">R$ {report.total_revenue.toFixed(2)}</td>
                    <td className="py-4 text-sm">{(report.commission_rate * 100).toFixed(0)}%</td>
                    <td className="py-4 text-white font-mono font-bold text-sm">R$ {report.total_commission.toFixed(2)}</td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-gray-600 italic">Nenhum dado disponível no momento.</td>
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
