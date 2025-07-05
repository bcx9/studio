
'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import UnitList from '@/components/unit-list';
import type { MeshUnit, Group } from '@/types/mesh';
import { Button } from '@/components/ui/button';
import { PlusCircle, Building2, Settings, Plug, MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface AppSidebarProps {
  units: MeshUnit[];
  groups: Group[];
  onCreateUnit: () => void;
  onDeleteUnit: (id: number) => void;
  onChargeUnit: (id: number) => void;
  onUnitHover: (id: number | null) => void;
  selectedUnitId?: number | null;
  onSelectUnit: (unit: MeshUnit | null) => void;
  controlCenterPosition: { lat: number; lng: number } | null;
  onConfigureLeitstelle: () => void;
  isPositioningMode: boolean;
  onTogglePositioningMode: () => void;
}

export default function AppSidebar({
  units,
  groups,
  onCreateUnit,
  onDeleteUnit,
  onChargeUnit,
  onUnitHover,
  selectedUnitId,
  onSelectUnit,
  controlCenterPosition,
  onConfigureLeitstelle,
  isPositioningMode,
  onTogglePositioningMode,
}: AppSidebarProps) {
  return (
    <>
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Leitstelle</SidebarGroupLabel>
          <div className="p-3 -mt-2 rounded-md border bg-background/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="text-base font-semibold">Leitstelle</h3>
                  <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <Plug className="h-3 w-3" />
                    Extern versorgt
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-0.5'>
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={isPositioningMode ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={onTogglePositioningMode}>
                                <MapPin className="h-4 w-4" />
                                <span className="sr-only">Leitstellenposition festlegen</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Position festlegen</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onConfigureLeitstelle}>
                                <Settings className="h-4 w-4" />
                                <span className="sr-only">Leitstelle konfigurieren</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Konfigurieren</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className='-mt-2'>
        <UnitList 
          units={units} 
          groups={groups}
          onDeleteUnit={onDeleteUnit}
          onChargeUnit={onChargeUnit}
          onUnitHover={onUnitHover}
          selectedUnitId={selectedUnitId}
          onSelectUnit={onSelectUnit}
          controlCenterPosition={controlCenterPosition}
        />
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" onClick={onCreateUnit}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Neue Einheit hinzufügen
        </Button>
      </SidebarFooter>
    </>
  );
}
