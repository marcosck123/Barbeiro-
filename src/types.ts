export interface Appointment {
  id: string;
  clientName: string;
  clientId?: string;
  barberId: string;
  serviceId: string;
  serviceName: string;
  date: string; // ISO string
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod?: 'credit_card' | 'debit_card' | 'pix' | 'cash';
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  imageUrl: string;
}

export interface Barber {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  bio: string;
  rating: number;
  commissionRate: number; // percentage (e.g., 30 for 30%)
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'barber' | 'client';
  barberId?: string; // linked barber profile if role is 'barber'
}
