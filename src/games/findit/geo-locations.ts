export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
  type: 'city' | 'country';
}

export const GEO_LOCATIONS: GeoLocation[] = [
  // ── Europa ──────────────────────────────────────────────
  { name: 'Berlin', lat: 52.52, lng: 13.405, type: 'city' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, type: 'city' },
  { name: 'London', lat: 51.5074, lng: -0.1278, type: 'city' },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, type: 'city' },
  { name: 'Rom', lat: 41.9028, lng: 12.4964, type: 'city' },
  { name: 'Wien', lat: 48.2082, lng: 16.3738, type: 'city' },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, type: 'city' },
  { name: 'Brüssel', lat: 50.8503, lng: 4.3517, type: 'city' },
  { name: 'Prag', lat: 50.0755, lng: 14.4378, type: 'city' },
  { name: 'Warschau', lat: 52.2297, lng: 21.0122, type: 'city' },
  { name: 'Budapest', lat: 47.4979, lng: 19.0402, type: 'city' },
  { name: 'Lissabon', lat: 38.7223, lng: -9.1393, type: 'city' },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, type: 'city' },
  { name: 'Oslo', lat: 59.9139, lng: 10.7522, type: 'city' },
  { name: 'Kopenhagen', lat: 55.6761, lng: 12.5683, type: 'city' },
  { name: 'Helsinki', lat: 60.1699, lng: 24.9384, type: 'city' },
  { name: 'Athen', lat: 37.9838, lng: 23.7275, type: 'city' },
  { name: 'Dublin', lat: 53.3498, lng: -6.2603, type: 'city' },
  { name: 'Zürich', lat: 47.3769, lng: 8.5417, type: 'city' },
  { name: 'Bukarest', lat: 44.4268, lng: 26.1025, type: 'city' },
  { name: 'München', lat: 48.1351, lng: 11.582, type: 'city' },
  { name: 'Hamburg', lat: 53.5511, lng: 9.9937, type: 'city' },
  { name: 'Barcelona', lat: 41.3874, lng: 2.1686, type: 'city' },
  { name: 'Mailand', lat: 45.4642, lng: 9.19, type: 'city' },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784, type: 'city' },
  { name: 'Moskau', lat: 55.7558, lng: 37.6173, type: 'city' },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, type: 'city' },
  { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, type: 'city' },
  { name: 'Belgrad', lat: 44.7866, lng: 20.4489, type: 'city' },
  { name: 'Zagreb', lat: 45.815, lng: 15.9819, type: 'city' },

  // ── Asien ───────────────────────────────────────────────
  { name: 'Tokio', lat: 35.6762, lng: 139.6503, type: 'city' },
  { name: 'Peking', lat: 39.9042, lng: 116.4074, type: 'city' },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, type: 'city' },
  { name: 'Seoul', lat: 37.5665, lng: 126.978, type: 'city' },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, type: 'city' },
  { name: 'Singapur', lat: 1.3521, lng: 103.8198, type: 'city' },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777, type: 'city' },
  { name: 'Neu-Delhi', lat: 28.6139, lng: 77.209, type: 'city' },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, type: 'city' },
  { name: 'Hongkong', lat: 22.3193, lng: 114.1694, type: 'city' },
  { name: 'Taipei', lat: 25.033, lng: 121.5654, type: 'city' },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, type: 'city' },
  { name: 'Hanoi', lat: 21.0285, lng: 105.8542, type: 'city' },
  { name: 'Manila', lat: 14.5995, lng: 120.9842, type: 'city' },
  { name: 'Teheran', lat: 35.6892, lng: 51.389, type: 'city' },
  { name: 'Riad', lat: 24.7136, lng: 46.6753, type: 'city' },
  { name: 'Jerusalem', lat: 31.7683, lng: 35.2137, type: 'city' },
  { name: 'Kuala Lumpur', lat: 3.139, lng: 101.6869, type: 'city' },
  { name: 'Kathmandu', lat: 27.7172, lng: 85.324, type: 'city' },
  { name: 'Ulaanbaatar', lat: 47.8864, lng: 106.9057, type: 'city' },

  // ── Nordamerika ─────────────────────────────────────────
  { name: 'New York', lat: 40.7128, lng: -74.006, type: 'city' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, type: 'city' },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, type: 'city' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, type: 'city' },
  { name: 'Mexiko-Stadt', lat: 19.4326, lng: -99.1332, type: 'city' },
  { name: 'Washington D.C.', lat: 38.9072, lng: -77.0369, type: 'city' },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, type: 'city' },
  { name: 'Miami', lat: 25.7617, lng: -80.1918, type: 'city' },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207, type: 'city' },
  { name: 'Havanna', lat: 23.1136, lng: -82.3666, type: 'city' },
  { name: 'Montreal', lat: 45.5017, lng: -73.5673, type: 'city' },
  { name: 'Las Vegas', lat: 36.1699, lng: -115.1398, type: 'city' },

  // ── Südamerika ──────────────────────────────────────────
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, type: 'city' },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, type: 'city' },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, type: 'city' },
  { name: 'Lima', lat: -12.0464, lng: -77.0428, type: 'city' },
  { name: 'Bogotá', lat: 4.711, lng: -74.0721, type: 'city' },
  { name: 'Santiago', lat: -33.4489, lng: -70.6693, type: 'city' },
  { name: 'Caracas', lat: 10.4806, lng: -66.9036, type: 'city' },
  { name: 'Quito', lat: -0.1807, lng: -78.4678, type: 'city' },
  { name: 'Montevideo', lat: -34.9011, lng: -56.1645, type: 'city' },
  { name: 'La Paz', lat: -16.4897, lng: -68.1193, type: 'city' },

  // ── Afrika ──────────────────────────────────────────────
  { name: 'Kairo', lat: 30.0444, lng: 31.2357, type: 'city' },
  { name: 'Kapstadt', lat: -33.9249, lng: 18.4241, type: 'city' },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219, type: 'city' },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792, type: 'city' },
  { name: 'Marrakesch', lat: 31.6295, lng: -7.9811, type: 'city' },
  { name: 'Addis Abeba', lat: 9.025, lng: 38.7469, type: 'city' },
  { name: 'Dakar', lat: 14.7167, lng: -17.4677, type: 'city' },
  { name: 'Tunis', lat: 36.8065, lng: 10.1815, type: 'city' },
  { name: 'Accra', lat: 5.6037, lng: -0.187, type: 'city' },
  { name: 'Kinshasa', lat: -4.4419, lng: 15.2663, type: 'city' },

  // ── Ozeanien ────────────────────────────────────────────
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, type: 'city' },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, type: 'city' },
  { name: 'Auckland', lat: -36.8485, lng: 174.7633, type: 'city' },
  { name: 'Wellington', lat: -41.2865, lng: 174.7762, type: 'city' },
  { name: 'Perth', lat: -31.9505, lng: 115.8605, type: 'city' },

  // ── Länder (Zentroid) ───────────────────────────────────
  { name: 'Brasilien', lat: -14.235, lng: -51.9253, type: 'country' },
  { name: 'Australien', lat: -25.2744, lng: 133.7751, type: 'country' },
  { name: 'Kanada', lat: 56.1304, lng: -106.3468, type: 'country' },
  { name: 'Russland', lat: 61.524, lng: 105.3188, type: 'country' },
  { name: 'China', lat: 35.8617, lng: 104.1954, type: 'country' },
  { name: 'Indien', lat: 20.5937, lng: 78.9629, type: 'country' },
  { name: 'Japan', lat: 36.2048, lng: 138.2529, type: 'country' },
  { name: 'Deutschland', lat: 51.1657, lng: 10.4515, type: 'country' },
  { name: 'Frankreich', lat: 46.2276, lng: 2.2137, type: 'country' },
  { name: 'Italien', lat: 41.8719, lng: 12.5674, type: 'country' },
  { name: 'Spanien', lat: 40.4637, lng: -3.7492, type: 'country' },
  { name: 'Mexiko', lat: 23.6345, lng: -102.5528, type: 'country' },
  { name: 'Argentinien', lat: -38.4161, lng: -63.6167, type: 'country' },
  { name: 'Südafrika', lat: -30.5595, lng: 22.9375, type: 'country' },
  { name: 'Ägypten', lat: 26.8206, lng: 30.8025, type: 'country' },
  { name: 'Thailand', lat: 15.87, lng: 100.9925, type: 'country' },
  { name: 'Türkei', lat: 38.9637, lng: 35.2433, type: 'country' },
  { name: 'Griechenland', lat: 39.0742, lng: 21.8243, type: 'country' },
  { name: 'Norwegen', lat: 60.472, lng: 8.4689, type: 'country' },
  { name: 'Schweden', lat: 60.1282, lng: 18.6435, type: 'country' },
  { name: 'Island', lat: 64.9631, lng: -19.0208, type: 'country' },
  { name: 'Neuseeland', lat: -40.9006, lng: 174.886, type: 'country' },
  { name: 'Chile', lat: -35.6751, lng: -71.543, type: 'country' },
  { name: 'Kolumbien', lat: 4.5709, lng: -74.2973, type: 'country' },
  { name: 'Peru', lat: -9.19, lng: -75.0152, type: 'country' },
  { name: 'Nigeria', lat: 9.082, lng: 8.6753, type: 'country' },
  { name: 'Kenia', lat: -0.0236, lng: 37.9062, type: 'country' },
  { name: 'Marokko', lat: 31.7917, lng: -7.0926, type: 'country' },
  { name: 'Südkorea', lat: 35.9078, lng: 127.7669, type: 'country' },
  { name: 'Vietnam', lat: 14.0583, lng: 108.2772, type: 'country' },
  { name: 'Indonesien', lat: -0.7893, lng: 113.9213, type: 'country' },
  { name: 'Philippinen', lat: 12.8797, lng: 121.774, type: 'country' },
  { name: 'Polen', lat: 51.9194, lng: 19.1451, type: 'country' },
  { name: 'Österreich', lat: 47.5162, lng: 14.5501, type: 'country' },
  { name: 'Schweiz', lat: 46.8182, lng: 8.2275, type: 'country' },
  { name: 'Portugal', lat: 39.3999, lng: -8.2245, type: 'country' },

  // Neue Städte (40)
  { name: 'Florenz', lat: 43.7696, lng: 11.2558, type: 'city' },
  { name: 'Sevilla', lat: 37.3891, lng: -5.9845, type: 'city' },
  { name: 'Porto', lat: 41.1579, lng: -8.6291, type: 'city' },
  { name: 'Krakau', lat: 50.0647, lng: 19.945, type: 'city' },
  { name: 'Dubrovnik', lat: 42.6507, lng: 18.0944, type: 'city' },
  { name: 'Tallinn', lat: 59.437, lng: 24.7536, type: 'city' },
  { name: 'Riga', lat: 56.9496, lng: 24.1052, type: 'city' },
  { name: 'Vilnius', lat: 54.6872, lng: 25.2797, type: 'city' },
  { name: 'Bratislava', lat: 48.1486, lng: 17.1077, type: 'city' },
  { name: 'Ljubljana', lat: 46.0569, lng: 14.5058, type: 'city' },
  { name: 'Marseille', lat: 43.2965, lng: 5.3698, type: 'city' },
  { name: 'Neapel', lat: 40.8518, lng: 14.2681, type: 'city' },
  { name: 'Göteborg', lat: 57.7089, lng: 11.9746, type: 'city' },
  { name: 'Köln', lat: 50.9375, lng: 6.9603, type: 'city' },
  { name: 'Stuttgart', lat: 48.7758, lng: 9.1829, type: 'city' },
  { name: 'Dresden', lat: 51.0504, lng: 13.7373, type: 'city' },
  { name: 'Leipzig', lat: 51.3397, lng: 12.3731, type: 'city' },
  { name: 'Salzburg', lat: 47.8095, lng: 13.055, type: 'city' },
  { name: 'Genf', lat: 46.2044, lng: 6.1432, type: 'city' },
  { name: 'Nizza', lat: 43.7102, lng: 7.262, type: 'city' },
  { name: 'Osaka', lat: 34.6937, lng: 135.5023, type: 'city' },
  { name: 'Kyoto', lat: 35.0116, lng: 135.7681, type: 'city' },
  { name: 'Busan', lat: 35.1796, lng: 129.0756, type: 'city' },
  { name: 'Ho-Chi-Minh-Stadt', lat: 10.8231, lng: 106.6297, type: 'city' },
  { name: 'Colombo', lat: 6.9271, lng: 79.8612, type: 'city' },
  { name: 'Doha', lat: 25.2854, lng: 51.531, type: 'city' },
  { name: 'Muskat', lat: 23.588, lng: 58.3829, type: 'city' },
  { name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, type: 'city' },
  { name: 'Dallas', lat: 32.7767, lng: -96.797, type: 'city' },
  { name: 'Boston', lat: 42.3601, lng: -71.0589, type: 'city' },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321, type: 'city' },
  { name: 'Denver', lat: 39.7392, lng: -104.9903, type: 'city' },
  { name: 'Medellín', lat: 6.2476, lng: -75.5658, type: 'city' },
  { name: 'Cusco', lat: -13.532, lng: -71.9675, type: 'city' },
  { name: 'Cartagena', lat: 10.3997, lng: -75.5144, type: 'city' },
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, type: 'city' },
  { name: 'Casablanca', lat: 33.5731, lng: -7.5898, type: 'city' },
  { name: 'Dar es Salaam', lat: -6.7924, lng: 39.2083, type: 'city' },
  { name: 'Luanda', lat: -8.839, lng: 13.2894, type: 'city' },
  { name: 'Brisbane', lat: -27.4698, lng: 153.0251, type: 'city' },

  // Neue Länder (15)
  { name: 'Kroatien', lat: 45.1, lng: 15.2, type: 'country' },
  { name: 'Ungarn', lat: 47.1625, lng: 19.5033, type: 'country' },
  { name: 'Tschechien', lat: 49.8175, lng: 15.473, type: 'country' },
  { name: 'Irland', lat: 53.1424, lng: -7.6921, type: 'country' },
  { name: 'Rumänien', lat: 45.9432, lng: 24.9668, type: 'country' },
  { name: 'Ukraine', lat: 48.3794, lng: 31.1656, type: 'country' },
  { name: 'Serbien', lat: 44.0165, lng: 21.0059, type: 'country' },
  { name: 'Finnland', lat: 61.9241, lng: 25.7482, type: 'country' },
  { name: 'Dänemark', lat: 56.2639, lng: 9.5018, type: 'country' },
  { name: 'Malaysia', lat: 4.2105, lng: 101.9758, type: 'country' },
  { name: 'Sri Lanka', lat: 7.8731, lng: 80.7718, type: 'country' },
  { name: 'Äthiopien', lat: 9.145, lng: 40.4897, type: 'country' },
  { name: 'Tansania', lat: -6.369, lng: 34.8888, type: 'country' },
  { name: 'Ecuador', lat: -1.8312, lng: -78.1834, type: 'country' },
  { name: 'Kuba', lat: 21.5218, lng: -77.7812, type: 'country' },
];

