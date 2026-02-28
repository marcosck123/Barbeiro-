import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scissors, 
  User as UserIcon, 
  Calendar as CalendarIcon, 
  Clock, 
  CreditCard, 
  ChevronRight, 
  Star, 
  Check, 
  ArrowLeft,
  LogOut,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Save,
  Camera,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfDay, isSameDay, parseISO, addMinutes, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Appointment, Service, Barber, User as UserType } from './types';
import { storageService } from './services/storage';

// --- Components ---

const Navbar = ({ user, onLogout, onOpenAuth, onGoToDashboard, onGoHome }: { 
  user: UserType | null, 
  onLogout: () => void, 
  onOpenAuth: () => void,
  onGoToDashboard: () => void,
  onGoHome: () => void
}) => (
  <nav className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-50">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer" onClick={onGoHome}>
        <Scissors className="w-6 h-6 text-white" />
        <span>BarberFlow</span>
      </div>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
        <a href="#services" onClick={onGoHome} className="hover:text-white transition-colors">Serviços</a>
        <a href="#barbers" onClick={onGoHome} className="hover:text-white transition-colors">Barbeiros</a>
        {user && (user.role === 'admin' || user.role === 'barber') && (
          <button onClick={onGoToDashboard} className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            {user.role === 'admin' ? 'Painel ADM' : 'Dashboard'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:inline">Olá, <span className="text-white font-bold">{user.name}</span></span>
            <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={onOpenAuth}
            className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all"
          >
            Entrar / Cadastrar
          </button>
        )}
      </div>
    </div>
  </nav>
);

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Serviço', 'Barbeiro', 'Horário', 'Pagamento'];
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              idx + 1 <= currentStep ? 'bg-white border-white text-black' : 'border-white/20 text-white/20'
            }`}>
              {idx + 1 < currentStep ? <Check className="w-5 h-5" /> : idx + 1}
            </div>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${
              idx + 1 <= currentStep ? 'text-white' : 'text-white/20'
            }`}>{step}</span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`w-12 h-[2px] mb-6 ${idx + 1 < currentStep ? 'bg-white' : 'bg-white/10'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// --- Admin Dashboard ---

const AdminDashboard = ({ user, appointments, barbers, services, settings, onAddBarber, onUpdateBarber, onAddService, onDeleteService, onDeleteAppointment, onUpdateUser, onUpdateSettings }: { 
  user: UserType,
  appointments: Appointment[], 
  barbers: Barber[], 
  services: Service[],
  settings: any,
  onAddBarber: (barber: Barber, user: UserType) => void,
  onUpdateBarber: (barber: Barber) => void,
  onAddService: (service: Service) => void,
  onDeleteService: (id: string) => void,
  onDeleteAppointment: (id: string) => void,
  onUpdateUser: (user: UserType) => void,
  onUpdateSettings: (settings: any) => void
}) => {
  const [isAddingBarber, setIsAddingBarber] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'barbers' | 'services' | 'history' | 'profile' | 'settings'>('stats');
  const [editedUser, setEditedUser] = useState(user);
  const [editedSettings, setEditedSettings] = useState(settings);
  
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    const monthlyAppointments = appointments.filter(app => 
      isWithinInterval(parseISO(app.date), { start: currentMonthStart, end: currentMonthEnd })
    );

    const totalRevenue = monthlyAppointments.reduce((acc, app) => {
      const service = services.find(s => s.id === app.serviceId);
      return acc + (service?.price || 0);
    }, 0);

    const barberStats = barbers.map(barber => {
      const barberApps = monthlyAppointments.filter(app => app.barberId === barber.id);
      const revenue = barberApps.reduce((acc, app) => {
        const service = services.find(s => s.id === app.serviceId);
        return acc + (service?.price || 0);
      }, 0);
      const commission = (revenue * barber.commissionRate) / 100;
      return {
        id: barber.id,
        name: barber.name,
        revenue,
        commission,
        apps: barberApps.length
      };
    });

    return {
      totalRevenue,
      totalApps: monthlyAppointments.length,
      barberStats
    };
  }, [appointments, barbers, services]);

  const chartData = useMemo(() => {
    // Last 6 months revenue
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthApps = appointments.filter(app => 
        isWithinInterval(parseISO(app.date), { start: monthStart, end: monthEnd })
      );
      const revenue = monthApps.reduce((acc, app) => {
        const service = services.find(s => s.id === app.serviceId);
        return acc + (service?.price || 0);
      }, 0);
      data.push({
        name: format(date, 'MMM', { locale: ptBR }),
        revenue
      });
    }
    return data;
  }, [appointments, services]);

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight">Painel Administrativo</h2>
          <p className="text-gray-500">Visão geral do faturamento e gestão da equipe.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAddingService(true)}
            className="bg-white/10 text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Serviço
          </button>
          <button 
            onClick={() => setIsAddingBarber(true)}
            className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Barbeiro
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/10 overflow-x-auto pb-px scrollbar-hide">
        {[
          { id: 'stats', name: 'Estatísticas', icon: TrendingUp },
          { id: 'barbers', name: 'Barbeiros', icon: Users },
          { id: 'services', name: 'Serviços', icon: Scissors },
          { id: 'history', name: 'Histórico', icon: CalendarIcon },
          { id: 'profile', name: 'Meu Perfil', icon: UserIcon },
          { id: 'settings', name: 'Configurações', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Faturamento Mensal</span>
              </div>
              <div className="text-4xl font-bold">R$ {stats.totalRevenue.toLocaleString()}</div>
              <div className="mt-2 text-xs text-emerald-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12% em relação ao mês anterior
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total de Atendimentos</span>
              </div>
              <div className="text-4xl font-bold">{stats.totalApps}</div>
              <p className="mt-2 text-xs text-gray-500">Mês de {format(new Date(), 'MMMM', { locale: ptBR })}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Equipe Ativa</span>
              </div>
              <div className="text-4xl font-bold">{barbers.length}</div>
              <p className="mt-2 text-xs text-gray-500">Barbeiros cadastrados</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-8">Evolução do Faturamento</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#fff" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'barbers' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-white/10">
            <h3 className="text-xl font-bold">Desempenho da Equipe</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-white/10">
                  <th className="px-8 py-4">Barbeiro</th>
                  <th className="px-8 py-4">Atendimentos</th>
                  <th className="px-8 py-4">Faturamento</th>
                  <th className="px-8 py-4">Comissão (%)</th>
                  <th className="px-8 py-4">A Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.barberStats.map((b, idx) => {
                  const barber = barbers.find(bar => bar.name === b.name);
                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6 font-bold">{b.name}</td>
                      <td className="px-8 py-6 text-gray-400">{b.apps}</td>
                      <td className="px-8 py-6 text-gray-400">R$ {b.revenue.toLocaleString()}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            defaultValue={barber?.commissionRate} 
                            onBlur={(e) => {
                              if (barber) {
                                const newRate = Number(e.target.value);
                                onUpdateBarber({ ...barber, commissionRate: newRate });
                              }
                            }}
                            className="w-16 bg-white/10 border border-white/10 rounded px-2 py-1 text-xs font-mono outline-none focus:border-white/40"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-emerald-500">R$ {b.commission.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xl font-bold">Gestão de Serviços</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-white/10">
                  <th className="px-8 py-4">Serviço</th>
                  <th className="px-8 py-4">Categoria</th>
                  <th className="px-8 py-4">Duração</th>
                  <th className="px-8 py-4 text-right">Preço</th>
                  <th className="px-8 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {services.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6 font-bold">{s.name}</td>
                    <td className="px-8 py-6 text-gray-400">{s.category}</td>
                    <td className="px-8 py-6 text-gray-400">{s.duration} min</td>
                    <td className="px-8 py-6 text-right font-bold">R$ {s.price}</td>
                    <td className="px-8 py-6 text-center">
                      <button 
                        onClick={() => onDeleteService(s.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xl font-bold">Histórico Geral de Atendimentos</h3>
            <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">{appointments.length} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-white/10">
                  <th className="px-8 py-4">Data</th>
                  <th className="px-8 py-4">Cliente</th>
                  <th className="px-8 py-4">Barbeiro</th>
                  <th className="px-8 py-4">Serviço</th>
                  <th className="px-8 py-4 text-right">Valor</th>
                  <th className="px-8 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...appointments].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(app => {
                  const service = services.find(s => s.id === app.serviceId);
                  const barber = barbers.find(b => b.id === app.barberId);
                  return (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6 text-sm text-gray-400">{format(parseISO(app.date), 'dd/MM/yy HH:mm')}</td>
                      <td className="px-8 py-6 font-bold">{app.clientName}</td>
                      <td className="px-8 py-6 text-gray-400">{barber?.name}</td>
                      <td className="px-8 py-6 text-gray-400">{app.serviceName}</td>
                      <td className="px-8 py-6 text-right font-bold">R$ {service?.price}</td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => onDeleteAppointment(app.id)}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <h3 className="text-xl font-bold mb-6">Editar Perfil</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nome</label>
              <input 
                value={editedUser.name}
                onChange={e => setEditedUser({...editedUser, name: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">E-mail</label>
              <input 
                value={editedUser.email}
                onChange={e => setEditedUser({...editedUser, email: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nova Senha</label>
              <input 
                type="password"
                value={editedUser.password || ''}
                onChange={e => setEditedUser({...editedUser, password: e.target.value})}
                placeholder="Deixe em branco para manter a atual"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" 
              />
            </div>
            <button 
              onClick={() => onUpdateUser(editedUser)}
              className="w-full bg-white text-black py-4 rounded-xl font-bold mt-4 hover:bg-gray-200"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <h3 className="text-xl font-bold mb-6">Configurações da Barbearia</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">WhatsApp para Contato</label>
              <input 
                value={editedSettings.whatsapp}
                onChange={e => setEditedSettings({...editedSettings, whatsapp: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Endereço</label>
              <input 
                value={editedSettings.address}
                onChange={e => setEditedSettings({...editedSettings, address: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Horário de Funcionamento</label>
              <input 
                value={editedSettings.openingHours}
                onChange={e => setEditedSettings({...editedSettings, openingHours: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" 
              />
            </div>
            <button 
              onClick={() => onUpdateSettings(editedSettings)}
              className="w-full bg-white text-black py-4 rounded-xl font-bold mt-4 hover:bg-gray-200"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      <AnimatePresence>
        {isAddingService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingService(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl p-10 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6">Novo Serviço</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const target = e.target as any;
                const newService: Service = {
                  id: crypto.randomUUID(),
                  name: target.name.value,
                  category: target.category.value,
                  description: target.description.value,
                  duration: Number(target.duration.value),
                  price: Number(target.price.value),
                  imageUrl: target.imageUrl.value || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop'
                };
                onAddService(newService);
                setIsAddingService(false);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nome</label>
                    <input name="name" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Categoria</label>
                    <select name="category" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40">
                      <option value="Cabelo">Cabelo</option>
                      <option value="Barba">Barba</option>
                      <option value="Combo">Combo</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Duração (min)</label>
                    <input name="duration" type="number" required defaultValue={30} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Preço (R$)</label>
                    <input name="price" type="number" required defaultValue={40} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">URL da Imagem</label>
                  <input name="imageUrl" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Descrição</label>
                  <textarea name="description" rows={3} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40 resize-none" />
                </div>
                <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-bold mt-4 hover:bg-gray-200">Salvar Serviço</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* General Appointment History */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold">Histórico Geral de Atendimentos</h3>
          <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">{appointments.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-white/10">
                <th className="px-8 py-4">Data</th>
                <th className="px-8 py-4">Cliente</th>
                <th className="px-8 py-4">Barbeiro</th>
                <th className="px-8 py-4">Serviço</th>
                <th className="px-8 py-4 text-right">Valor</th>
                <th className="px-8 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...appointments].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(app => {
                const service = services.find(s => s.id === app.serviceId);
                const barber = barbers.find(b => b.id === app.barberId);
                return (
                  <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6 text-sm text-gray-400">{format(parseISO(app.date), 'dd/MM/yy HH:mm')}</td>
                    <td className="px-8 py-6 font-bold">{app.clientName}</td>
                    <td className="px-8 py-6 text-gray-400">{barber?.name}</td>
                    <td className="px-8 py-6 text-gray-400">{app.serviceName}</td>
                    <td className="px-8 py-6 text-right font-bold">R$ {service?.price}</td>
                    <td className="px-8 py-6 text-center">
                      <button 
                        onClick={() => onDeleteAppointment(app.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Barber Dashboard ---

const BarberDashboard = ({ user, barber, appointments, services, onUpdateProfile, onUpdateUser }: { 
  user: UserType,
  barber: Barber, 
  appointments: Appointment[], 
  services: Service[],
  onUpdateProfile: (updatedBarber: Barber) => void,
  onUpdateUser: (user: UserType) => void
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'profile'>('stats');
  const [editedBarber, setEditedBarber] = useState(barber);
  const [editedUser, setEditedUser] = useState(user);

  const myAppointments = useMemo(() => {
    return appointments.filter(app => app.barberId === barber.id)
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [appointments, barber.id]);

  const myStats = useMemo(() => {
    const revenue = myAppointments.reduce((acc, app) => {
      const service = services.find(s => s.id === app.serviceId);
      return acc + (service?.price || 0);
    }, 0);
    const commission = (revenue * barber.commissionRate) / 100;
    return { revenue, commission, count: myAppointments.length };
  }, [myAppointments, services, barber.commissionRate]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <img src={barber.avatarUrl} className="w-24 h-24 rounded-full object-cover border-4 border-white/10" alt={barber.name} />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight">{barber.name}</h2>
            <p className="text-gray-500 font-medium">{barber.role}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/10 overflow-x-auto pb-px scrollbar-hide">
        {[
          { id: 'stats', name: 'Visão Geral', icon: TrendingUp },
          { id: 'history', name: 'Meus Atendimentos', icon: CalendarIcon },
          { id: 'profile', name: 'Meu Perfil', icon: UserIcon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Minha Comissão</span>
            <div className="text-4xl font-bold text-emerald-500">R$ {myStats.commission.toLocaleString()}</div>
            <p className="mt-2 text-xs text-gray-500">Baseado em R$ {myStats.revenue.toLocaleString()} de faturamento</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Atendimentos</span>
            <div className="text-4xl font-bold">{myStats.count}</div>
            <p className="mt-2 text-xs text-gray-500">Total histórico</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Avaliação</span>
            <div className="text-4xl font-bold flex items-center gap-2">
              {barber.rating}
              <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
            </div>
            <p className="mt-2 text-xs text-gray-500">Média dos clientes</p>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-white/10">
            <h3 className="text-xl font-bold">Histórico de Atendimentos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-white/10">
                  <th className="px-8 py-4">Data</th>
                  <th className="px-8 py-4">Cliente</th>
                  <th className="px-8 py-4">Serviço</th>
                  <th className="px-8 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {myAppointments.map(app => {
                  const service = services.find(s => s.id === app.serviceId);
                  return (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6 text-sm text-gray-400">{format(parseISO(app.date), 'dd/MM/yy HH:mm')}</td>
                      <td className="px-8 py-6 font-bold">{app.clientName}</td>
                      <td className="px-8 py-6 text-gray-400">{app.serviceName}</td>
                      <td className="px-8 py-6 text-right font-bold">R$ {service?.price}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold mb-6">Perfil Profissional</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Biografia</label>
                <textarea 
                  value={editedBarber.bio}
                  onChange={e => setEditedBarber({...editedBarber, bio: e.target.value})}
                  rows={6}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Avatar URL</label>
                <input 
                  value={editedBarber.avatarUrl}
                  onChange={e => setEditedBarber({...editedBarber, avatarUrl: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40"
                />
              </div>
              <button 
                onClick={() => onUpdateProfile(editedBarber)}
                className="w-full bg-white text-black py-4 rounded-xl font-bold mt-4 hover:bg-gray-200"
              >
                Salvar Perfil Profissional
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold mb-6">Dados de Acesso</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nome</label>
                <input 
                  value={editedUser.name}
                  onChange={e => setEditedUser({...editedUser, name: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">E-mail</label>
                <input 
                  value={editedUser.email}
                  onChange={e => setEditedUser({...editedUser, email: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nova Senha</label>
                <input 
                  type="password"
                  value={editedUser.password || ''}
                  onChange={e => setEditedUser({...editedUser, password: e.target.value})}
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" 
                />
              </div>
              <button 
                onClick={() => onUpdateUser(editedUser)}
                className="w-full bg-white text-black py-4 rounded-xl font-bold mt-4 hover:bg-gray-200"
              >
                Salvar Dados de Acesso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'landing' | 'booking' | 'dashboard'>('landing');
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<UserType | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Booking State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<Appointment['paymentMethod'] | ''>('');

  const [services, setServices] = useState<Service[]>(storageService.getServices());
  const [barbers, setBarbers] = useState<Barber[]>(storageService.getBarbers());
  const [appointments, setAppointments] = useState<Appointment[]>(storageService.getAppointments());
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [settings, setSettings] = useState(storageService.getSettings());

  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category));
    return ['Todos', ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'Todos') return services;
    return services.filter(s => s.category === selectedCategory);
  }, [services, selectedCategory]);

  useEffect(() => {
    setUser(storageService.getCurrentUser());
  }, []);

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setUser(null);
    setView('landing');
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as any;
    const email = target.email.value;
    const password = target.password.value;
    const name = authMode === 'register' ? target.name.value : '';

    if (authMode === 'register') {
      const newUser: UserType = { id: crypto.randomUUID(), name, email, password, role: 'client' };
      storageService.registerUser(newUser);
      storageService.setCurrentUser(newUser);
      setUser(newUser);
    } else {
      const users = storageService.getUsers();
      const found = users.find(u => u.email === email && u.password === password);
      if (found) {
        storageService.setCurrentUser(found);
        setUser(found);
      } else {
        alert('Credenciais inválidas.');
        return;
      }
    }
    setIsAuthModalOpen(false);
  };

  const handleFinalizeBooking = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      clientName: user.name,
      clientId: user.id,
      barberId: selectedBarber!.id,
      serviceId: selectedService!.id,
      serviceName: selectedService!.name,
      date: appointmentDate.toISOString(),
      duration: selectedService!.duration,
      status: 'confirmed',
      paymentMethod: paymentMethod as Appointment['paymentMethod']
    };

    storageService.saveAppointment(newAppointment);
    setAppointments(storageService.getAppointments());
    alert('Agendamento realizado com sucesso!');
    setView('landing');
    setStep(1);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedTime('');
  };

  const currentBarberProfile = useMemo(() => {
    if (user?.role === 'barber' && user.barberId) {
      return barbers.find(b => b.id === user.barberId);
    }
    return null;
  }, [user, barbers]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans scroll-smooth">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onOpenAuth={() => setIsAuthModalOpen(true)} 
        onGoToDashboard={() => setView('dashboard')}
        onGoHome={() => setView('landing')}
      />

      {view === 'landing' ? (
        <>
          {/* Hero Section */}
          <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2000" 
                className="w-full h-full object-cover opacity-40 grayscale"
                alt="Barbershop"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>
            
            <div className="relative z-10 text-center max-w-4xl px-6">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-7xl md:text-9xl font-bold tracking-tighter mb-8"
              >
                ESTILO É <br /> <span className="text-gray-500">IDENTIDADE.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
              >
                A BarberFlow une a tradição da barbearia clássica com a conveniência moderna. Agende seu horário em segundos.
              </motion.p>
              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setView('booking')}
                className="bg-white text-black px-12 py-5 rounded-full text-lg font-bold hover:scale-105 transition-all shadow-2xl shadow-white/10"
              >
                Agendar Agora
              </motion.button>
            </div>
          </section>

          {/* Services Grid */}
          <section id="services" className="py-32 max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4 block">Nossos Serviços</span>
                <h2 className="text-5xl font-bold tracking-tight">Cortes & Cuidados</h2>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredServices.map((s, idx) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => { setSelectedService(s); setView('booking'); setStep(2); }}
                >
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-6">
                    <img src={s.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={s.name} />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    <div className="absolute bottom-6 left-6">
                      <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">R$ {s.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">{s.name}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">{s.category}</span>
                  </div>
                  <p className="text-gray-500 text-sm">{s.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Barbers Section */}
          <section id="barbers" className="py-32 bg-white/[0.02] border-y border-white/5">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4 block">A Equipe</span>
                <h2 className="text-5xl font-bold tracking-tight">Mestres da Tesoura</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {barbers.map((b, idx) => (
                  <motion.div 
                    key={b.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-48 h-48 rounded-full overflow-hidden mb-8 border-4 border-white/10 p-2">
                      <img src={b.avatarUrl} className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-all duration-500" alt={b.name} />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{b.name}</h3>
                    <p className="text-gray-500 font-medium mb-4">{b.role}</p>
                    <div className="flex items-center gap-1 text-yellow-500 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(b.rating) ? 'fill-current' : ''}`} />
                      ))}
                      <span className="text-white text-sm font-bold ml-2">{b.rating}</span>
                    </div>
                    <p className="text-gray-400 text-sm max-w-xs">{b.bio}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : view === 'booking' ? (
        /* Booking Flow */
        <main className="max-w-4xl mx-auto px-6 py-20">
          <button 
            onClick={() => step === 1 ? setView('landing') : setStep(step - 1)}
            className="flex items-center gap-2 text-gray-500 hover:text-white mb-12 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <StepIndicator currentStep={step} />

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-4xl font-bold mb-8 tracking-tight">Escolha o Serviço</h2>
                <div className="grid grid-cols-1 gap-4">
                  {services.map(s => (
                    <button key={s.id} onClick={() => { setSelectedService(s); setStep(2); }} className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${selectedService?.id === s.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                      <div className="flex items-center gap-6">
                        <img src={s.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt={s.name} />
                        <div className="text-left">
                          <h3 className="font-bold text-lg">{s.name}</h3>
                          <p className={`text-sm ${selectedService?.id === s.id ? 'text-black/60' : 'text-gray-500'}`}>{s.duration} min</p>
                        </div>
                      </div>
                      <span className="font-bold">R$ {s.price}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-4xl font-bold mb-8 tracking-tight">Escolha o Barbeiro</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {barbers.map(b => (
                    <button key={b.id} onClick={() => { setSelectedBarber(b); setStep(3); }} className={`p-8 rounded-2xl border transition-all flex flex-col items-center text-center ${selectedBarber?.id === b.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                      <img src={b.avatarUrl} className="w-24 h-24 rounded-full mb-4 object-cover" alt={b.name} />
                      <h3 className="font-bold text-lg">{b.name}</h3>
                      <p className={`text-xs uppercase tracking-widest font-bold mb-2 ${selectedBarber?.id === b.id ? 'text-black/60' : 'text-gray-500'}`}>{b.role}</p>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span className={`text-xs font-bold ${selectedBarber?.id === b.id ? 'text-black' : 'text-white'}`}>{b.rating}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-4xl font-bold mb-8 tracking-tight">Data & Horário</h2>
                <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = addDays(new Date(), i);
                    const isSelected = isSameDay(selectedDate, date);
                    return (
                      <button key={i} onClick={() => setSelectedDate(date)} className={`flex-shrink-0 w-24 py-6 rounded-2xl border flex flex-col items-center transition-all ${isSelected ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                        <span className="text-[10px] uppercase font-bold tracking-widest mb-1">{format(date, 'EEE', { locale: ptBR })}</span>
                        <span className="text-2xl font-bold">{format(date, 'dd')}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(time => (
                    <button key={time} onClick={() => { setSelectedTime(time); setStep(4); }} className={`py-4 rounded-xl border text-sm font-bold transition-all ${selectedTime === time ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                      {time}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-4xl font-bold mb-8 tracking-tight">Pagamento</h2>
                <div className="grid grid-cols-1 gap-4 mb-12">
                  {[{ id: 'pix', name: 'PIX' }, { id: 'credit_card', name: 'Cartão de Crédito' }, { id: 'debit_card', name: 'Cartão de Débito' }, { id: 'cash', name: 'Dinheiro' }].map(method => (
                    <button key={method.id} onClick={() => setPaymentMethod(method.id as any)} className={`flex items-center gap-4 p-6 rounded-2xl border transition-all ${paymentMethod === method.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                      <CreditCard className="w-6 h-6" />
                      <span className="font-bold">{method.name}</span>
                    </button>
                  ))}
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Resumo</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between"><span className="text-gray-400">Serviço</span><span className="font-bold">{selectedService?.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Barbeiro</span><span className="font-bold">{selectedBarber?.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Data & Hora</span><span className="font-bold">{format(selectedDate, 'dd/MM')} às {selectedTime}</span></div>
                    <div className="h-[1px] bg-white/10" />
                    <div className="flex justify-between text-xl"><span className="font-bold">Total</span><span className="font-bold text-white">R$ {selectedService?.price}</span></div>
                  </div>
                  <button disabled={!paymentMethod} onClick={handleFinalizeBooking} className="w-full bg-white text-black py-5 rounded-2xl text-lg font-bold hover:bg-gray-200 disabled:opacity-50">Finalizar Agendamento</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      ) : (
        /* Dashboard Flow */
        <main className="max-w-7xl mx-auto px-6 py-20">
          {user?.role === 'admin' ? (
            <AdminDashboard 
              user={user}
              appointments={appointments} 
              barbers={barbers} 
              services={services}
              settings={settings}
              onAddBarber={(b, u) => {
                storageService.saveBarber(b);
                storageService.registerUser(u);
                setBarbers(storageService.getBarbers());
              }}
              onUpdateBarber={(b) => {
                storageService.saveBarber(b);
                setBarbers(storageService.getBarbers());
              }}
              onAddService={(s) => {
                storageService.saveService(s);
                setServices(storageService.getServices());
              }}
              onDeleteService={(id) => {
                storageService.deleteService(id);
                setServices(storageService.getServices());
              }}
              onDeleteAppointment={(id) => {
                storageService.deleteAppointment(id);
                setAppointments(storageService.getAppointments());
              }}
              onUpdateUser={(u) => {
                storageService.saveUser(u);
                storageService.setCurrentUser(u);
                setUser(u);
                alert('Perfil atualizado com sucesso!');
              }}
              onUpdateSettings={(s) => {
                storageService.saveSettings(s);
                setSettings(s);
                alert('Configurações salvas!');
              }}
            />
          ) : user?.role === 'barber' && currentBarberProfile ? (
            <BarberDashboard 
              user={user}
              barber={currentBarberProfile} 
              appointments={appointments} 
              services={services}
              onUpdateProfile={(b) => {
                storageService.saveBarber(b);
                setBarbers(storageService.getBarbers());
                alert('Perfil profissional atualizado!');
              }}
              onUpdateUser={(u) => {
                storageService.saveUser(u);
                storageService.setCurrentUser(u);
                setUser(u);
                alert('Dados de acesso atualizados!');
              }}
            />
          ) : (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold">Acesso restrito.</h2>
              <button onClick={() => setView('landing')} className="mt-4 text-gray-500 hover:text-white">Voltar ao início</button>
            </div>
          )}
        </main>
      )}

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAuthModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl p-10 shadow-2xl">
              <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
              <h2 className="text-3xl font-bold tracking-tight mb-2">{authMode === 'login' ? 'Bem-vindo' : 'Crie sua conta'}</h2>
              <p className="text-gray-500 mb-8">{authMode === 'login' ? 'Entre para gerenciar seus agendamentos.' : 'Cadastre-se para agendar seu horário.'}</p>
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nome Completo</label>
                    <input name="name" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">E-mail</label>
                  <input name="email" required type="email" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Senha</label>
                  <input name="password" required type="password" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                </div>
                <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-bold mt-4 hover:bg-gray-200">{authMode === 'login' ? 'Entrar' : 'Cadastrar'}</button>
              </form>
              <div className="mt-8 text-center text-sm">
                <span className="text-gray-500">{authMode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}</span>
                <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="ml-2 text-white font-bold hover:underline">{authMode === 'login' ? 'Cadastre-se' : 'Faça login'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/10 py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter mb-6"><Scissors className="w-6 h-6" /><span>BarberFlow</span></div>
            <p className="text-gray-500 max-w-sm">Mais que um corte, uma experiência de autocuidado e estilo. Agende seu horário e transforme seu visual.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Links</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white">Início</a></li>
              <li><a href="#services" className="hover:text-white">Serviços</a></li>
              <li><a href="#barbers" className="hover:text-white">Barbeiros</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Contato</h4>
            <ul className="space-y-4 text-sm text-gray-500"><li>Rua da Barbearia, 123</li><li>(11) 99999-9999</li><li>contato@barberflow.com</li></ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 text-center text-[10px] text-gray-600 uppercase tracking-widest">© 2026 BarberFlow. Todos os direitos reservados.</div>
      </footer>

      {/* WhatsApp Button */}
      <a 
        href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all group"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span className="absolute right-full mr-4 bg-white text-black px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
          Fale conosco
        </span>
      </a>
    </div>
  );
}
