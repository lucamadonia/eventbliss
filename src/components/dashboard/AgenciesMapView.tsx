import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Agency, COUNTRIES } from '@/lib/agencies-data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { MapPin, AlertTriangle } from 'lucide-react';

// City coordinates for all cities in the agencies data
const CITY_COORDINATES: Record<string, [number, number]> = {
  // Deutschland
  "Berlin": [13.405, 52.52],
  "Hamburg": [9.9937, 53.5511],
  "München": [11.582, 48.1351],
  "Köln": [6.9603, 50.9375],
  "Frankfurt": [8.6821, 50.1109],
  "Düsseldorf": [6.7735, 51.2277],
  "Stuttgart": [9.1829, 48.7758],
  "Dresden": [13.7373, 51.0504],
  "Leipzig": [12.3731, 51.3397],
  "Hannover": [9.7320, 52.3759],
  "Nürnberg": [11.0753, 49.4521],
  "Bremen": [8.8017, 53.0793],
  "Dortmund": [7.4653, 51.5136],
  "Essen": [7.0148, 51.4556],
  
  // Österreich
  "Wien": [16.3738, 48.2082],
  "Salzburg": [13.0550, 47.8095],
  "Graz": [15.4395, 47.0707],
  "Innsbruck": [11.3928, 47.2692],
  "Linz": [14.2858, 48.3069],
  
  // Schweiz
  "Zürich": [8.5417, 47.3769],
  "Genf": [6.1432, 46.2044],
  "Basel": [7.5886, 47.5596],
  "Bern": [7.4474, 46.9480],
  "Lausanne": [6.6323, 46.5197],
  
  // Niederlande
  "Amsterdam": [4.9041, 52.3676],
  "Rotterdam": [4.4777, 51.9244],
  "Den Haag": [4.3007, 52.0705],
  "Utrecht": [5.1214, 52.0907],
  "Eindhoven": [5.4697, 51.4416],
  
  // Belgien
  "Brüssel": [4.3517, 50.8503],
  "Antwerpen": [4.4025, 51.2194],
  "Brügge": [3.2247, 51.2093],
  "Gent": [3.7174, 51.0543],
  
  // Frankreich
  "Paris": [2.3522, 48.8566],
  "Lyon": [4.8357, 45.7640],
  "Marseille": [5.3698, 43.2965],
  "Nizza": [7.2620, 43.7102],
  "Bordeaux": [-0.5792, 44.8378],
  "Toulouse": [1.4442, 43.6047],
  "Straßburg": [7.7521, 48.5734],
  "Lille": [3.0573, 50.6292],
  
  // Spanien
  "Madrid": [-3.7038, 40.4168],
  "Barcelona": [2.1734, 41.3851],
  "Valencia": [-0.3763, 39.4699],
  "Sevilla": [-5.9845, 37.3891],
  "Málaga": [-4.4214, 36.7213],
  "Bilbao": [-2.9253, 43.2630],
  "Zaragoza": [-0.8773, 41.6488],
  "Ibiza": [1.4318, 38.9067],
  "Mallorca": [2.6502, 39.5696],
  "Marbella": [-4.8862, 36.5099],
  
  // Portugal
  "Lissabon": [-9.1393, 38.7223],
  "Porto": [-8.6291, 41.1579],
  "Faro": [-7.9304, 37.0194],
  
  // Italien
  "Rom": [12.4964, 41.9028],
  "Mailand": [9.1900, 45.4642],
  "Venedig": [12.3155, 45.4408],
};

interface AgenciesMapViewProps {
  agencies: Agency[];
  selectedCountry?: string;
  selectedCity?: string;
  onCityClick?: (city: string) => void;
}

