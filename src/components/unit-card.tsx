'use client';
import type { MeshUnit } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Car,
  User,
  Battery,
  GaugeCircle,
  Compass,
  Settings,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import StatusBadge from './status-badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface UnitCardProps {
  unit: MeshUnit;
  onConfigure: (unit: MeshUnit) => void;
  onDelete: (id: number) => void;
  isSelected: boolean;
}

export default function UnitCard({ unit, onConfigure, onDelete, isSelected }: UnitCardProps) {
  const BatteryIcon = () => {
    if (!unit.isActive || unit.battery <= 0) return <Battery className="text-muted-foreground" />;
    if (unit.battery < 20) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <Battery className="text-green-500" />;
  };

  return (
    <Card className={cn("transition-all", isSelected ? "border-primary shadow-lg" : "border-card")}>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {unit.type === 'Vehicle' ? (
              <Car className="h-6 w-6 text-primary" />
            ) : (
              <User className="h-6 w-6 text-primary" />
            )}
            <div>
              <CardTitle className="text-base font-bold">{unit.name}</CardTitle>
              <StatusBadge status={unit.status} />
            </div>
          </div>
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onConfigure(unit)}>
                <Settings className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => onDelete(unit.id)}>
                <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
      <TooltipProvider delayDuration={200}>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <Tooltip>
            <TooltipTrigger className='flex items-center gap-1'>
                <BatteryIcon /> {unit.battery}%
            </TooltipTrigger>
            <TooltipContent>Battery Level</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger className='flex items-center gap-1'>
                <GaugeCircle className="h-4 w-4" /> {unit.speed} km/h
            </TooltipTrigger>
            <TooltipContent>Speed</TooltipContent>
          </Tooltip>
           <Tooltip>
            <TooltipTrigger className='flex items-center gap-1'>
                <Compass className="h-4 w-4" /> {unit.heading}°
            </TooltipTrigger>
            <TooltipContent>Heading</TooltipContent>
          </Tooltip>
        </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
