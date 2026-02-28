import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Haircut, Barber, Availability } from '../types';
import { Scissors, User, Calendar, CreditCard, Banknote, QrCode, CheckCircle2, ChevronRight } from 'lucide-react';
import { storageService } from '../services/storage';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [haircuts, setHaircuts] = useState<Haircut[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [slots, setSlots] = useState<Availability[]>([]);
  
  const [selectedCut, setSelectedCut] = useState<Haircut | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    storageService.getHaircuts().then(data => {
      setHaircuts(data);
      const cutId = searchParams.get('cut');
      if (cutId) {
        const cut = data.find((h: any) => h.id === parseInt(cutId));
        if (cut) {
          setSelectedCut(cut);
          setStep(2);
        }
      }
    });
    storageService.getBarbers().then(setBarbers);
  }, [searchParams]);

  useEffect(() => {
    if (selectedBarber) {
      storageService.getAvailability(selectedBarber.id).then(setSlots);
    }
  }, [selectedBarber]);

  const handleBooking = async () => {
    if (!user || !selectedCut || !selectedBarber || !selectedSlot || !paymentMethod) return;
    
    setIsProcessing(true);
    const change = paymentMethod === 'dinheiro' ? parseFloat(cashAmount) - selectedCut.price : 0;

    try {
      await storageService.createAppointment({
        customer_id: user.id,
        barber_id: selectedBarber.id,
        haircut_id: selectedCut.id,
        start_time: selectedSlot.start_time,
        payment_method: paymentMethod,
        total_price: selectedCut.price,
        change_amount: change > 0 ? change : 0,
        slot_id: selectedSlot.id
      });
      setIsSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  if (!user) {
    return (
      <div className="pt-32 text-center">
        <p className="mb-4 opacity-60">Você precisa estar logado para agendar.</p>
        <button onClick={() => navigate('/login')} className="btn-primary">Fazer Login</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-black">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Agende seu Estilo</h1>
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`w-8 h-1 rounded-full transition-colors ${step >= i ? 'bg-white' : 'bg-white/10'}`} 
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 vercel-card"
            >
              <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-2">Agendamento Confirmado!</h2>
              <p className="text-gray-500">Enviamos um email de confirmação para você e para o barbeiro.</p>
              {paymentMethod === 'dinheiro' && parseFloat(cashAmount) > selectedCut!.price && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl inline-block border border-white/10">
                  <p className="text-emerald-400 font-bold">Troco: R$ {(parseFloat(cashAmount) - selectedCut!.price).toFixed(2)}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="space-y-8">
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Scissors className="w-6 h-6" /> Escolha o Corte
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {haircuts.map(cut => (
                      <button 
                        key={cut.id}
                        onClick={() => { setSelectedCut(cut); setStep(2); }}
                        className="vercel-card p-4 flex items-center gap-4 hover:bg-white/5 transition-all text-left group"
                      >
                        <img src={cut.image} className="w-16 h-16 rounded-lg object-cover border border-white/10" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">{cut.name}</h4>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">R$ {cut.price.toFixed(2)} • {cut.estimated_time}min</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <User className="w-6 h-6" /> Escolha o Barbeiro
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {barbers.map(barber => (
                      <button 
                        key={barber.id}
                        onClick={() => { setSelectedBarber(barber); setStep(3); }}
                        className="vercel-card p-6 hover:bg-white/5 transition-all text-left group"
                      >
                        <h4 className="text-lg font-bold mb-2 group-hover:text-white transition-colors">{barber.name}</h4>
                        <p className="text-xs text-gray-500 italic mb-4">"{barber.bio}"</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                          Ver disponibilidade <ChevronRight className="w-3 h-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setStep(1)} className="mt-8 text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-bold">← Voltar</button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Calendar className="w-6 h-6" /> Escolha o Horário
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {slots.map(slot => (
                      <button 
                        key={slot.id}
                        onClick={() => { setSelectedSlot(slot); setStep(4); }}
                        className="vercel-card p-4 hover:bg-white text-black transition-all text-center group"
                      >
                        <p className="text-[10px] text-gray-500 group-hover:text-gray-400 uppercase mb-1">
                          {new Date(slot.start_time).toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </p>
                        <p className="font-mono font-bold">
                          {new Date(slot.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </button>
                    ))}
                    {slots.length === 0 && (
                      <div className="col-span-full py-12 vercel-card text-center text-gray-600 italic">
                        Nenhum horário disponível para este barbeiro.
                      </div>
                    )}
                  </div>
                  <button onClick={() => setStep(2)} className="mt-8 text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-bold">← Voltar</button>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h2 className="text-2xl font-bold mb-6">Resumo e Pagamento</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="vercel-card p-6 space-y-4">
                      <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
                        <span className="text-gray-500">Corte:</span>
                        <span className="font-bold">{selectedCut?.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
                        <span className="text-gray-500">Barbeiro:</span>
                        <span className="font-bold">{selectedBarber?.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
                        <span className="text-gray-500">Data:</span>
                        <span className="font-bold">{new Date(selectedSlot!.start_time).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between pt-4 text-xl font-bold">
                        <span>Total:</span>
                        <span className="font-mono">R$ {selectedCut?.price.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Método de Pagamento</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={() => setPaymentMethod('cartao')}
                          className={`flex items-center gap-3 p-4 rounded-md border transition-all ${paymentMethod === 'cartao' ? 'border-white bg-white/5' : 'border-white/10 hover:bg-white/5'}`}
                        >
                          <CreditCard className="w-4 h-4" /> <span className="text-sm">Cartão</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('pix')}
                          className={`flex items-center gap-3 p-4 rounded-md border transition-all ${paymentMethod === 'pix' ? 'border-white bg-white/5' : 'border-white/10 hover:bg-white/5'}`}
                        >
                          <QrCode className="w-4 h-4" /> <span className="text-sm">PIX</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('dinheiro')}
                          className={`flex items-center gap-3 p-4 rounded-md border transition-all ${paymentMethod === 'dinheiro' ? 'border-white bg-white/5' : 'border-white/10 hover:bg-white/5'}`}
                        >
                          <Banknote className="w-4 h-4" /> <span className="text-sm">Dinheiro</span>
                        </button>
                      </div>

                      {paymentMethod === 'dinheiro' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                          <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold">Valor para troco</label>
                          <input 
                            type="number" 
                            placeholder="Quanto você vai entregar?"
                            value={cashAmount}
                            onChange={e => setCashAmount(e.target.value)}
                            className="w-full input-vercel"
                          />
                          {parseFloat(cashAmount) > selectedCut!.price && (
                            <p className="text-xs text-emerald-400 font-bold">Troco: R$ {(parseFloat(cashAmount) - selectedCut!.price).toFixed(2)}</p>
                          )}
                        </motion.div>
                      )}

                      <button 
                        onClick={handleBooking}
                        disabled={!paymentMethod || isProcessing}
                        className="w-full btn-vercel-primary py-4 disabled:opacity-50"
                      >
                        {isProcessing ? 'Processando...' : 'Finalizar Agendamento'}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setStep(3)} className="mt-8 text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-bold">← Voltar</button>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
