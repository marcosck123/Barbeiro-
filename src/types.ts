export interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string; // ISO string
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}
