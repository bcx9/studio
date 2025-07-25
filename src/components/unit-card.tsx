
'use client';
import type { MeshUnit, UnitType } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Car,
  User,
  Battery,
  GaugeCircle,
  Compass,
  Trash2,
  AlertTriangle,
  BatteryCharging,
  Milestone,
  ArrowDown,
  ArrowUp,
  Plug,
  Rss,
  Waypoints,
  Box,
  Plane,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import StatusBadge from './status-badge';
import { cn, calculateDistance } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface UnitCardProps {
  unit: MeshUnit;
  onDelete: (id: number) => void;
  onCharge: (id: number) => void;
  onSelect: (unit: MeshUnit | null) => void;
  isSelected: boolean;
  controlCenterPosition: { lat: number; lng: number } | null;
}

const TypeIcon = ({ type }: { type: UnitType }) => {
    switch (type) {
        case 'Vehicle': return <Car className="h-5 w-5" />;
        case 'Personnel': return <User className="h-5 w-5" />;
        case 'Support': return <Box className="h-5 w-5" />;
        case 'Air': return <Plane className="h-5 w-5" />;
        case 'Military': return <Shield className="h-5 w-5" />;
        case 'Police': return <ShieldAlert className="h-5 w-5" />;
        default: return <Box className="h-5 w-5" />;
    }
};

export default function UnitCard({ unit, onDelete, onCharge, onSelect, isSelected, controlCenterPosition }: UnitCardProps) {
  const BatteryIcon = () => {
    if (!unit.isActive || unit.battery <= 0) return <Battery className="text-muted-foreground" />;
    if (unit.battery < 20) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <Battery className="text-green-500" />;
  };

  const distanceToCenter = controlCenterPosition
    ? calculateDistance(
        unit.position.lat,
        unit.position.lng,
        controlCenterPosition.lat,
        controlCenterPosition.lng
      )
    : null;

  const formatDistance = (distance: number | null) => {
    if (distance === null) return null;
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(2)} km`;
  };
  
  const formattedDistance = formatDistance(distanceToCenter);


  return (
    <Card 
        className={cn(
          "transition-all cursor-pointer", 
          isSelected 
            ? "bg-primary/10 border-primary/80" 
            : "hover:bg-white/5"
        )}
        onClick={() => onSelect(unit)}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className='flex items-center justify-center h-10 w-10 rounded-full bg-primary/20 border border-primary/50 text-primary'>
              <TypeIcon type={unit.type} />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{unit.name}</CardTitle>
              <StatusBadge status={unit.status} />
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => {e.stopPropagation(); onCharge(unit.id)}}>
                            <BatteryCharging className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Akku laden</TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive/70 hover:text-destructive" onClick={(e) => {e.stopPropagation(); onDelete(unit.id)}}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Löschen</TooltipContent>
                </Tooltip>
             </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
          <TooltipProvider delayDuration={200}>
            <div className='flex items-center gap-2'>
            {unit.isExternallyPowered ? (
              <Tooltip>
                  <TooltipTrigger className='flex items-center gap-1 text-green-500'>
                      <Plug className="h-4 w-4" /> {unit.battery}%
                  </TooltipTrigger>
                  <TooltipContent>Extern versorgt</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                  <TooltipTrigger className='flex items-center gap-1'>
                      <BatteryIcon /> {unit.battery}%
                  </TooltipTrigger>
                  <TooltipContent>Akkustand</TooltipContent>
              </Tooltip>
            )}
            </div>
            
            <Tooltip>
              <TooltipTrigger className='flex items-center gap-2'>
                  <GaugeCircle className="h-4 w-4" /> {unit.speed} km/h
              </TooltipTrigger>
              <TooltipContent>Geschwindigkeit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger className='flex items-center gap-2'>
                  <Compass className="h-4 w-4" /> {unit.heading}°
              </TooltipTrigger>
              <TooltipContent>Richtung</TooltipContent>
            </Tooltip>
            
            {formattedDistance && (
              <Tooltip>
                <TooltipTrigger className='flex items-center gap-2'>
                    <Milestone className="h-4 w-4" /> {formattedDistance}
                </TooltipTrigger>
                <TooltipContent>Entfernung zur Leitstelle</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
                <TooltipTrigger className='flex items-center gap-2'>
                    <Rss className="h-4 w-4" /> {unit.signalStrength} dBm
                </TooltipTrigger>
                <TooltipContent>Signalstärke (RSSI)</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger className='flex items-center gap-2'>
                    <Waypoints className="h-4 w-4" /> {unit.hopCount} {unit.hopCount === 1 ? 'Hop' : 'Hops'}
                </TooltipTrigger>
                <TooltipContent>Anzahl Hops</TooltipContent>
            </Tooltip>

          </TooltipProvider>
        </div>
        
        {unit.lastMessage && (
            <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    {unit.lastMessage.source === 'unit' ? (
                        <ArrowUp className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                    ) : (
                        <ArrowDown className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    )}
                    <div className="flex-1">
                        <p className="text-foreground leading-snug">{unit.lastMessage.text}</p>
                        <p className='text-xs'>{formatDistanceToNow(new Date(unit.lastMessage.timestamp), { addSuffix: true, locale: de })}</p>
                    </div>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
