// Curated Street View locations — verified to have coverage
export interface StreetViewLocation {
  lat: number;
  lng: number;
  city: string;
  country: string;
  hint?: string;
}

export const STREETVIEW_LOCATIONS: StreetViewLocation[] = [
  // Europa
  { lat: 48.8584, lng: 2.2945, city: 'Paris', country: 'Frankreich', hint: 'Stadt der Liebe' },
  { lat: 41.9028, lng: 12.4964, city: 'Rom', country: 'Italien', hint: 'Ewige Stadt' },
  { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Deutschland' },
  { lat: 51.5074, lng: -0.1278, city: 'London', country: 'England' },
  { lat: 40.4168, lng: -3.7038, city: 'Madrid', country: 'Spanien' },
  { lat: 48.2082, lng: 16.3738, city: 'Wien', country: 'Oesterreich' },
  { lat: 59.3293, lng: 18.0686, city: 'Stockholm', country: 'Schweden' },
  { lat: 55.6761, lng: 12.5683, city: 'Kopenhagen', country: 'Daenemark' },
  { lat: 50.0755, lng: 14.4378, city: 'Prag', country: 'Tschechien' },
  { lat: 47.4979, lng: 19.0402, city: 'Budapest', country: 'Ungarn' },
  { lat: 38.7223, lng: -9.1393, city: 'Lissabon', country: 'Portugal' },
  { lat: 37.9838, lng: 23.7275, city: 'Athen', country: 'Griechenland' },
  { lat: 53.3498, lng: -6.2603, city: 'Dublin', country: 'Irland' },
  { lat: 41.3874, lng: 2.1686, city: 'Barcelona', country: 'Spanien' },
  { lat: 45.4642, lng: 9.1900, city: 'Mailand', country: 'Italien' },
  { lat: 52.3676, lng: 4.9041, city: 'Amsterdam', country: 'Niederlande' },
  { lat: 50.8503, lng: 4.3517, city: 'Bruessel', country: 'Belgien' },
  { lat: 47.3769, lng: 8.5417, city: 'Zuerich', country: 'Schweiz' },
  { lat: 60.1699, lng: 24.9384, city: 'Helsinki', country: 'Finnland' },
  { lat: 59.9139, lng: 10.7522, city: 'Oslo', country: 'Norwegen' },

  // Asien
  { lat: 35.6762, lng: 139.6503, city: 'Tokio', country: 'Japan' },
  { lat: 37.5665, lng: 126.9780, city: 'Seoul', country: 'Suedkorea' },
  { lat: 13.7563, lng: 100.5018, city: 'Bangkok', country: 'Thailand' },
  { lat: 1.3521, lng: 103.8198, city: 'Singapur', country: 'Singapur' },
  { lat: 22.3193, lng: 114.1694, city: 'Hongkong', country: 'China' },
  { lat: 25.2048, lng: 55.2708, city: 'Dubai', country: 'VAE' },
  { lat: 28.6139, lng: 77.2090, city: 'Neu-Delhi', country: 'Indien' },
  { lat: 35.0116, lng: 135.7681, city: 'Kyoto', country: 'Japan' },
  { lat: 25.0330, lng: 121.5654, city: 'Taipei', country: 'Taiwan' },
  { lat: 3.1390, lng: 101.6869, city: 'Kuala Lumpur', country: 'Malaysia' },

  // Nordamerika
  { lat: 40.7580, lng: -73.9855, city: 'New York', country: 'USA', hint: 'Times Square' },
  { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', country: 'USA' },
  { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA' },
  { lat: 41.8781, lng: -87.6298, city: 'Chicago', country: 'USA' },
  { lat: 25.7617, lng: -80.1918, city: 'Miami', country: 'USA' },
  { lat: 36.1699, lng: -115.1398, city: 'Las Vegas', country: 'USA' },
  { lat: 43.6532, lng: -79.3832, city: 'Toronto', country: 'Kanada' },
  { lat: 49.2827, lng: -123.1207, city: 'Vancouver', country: 'Kanada' },
  { lat: 19.4326, lng: -99.1332, city: 'Mexiko-Stadt', country: 'Mexiko' },
  { lat: 23.1136, lng: -82.3666, city: 'Havanna', country: 'Kuba' },

  // Suedamerika
  { lat: -22.9068, lng: -43.1729, city: 'Rio de Janeiro', country: 'Brasilien' },
  { lat: -23.5505, lng: -46.6333, city: 'Sao Paulo', country: 'Brasilien' },
  { lat: -34.6037, lng: -58.3816, city: 'Buenos Aires', country: 'Argentinien' },
  { lat: -12.0464, lng: -77.0428, city: 'Lima', country: 'Peru' },
  { lat: 4.7110, lng: -74.0721, city: 'Bogota', country: 'Kolumbien' },
  { lat: -33.4489, lng: -70.6693, city: 'Santiago', country: 'Chile' },

  // Afrika
  { lat: 30.0444, lng: 31.2357, city: 'Kairo', country: 'Aegypten' },
  { lat: -33.9249, lng: 18.4241, city: 'Kapstadt', country: 'Suedafrika' },
  { lat: 31.6295, lng: -7.9811, city: 'Marrakesch', country: 'Marokko' },
  { lat: -1.2921, lng: 36.8219, city: 'Nairobi', country: 'Kenia' },

  // Ozeanien
  { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australien' },
  { lat: -37.8136, lng: 144.9631, city: 'Melbourne', country: 'Australien' },
  { lat: -36.8485, lng: 174.7633, city: 'Auckland', country: 'Neuseeland' },

  // Besondere Orte
  { lat: 27.1751, lng: 78.0421, city: 'Agra', country: 'Indien', hint: 'Taj Mahal' },
  { lat: 29.9792, lng: 31.1342, city: 'Gizeh', country: 'Aegypten', hint: 'Pyramiden' },
  { lat: 43.7230, lng: 10.3966, city: 'Pisa', country: 'Italien', hint: 'Schiefer Turm' },
  { lat: 64.1466, lng: -21.9426, city: 'Reykjavik', country: 'Island' },
  { lat: 35.3606, lng: 138.7274, city: 'Fujiyoshida', country: 'Japan', hint: 'Mount Fuji' },
  { lat: -13.1631, lng: -72.5450, city: 'Machu Picchu', country: 'Peru' },
];

export function getRandomStreetViewLocations(count: number): StreetViewLocation[] {
  const shuffled = [...STREETVIEW_LOCATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
