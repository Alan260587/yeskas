export type SocialNetwork = 'facebook' | 'tiktok' | 'instagram' | 'youtube' | 'kick' | 'spotify' | 'special';

export interface ServiceItem {
  id: string;
  network: SocialNetwork;
  name: string;
  metric: string; // e.g. "1K Seg.", "1K Likes", "100 Viewers x 2H"
  price: number; // in USD
  unit: string;
  description: string;
  popular?: boolean;
  tag?: string;
  image: string;
  deliveryTime?: string;
  guarantee?: string;
}

export interface DiagnosticPackageItem {
  id: string;
  name: string;
  price: number;
  detail: string;
  category: string;
  deliveryTime?: string;
  guarantee?: string;
}

export interface SpecialPackage {
  id: string;
  network: SocialNetwork;
  title: string;
  subtitle: string;
  price: number | 'consultar';
  description: string;
  features: string[];
  isTodayOnly?: boolean;
  freeTrialAvailable?: boolean;
  image: string;
}

export interface CartItem {
  id: string;
  serviceId: string;
  network: SocialNetwork;
  name: string;
  metric: string;
  unitPrice: number;
  quantity: number; // multiplier, e.g. 1 means 1 unit (1K), 2 means 2 units (2K)
}

export interface OrderDetails {
  usernameOrUrl: string;
  paymentMethod: string;
  clientNotes?: string;
}
