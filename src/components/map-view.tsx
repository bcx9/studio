
'use client';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import * as React from 'react';
import L, { type Map } from 'leaflet';
import 'leaflet-defaulticon-compatibility';


import type { MeshUnit } from '@/types/mesh';
import { Globe, Map as MapIcon, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const getStatusColor = (status: MeshUnit['status'], battery: number) => {
  if (status === 'Offline') return '#6b7280'; // gray-500
  if (status === 'Alarm') return '#ef4444'; // red-500
  if (battery < 20) return '#eab308'; // yellow-500
  if (status === 'Moving') return '#22c55e'; // green-500
  return '#3b82f6'; // blue-500
};

const createUnitIcon = (unit: MeshUnit, isHighlighted: boolean) => {
  const bgColor = getStatusColor(unit.status, unit.battery);
  // Using hardcoded HSL values from the dark theme to ensure Leaflet renders them correctly.
  const borderColor = isHighlighted ? 'hsl(221, 83%, 58%)' : 'hsl(222, 47%, 15%)';
  const iconColor = 'hsl(210, 40%, 98%)';
  const scale = isHighlighted ? '1.25' : '1';

  const iconSvg = unit.type === 'Vehicle'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L2 12v9c0 .6.4 1 1 1h2"/><path d="M14 17H9"/><path d="M19 17H6.5c-1 0-1.8-.6-2-1.4L2 12"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

  const iconHtml = `
    <div style="
      width: 28px; 
      height: 28px; 
      border-radius: 50%; 
      background-color: ${bgColor}; 
      border: 3px solid ${borderColor};
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      transform: scale(${scale});
      transition: transform 0.2s ease-out;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      ${iconSvg}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '', // Use an empty class name to prevent Leaflet's default styles
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

const createControlCenterIcon = () => {
    // Using hardcoded HSL values from the dark theme to ensure Leaflet renders them correctly.
    const primaryColor = 'hsl(221, 83%, 58%)';
    const cardColor = 'hsl(222, 47%, 11%)';
    const foregroundColor = 'hsl(210, 40%, 98%)';

    const iconHtml = `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${primaryColor};
        border: 2px solid ${cardColor};
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${foregroundColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22v-5"/>
          <path d="M9 17H5.5a2.5 2.5 0 0 1-2.5-2.5V7.5A2.5 2.5 0 0 1 5.5 5H7"/>
          <path d="M17 5h1.5a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5H15"/>
          <path d="M7 17v-1a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1"/>
          <path d="M7 5V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1"/>
        </svg>
      </div>
    `;
    return L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
};


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
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};
const INITIAL_CENTER: L.LatLngExpression = [53.19745, 10.84507];


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
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    } else {
        map.setView(INITIAL_CENTER, 13);
    }
  }, [units]);

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
    }

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.off();
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [onMapClick]);

  React.useEffect(() => {
      if (tileLayerRef.current && mapInstanceRef.current) {
          tileLayerRef.current.setUrl(TILE_LAYERS[mapStyle].url);
          tileLayerRef.current.options.attribution = TILE_LAYERS[mapStyle].attribution;
      }
  }, [mapStyle]);
  
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkerIds = Object.keys(markersRef.current).map(Number);
    const incomingUnitIds = units.map(u => u.id);
    
    // Remove markers for units that no longer exist
    currentMarkerIds.forEach(id => {
      if (!incomingUnitIds.includes(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });


    units.forEach(unit => {
      if (!unit.isActive) {
         if (markersRef.current[unit.id]) {
            markersRef.current[unit.id].remove();
            delete markersRef.current[unit.id];
        }
        return;
      }

      const isHighlighted = unit.id === highlightedUnitId;
      const icon = createUnitIcon(unit, isHighlighted);
      const position: L.LatLngExpression = [unit.position.lat, unit.position.lng];
      const tooltipContent = `
            <strong style="font-family: Inter, sans-serif; font-size: 14px;">${unit.name}</strong><br>
            <span style="font-family: Inter, sans-serif; font-size: 12px;">
                Status: ${unit.status}<br>
                Akku: ${unit.battery}%
            </span>
          `;
      
      if (markersRef.current[unit.id]) {
        // Update existing marker
        markersRef.current[unit.id].setLatLng(position);
        markersRef.current[unit.id].setIcon(icon);
        markersRef.current[unit.id].setZIndexOffset(isHighlighted ? 1000 : 0);
        markersRef.current[unit.id].setTooltipContent(tooltipContent);
      } else {
        // Create new marker
         const marker = L.marker(position, {
            icon: icon,
            zIndexOffset: isHighlighted ? 1000 : 0,
        }).bindTooltip(tooltipContent).addTo(map);

        marker.on('click', () => {
            if (onUnitClick) {
                onUnitClick(unit.id);
            }
        });
        markersRef.current[unit.id] = marker;
      }
    });
      
    if (!isInitiallyCenteredRef.current && units.some(u => u.isActive)) {
      handleRecenter();
      isInitiallyCenteredRef.current = true;
    }
  }, [units, highlightedUnitId, handleRecenter, onUnitClick]);

  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (controlCenterPosition) {
        const icon = createControlCenterIcon();
        const position: L.LatLngExpression = [controlCenterPosition.lat, controlCenterPosition.lng];
        const tooltipContent = `<strong style="font-family: Inter, sans-serif; font-size: 14px;">Leitstelle</strong>`;

        if (controlCenterMarkerRef.current) {
            controlCenterMarkerRef.current.setLatLng(position);
        } else {
            const marker = L.marker(position, {
                icon,
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