// ---------------------------------------------------------------------------
// Region helpers
// ---------------------------------------------------------------------------

export type GeoRegion = 'europa' | 'asien' | 'amerika' | 'afrika' | 'ozeanien' | 'deutschland';

const DACH_NAMES = new Set([
  'Deutschland', 'Berlin', 'München', 'Hamburg', 'Köln', 'Stuttgart', 'Dresden',
  'Leipzig', 'Salzburg', 'Wien', 'Zürich', 'Genf', 'Österreich', 'Schweiz',
]);

export function getRegion(loc: GeoLocation): GeoRegion {
  if (DACH_NAMES.has(loc.name)) return 'deutschland';
  if (loc.lat > 35 && loc.lat < 72 && loc.lng > -25 && loc.lng < 40) return 'europa';
  if (loc.lat > -10 && loc.lat < 55 && loc.lng > 40 && loc.lng < 180) return 'asien';
  if (loc.lat > -56 && loc.lat < 72 && loc.lng > -180 && loc.lng < -30) return 'amerika';
  if (loc.lat > -40 && loc.lat < 38 && loc.lng > -20 && loc.lng < 55) return 'afrika';
  return 'ozeanien';
}

export function filterByRegion(locations: GeoLocation[], region: string): GeoLocation[] {
  if (region === 'welt') return locations;
  return locations.filter(loc => getRegion(loc) === region);
}
