export interface Currency {
  code: string;
  symbol: string;
  name: string;
  nameDe: string;
}

export const currencies: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro', nameDe: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar', nameDe: 'US-Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound', nameDe: 'Britisches Pfund' },
  { code: 'CHF', symbol: 'Fr.', name: 'Swiss Franc', nameDe: 'Schweizer Franken' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', nameDe: 'Polnischer Złoty' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', nameDe: 'Schwedische Krone' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', nameDe: 'Norwegische Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', nameDe: 'Dänische Krone' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', nameDe: 'Tschechische Krone' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', nameDe: 'Ungarischer Forint' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', nameDe: 'Türkische Lira' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', nameDe: 'VAE-Dirham' },
];

export const getCurrencySymbol = (code: string): string => {
  const currency = currencies.find(c => c.code === code);
  return currency?.symbol || code;
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
};
