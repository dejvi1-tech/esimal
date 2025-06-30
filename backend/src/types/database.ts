export interface Package {
  id: string;
  name: string;
  data_amount: number;
  validity_days: number;
  price: number;
  currency: string;
  country: string;
  operator: string;
  type: 'initial' | 'topup';
  is_active: boolean;
}

export interface Order {
  id: string;
  status: string;
  package: Package;
  activation_date: string;
  expiry_date: string;
  created_at: string;
  esim_id: string;
}

export interface Esim {
  id: string;
  iccid: string;
  status: string;
  user_id: string;
  order: Order;
  created_at: string;
}

export type UserOrderStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface UserOrder {
  id: string;
  user_id: string;
  package_id: string;
  status: UserOrderStatus;
  created_at: string;
  updated_at: string;
} 