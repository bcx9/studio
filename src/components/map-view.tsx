'use client';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, Tooltip as LeafletTooltip } from 'react-leaflet';

import type { MeshUnit } from '@/types/mesh';
import { Car, User, Globe, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import StatusBadge from './status-badge';

interface MapViewProps {
  units: MeshUnit[];
  highlightedUnitId: number | null;
}

type MapStyle = 'satellite' | 'street';

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

const RecenterAutomatically = ({ units }: { units: MeshUnit[] }) => {
  const map = useMap();
  React.useEffect(() => {
    if (units.length === 0) return;

    const activeUnits = units.filter(u => u.isActive);
    if (activeUnits.length === 0) return;

    const bounds = L.latLngBounds(activeUnits.map(u => [u.position.lat, u.position.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [units, map]);
  return null;
};

export default function MapView({ units, highlightedUnitId }: MapViewProps) {
  const [mapStyle, setMapStyle] = React.useState<MapStyle>('street');
  const center: L.LatLngExpression = [52.52, 13.405]; // Fallback to Berlin center
  const mapKey = React.useId();

  return (
    <div key={mapKey} className="relative w-full h-full rounded-lg overflow-hidden border bg-background">
      <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
        <TileLayer
          key={mapStyle}
          attribution={tileLayers[mapStyle].attribution}
          url={tileLayers[mapStyle].url}
        />
        {units.filter(u => u.isActive).map(unit => {
          const isHighlighted = unit.id === highlightedUnitId;
          return (
            <Marker
              key={unit.id}
              position={[unit.position.lat, unit.position.lng]}
              icon={createUnitIcon(unit, isHighlighted)}
              zIndexOffset={isHighlighted ? 1000 : 0}
            >
              <LeafletTooltip>
                <p className='font-bold'>{unit.name}</p>
                <div className='flex items-center gap-1.5'>Status: <StatusBadge status={unit.status} /></div>
                <p>Akku: {unit.battery}%</p>
              </LeafletTooltip>
            </Marker>
          );
        })}
        <RecenterAutomatically units={units} />
      </MapContainer>
      <div className="absolute top-2 right-2 z-10">
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
