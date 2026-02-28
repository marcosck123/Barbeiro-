import { User, Haircut, Barber, Availability, Appointment } from '../types';

const STORAGE_KEYS = {
  USERS: 'barber_users',
  HAIRCUTS: 'barber_haircuts',
  BARBERS: 'barber_barbers',
  AVAILABILITY: 'barber_availability',
  APPOINTMENTS: 'barber_appointments',
};

// Seed Data
const INITIAL_HAIRCUTS: Haircut[] = [
  {
    id: 1,
    name: 'Degradê Moderno',
    image: 'https://images.unsplash.com/photo-1599351431247-f10b21816381?q=80&w=800&auto=format&fit=crop',
    description: 'Um corte limpo com transição suave nas laterais, perfeito para o dia a dia.',
    price: 45.00,
    estimated_time: 40
  },
  {
    id: 2,
    name: 'Pompadour Clássico',
    image: 'https://images.unsplash.com/photo-1621605815841-287940719019?q=80&w=800&auto=format&fit=crop',
    description: 'Volume no topo com um acabamento refinado para um visual atemporal.',
    price: 60.00,
    estimated_time: 50
  },
  {
    id: 3,
    name: 'Barba de Respeito',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop',
    description: 'Modelagem completa da barba com toalha quente e produtos premium.',
    price: 35.00,
    estimated_time: 30
  },
  {
    id: 4,
    name: 'Corte & Barba Combo',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop',
    description: 'O pacote completo para renovar seu visual com o máximo de cuidado.',
    price: 90.00,
    estimated_time: 75
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 1,
    email: 'marcoseduardock@gmail.com',
    username: 'Admin Marcos',
    role: 'admin'
  }
];

// Helper to get data from localStorage
const get = <T>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
};

// Helper to save data to localStorage
const save = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize Storage
export const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.HAIRCUTS)) {
    save(STORAGE_KEYS.HAIRCUTS, INITIAL_HAIRCUTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    save(STORAGE_KEYS.USERS, INITIAL_USERS);
    // Add a default password for the admin in a real app, here we just mock it
    localStorage.setItem('admin_password', '123456');
  }
  if (!localStorage.getItem(STORAGE_KEYS.BARBERS)) {
    save(STORAGE_KEYS.BARBERS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.AVAILABILITY)) {
    save(STORAGE_KEYS.AVAILABILITY, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
    save(STORAGE_KEYS.APPOINTMENTS, []);
  }
};

export const storageService = {
  // Auth
  async login(email: string, password: string): Promise<User | null> {
    const users = get<User[]>(STORAGE_KEYS.USERS, []);
    const user = users.find(u => u.email === email);
    // In this mock, we check a simple password store or just allow it for the admin
    const savedPassword = email === 'marcoseduardock@gmail.com' ? '123456' : localStorage.getItem(`pass_${email}`);
    if (user && savedPassword === password) {
      return user;
    }
    return null;
  },

  async register(userData: Omit<User, 'id'> & { password?: string }): Promise<User> {
    const users = get<User[]>(STORAGE_KEYS.USERS, []);
    const newUser: User = {
      ...userData,
      id: Date.now(),
      role: userData.role || 'customer'
    };
    users.push(newUser);
    save(STORAGE_KEYS.USERS, users);
    if (userData.password) {
      localStorage.setItem(`pass_${userData.email}`, userData.password);
    }
    return newUser;
  },

  // Haircuts
  async getHaircuts(): Promise<Haircut[]> {
    return get<Haircut[]>(STORAGE_KEYS.HAIRCUTS, []);
  },

  async addHaircut(haircut: Omit<Haircut, 'id'>): Promise<Haircut> {
    const haircuts = get<Haircut[]>(STORAGE_KEYS.HAIRCUTS, []);
    const newHaircut = { ...haircut, id: Date.now() };
    haircuts.push(newHaircut);
    save(STORAGE_KEYS.HAIRCUTS, haircuts);
    return newHaircut;
  },

  // Barbers
  async getBarbers(): Promise<Barber[]> {
    return get<Barber[]>(STORAGE_KEYS.BARBERS, []);
  },

  async addBarber(barber: Omit<Barber, 'id'>): Promise<Barber> {
    const barbers = get<Barber[]>(STORAGE_KEYS.BARBERS, []);
    const newBarber = { ...barber, id: Date.now() };
    barbers.push(newBarber);
    save(STORAGE_KEYS.BARBERS, barbers);
    return newBarber;
  },

  // Availability
  async getAvailability(barberId: number): Promise<Availability[]> {
    const all = get<Availability[]>(STORAGE_KEYS.AVAILABILITY, []);
    return all.filter(a => a.barber_id === barberId && a.is_booked === 0);
  },

  async addAvailability(slot: Omit<Availability, 'id' | 'is_booked'>): Promise<void> {
    const all = get<Availability[]>(STORAGE_KEYS.AVAILABILITY, []);
    all.push({ ...slot, id: Date.now(), is_booked: 0 });
    save(STORAGE_KEYS.AVAILABILITY, all);
  },

  // Appointments
  async createAppointment(data: any): Promise<Appointment> {
    const appointments = get<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const haircuts = get<Haircut[]>(STORAGE_KEYS.HAIRCUTS, []);
    const barbers = get<Barber[]>(STORAGE_KEYS.BARBERS, []);
    
    const haircut = haircuts.find(h => h.id === data.haircut_id);
    const barber = barbers.find(b => b.id === data.barber_id);

    const newAppointment: Appointment = {
      ...data,
      id: Date.now(),
      status: 'scheduled',
      haircut_name: haircut?.name,
      commission_rate: barber?.commission_rate
    };

    appointments.push(newAppointment);
    save(STORAGE_KEYS.APPOINTMENTS, appointments);

    // Mark slot as booked
    if (data.slot_id) {
      const availability = get<Availability[]>(STORAGE_KEYS.AVAILABILITY, []);
      const index = availability.findIndex(a => a.id === data.slot_id);
      if (index !== -1) {
        availability[index].is_booked = 1;
        save(STORAGE_KEYS.AVAILABILITY, availability);
      }
    }

    return newAppointment;
  },

  async getBarberHistory(barberId: number): Promise<Appointment[]> {
    const appointments = get<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    return appointments.filter(a => a.barber_id === barberId);
  },

  async getAdminReports(): Promise<any[]> {
    const appointments = get<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const barbers = get<Barber[]>(STORAGE_KEYS.BARBERS, []);
    
    return barbers.map(barber => {
      const barberApps = appointments.filter(a => a.barber_id === barber.id);
      const totalRevenue = barberApps.reduce((sum, a) => sum + a.total_price, 0);
      return {
        barber_name: barber.name,
        commission_rate: barber.commission_rate,
        total_revenue: totalRevenue,
        total_commission: totalRevenue * barber.commission_rate
      };
    });
  }
};
