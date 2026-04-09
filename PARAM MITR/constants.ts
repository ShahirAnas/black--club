import { SoilData, WeatherForecast, MarketListing, MarketPrice } from './types';

// Initial empty states or defaults
export const INITIAL_SOIL_DATA: SoilData = {
  ph: 0,
  nitrogen: 0,
  phosphorus: 0,
  potassium: 0,
  moisture: 0,
  organicMatter: 0,
  type: 'Loam',
  lastTested: new Date().toISOString().split('T')[0]
};

export const EMPTY_LISTINGS: MarketListing[] = [];

export const EMPTY_PRICES: MarketPrice[] = [];

export const EMPTY_FORECAST: WeatherForecast[] = [];