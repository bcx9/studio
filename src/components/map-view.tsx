
'use client';
// CSS must be imported first
import 'leaflet/dist/leaflet.css';

import * as React from 'react';
import L, { type Map } from 'leaflet';

import type { MeshUnit, UnitStatus, UnitType } from '@/types/mesh';
import { Globe, Map as MapIcon, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapViewProps {
  units: MeshUnit[];
  highlightedUnitId: number | null;
  controlCenterPosition: { lat: number; lng: number } | null;
  onMapClick: (position: { lat: number; lng: number }) => void;
  onUnitClick?: (unitId: number) => void;
}

type MapStyle = 'satellite' | 'street';

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};

const INITIAL_CENTER: L.LatLngExpression = [53.19745, 10.84507];

const STATUS_COLORS: Record<UnitStatus, string> = {
  Online: '#60a5fa',    // tailwind blue-400
  Moving: '#4ade80',    // tailwind green-400
  Idle: '#38bdf8',      // tailwind sky-400
  Alarm: '#f87171',     // tailwind red-400
  Offline: '#9ca3af',   // tailwind gray-400
};

const createStatusIcon = (status: UnitStatus, unitType: UnitType, isHighlighted: boolean) => {
  const color = STATUS_COLORS[status] || '#9ca3af';
  const alarmAnimationClass = status === 'Alarm' ? 'animate-pulse' : '';
  const highlightDropShadow = isHighlighted ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : '';

  // SVG paths for lucide icons (Car and User)
  const iconPaths = {
    Vehicle: `
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2"></path>
      <path d="M14 17h-4"></path>
      <path d="M15 7h-5"></path>
      <path d="M5 17v-4h4"></path>
      <circle cx="7" cy="17" r="2"></circle>
      <circle cx="17" cy="17" r="2"></circle>
    `,
    Personnel: `
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    `,
  };

  const iconPath = iconPaths[unitType] || '';

  const iconHtml = `
    <div class="relative flex items-center justify-center ${alarmAnimationClass}">
      <svg class="h-10 w-10 ${highlightDropShadow}" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 42 16 42C16 42 32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="${color}"/>
        <circle cx="16" cy="16" r="8" fill="white"/>
        <svg x="8" y="8" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="${color}" fill="none" stroke-linecap="round" stroke-linejoin="round">
          ${iconPath}
        </svg>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '', // Important to override default Leaflet styles
    iconSize: [40, 42],
    iconAnchor: [20, 42],
    popupAnchor: [0, -42],
  });
};

const createControlCenterIcon = () => {
  // Use a fixed color for stability, similar to the dark theme's primary color
  const color = 'hsl(221, 83%, 58%)'; 
  
  const iconHtml = `
    <div class="relative flex items-center justify-center">
      <svg class="h-10 w-10" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 42 16 42C16 42 32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="${color}"/>
        <path d="M16 11L18.09 15.26L23 15.9L19.5 19.29L20.18 24L16 21.75L11.82 24L12.5 19.29L9 15.9L13.91 15.26L16 11Z" fill="white"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [40, 42],
    iconAnchor: [20, 42],
    popupAnchor: [0, -42],
  });
};


export default function MapView({ units, highlightedUnitId, controlCenterPosition, onMapClick, onUnitClick }: MapViewProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<Map | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);
  const markersRef = React.useRef<Record<number, L.Marker>>({});
  const controlCenterMarkerRef = React.useRef<L.Marker | null>(null);
  const isInitiallyCenteredRef = React.useRef(false);
  
  const [mapStyle, setMapStyle] = React.useState<MapStyle>('street');

  const handleRecenter = React.useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activeUnits = units.filter(u => u.isActive);

    if (activeUnits.length > 0) {
      const bounds = L.latLngBounds(activeUnits.map(u => [u.position.lat, u.position.lng]));
      if (controlCenterPosition) {
        bounds.extend([controlCenterPosition.lat, controlCenterPosition.lng]);
      }
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    } else if (controlCenterPosition) {
        map.setView([controlCenterPosition.lat, controlCenterPosition.lng], 13);
    } 
    else {
        map.setView(INITIAL_CENTER, 13);
    }
  }, [units, controlCenterPosition]);

  // Initialize map
  React.useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
          center: INITIAL_CENTER,
          zoom: 13,
          scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      tileLayerRef.current = L.tileLayer(TILE_LAYERS.street.url, {
          attribution: TILE_LAYERS.street.attribution,
      }).addTo(map);
      
      setTimeout(() => map.invalidateSize(), 100);
      
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.off();
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, [onMapClick]);

  // Update tile layer style
  React.useEffect(() => {
      if (tileLayerRef.current && mapInstanceRef.current) {
          tileLayerRef.current.setUrl(TILE_LAYERS[mapStyle].url);
          tileLayerRef.current.options.attribution = TILE_LAYERS[mapStyle].attribution;
      }
  }, [mapStyle]);

  // Manage all markers (Units and Control Center) with a robust "clear and redraw" strategy
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // --- Clear all existing markers from the map ---
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    if (controlCenterMarkerRef.current) {
        controlCenterMarkerRef.current.remove();
        controlCenterMarkerRef.current = null;
    }

    // --- Redraw unit markers ---
    units.forEach(unit => {
        const position: L.LatLngExpression = [unit.position.lat, unit.position.lng];
        const tooltipContent = `
            <strong>${unit.name} (${unit.type})</strong><br>
            <span>
                Status: ${unit.status}<br>
                Akku: ${unit.battery}%
            </span>`;
        
        const isHighlighted = unit.id === highlightedUnitId;
        const icon = createStatusIcon(unit.status, unit.type, isHighlighted);
        
        const marker = L.marker(position, { icon })
          .addTo(map)
          .bindTooltip(tooltipContent);
        
        marker.setZIndexOffset(isHighlighted ? 1000 : unit.id);

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            onUnitClick?.(unit.id);
        });

        markersRef.current[unit.id] = marker;
    });

    // --- Redraw control center marker ---
    if (controlCenterPosition) {
        const position: L.LatLngExpression = [controlCenterPosition.lat, controlCenterPosition.lng];
        const tooltipContent = `<strong>Leitstelle</strong>`;
        
        const icon = createControlCenterIcon();
        
        const marker = L.marker(position, { icon, zIndexOffset: 1100 })
          .bindTooltip(tooltipContent).addTo(map);

        controlCenterMarkerRef.current = marker;
    }
  }, [units, highlightedUnitId, controlCenterPosition, onUnitClick]);

  // Perform initial centering only once
  React.useEffect(() => {
    if (!isInitiallyCenteredRef.current && (units.some(u => u.isActive) || controlCenterPosition)) {
      handleRecenter();
      isInitiallyCenteredRef.current = true;
    }
  }, [units, controlCenterPosition, handleRecenter]);


  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border bg-background">
      <div ref={mapContainerRef} className="h-full w-full z-0" />
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
            variant="secondary"
            size="icon"
            onClick={handleRecenter}
            title="Auf Einheiten zentrieren"
        >
            <Target className="h-5 w-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setMapStyle(style => style === 'satellite' ? 'street' : 'satellite')}
          title={mapStyle === 'satellite' ? 'Straßenansicht' : 'Satellitenansicht'}
        >
          {mapStyle === 'satellite' ? <MapIcon className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
