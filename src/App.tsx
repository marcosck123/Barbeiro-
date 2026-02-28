import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, startOfDay, isSameDay, parseISO, addMinutes, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  Scissors, 
  Calendar as CalendarIcon,
  Trash2,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Appointment, Service } from './types';
import { storageService } from './services/storage';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 to 21:00

export default function App() {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services] = useState<Service[]>(storageService.getServices());
  
  // Form state
  const [formData, setFormData] = useState({
    clientName: '',
    serviceId: services[0]?.id || '',
    time: '09:00',
    notes: ''
  });

  useEffect(() => {
    setAppointments(storageService.getAppointments());
  }, []);

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(startOfDay(new Date()));

  const filteredAppointments = appointments.filter(app => 
    isSameDay(parseISO(app.date), selectedDate)
  );

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const service = services.find(s => s.id === formData.serviceId);
    if (!service) return;

    const [hours, minutes] = formData.time.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      clientName: formData.clientName,
      service: service.name,
      date: appointmentDate.toISOString(),
      duration: service.duration,
      status: 'confirmed',
      notes: formData.notes
    };

    storageService.saveAppointment(newAppointment);
    setAppointments(storageService.getAppointments());
    setIsModalOpen(false);
    setFormData({ clientName: '', serviceId: services[0]?.id || '', time: '09:00', notes: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este agendamento?')) {
      storageService.deleteAppointment(id);
      setAppointments(storageService.getAppointments());
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <Scissors className="w-5 h-5" />
            <span>BarberFlow <span className="text-gray-500 font-medium">Agenda</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-black px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Calendar Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-gray-500">Gerencie seus horários e clientes para hoje.</p>
              {filteredAppointments.length > 0 && (
                <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {filteredAppointments.length} {filteredAppointments.length === 1 ? 'Agendamento' : 'Agendamentos'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
            <button onClick={handlePrevDay} className="p-2 hover:bg-white/5 rounded-md transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleToday}
              className="px-4 py-1 text-sm font-medium hover:bg-white/5 rounded-md transition-colors"
            >
              Hoje
            </button>
            <button onClick={handleNextDay} className="p-2 hover:bg-white/5 rounded-md transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timeline View */}
        <div className="relative border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
          <div className="grid grid-cols-[80px_1fr]">
            {/* Time Column */}
            <div className="border-r border-white/10 py-4">
              {HOURS.map(hour => (
                <div key={hour} className="h-24 px-4 text-right">
                  <span className="text-xs font-mono text-gray-500">{hour.toString().padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {/* Slots Column */}
            <div className="relative py-4">
              {/* Grid Lines */}
              {HOURS.map(hour => (
                <div key={hour} className="h-24 border-b border-white/[0.05] last:border-0" />
              ))}

              {/* Appointments Layer */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Current Time Indicator */}
                {isSameDay(selectedDate, new Date()) && (
                  <div 
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20 flex items-center"
                    style={{ 
                      top: ((new Date().getHours() - 8) * 96) + (new Date().getMinutes() * 96 / 60) + 16 
                    }}
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
                  </div>
                )}

                {filteredAppointments.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <div className="text-center">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-sm">Nenhum agendamento para este dia.</p>
                    </div>
                  </div>
                )}

                {filteredAppointments.map(app => {
                  const date = parseISO(app.date);
                  const startHour = date.getHours();
                  const startMinutes = date.getMinutes();
                  
                  // Calculate position
                  // 8:00 is the start (0px)
                  // Each hour is 96px (24 * 4)
                  const top = ((startHour - 8) * 96) + (startMinutes * 96 / 60) + 16;
                  const height = (app.duration * 96 / 60);

                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ top, height }}
                      className="absolute left-4 right-4 bg-white text-black rounded-lg p-3 shadow-xl pointer-events-auto border border-black/5 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm leading-tight truncate">{app.clientName}</h3>
                          <button 
                            onClick={() => handleDelete(app.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>
                        <p className="text-[10px] font-medium uppercase tracking-wider opacity-60 mt-0.5">{app.service}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] font-mono opacity-50">
                        <Clock className="w-3 h-3" />
                        {format(date, 'HH:mm')} - {format(addMinutes(date, app.duration), 'HH:mm')}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold tracking-tight mb-6">Novo Agendamento</h2>
              
              <form onSubmit={handleAddAppointment} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">Cliente</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Nome do cliente"
                    value={formData.clientName}
                    onChange={e => setFormData({...formData, clientName: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-white/40 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">Serviço</label>
                    <select 
                      value={formData.serviceId}
                      onChange={e => setFormData({...formData, serviceId: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-white/40 outline-none transition-all appearance-none"
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">Horário</label>
                    <input 
                      required
                      type="time" 
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-white/40 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">Notas (Opcional)</label>
                  <textarea 
                    rows={3}
                    placeholder="Alguma observação..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-white/40 outline-none transition-all resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white/5 text-white border border-white/10 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-white text-black py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
