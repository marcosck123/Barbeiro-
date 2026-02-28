import { Appointment, Service, Barber, User } from '../types';

const STORAGE_KEYS = {
  APPOINTMENTS: 'bf_appointments',
  SERVICES: 'bf_services',
  BARBERS: 'bf_barbers',
  USERS: 'bf_users',
  CURRENT_USER: 'bf_current_user',
  SETTINGS: 'bf_settings',
};

const DEFAULT_SETTINGS = {
  whatsapp: '(11) 99999-9999',
  address: 'Rua da Barbearia, 123',
  openingHours: '09:00 - 20:00'
};

const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Corte Social', category: 'Cabelo', description: 'O clássico que nunca sai de moda.', duration: 30, price: 40, imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop' },
  { id: '2', name: 'Degradê', category: 'Cabelo', description: 'Estilo moderno com transição suave.', duration: 45, price: 50, imageUrl: 'https://images.unsplash.com/photo-1621605815841-2dddb7a69e3d?w=400&h=400&fit=crop' },
  { id: '3', name: 'Barba', category: 'Barba', description: 'Alinhamento e hidratação completa.', duration: 20, price: 25, imageUrl: 'https://images.unsplash.com/photo-1599351431247-f10b21ce49b3?w=400&h=400&fit=crop' },
  { id: '4', name: 'Combo', category: 'Combo', description: 'Corte + Barba com desconto especial.', duration: 60, price: 70, imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop' },
];

const DEFAULT_BARBERS: Barber[] = [
  { id: 'b1', name: 'Ricardo "The Blade"', role: 'Master Barber', avatarUrl: 'https://i.pravatar.cc/150?u=b1', bio: 'Especialista em cortes clássicos e barbas.', rating: 4.9, commissionRate: 40 },
  { id: 'b2', name: 'Lucas Silva', role: 'Fade Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=b2', bio: 'Mestre do degradê e estilos urbanos.', rating: 4.8, commissionRate: 30 },
  { id: 'b3', name: 'André Santos', role: 'Stylist', avatarUrl: 'https://i.pravatar.cc/150?u=b3', bio: 'Transformando visuais com precisão.', rating: 5.0, commissionRate: 35 },
];

const ADMIN_USER: User = {
  id: 'admin-1',
  name: 'Marcos Eduardo',
  email: 'marcoseduardock@gmail.com',
  password: '12345',
  role: 'admin'
};

export const storageService = {
  getAppointments: (): Appointment[] => {
    if (typeof localStorage === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : [];
  },

  saveAppointment: (appointment: Appointment) => {
    const appointments = storageService.getAppointments();
    const index = appointments.findIndex(a => a.id === appointment.id);
    if (index >= 0) appointments[index] = appointment;
    else appointments.push(appointment);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  },

  deleteAppointment: (id: string) => {
    const appointments = storageService.getAppointments();
    const filtered = appointments.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filtered));
  },

  getServices: (): Service[] => {
    if (typeof localStorage === 'undefined') return DEFAULT_SERVICES;
    const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return data ? JSON.parse(data) : DEFAULT_SERVICES;
  },

  saveService: (service: Service) => {
    const services = storageService.getServices();
    const index = services.findIndex(s => s.id === service.id);
    if (index >= 0) services[index] = service;
    else services.push(service);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  },

  deleteService: (id: string) => {
    const services = storageService.getServices();
    const filtered = services.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(filtered));
  },

  getBarbers: (): Barber[] => {
    if (typeof localStorage === 'undefined') return DEFAULT_BARBERS;
    const data = localStorage.getItem(STORAGE_KEYS.BARBERS);
    return data ? JSON.parse(data) : DEFAULT_BARBERS;
  },

  saveBarber: (barber: Barber) => {
    const barbers = storageService.getBarbers();
    const index = barbers.findIndex(b => b.id === barber.id);
    if (index >= 0) barbers[index] = barber;
    else barbers.push(barber);
    localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(barbers));
  },

  getUsers: (): User[] => {
    if (typeof localStorage === 'undefined') return [ADMIN_USER];
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = data ? JSON.parse(data) : [ADMIN_USER];
    // Ensure admin is always there
    if (!users.find((u: User) => u.email === ADMIN_USER.email)) {
      users.push(ADMIN_USER);
    }
    return users;
  },

  registerUser: (user: User) => {
    const users = storageService.getUsers();
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = user;
    else users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  setCurrentUser: (user: User | null) => {
    if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    if (typeof localStorage === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  getSettings: () => {
    if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  saveSettings: (settings: any) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
};
