import type { BookingProvider } from './types';
import { CalendlyProvider } from './calendly';
import { CalcomProvider } from './calcom';
import { CustomApiProvider } from './custom-api';

const providers: Record<string, BookingProvider> = {
  calendly: new CalendlyProvider(),
  cal_com: new CalcomProvider(),
  custom_api: new CustomApiProvider(),
};

export function getProvider(name: string): BookingProvider | null {
  return providers[name] || null;
}

export function getAllProviders(): BookingProvider[] {
  return Object.values(providers);
}

export * from './types';
