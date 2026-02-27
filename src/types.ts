export interface User {
  id: number;
  email: string;
  username: string;
  role: 'admin' | 'barber' | 'customer';
}

export interface Haircut {
  id: number;
  name: string;
  image: string;
  description: string;
  price: number;
  estimated_time: number;
}

export interface Barber {
  id: number;
  user_id: number;
  name: string;
  bio: string;
  commission_rate: number;
}

export interface Availability {
  id: number;
  barber_id: number;
  start_time: string;
  end_time: string;
  is_booked: number;
}

export interface Appointment {
  id: number;
  customer_id: number;
  barber_id: number;
  haircut_id: number;
  start_time: string;
  status: string;
  payment_method: string;
  total_price: number;
  change_amount: number;
  haircut_name?: string;
  commission_rate?: number;
}
