
export enum Tab {
  SOIL = 'SOIL',
  WEATHER = 'WEATHER',
  MARKET = 'MARKET',
  PRICES = 'PRICES',
  SCHEMES = 'SCHEMES',
  PROFILE = 'PROFILE',
  CHAT = 'CHAT'
}

export type AppLanguage = 'English' | 'Hindi' | 'Marathi' | 'Punjabi' | 'Gujarati' | 'Tamil' | 'Telugu' | 'Kannada' | 'Bengali' | 'Malayalam';

export interface TranslationDictionary {
  [key: string]: string;
}

export interface SoilData {
  ph: number;
  nitrogen: number; // ppm
  phosphorus: number; // ppm
  potassium: number; // ppm
  moisture: number; // percentage
  organicMatter: number; // percentage
  type: 'Clay' | 'Loam' | 'Sandy' | 'Silt';
  lastTested: string;
}

export interface WeatherForecast {
  day: string;
  tempMin: number;
  tempMax: number;
  condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
  icon: string;
}

export interface MarketListing {
  id: string;
  crop: string;
  variety: string;
  quantity: number; // kg
  harvestDate: string;
  farmingMethod: 'Organic' | 'Conventional';
  distance: number; // km (calculated display value)
  coordinates?: { lat: number; lng: number }; // Real coordinates
  price: number; // per kg
  grade: 'Premium' | 'Grade A' | 'Grade B' | 'Standard' | 'Pending';
  farmerName: string;
  imageUrl: string;
  status: 'Active' | 'Pending Review' | 'Sold';
  category: 'Vegetable' | 'Fruit' | 'Grain' | 'Commercial';
  shopDescription?: string;
  address?: string;
}

export interface MarketPrice {
  market: string;
  crop: string;
  price: number;
  unit: string; // e.g. "Quintal", "Kg", "Ton"
  pricePerKg?: number; // Helper for display
  date?: string; // Date of price
  trend: 'up' | 'down' | 'stable';
  change: number;
  // Details
  address?: string;
  phoneNumber?: string;
  capacity?: string; // e.g. "2000 Quintals/Day"
  commodities?: string[]; // Other crops sold there
}

export interface PriceEvent {
  crop: string;
  price: string;
  date: string;
  market: string;
  status: 'High' | 'Low';
  reason: string;
}

export interface NewsItem {
  headline: string;
  summary: string;
  date: string;
  source: string;
}

export interface MarketNewsData {
  highs: PriceEvent[];
  lows: PriceEvent[];
  generalNews: NewsItem[];
}

export interface Scheme {
  id: string;
  title: string;
  type: 'Central' | 'State';
  state?: string; // For state specific schemes
  category: 'Financial' | 'Insurance' | 'Subsidy' | 'Infra';
  description: string;
  benefits: string;
  eligibility: string[];
  documents: string[];
  deadline?: string;
  portalLink: string;
  applicationMode: 'Online' | 'Offline';
  subsidyPercent?: number; // For calculator
}
