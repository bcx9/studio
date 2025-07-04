
'use client';
// CSS must be imported first
import 'leaflet/dist/leaflet.css';

import * as React from 'react';
import L, { type Map } from 'leaflet';

import type { MeshUnit } from '@/types/mesh';
import { Globe, Map as MapIcon, Target, Building2 } from 'lucide-react';
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

const createUnitIcon = (unit: MeshUnit, isHighlighted: boolean) => {
  const isVehicle = unit.type === 'Vehicle';
  const size = isHighlighted ? 32 : 28;
  const color = unit.status === 'Alarm' ? '#ef4444' : '#2962FF'; // Red-500 or Primary Blue
  const borderColor = isHighlighted ? '#ffffff' : '#f8fafc'; // White or Slate-50
  const zIndex = isHighlighted ? 1000 : unit.id;

  const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 50%;
      border: 2px solid ${borderColor};
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.5);
      z-index: ${zIndex};
    ">
      ${isVehicle 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16.5V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1.5"/><path d="M19 16.5h.5a2.5 2.5 0 0 0 0-5H19"/><path d="M5 16.5H4.5a2.5 2.5 0 0 1 0-5H5"/><path d="M15 11.5H9v-3.41c0-.42.23-.8.6-.99l2.8-1.4a2 2 0 0 1 1.2 0l2.8 1.4c.37.19.6.57.6.99V11.5Z"/><path d="M8 12v-2"/><path d="M16 12v-2"/></svg>` 
        : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
      }
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '', // Important to have an empty class name to avoid conflicts
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createControlCenterIcon = () => {
    const size = 32;
    const color = '#161A39'; // Dark Blue Background
    const borderColor = '#C58BF7'; // Purple Accent
    const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 50%;
      border: 3px solid ${borderColor};
      display: flex;
      justify-content: center;
      align-items: center;
      color: ${borderColor};
      box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 17H5.5a2.5 2.5 0 0 1 0-5H9"/><path d="M15 17h3.5a2.5 2.5 0 0 0 0-5H15"/><path d="M12 12v-2.5a4.5 4.5 0 0 1 9 0V12"/><path d="M12 12V9.5a4.5 4.5 0 0 0-9 0V12"/><path d="M12 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9"/><path d="M12 12h9a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-9"/></svg>
    </div>
  `;
   return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}


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
  
  // Manage unit markers
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const unitIdsOnMap = new Set(Object.keys(markersRef.current).map(Number));

    units.forEach(unit => {
      unitIdsOnMap.delete(unit.id);
      
      if (!unit.isActive) {
        if (markersRef.current[unit.id]) {
          markersRef.current[unit.id].remove();
          delete markersRef.current[unit.id];
        }
        return;
      }

      const isHighlighted = unit.id === highlightedUnitId;
      const position: L.LatLngExpression = [unit.position.lat, unit.position.lng];
      const tooltipContent = `
        <strong>${unit.name}</strong><br>
        <span>
            Status: ${unit.status}<br>
            Akku: ${unit.battery}%
        </span>`;

      if (markersRef.current[unit.id]) {
        // Marker exists, update it
        markersRef.current[unit.id]
          .setLatLng(position)
          .setIcon(createUnitIcon(unit, isHighlighted))
          .setZIndexOffset(isHighlighted ? 1000 : unit.id)
          .getTooltip()?.setContent(tooltipContent);
      } else {
        // Marker doesn't exist, create it
        const marker = L.marker(position, { 
            icon: createUnitIcon(unit, isHighlighted),
            zIndexOffset: isHighlighted ? 1000 : unit.id 
        })
          .addTo(map)
          .bindTooltip(tooltipContent);

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            onUnitClick?.(unit.id)
        });
        markersRef.current[unit.id] = marker;
      }
    });

    // Remove markers for units that are no longer in the units array
    unitIdsOnMap.forEach(id => {
        if (markersRef.current[id]) {
            markersRef.current[id].remove();
            delete markersRef.current[id];
        }
    });

  }, [units, highlightedUnitId, onUnitClick]);

  // Perform initial centering
  React.useEffect(() => {
    if (!isInitiallyCenteredRef.current && (units.some(u => u.isActive) || controlCenterPosition)) {
      handleRecenter();
      isInitiallyCenteredRef.current = true;
    }
  }, [units, controlCenterPosition, handleRecenter]);


  // Manage control center marker
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (controlCenterPosition) {
        const position: L.LatLngExpression = [controlCenterPosition.lat, controlCenterPosition.lng];
        const tooltipContent = `<strong>Leitstelle</strong>`;

        if (controlCenterMarkerRef.current) {
            controlCenterMarkerRef.current.setLatLng(position);
        } else {
            const marker = L.marker(position, {
                icon: createControlCenterIcon(),
                zIndexOffset: 1100,
            }).bindTooltip(tooltipContent).addTo(map);
            controlCenterMarkerRef.current = marker;
        }
    } else {
        if (controlCenterMarkerRef.current) {
            controlCenterMarkerRef.current.remove();
            controlCenterMarkerRef.current = null;
        }
    }
  }, [controlCenterPosition]);


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
 