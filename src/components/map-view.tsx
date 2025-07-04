'use client';
// CSS must be imported first
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

import * as React from 'react';
// Import Leaflet and the compatibility patch
import L, { type Map } from 'leaflet';
import 'leaflet-defaulticon-compatibility';

import type { MeshUnit } from '@/types/mesh';
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

  const recenterMap = React.useCallback(() => {
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
          .setZIndexOffset(isHighlighted ? 1000 : 0)
          .getTooltip()?.setContent(tooltipContent);
      } else {
        // Marker doesn't exist, create it with default icon
        const marker = L.marker(position, { zIndexOffset: isHighlighted ? 1000 : 0 })
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
    if (!isInitiallyCenteredRef.current && units.some(u => u.isActive)) {
      recenterMap();
      isInitiallyCenteredRef.current = true;
    }
  }, [units, recenterMap]);


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
             // Create with default icon
            const marker = L.marker(position, {
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
            onClick={recenterMap}
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
