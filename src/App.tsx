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
            Dashboard
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

const AdminDashboard = ({ appointments, barbers, services, onAddBarber, onUpdateBarber, onDeleteAppointment }: { 
  appointments: Appointment[], 
  barbers: Barber[], 
  services: Service[],
  onAddBarber: (barber: Barber, user: UserType) => void,
  onUpdateBarber: (barber: Barber) => void,
  onDeleteAppointment: (id: string) => void
}) => {
  const [isAddingBarber, setIsAddingBarber] = useState(false);
  
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
        <button 
          onClick={() => setIsAddingBarber(true)}
          className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Barbeiro
        </button>
      </div>

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

      {/* Barber Performance Table */}
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

      {/* Add Barber Modal */}
      <AnimatePresence>
        {isAddingBarber && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingBarber(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl p-10 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6">Novo Barbeiro</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const target = e.target as any;
                const barberId = crypto.randomUUID();
                const newBarber: Barber = {
                  id: barberId,
                  name: target.name.value,
                  role: target.role.value,
                  avatarUrl: `https://i.pravatar.cc/150?u=${barberId}`,
                  bio: target.bio.value,
                  rating: 5.0,
                  commissionRate: Number(target.commission.value)
                };
                const newUser: UserType = {
                  id: crypto.randomUUID(),
                  name: target.name.value,
                  email: target.email.value,
                  password: target.password.value,
                  role: 'barber',
                  barberId: barberId
                };
                onAddBarber(newBarber, newUser);
                setIsAddingBarber(false);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nome</label>
                    <input name="name" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Cargo</label>
                    <input name="role" required placeholder="Ex: Master Barber" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">E-mail de Acesso</label>
                    <input name="email" type="email" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Senha de Acesso</label>
                    <input name="password" type="password" required defaultValue="123456" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Comissão (%)</label>
                  <input name="commission" type="number" required defaultValue={30} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Bio</label>
                  <textarea name="bio" rows={3} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40 resize-none" />
                </div>
                <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-bold mt-4 hover:bg-gray-200">Salvar Barbeiro & Criar Conta</button>
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

const BarberDashboard = ({ barber, appointments, services, onUpdateProfile }: { 
  barber: Barber, 
  appointments: Appointment[], 
  services: Service[],
  onUpdateProfile: (updatedBarber: Barber) => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBarber, setEditedBarber] = useState(barber);

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
            <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
              <Camera className="w-6 h-6" />
            </button>
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight">{barber.name}</h2>
            <p className="text-gray-500 font-medium">{barber.role}</p>
          </div>
        </div>
        <button 
          onClick={() => isEditing ? (onUpdateProfile(editedBarber), setIsEditing(false)) : setIsEditing(true)}
          className="bg-white text-black px-8 py-3 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-all"
        >
          {isEditing ? <><Save className="w-4 h-4" /> Salvar Perfil</> : <><Edit2 className="w-4 h-4" /> Editar Perfil</>}
        </button>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-2xl font-bold">Histórico de Atendimentos</h3>
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
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

        <div className="space-y-8">
          <h3 className="text-2xl font-bold">Meu Perfil</h3>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            {isEditing ? (
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
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-4">Biografia</span>
                <p className="text-gray-400 leading-relaxed italic">"{barber.bio}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
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

  const [services] = useState<Service[]>(storageService.getServices());
  const [barbers, setBarbers] = useState<Barber[]>(storageService.getBarbers());
  const [appointments, setAppointments] = useState<Appointment[]>(storageService.getAppointments());

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
            <div className="flex items-end justify-between mb-16">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4 block">Nossos Serviços</span>
                <h2 className="text-5xl font-bold tracking-tight">Cortes & Cuidados</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((s, idx) => (
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
                  <h3 className="text-xl font-bold mb-2">{s.name}</h3>
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
              appointments={appointments} 
              barbers={barbers} 
              services={services}
              onAddBarber={(b, u) => {
                storageService.saveBarber(b);
                storageService.registerUser(u);
                setBarbers(storageService.getBarbers());
              }}
              onUpdateBarber={(b) => {
                storageService.saveBarber(b);
                setBarbers(storageService.getBarbers());
              }}
              onDeleteAppointment={(id) => {
                storageService.deleteAppointment(id);
                setAppointments(storageService.getAppointments());
              }}
            />
          ) : user?.role === 'barber' && currentBarberProfile ? (
            <BarberDashboard 
              barber={currentBarberProfile} 
              appointments={appointments} 
              services={services}
              onUpdateProfile={(b) => {
                storageService.saveBarber(b);
                setBarbers(storageService.getBarbers());
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
    </div>
  );
}