export const AgenciesMapView = ({
  agencies,
  selectedCountry,
  selectedCity,
  onCityClick,
}: AgenciesMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapToken, setMapToken] = useState<string>("");
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group agencies by city
  const cityCounts = agencies.reduce((acc, agency) => {
    if (!acc[agency.city]) {
      acc[agency.city] = { count: 0, country: agency.country, countryCode: agency.countryCode };
    }
    acc[agency.city].count++;
    return acc;
  }, {} as Record<string, { count: number; country: string; countryCode: string }>);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapToken) return;

    try {
      mapboxgl.accessToken = mapToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [10, 50], // Center on Europe
        zoom: 4,
        minZoom: 3,
        maxZoom: 12,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: false,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        setIsMapReady(true);
        setError(null);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Karte konnte nicht geladen werden. Bitte Token überprüfen.');
      });

    } catch (err) {
      console.error('Map init error:', err);
      setError('Fehler beim Initialisieren der Karte');
    }

    return () => {
      map.current?.remove();
    };
  }, [mapToken]);

  // Update markers when agencies or map ready state changes
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each city
    Object.entries(cityCounts).forEach(([city, data]) => {
      const coords = CITY_COORDINATES[city];
      if (!coords) {
        console.warn(`No coordinates for city: ${city}`);
        return;
      }

      const countryInfo = COUNTRIES[data.countryCode];
      const isSelected = selectedCity === city;
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'city-marker';
      el.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${isSelected ? '48px' : '36px'};
        height: ${isSelected ? '48px' : '36px'};
        border-radius: 50%;
        background: ${isSelected ? 'hsl(var(--primary))' : 'hsl(var(--background))'};
        border: 2px solid ${isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: ${isSelected ? '14px' : '12px'};
        font-weight: 600;
        color: ${isSelected ? 'white' : 'hsl(var(--foreground))'};
      `;
      el.textContent = data.count.toString();
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.15)';
        el.style.zIndex = '10';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      });

      el.addEventListener('click', () => {
        onCityClick?.(city);
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
        className: 'agency-popup',
      }).setHTML(`
        <div style="padding: 8px; min-width: 120px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${countryInfo?.emoji || ''} ${city}</div>
          <div style="font-size: 12px; color: #666;">${data.count} Agentur${data.count > 1 ? 'en' : ''}</div>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('mouseenter', () => {
        popup.addTo(map.current!);
      });
      
      el.addEventListener('mouseleave', () => {
        popup.remove();
      });

      markersRef.current.push(marker);
    });

    // Fly to selected city or country
    if (selectedCity && CITY_COORDINATES[selectedCity]) {
      map.current.flyTo({
        center: CITY_COORDINATES[selectedCity],
        zoom: 10,
        duration: 1000,
      });
    } else if (selectedCountry && selectedCountry !== 'all') {
      // Calculate bounds for country
      const countryAgencies = agencies.filter(a => a.countryCode === selectedCountry);
      const countryCities = [...new Set(countryAgencies.map(a => a.city))];
      const validCoords = countryCities
        .map(city => CITY_COORDINATES[city])
        .filter(Boolean);
      
      if (validCoords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validCoords.forEach(coord => bounds.extend(coord as [number, number]));
        map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
      }
    }
  }, [agencies, cityCounts, isMapReady, selectedCity, selectedCountry, onCityClick]);

  if (!mapToken) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium mb-1">Mapbox Token erforderlich</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Für die Kartenansicht wird ein Mapbox Public Token benötigt.
              Du findest deinen Token unter{' '}
              <a 
                href="https://mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
              {' '}→ Dashboard → Tokens.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
          <Input
            id="mapbox-token"
            type="password"
            placeholder="pk.eyJ1Ijo..."
            value={mapToken}
            onChange={(e) => setMapToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Der Token wird nur lokal im Browser gespeichert.
          </p>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => setMapToken("")}
        >
          Token ändern
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-medium">{Object.keys(cityCounts).length} Städte</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">{agencies.length} Agenturen</span>
        </div>
      </div>

      {/* Loading overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Karte wird geladen...</span>
          </div>
        </div>
      )}
    </div>
  );
};
