'use client';
import Image from 'next/image';
import type { MeshUnit } from '@/types/mesh';
import { Car, User, Bot, AlertTriangle, Battery, BatteryLow } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MapViewProps {
  units: MeshUnit[];
  highlightedUnitId: number | null;
}

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
  // Normalize positions to a 0-1 scale for placement on the map.
  // This is a simplified approach for demonstration.
  const latMin = 52.51, latMax = 52.53;
  const lngMin = 13.39, lngMax = 13.42;

  const normalizePosition = (pos: { lat: number; lng: number }) => {
    const y = 100 - ((pos.lat - latMin) / (latMax - latMin)) * 100;
    const x = ((pos.lng - lngMin) / (lngMax - lngMin)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  return (
    <div className="relative w-full h-full bg-background rounded-lg overflow-hidden border">
      <Image
        src="https://placehold.co/1200x800.png"
        alt="Map of central Berlin"
        layout="fill"
        objectFit="cover"
        className="opacity-20"
        data-ai-hint="satellite map"
      />
      <TooltipProvider>
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
                  <p>Status: {unit.status}</p>
                  <p>Battery: {unit.battery}%</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
