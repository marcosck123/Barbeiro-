import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Haircut } from '../types';
import { Scissors, Clock, DollarSign, ChevronRight, Star, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storageService } from '../services/storage';

export default function Home() {
  const [haircuts, setHaircuts] = useState<Haircut[]>([]);

  useEffect(() => {
    storageService.getHaircuts().then(setHaircuts);
  }, []);

  return (
    <div className="bg-black min-h-screen">
      {/* Vercel Style Hero */}
      <section className="pt-40 pb-20 px-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            O padrão de excelência <br /> para o seu estilo.
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Agende seu corte em segundos com os melhores profissionais. <br />
            Simples, rápido e com a qualidade que você merece.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/booking" className="btn-vercel-primary px-8 py-3 text-base">
              Agendar Agora
            </Link>
            <a href="#catalogo" className="btn-vercel-secondary px-8 py-3 text-base">
              Ver Catálogo
            </a>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="vercel-card p-8 md:col-span-2 flex flex-col justify-between h-64">
          <div>
            <Star className="w-6 h-6 text-white mb-4" />
            <h3 className="text-xl font-bold mb-2">Qualidade Inquestionável</h3>
            <p className="text-gray-400 text-sm max-w-md">Utilizamos apenas os melhores produtos do mercado para garantir um acabamento impecável e duradouro.</p>
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-widest">Premium Standard</div>
        </div>
        <div className="vercel-card p-8 flex flex-col justify-between h-64">
          <div>
            <Zap className="w-6 h-6 text-white mb-4" />
            <h3 className="text-xl font-bold mb-2">Agilidade</h3>
            <p className="text-gray-400 text-sm">Sistema de agendamento em tempo real. Sem filas, sem espera.</p>
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-widest">Real-time Sync</div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalogo" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Catálogo de Serviços</h2>
          <p className="text-gray-400">Escolha o serviço ideal para o seu momento.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {haircuts.map((cut, index) => (
            <motion.div
              key={cut.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="vercel-card overflow-hidden group"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img 
                  src={cut.image} 
                  alt={cut.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{cut.name}</h3>
                  <span className="text-sm font-mono text-gray-400">R${cut.price.toFixed(0)}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{cut.description}</p>
                <Link 
                  to={`/booking?cut=${cut.id}`}
                  className="w-full btn-vercel-secondary py-2 flex items-center justify-center gap-2 text-xs"
                >
                  Agendar <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <Scissors className="w-5 h-5" />
            <span>BarberFlow</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
          <p className="text-xs text-gray-600">© 2026 BarberFlow. Built with Vercel Spirit.</p>
        </div>
      </footer>
    </div>
  );
}
