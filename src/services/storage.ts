import { Appointment, Service } from '../types';

const STORAGE_KEYS = {
  APPOINTMENTS: 'bf_appointments',
  SERVICES: 'bf_services',
};

const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Corte Social', duration: 30, price: 40 },
  { id: '2', name: 'Degradê', duration: 45, price: 50 },
  { id: '3', name: 'Barba', duration: 20, price: 25 },
  { id: '4', name: 'Combo (Corte + Barba)', duration: 60, price: 70 },
];

export const storageService = {
  getAppointments: (): Appointment[] => {
    if (typeof localStorage === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : [];
  },

  saveAppointment: (appointment: Appointment) => {
    const appointments = storageService.getAppointments();
    const index = appointments.findIndex(a => a.id === appointment.id);
    
    if (index >= 0) {
      appointments[index] = appointment;
    } else {
      appointments.push(appointment);
    }
    
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
  }
};
