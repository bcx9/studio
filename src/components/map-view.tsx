
'use client';
import 'leaflet/dist/leaflet.css';

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L, { type Map } from 'leaflet';

import type { MeshUnit } from '@/types/mesh';
import { Car, User, Globe, Map as MapIcon, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const getStatusColorClass = (status: MeshUnit['status'], battery: number) => {
  if (status === 'Offline') return 'bg-gray-500';
  if (status === 'Alarm') return 'bg-red-500 animate-pulse';
  if (battery < 20) return 'bg-yellow-500';
  if (status === 'Moving') return 'bg-green-500';
  return 'bg-blue-500';
};

const UnitIconComponent = ({ type }: { type: MeshUnit['type'] }) => {
  if (type === 'Vehicle') return <Car className="h-4 w-4 text-white" />;
  return <User className="h-4 w-4 text-white" />;
};

const createUnitIcon = (unit: MeshUnit, isHighlighted: boolean) => {
  const iconHtml = renderToStaticMarkup(
    <div
      className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center border-2 border-white/50 shadow-lg transition-transform duration-300',
        getStatusColorClass(unit.status, unit.battery),
        isHighlighted ? 'scale-125 ring-4 ring-primary' : 'scale-100'
      )}
    >
      <UnitIconComponent type={unit.type} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'bg-transparent border-0',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

interface MapViewProps {
  units: MeshUnit[];
  highlightedUnitId: number | null;
}

type MapStyle = 'satellite' | 'street';

const tileLayers = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};


export default function MapView({ units, highlightedUnitId }: MapViewProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<Map | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);
  const markersLayerRef = React.useRef<L.LayerGroup | null>(null);
  const isInitiallyCenteredRef = React.useRef(false);
  
  const [mapStyle, setMapStyle] = React.useState<MapStyle>('street');
  const center: L.LatLngExpression = [52.52, 13.405];

  const handleRecenter = React.useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activeUnits = units.filter(u => u.isActive);

    if (activeUnits.length > 0) {
      const bounds = L.latLngBounds(activeUnits.map(u => [u.position.lat, u.position.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [units]);

  // Effect to initialize and destroy the map
  React.useEffect(() => {
    // Only run if the container div exists and the map isn't already initialized.
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
          center: center,
          zoom: 13,
          scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      tileLayerRef.current = L.tileLayer(tileLayers.street.url, {
          attribution: tileLayers.street.attribution,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);

      // Invalidate size after initial creation
      setTimeout(() => map.invalidateSize(), 100);
    }

    // Cleanup function to run when component unmounts
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []); // Empty dependency array ensures this runs only once.

  // Effect to update tile layer style when mapStyle changes
  React.useEffect(() => {
      if (tileLayerRef.current) {
          tileLayerRef.current.setUrl(tileLayers[mapStyle].url);
          tileLayerRef.current.options.attribution = tileLayers[mapStyle].attribution;
      }
  }, [mapStyle]);
  
  // Effect to update markers when units or highlighted unit change
  React.useEffect(() => {
      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      if (!map || !markersLayer) return;

      markersLayer.clearLayers();

      const activeUnits = units.filter(u => u.isActive);

      activeUnits.forEach(unit => {
          const isHighlighted = unit.id === highlightedUnitId;
          const tooltipContent = `
            <strong style="font-family: Inter, sans-serif; font-size: 14px;">${unit.name}</strong><br>
            <span style="font-family: Inter, sans-serif; font-size: 12px;">
                Status: ${unit.status}<br>
                Akku: ${unit.battery}%
            </span>
          `;
          const marker = L.marker([unit.position.lat, unit.position.lng], {
              icon: createUnitIcon(unit, isHighlighted),
              zIndexOffset: isHighlighted ? 1000 : 0,
          }).bindTooltip(tooltipContent);
          markersLayer.addLayer(marker);
      });
      
      // Auto-recenter logic, but only on the first load of units
      if (!isInitiallyCenteredRef.current && activeUnits.length > 0) {
        handleRecenter();
        isInitiallyCenteredRef.current = true;
      }
  }, [units, highlightedUnitId, handleRecenter]);


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
