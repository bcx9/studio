'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import UnitList from '@/components/unit-list';
import type { MeshUnit } from '@/types/mesh';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface AppSidebarProps {
  units: MeshUnit[];
  onConfigureUnit: (unit: MeshUnit) => void;
  onCreateUnit: () => void;
  onDeleteUnit: (id: number) => void;
  onUnitHover: (id: number | null) => void;
  selectedUnitId?: number | null;
}

export default function AppSidebar({
  units,
  onConfigureUnit,
  onCreateUnit,
  onDeleteUnit,
  onUnitHover,
  selectedUnitId,
}: AppSidebarProps) {
  return (
    <>
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Network Overview</SidebarGroupLabel>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent>
        <UnitList 
          units={units} 
          onConfigureUnit={onConfigureUnit} 
          onDeleteUnit={onDeleteUnit}
          onUnitHover={onUnitHover}
          selectedUnitId={selectedUnitId}
        />
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" onClick={onCreateUnit}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Unit
        </Button>
      </SidebarFooter>
    </>
  );
}
