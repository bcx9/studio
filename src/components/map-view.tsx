'use client';
import Image from 'next/image';
import * as React from 'react';
import type { MeshUnit } from '@/types/mesh';
import { Car, User, Globe, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from '@/components/ui/button';
import StatusBadge from './status-badge';

interface MapViewProps {
  units: MeshUnit[];
  highlightedUnitId: number | null;
}

type MapStyle = 'satellite' | 'street';

const getStatusColor = (status: MeshUnit['status'], battery: number) => {
  if (status === 'Offline') return 'bg-gray-500';
  if (status === 'Alarm') return 'bg-red-500 animate-pulse';
  if (battery < 20) return 'bg-yellow-500';
  if (status === 'Moving') return 'bg-green-500';
  return 'bg-blue-500';
};

const UnitIcon = ({type}: {type: MeshUnit['type']}) => {
    if (type === 'Vehicle') return <Car className="h-4 w-4 text-white" />;
    return <User className="h-4 w-4 text-white" />;
}

export default function MapView({ units, highlightedUnitId }: MapViewProps) {
  const [mapStyle, setMapStyle] = React.useState<MapStyle>('satellite');

  // Normalize positions to a 0-1 scale for placement on the map.
  // This is a simplified approach for demonstration.
  const latMin = 52.51, latMax = 52.53;
  const lngMin = 13.39, lngMax = 13.42;

  const normalizePosition = (pos: { lat: number; lng: number }) => {
    const y = 100 - ((pos.lat - latMin) / (latMax - latMin)) * 100;
    const x = ((pos.lng - lngMin) / (lngMax - lngMin)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const mapImages: Record<MapStyle, { src: string, hint: string }> = {
    satellite: { src: "https://placehold.co/1200x800.png", hint: "satellite map" },
    street: { src: "https://placehold.co/1200x800.png", hint: "street map" },
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border">
      <Image
        key={mapStyle}
        src={mapImages[mapStyle].src}
        alt="Kartenansicht von Berlin"
        layout="fill"
        objectFit="cover"
        className="opacity-40"
        data-ai-hint={mapImages[mapStyle].hint}
      />
      <TooltipProvider>
        <div className="absolute top-2 right-2 z-10">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setMapStyle(style => style === 'satellite' ? 'street' : 'satellite')}
                        >
                        {mapStyle === 'satellite' ? <MapIcon className="h-5 w-5"/> : <Globe className="h-5 w-5"/>}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{mapStyle === 'satellite' ? 'Straßenansicht' : 'Satellitenansicht'}</p>
                </TooltipContent>
            </Tooltip>
        </div>
        <div className="absolute inset-0">
          {units.filter(u => u.isActive).map(unit => {
            const { x, y } = normalizePosition(unit.position);
            const isHighlighted = unit.id === highlightedUnitId;
            return (
              <Tooltip key={unit.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'absolute w-7 h-7 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 border-2 border-white/50 shadow-lg',
                      getStatusColor(unit.status, unit.battery),
                      isHighlighted ? 'scale-125 z-10' : 'scale-100'
                    )}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <UnitIcon type={unit.type} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='font-bold'>{unit.name}</p>
                  <div className='flex items-center gap-1.5'>Status: <StatusBadge status={unit.status} /></div>
                  <p>Akku: {unit.battery}%</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
